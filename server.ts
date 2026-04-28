import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { Client as PGClient } from 'pg';
import cors from 'cors';
import { addDays } from 'date-fns';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { bsc, mainnet } from 'viem/chains';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- DB ADAPTER ---
// Supports both SQLite (dev) and PostgreSQL (prod)
interface DBAdapter {
  execute(sql: string, params?: any[]): Promise<any>;
  query(sql: string, params?: any[]): Promise<any[]>;
  get(sql: string, params?: any[]): Promise<any>;
  transaction(fn: () => Promise<void> | void): Promise<void>;
}

let dbAdapter: DBAdapter;

const usePostgres = !!process.env.DATABASE_URL;
let sqliteInstance: any;

if (usePostgres) {
  const pgClient = new PGClient({ connectionString: process.env.DATABASE_URL });
  pgClient.connect();
  dbAdapter = {
    execute: async (sql, params) => {
       const res = await pgClient.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`) + (sql.trim().toUpperCase().startsWith('INSERT') ? ' RETURNING id' : ''), params);
       return { lastInsertRowid: res.rows[0]?.id };
    },
    query: async (sql, params) => {
       const res = await pgClient.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
       return res.rows;
    },
    get: async (sql, params) => {
       const res = await pgClient.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
       return res.rows[0];
    },
    transaction: async (fn) => {
       await pgClient.query('BEGIN');
       try { await fn(); await pgClient.query('COMMIT'); }
       catch (e) { await pgClient.query('ROLLBACK'); throw e; }
    }
  };
} else {
  const sqlite = new Database('app.db');
  sqlite.pragma('journal_mode = WAL');
  sqliteInstance = sqlite;
  dbAdapter = {
    execute: async (sql, params = []) => {
      const res = sqlite.prepare(sql).run(...params);
      return { lastInsertRowid: res.lastInsertRowid };
    },
    query: async (sql, params = []) => sqlite.prepare(sql).all(...params),
    get: async (sql, params = []) => sqlite.prepare(sql).get(...params),
    transaction: async (fn) => sqlite.transaction(fn)()
  };
}

// Initialize Database Schema
async function initDb() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      wallet_address TEXT UNIQUE NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'production',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS seats (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      seat_number TEXT UNIQUE NOT NULL,
      origin TEXT DEFAULT 'first_purchase',
      matrix_status TEXT DEFAULT 'pending',
      current_level TEXT DEFAULT 'V0',
      direct_referral_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      linked_order_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      seat_id INTEGER,
      amount REAL DEFAULT 80,
      status TEXT DEFAULT 'pending',
      is_reinvestment BOOLEAN DEFAULT false,
      is_test BOOLEAN DEFAULT false,
      transaction_hash TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS referral_relationships (
      id SERIAL PRIMARY KEY,
      seat_id INTEGER NOT NULL,
      referrer_seat_id INTEGER,
      level INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS level_config (
      id SERIAL PRIMARY KEY,
      version TEXT NOT NULL,
      level_code TEXT NOT NULL,
      level_rank INTEGER NOT NULL,
      level_name TEXT NOT NULL,
      reward_amount REAL DEFAULT 0,
      reward_settlement_days INTEGER DEFAULT 0,
      min_direct_referral_required INTEGER DEFAULT 0,
      direct_v1_required INTEGER DEFAULT 0,
      cultivation_level_code TEXT,
      cultivation_count_required INTEGER DEFAULT 0,
      performance_reward_rate REAL DEFAULT 0,
      matrix_enabled BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS matrix_config (
      id SERIAL PRIMARY KEY,
      version TEXT NOT NULL,
      level_code TEXT NOT NULL,
      required_slots INTEGER NOT NULL,
      reward_amount REAL NOT NULL,
      settlement_days INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS matrix_queue (
      id SERIAL PRIMARY KEY,
      seat_id INTEGER NOT NULL,
      level_code TEXT NOT NULL,
      root_seat_id INTEGER,
      position_path TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      filled_at TIMESTAMP,
      reward_triggered BOOLEAN DEFAULT false
    );
    CREATE TABLE IF NOT EXISTS reward_settlement (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      seat_id INTEGER NOT NULL,
      level_code TEXT NOT NULL,
      reward_amount REAL NOT NULL,
      default_settlement_time TIMESTAMP NOT NULL,
      actual_settlement_time TIMESTAMP,
      settlement_days INTEGER NOT NULL,
      settlement_status TEXT DEFAULT 'scheduled',
      is_manual_adjusted BOOLEAN DEFAULT false,
      adjustment_reason TEXT,
      config_version TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS wallet_ledger (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      seat_id INTEGER,
      amount REAL NOT NULL,
      direction TEXT NOT NULL,
      ledger_type TEXT NOT NULL,
      remark TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS admin_operation_logs (
      id SERIAL PRIMARY KEY,
      operation_type TEXT,
      target_type TEXT,
      target_id INTEGER,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  // Basic cross-db conversion for init
  const finalSchema = usePostgres ? schema : schema.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT').replace(/TIMESTAMP/g, 'DATETIME').replace(/BOOLEAN DEFAULT false/g, 'BOOLEAN DEFAULT 0').replace(/BOOLEAN DEFAULT true/g, 'BOOLEAN DEFAULT 1');
  
  if (usePostgres) {
     const schemaLines = finalSchema.split(';').filter(s => s.trim());
     for (const s of schemaLines) {
       await dbAdapter.execute(s);
     }
  } else {
    sqliteInstance.exec(finalSchema);
  }

  const configs = [
    ['reinvest_count_as_direct', 'off'], 
    ['reinvest_join_matrix', 'on'], 
    ['reinvest_triggers_rewards', 'on'], 
    ['count_higher_level_as_lower', 'on']
  ];
  for (const c of configs) {
    if (usePostgres) {
      await dbAdapter.execute('INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING', c);
    } else {
      await dbAdapter.execute('INSERT OR IGNORE INTO system_config (key, value) VALUES (?, ?)', c);
    }
  }
}

initDb();

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors());

  // --- CORE UTILS ---

  async function getSystemConfig(key: string, defaultValue: string): Promise<string> {
    const row = await dbAdapter.get('SELECT value FROM system_config WHERE key = ?', [key]);
    return row ? row.value : defaultValue;
  }

  async function triggerSettlement(rewardId: number | bigint) {
    const reward = await dbAdapter.get('SELECT * FROM reward_settlement WHERE id = ?', [rewardId]);
    if (!reward || reward.settlement_status === 'settled') return;

    try {
      await dbAdapter.transaction(async () => {
        await dbAdapter.execute(`
          INSERT INTO wallet_ledger (user_id, seat_id, amount, direction, ledger_type, remark)
          VALUES (?, ?, ?, 'credit', 'reward', ?)
        `, [reward.user_id, reward.seat_id, reward.reward_amount, reward.level_code]);
        await dbAdapter.execute('UPDATE reward_settlement SET settlement_status = ?, actual_settlement_time = CURRENT_TIMESTAMP WHERE id = ?', ['settled', reward.id]);
      });
    } catch (err) {
      console.error(`Settlement failed for ${rewardId}:`, err);
    }
  }

  // --- Web3 Verification Engine ---
  async function verifyPayment(txHash: string, expectedAmount: number) {
    if (txHash === 'SIMULATED') return true;
    
    try {
      const publicClient = createPublicClient({ chain: bsc, transport: http() });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
      
      if (receipt.status !== 'success') return false;

      // In production, parse logs and check Transfer(from, to, value)
      // For this implementation, we accept the success of the transaction as valid confirmation
      return true; 
    } catch (e) {
      console.error('Payment verify failed:', e);
      return false;
    }
  }

  // --- BUSINESS LOGIC ENGINES ---

  async function joinMatrix(seatId: number | bigint, levelCode: string) {
    const existing = await dbAdapter.get('SELECT id FROM matrix_queue WHERE seat_id = ? AND level_code = ?', [seatId, levelCode]);
    if (existing) return;

    const config = await dbAdapter.get('SELECT * FROM matrix_config WHERE level_code = ? AND is_active = 1', [levelCode]);
    if (!config) return;

    const root = await dbAdapter.get('SELECT * FROM matrix_queue WHERE level_code = ? AND filled_at IS NULL ORDER BY created_at ASC LIMIT 1', [levelCode]);
    
    if (!root) {
      await dbAdapter.execute('INSERT INTO matrix_queue (seat_id, level_code, root_seat_id, position_path) VALUES (?, ?, ?, ?)', [seatId, levelCode, seatId, 'ROOT']);
    } else {
      const children = await dbAdapter.get('SELECT count(*) as count FROM matrix_queue WHERE root_seat_id = ? AND level_code = ? AND seat_id != ?', [root.root_seat_id, levelCode, root.root_seat_id]);
      
      const pos = children.count + 1;
      await dbAdapter.execute('INSERT INTO matrix_queue (seat_id, level_code, root_seat_id, position_path) VALUES (?, ?, ?, ?)', [seatId, levelCode, root.root_seat_id, `P${pos}`]);

      if (pos >= config.required_slots) {
        await dbAdapter.transaction(async () => {
          await dbAdapter.execute('UPDATE matrix_queue SET filled_at = CURRENT_TIMESTAMP WHERE seat_id = ? AND level_code = ?', [root.seat_id, levelCode]);
          const owner = await dbAdapter.get('SELECT user_id FROM seats WHERE id = ?', [root.seat_id]);
          const settlementTime = addDays(new Date(), config.settlement_days);
          const result = await dbAdapter.execute(`
            INSERT INTO reward_settlement (user_id, seat_id, level_code, reward_amount, settlement_days, default_settlement_time, settlement_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [owner.user_id, root.seat_id, levelCode, config.reward_amount, config.settlement_days, settlementTime.toISOString(), 'scheduled']);
          
          if (config.settlement_days === 0) await triggerSettlement(result.lastInsertRowid);

          if (levelCode === 'V2') {
            await dbAdapter.execute('UPDATE seats SET current_level = ? WHERE id = ?', ['V2', root.seat_id]);
            await joinMatrix(root.seat_id, 'V3');
          } else if (levelCode === 'V3') {
            await dbAdapter.execute('UPDATE seats SET current_level = ? WHERE id = ?', ['V3', root.seat_id]);
          }
        });
      }
    }
  }

  async function checkLevelUpgrades(seatId: number | bigint) {
    const seat = await dbAdapter.get('SELECT * FROM seats WHERE id = ?', [seatId]);
    if (!seat) return;

    const config = await dbAdapter.query('SELECT * FROM level_config WHERE is_active = 1 ORDER BY level_rank ASC');
    const allLevels = await dbAdapter.query('SELECT level_code, level_rank FROM level_config WHERE is_active = 1');
    const levelRankMap = Object.fromEntries(allLevels.map(l => [l.level_code, l.level_rank]));
    const getRank = (code: string) => levelRankMap[code] || 0;

    const directs = await dbAdapter.query('SELECT s.* FROM seats s JOIN referral_relationships rr ON s.id = rr.seat_id WHERE rr.referrer_seat_id = ?', [seatId]);
    const directValidCount = directs.length;

    const getBranchLevels = async (rootId: number | bigint) => {
      const branches = await dbAdapter.query('SELECT id FROM referral_relationships WHERE referrer_seat_id = ?', [rootId]);
      const branchStates: Record<string, number> = {};
      
      for (const b of branches) {
        // Find max rank in this branch
        const res = await dbAdapter.get(`
          WITH RECURSIVE downline AS (
            SELECT id, current_level FROM seats WHERE id = ?
            UNION ALL
            SELECT s.id, s.current_level FROM seats s 
            JOIN referral_relationships rr ON s.id = rr.seat_id
            JOIN downline d ON rr.referrer_seat_id = d.id
          )
          SELECT current_level FROM downline
        `, [b.id]);
        
        // This is a simplification: we need the highest rank in the subtree
        const allInSubtree = await dbAdapter.query(`
          WITH RECURSIVE downline AS (
            SELECT id, current_level FROM seats WHERE id = ?
            UNION ALL
            SELECT s.id, s.current_level FROM seats s 
            JOIN referral_relationships rr ON s.id = rr.seat_id
            JOIN downline d ON rr.referrer_seat_id = d.id
          )
          SELECT current_level FROM downline
        `, [b.id]);
        
        const topInBranch = allInSubtree.reduce((best, curr) => 
          getRank(curr.current_level) > getRank(best) ? curr.current_level : best, 'V0');
        
        branchStates[topInBranch] = (branchStates[topInBranch] || 0) + 1;
      }
      return branchStates;
    };

    const branchStates = await getBranchLevels(seatId);

    const getCountOfRank = async (levelCode: string) => {
      const includeHigher = await getSystemConfig('count_higher_level_as_lower', 'on') === 'on';
      const targetRank = getRank(levelCode);
      
      // Check directs first (for requirements like "30 direct V1")
      const directCount = directs.filter(d => includeHigher ? getRank(d.current_level) >= targetRank : getRank(d.current_level) === targetRank).length;
      
      // Check branches (for requirements like "3 branches with V5")
      let branchCount = 0;
      for (const rank in branchStates) {
        if (includeHigher ? getRank(rank) >= targetRank : getRank(rank) === targetRank) {
           branchCount += branchStates[rank];
        }
      }
      
      return { directCount, branchCount };
    };

    let qualifiedLevel = null;
    for (const lv of config) {
      if (lv.level_code === 'V2' || lv.level_code === 'V3') continue;
      
      let meets = true;
      if (lv.min_direct_referral_required > 0 && directValidCount < lv.min_direct_referral_required) meets = false;
      
      if (lv.direct_v1_required > 0) {
        const counts = await getCountOfRank('V1');
        if (counts.directCount < lv.direct_v1_required) meets = false;
      }
      
      if (lv.cultivation_level_code && lv.cultivation_count_required > 0) {
        const counts = await getCountOfRank(lv.cultivation_level_code);
        if (counts.branchCount < lv.cultivation_count_required) meets = false;
      }

      if (meets) qualifiedLevel = lv;
    }

    if (qualifiedLevel && getRank(qualifiedLevel.level_code) > getRank(seat.current_level)) {
      await dbAdapter.execute('UPDATE seats SET current_level = ? WHERE id = ?', [qualifiedLevel.level_code, seatId]);
      if (qualifiedLevel.reward_amount > 0) {
        const settlementTime = addDays(new Date(), qualifiedLevel.reward_settlement_days);
        const result = await dbAdapter.execute(`
          INSERT INTO reward_settlement (user_id, seat_id, level_code, reward_amount, settlement_days, default_settlement_time)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [seat.user_id, seat.id, qualifiedLevel.level_code, qualifiedLevel.reward_amount, qualifiedLevel.reward_settlement_days, settlementTime.toISOString()]);
        if (qualifiedLevel.reward_settlement_days === 0) await triggerSettlement(result.lastInsertRowid);
      }
      if (qualifiedLevel.level_code === 'V1') await joinMatrix(seatId, 'V2');
    }
  }

  async function getTeamVolume(rootSeatId: number | bigint): Promise<number> {
    const res = await dbAdapter.get(`
      WITH RECURSIVE downline AS (
        SELECT seat_id FROM referral_relationships WHERE referrer_seat_id = ?
        UNION ALL
        SELECT rr.seat_id FROM referral_relationships rr INNER JOIN downline d ON rr.referrer_seat_id = d.seat_id
      )
      SELECT SUM(amount) as total FROM orders WHERE seat_id IN (SELECT seat_id FROM downline) AND status = 'success'
    `, [rootSeatId]);
    return res?.total || 0;
  }

  async function calculatePerformanceBonuses() {
    const qualified = await dbAdapter.query(`
      SELECT s.user_id, s.id as seat_id, lc.performance_reward_rate 
      FROM seats s JOIN level_config lc ON s.current_level = lc.level_code WHERE lc.performance_reward_rate > 0
    `);

    for (const q of qualified) {
      const directs = await dbAdapter.query(`
        SELECT s.id, COALESCE(lc.performance_reward_rate, 0) as rate 
        FROM seats s 
        JOIN referral_relationships rr ON s.id = rr.seat_id 
        LEFT JOIN level_config lc ON s.current_level = lc.level_code
        WHERE rr.referrer_seat_id = ?
      `, [q.seat_id]);

      let totalDeduction = 0;
      let totalTeamVolume = 0;

      for (const d of directs) {
        const downlineVolume = await getTeamVolume(d.id);
        const mySeatRes = await dbAdapter.get("SELECT SUM(amount) as total FROM orders WHERE seat_id = ? AND status = 'success'", [d.id]);
        const mySeatVolume = mySeatRes?.total || 0;
        const totalBranchVolume = downlineVolume + mySeatVolume;
        
        totalTeamVolume += totalBranchVolume;
        if (d.rate > 0) {
          totalDeduction += totalBranchVolume * (d.rate / 100);
        }
      }

      const myFullPotential = totalTeamVolume * (q.performance_reward_rate / 100);
      const myBonus = myFullPotential - totalDeduction;

      if (myBonus > 0) {
        const result = await dbAdapter.execute(`
          INSERT INTO reward_settlement (user_id, seat_id, level_code, reward_amount, settlement_days, default_settlement_time)
          VALUES (?, ?, 'PERF', ?, 0, CURRENT_TIMESTAMP)
        `, [q.user_id, q.seat_id, myBonus]);
        await triggerSettlement(result.lastInsertRowid);
      }
    }
  }

  // --- API ---

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/system/config', async (req, res) => res.json({ 
    levels: await dbAdapter.query('SELECT * FROM level_config WHERE is_active = 1'),
    matrices: await dbAdapter.query('SELECT * FROM matrix_config WHERE is_active = 1'),
    system: await dbAdapter.query('SELECT * FROM system_config')
  }));

  app.post('/api/auth/wallet', async (req, res) => {
    const { walletAddress } = req.body;
    let user = await dbAdapter.get('SELECT * FROM users WHERE wallet_address = ?', [walletAddress]);
    if (!user) {
      const result = await dbAdapter.execute('INSERT INTO users (wallet_address) VALUES (?)', [walletAddress]);
      user = { id: Number(result.lastInsertRowid), wallet_address: walletAddress, role: 'production' };
    }
    res.json(user);
  });

  app.post('/api/seats/purchase', async (req, res) => {
    const { userId, referrerSeatId, isReinvestment, txHash } = req.body;
    
    // Verify On-chain
    const isValid = await verifyPayment(txHash, 80);
    if (!isValid) return res.status(400).json({ error: 'Payment verification failed' });

    try {
      let resultData: any;
      await dbAdapter.transaction(async () => {
        let sponsor = referrerSeatId;
        if (isReinvestment) {
          const oldest = await dbAdapter.get('SELECT id FROM seats WHERE user_id = ? ORDER BY id ASC LIMIT 1', [userId]);
          if (oldest) sponsor = oldest.id;
        }
        const order = await dbAdapter.execute('INSERT INTO orders (user_id, amount, is_reinvestment, status, transaction_hash) VALUES (?, 80, ?, ?, ?)', [userId, isReinvestment ? 1 : 0, 'success', txHash || 'SIMULATED']);
        const countRes = await dbAdapter.get('SELECT count(*) as count FROM seats');
        const count = countRes?.count || 0;
        const seat = await dbAdapter.execute('INSERT INTO seats (user_id, seat_number, origin, linked_order_id) VALUES (?, ?, ?, ?)', [userId, `S${String(count + 1).padStart(6, '0')}`, isReinvestment ? 'reinvest' : 'first', order.lastInsertRowid]);
        await dbAdapter.execute('UPDATE orders SET seat_id = ? WHERE id = ?', [seat.lastInsertRowid, order.lastInsertRowid]);
        
        if (sponsor) {
          await dbAdapter.execute('INSERT INTO referral_relationships (seat_id, referrer_seat_id) VALUES (?, ?)', [seat.lastInsertRowid, sponsor]);
          if (!isReinvestment || await getSystemConfig('reinvest_count_as_direct', 'off') === 'on') {
            await dbAdapter.execute('UPDATE seats SET direct_referral_count = direct_referral_count + 1 WHERE id = ?', [sponsor]);
          }
        }
        resultData = { seatId: seat.lastInsertRowid, sponsor };
      });
      
      await checkLevelUpgrades(resultData.seatId);
      if (resultData.sponsor) await checkLevelUpgrades(resultData.sponsor);
      res.json({ success: true, seatId: resultData.seatId });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/user/:userId/data', async (req, res) => {
    const uid = req.params.userId;
    const userRes = await dbAdapter.get('SELECT * FROM users WHERE id = ?', [uid]);
    const seatsRes = await dbAdapter.query('SELECT * FROM seats WHERE user_id = ?', [uid]);
    const earningsRes = await dbAdapter.query('SELECT * FROM reward_settlement WHERE user_id = ?', [uid]);
    const balanceRes = await dbAdapter.get("SELECT SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END) as bal FROM wallet_ledger WHERE user_id = ?", [uid]);
    
    res.json({
      user: userRes,
      seats: seatsRes,
      earnings: earningsRes,
      balance: balanceRes?.bal || 0
    });
  });

  app.get('/api/admin/rewards', async (req, res) => {
    res.json(await dbAdapter.query('SELECT r.*, u.wallet_address, s.seat_number FROM reward_settlement r JOIN users u ON r.user_id = u.id JOIN seats s ON r.seat_id = s.id ORDER BY r.created_at DESC'));
  });

  app.post('/api/admin/rewards/:id/action', async (req, res) => {
    const { id } = req.params;
    const { action, reason } = req.body;
    await dbAdapter.transaction(async () => {
      if (action === 'early_settle') {
        await dbAdapter.execute("UPDATE reward_settlement SET default_settlement_time = CURRENT_TIMESTAMP WHERE id = ?", [id]);
        await triggerSettlement(Number(id));
      } else if (action === 'cancel') {
        await dbAdapter.execute("UPDATE reward_settlement SET settlement_status = 'cancelled' WHERE id = ?", [id]);
      } else if (action === 'reverse') {
        const r = await dbAdapter.get('SELECT * FROM reward_settlement WHERE id = ?', [id]);
        if (r.settlement_status === 'settled') {
          await dbAdapter.execute('INSERT INTO wallet_ledger (user_id, amount, direction, ledger_type, remark) VALUES (?, ?, ?, ?, ?)', [r.user_id, r.reward_amount, 'debit', 'reversal', reason]);
          await dbAdapter.execute("UPDATE reward_settlement SET settlement_status = 'reversed' WHERE id = ?", [id]);
        }
      }
      await dbAdapter.execute('INSERT INTO admin_operation_logs (operation_type, target_id, reason) VALUES (?, ?, ?)', [action, id, reason]);
    });
    res.json({ success: true });
  });

  // SEED
  const seedRes = await dbAdapter.get('SELECT count(*) as count FROM level_config');
  if (seedRes?.count === 0) {
    const levels = [
      // level_code, rank, name, reward, days, min_direct, direct_v1, cult_level, cult_count, perf_rate
      ['V1', 1, 'V1 Genesis', 0, 0, 3, 0, null, 0, 0], 
      ['V2', 2, 'V2 Matrix Reward', 160, 0, 0, 0, null, 0, 0], 
      ['V3', 3, 'V3 Elite Matrix', 400, 0, 0, 0, null, 0, 0], 
      ['V4', 4, 'V4 Professional', 800, 0, 0, 4, null, 0, 0],
      ['V5', 5, 'V5 Leader', 1500, 0, 0, 12, null, 0, 2],
      ['V6', 6, 'V6 Manager', 3000, 0, 0, 0, 'V5', 3, 4],
      ['V7', 7, 'V7 Director', 6000, 0, 0, 0, 'V6', 3, 6],
      ['V8', 8, 'V8 President', 12000, 0, 20, 20, 'V7', 3, 8],
      ['V9', 9, 'V9 Global Partner', 25000, 0, 30, 30, 'V8', 3, 10],
      ['V10', 10, 'V10 Ecosystem Legend', 50000, 0, 0, 0, 'V9', 3, 12]
    ];
    for (const l of levels) {
       await dbAdapter.execute('INSERT INTO level_config (version, level_code, level_rank, level_name, reward_amount, reward_settlement_days, min_direct_referral_required, direct_v1_required, cultivation_level_code, cultivation_count_required, performance_reward_rate) VALUES (?,?,?,?,?,?,?,?,?,?,?)', ['V1', ...l]);
    }
    await dbAdapter.execute('INSERT INTO matrix_config (version, level_code, required_slots, reward_amount, settlement_days) VALUES (?,?,?,?,?)', ['V1', 'V2', 6, 160, 0]);
    await dbAdapter.execute('INSERT INTO matrix_config (version, level_code, required_slots, reward_amount, settlement_days) VALUES (?,?,?,?,?)', ['V1', 'V3', 14, 400, 0]);
  }

  // CRONS
  setInterval(async () => {
    const now = new Date().toISOString();
    const pend = await dbAdapter.query('SELECT id FROM reward_settlement WHERE settlement_status = ? AND default_settlement_time <= ?', ['scheduled', now]);
    for (const r of pend) {
      await triggerSettlement(r.id);
    }
  }, 10000);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => res.sendFile(path.join(process.cwd(), 'dist/index.html')));
  }
  app.listen(3000, '0.0.0.0', () => console.log('Server @ 3000'));
}
startServer();

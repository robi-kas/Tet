/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Users, 
  Settings, 
  TrendingUp, 
  Wallet, 
  Layers, 
  History, 
  LayoutDashboard,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowRightLeft,
  CircleDollarSign,
  QrCode,
  Search,
  Filter,
  ArrowUpCircle,
  Menu,
  X
} from 'lucide-react';
import { cn, apiCall } from './lib/utils';
import { QRCodeSVG } from 'qrcode.react';

import { useAccount, useDisconnect, useChainId, useBalance } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

// --- Components ---

const Navbar = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const location = useLocation();

  const getChainName = (id: number) => {
    if (id === 56) return 'BSC';
    if (id === 1) return 'ETH';
    if (id === 97) return 'T-BSC';
    return 'NET';
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'System', path: '/system' },
    { name: 'Team', path: '/team' },
    { name: 'Earnings', path: '/earnings' },
    { name: 'Admin', path: '/admin', admin: true },
  ];

  return (
    <>
      <nav className="apple-nav-global">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-6">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <Layers className="w-5 h-5" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              (!item.admin || user?.role === 'admin') && (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={cn(
                    "text-[12px] font-normal tracking-[-0.01em] hover:opacity-100 transition-opacity",
                    location.pathname === item.path ? "opacity-100" : "opacity-60"
                  )}
                >
                  {item.name}
                </Link>
              )
            ))}
          </div>
          <div className="flex items-center gap-4">
             {isConnected && (
               <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{getChainName(chainId)}</span>
               </div>
             )}
             <ConnectKitButton.Custom>
                {({ isConnected, show, address }) => (
                  <button onClick={show} className={cn(
                    "text-[12px] font-medium transition-all px-3 py-1 rounded-full",
                    isConnected ? "bg-canvas-parchment text-ink" : "bg-primary text-white"
                  )}>
                    {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
                  </button>
                )}
             </ConnectKitButton.Custom>
             {isConnected && user && (
               <button onClick={() => { disconnect(); onLogout(); }} className="text-[12px] opacity-60 hover:opacity-100 p-1">
                 <X className="w-4 h-4" />
               </button>
             )}
          </div>
        </div>
      </nav>
      
      {location.pathname !== '/' && (
        <nav className="apple-nav-sub">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-6">
            <h2 className="text-[21px] font-semibold tracking-[-0.015em]">
              {navItems.find(n => n.path === location.pathname)?.name || 'Matrix'}
            </h2>
            <div className="flex items-center gap-6">
               <button className="btn-apple-primary py-1 px-4 text-sm">Action</button>
            </div>
          </div>
        </nav>
      )}
    </>
  );
};

// --- Pages ---

const Landing = ({ onLogin }: { onLogin: (addr: string) => void }) => {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      onLogin(address);
    }
  }, [isConnected, address]);

  return (
    <div className="pt-[44px]">
      {/* Hero Tile */}
      <section className="apple-tile-light min-h-[90vh] flex flex-col items-center justify-center text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="max-w-3xl"
        >
          <h1 className="text-[56px] md:text-[80px] font-semibold tracking-[-0.015em] mb-4">80U Matrix</h1>
          <p className="text-[28px] font-normal leading-tight mb-8">Systematic yield maximization through decentralized networking.</p>
          <div className="flex items-center justify-center gap-4">
             <ConnectKitButton.Custom>
                {({ show }) => (
                  <button onClick={show} className="btn-apple-primary">Join Genesis</button>
                )}
             </ConnectKitButton.Custom>
             <button className="btn-apple-secondary flex items-center gap-1">Learn more <ChevronRight className="w-4 h-4" /></button>
          </div>
        </motion.div>
        
        <div className="mt-20 w-full max-w-4xl px-4">
           <img 
             src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop" 
             alt="Genesis Node" 
             className="w-full h-auto rounded-3xl product-shadow object-cover aspect-[16/9]"
           />
        </div>
      </section>

      {/* Feature Tile 1: Dark */}
      <section className="apple-tile-dark grid md:grid-cols-2 items-center gap-12">
        <div className="space-y-6">
           <h2 className="text-[40px] font-semibold tracking-[-0.015em]">Built on <br/> Immutable Code</h2>
           <p className="text-[21px] text-gray-400">Our matrix logic is governed by autonomous protocols. No central authority can alter the reward distribution.</p>
           <Link to="#" className="apple-link-on-dark flex items-center gap-1">View Audit Documentation <ChevronRight className="w-4 h-4" /></Link>
        </div>
        <div className="relative">
           <img 
             src="https://images.unsplash.com/photo-1642104704074-907c0698cbd9?q=80&w=2832&auto=format&fit=crop" 
             alt="Tech Grid" 
             className="w-full h-auto rounded-3xl object-cover aspect-square"
           />
        </div>
      </section>

      {/* Feature Tile 2: Parchment */}
      <section className="apple-tile-parchment flex flex-col items-center text-center">
        <div className="max-w-2xl mb-12">
          <h2 className="text-[40px] font-semibold tracking-[-0.015em] mb-4">The Path to Ascension</h2>
          <p className="text-[21px] font-normal text-ink-muted-80">From entry at V1 to the Global Partnership at V10, follow the systematic route.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full max-w-7xl">
           {[
             { title: 'Connect', desc: 'Link your Web3 wallet.' },
             { title: 'Activate', desc: 'Secure your Genesis position.' },
             { title: 'Expand', desc: 'Build your direct network.' },
             { title: 'Partner', desc: 'Reach V10 Global status.' }
           ].map((step, i) => (
             <div key={i} className="text-left space-y-4">
                <div className="text-[12px] font-semibold uppercase tracking-widest text-ink-muted-48">Step 0{i+1}</div>
                <h3 className="text-[24px] font-semibold">{step.title}</h3>
                <p className="text-[17px] text-ink-muted-80">{step.desc}</p>
             </div>
           ))}
        </div>
      </section>

      {/* Footer-ish Tile */}
      <section className="apple-tile-light text-center py-40">
         <h2 className="text-[56px] font-semibold mb-8">Join the Evolution.</h2>
         <ConnectKitButton.Custom>
            {({ show }) => (
              <button onClick={show} className="btn-apple-primary px-12 py-4 text-xl">Get Started Today</button>
            )}
         </ConnectKitButton.Custom>
      </section>
    </div>
  );
};

const Dashboard = ({ user }: { user: any }) => {
  const [data, setData] = useState<any>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const loadData = async () => {
    const res = await apiCall(`/user/${user.id}/data`);
    setData(res);
  };

  useEffect(() => { loadData(); }, [user.id]);

  const purchaseSeat = async () => {
    setIsPurchasing(true);
    try {
      const mockHash = `0x${Math.random().toString(16).slice(2)}...`;
      await apiCall('/seats/purchase', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, txHash: mockHash }),
      });
      await loadData();
    } catch (err) {
      alert('Purchase failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-apple-fade">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <p className="text-[17px] font-semibold text-primary mb-1">Genesis Network</p>
           <h1 className="text-[40px] font-semibold tracking-[-0.015em]">Dashboard Overview</h1>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={purchaseSeat}
             disabled={isPurchasing}
             className="btn-apple-primary"
           >
             {isPurchasing ? 'Processing...' : 'Activate New Seat'}
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Available Balance', value: `${data.balance} U`, icon: CircleDollarSign },
          { label: 'Active Seats', value: data.seats.length, icon: Layers },
          { label: 'Current Rank', value: data.seats[0]?.current_level || 'V0', icon: Shield },
          { label: 'Total Earnings', value: `${data.earnings.length > 0 ? data.earnings.reduce((a: any, b: any) => a + b.reward_amount, 0) : 0} U`, icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="apple-card">
            <stat.icon className="w-5 h-5 text-primary mb-6" />
            <p className="text-[14px] font-normal text-ink-muted-48 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-[28px] font-semibold">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Active Seats Detail */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[24px] font-semibold tracking-[-0.015em]">Your Active Nodes</h2>
            <Link to="#" className="apple-link text-sm">View all nodes</Link>
          </div>
          
          <div className="grid gap-4">
            {data.seats.length === 0 ? (
               <div className="apple-card py-20 text-center border-dashed">
                  <p className="text-ink-muted-48">No active seats found. Purchase your first seat to join the matrix.</p>
               </div>
            ) : (
              data.seats.map((seat: any) => (
                <div key={seat.id} className="apple-card flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-canvas-parchment flex items-center justify-center font-display text-xl font-bold product-shadow overflow-hidden">
                       <img src="https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=2832&auto=format&fit=crop" alt="Node" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[17px] font-semibold">{seat.current_level} Node</h4>
                        <span className="text-[10px] bg-canvas-parchment px-2 py-0.5 rounded uppercase font-bold text-ink-muted-48">{seat.origin.replace('_', ' ')}</span>
                      </div>
                      <p className="text-[14px] text-ink-muted-48 mt-0.5">Activated Node #{seat.seat_number}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 text-[14px] font-medium text-ink-muted-48">
                      <Users className="w-4 h-4" />
                      <span>{seat.direct_referral_count} Dir</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-primary text-[10px] font-bold uppercase tracking-widest">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                       {seat.matrix_status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Ledger */}
        <div className="space-y-6">
          <h2 className="text-[24px] font-semibold tracking-[-0.015em]">Recent Ledger</h2>
          <div className="grid gap-3">
            {data.earnings.length === 0 ? (
               <div className="apple-card py-12 text-center border-dashed">
                  <p className="text-sm text-ink-muted-48 italic">No earnings found. Build your team to unlock V1 rewards.</p>
               </div>
            ) : (
              data.earnings.slice(0, 6).map((earn: any) => (
                <div key={earn.id} className="apple-card border-none bg-surface-pearl flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-semibold text-primary mb-0.5">{earn.level_code} REWARD</p>
                    <p className="text-[12px] text-ink-muted-48">{new Date(earn.trigger_time).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[17px] font-semibold">+{earn.reward_amount} U</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link to="/earnings" className="text-[14px] apple-link font-medium flex items-center justify-center gap-1">
            Browse full ledger <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const SystemRules = () => {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    apiCall('/system/config').then(setConfig);
  }, []);

  if (!config) return <div className="p-20 text-center">Loading rules engine...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 animate-apple-fade">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[17px] font-semibold text-primary mb-2">Protocol</p>
        <h1 className="text-[48px] font-semibold tracking-[-0.015em] mb-4">Matrix Logic</h1>
        <p className="text-[21px] text-ink-muted-48">All rules are server-authoritative and governed by autonomous protocols.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {config.levels.sort((a: any, b: any) => a.level_rank - b.level_rank).map((lv: any) => (
          <div key={lv.id} className="apple-card group">
            <div className="flex items-center justify-between mb-10">
              <div className="w-16 h-16 rounded-2xl bg-canvas-parchment flex items-center justify-center text-[24px] font-bold text-primary product-shadow">
                {lv.level_code}
              </div>
              <div className="text-right">
                <span className="text-[12px] text-ink-muted-48 uppercase tracking-widest font-bold">Reward</span>
                <p className="text-[28px] font-semibold">{lv.reward_amount} U</p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[14px] font-semibold uppercase text-ink-muted-48 tracking-widest border-b border-divider-soft pb-2">Activation Path</h4>
              <ul className="space-y-4">
                {lv.min_direct_referral_required > 0 && (
                  <li className="flex items-center justify-between text-[17px]">
                    <span className="text-ink-muted-80">Direct Nodes</span>
                    <span className="font-semibold">{lv.min_direct_referral_required}</span>
                  </li>
                )}
                {lv.direct_v1_required > 0 && (
                  <li className="flex items-center justify-between text-[17px]">
                    <span className="text-ink-muted-80">Direct V1 Nodes</span>
                    <span className="font-semibold">{lv.direct_v1_required}</span>
                  </li>
                )}
                {lv.performance_reward_rate > 0 && (
                  <li className="flex items-center justify-between text-[17px] text-primary">
                    <span className="font-semibold">Team Volume</span>
                    <span className="font-bold">{lv.performance_reward_rate}%</span>
                  </li>
                )}
                {lv.matrix_enabled ? (
                  <li className="text-[14px] text-primary font-semibold italic">Public Matrix Path Active</li>
                ) : null}
              </ul>
            </div>

            <div className="mt-10 pt-6 border-t border-divider-soft flex items-center justify-between text-[12px] font-bold uppercase tracking-widest text-ink-muted-48">
              <span>Settlement: {lv.reward_settlement_days} Days</span>
              <span className={cn(lv.is_active ? "text-green-600" : "text-red-500")}>
                {lv.is_active ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const [rewards, setRewards] = useState<any[]>([]);
  const [upgradeUserId, setUpgradeUserId] = useState('');
  const [upgradeLevel, setUpgradeLevel] = useState('V1');
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    apiCall('/admin/rewards').then(setRewards);
  }, []);

  const handleUpgrade = async () => {
    if (!upgradeUserId) return;
    setIsUpgrading(true);
    try {
      await apiCall(`/admin/user/${upgradeUserId}/upgrade`, {
        method: 'POST',
        body: JSON.stringify({ targetLevel: upgradeLevel })
      });
      alert('Upgrade success');
      window.location.reload();
    } catch (err) {
      alert('Upgrade failed');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-apple-fade">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[17px] font-semibold text-red-600 mb-1">System Administration</p>
          <h1 className="text-[40px] font-semibold tracking-[-0.015em]">Admin Control</h1>
        </div>
        <span className="px-4 py-2 bg-red-50 text-red-600 text-[12px] font-bold rounded-full border border-red-100">Restricted Access</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="apple-card">
            <h3 className="text-[17px] font-semibold mb-6 flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-primary" />
              Manual Upgrade
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] text-ink-muted-48 uppercase font-bold tracking-widest block mb-2">User ID</label>
                <input 
                  type="text" 
                  value={upgradeUserId}
                  onChange={(e) => setUpgradeUserId(e.target.value)}
                  placeholder="Enter User ID"
                  className="w-full bg-canvas-parchment border border-divider-soft rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="text-[12px] text-ink-muted-48 uppercase font-bold tracking-widest block mb-2">Target Rank</label>
                <select 
                  value={upgradeLevel}
                  onChange={(e) => setUpgradeLevel(e.target.value)}
                  className="w-full bg-canvas-parchment border border-divider-soft rounded-xl px-4 py-3 text-sm appearance-none"
                >
                  {['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'].map(v => (
                    <option key={v} value={v}>{v} Rank</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="w-full btn-apple-primary py-3"
              >
                {isUpgrading ? 'Processing...' : 'Execute Upgrade'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="apple-card p-0 overflow-hidden">
            <div className="p-6 border-b border-divider-soft flex items-center justify-between">
              <h3 className="text-[17px] font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Settlement Queue
              </h3>
              <span className="text-[12px] text-ink-muted-48 uppercase font-bold tracking-widest">{rewards.length} Pending Distributions</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-canvas-parchment text-[12px] font-bold uppercase text-ink-muted-48 border-b border-divider-soft">
                  <tr>
                    <th className="p-6">User</th>
                    <th className="p-6">Node</th>
                    <th className="p-6">Amount</th>
                    <th className="p-6">Status</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider-soft">
                  {rewards.map((r: any) => (
                    <tr key={r.id} className="hover:bg-surface-pearl transition-colors text-[14px]">
                      <td className="p-6 font-mono text-ink-muted-48">{r.wallet_address.slice(0, 10)}...</td>
                      <td className="p-6 font-semibold">#{r.seat_number}</td>
                      <td className="p-6"><span className="bg-canvas-parchment px-2 py-1 rounded text-[12px] font-bold">{r.level_code}</span></td>
                      <td className="p-6 font-bold text-primary">{r.reward_amount} U</td>
                      <td className="p-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                          r.settlement_status === 'settled' ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"
                        )}>{r.settlement_status}</span>
                      </td>
                      <td className="p-6">
                        <div className="flex gap-4 justify-end">
                          {r.settlement_status === 'scheduled' && (
                            <>
                              <button 
                                onClick={async () => {
                                  await apiCall(`/admin/rewards/${r.id}/action`, {
                                    method: 'POST',
                                    body: JSON.stringify({ action: 'early_settle', reason: 'Admin override' })
                                  });
                                  window.location.reload();
                                }}
                                className="apple-link text-[12px] font-bold"
                              >Settle</button>
                              <button 
                                 onClick={async () => {
                                  await apiCall(`/admin/rewards/${r.id}/action`, {
                                    method: 'POST',
                                    body: JSON.stringify({ action: 'cancel', reason: 'System Disqualified' })
                                  });
                                  window.location.reload();
                                }}
                                className="text-red-500 hover:text-red-700 text-[12px] font-bold"
                              >Void</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Root Component ---

const TeamPage = ({ user }: { user: any }) => {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiCall(`/user/${user.id}/data`).then(setData); }, [user.id]);

  if (!data) return <div className="p-20 text-center animate-pulse">Scanning matrix...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-apple-fade">
      <div className="flex items-center justify-between">
        <h2 className="text-[34px] font-semibold tracking-[-0.015em]">Team Network</h2>
        <div className="flex gap-4">
           <div className="apple-card py-2 px-4 border-primary/20">
              <span className="text-[10px] text-ink-muted-48 uppercase font-bold block">Direct Nodes</span>
              <span className="text-xl font-bold text-primary">{data.seats.reduce((a:any, b:any) => a + b.direct_referral_count, 0)}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="apple-card md:col-span-1">
          <h3 className="text-[14px] font-bold text-ink-muted-48 uppercase mb-6 tracking-widest">Growth Distribution</h3>
          <div className="space-y-6">
            {['V1', 'V2', 'V3', 'V4', 'V5'].map(lv => (
              <div key={lv} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium">{lv} Qualified</span>
                  <span className="text-[14px] font-bold">0</span>
                </div>
                <div className="w-full h-1 bg-canvas-parchment rounded-full overflow-hidden">
                   <div className="h-full bg-primary" style={{ width: '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="apple-card md:col-span-2 flex flex-col justify-center items-center text-center py-24 min-h-[400px]">
           <div className="w-16 h-16 rounded-full bg-canvas-parchment flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-ink-muted-48" />
           </div>
           <h3 className="text-[21px] font-semibold mb-2">Network Visualizer</h3>
           <p className="text-ink-muted-48 max-w-xs">Your downline structure is being indexed. Check back shortly for the interactive graph.</p>
        </div>
      </div>
    </div>
  );
};

const EarningsPage = ({ user }: { user: any }) => {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { apiCall(`/user/${user.id}/data`).then(setData); }, [user.id]);

  if (!data) return <div className="p-20 text-center">Loading ledger...</div>;

  const filteredEarnings = data.earnings.filter((e: any) => {
    const matchesSearch = e.level_code.toLowerCase().includes(search.toLowerCase()) || 
                         `#N${e.seat_id}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.settlement_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-apple-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-[34px] font-semibold tracking-[-0.015em]">Earnings History</h2>
          <p className="text-ink-muted-48 mt-1 italic text-sm">Indexed ledger of all protocol distributions.</p>
        </div>
        <div className="apple-card py-2 px-6 border-primary/20">
           <span className="text-[10px] text-ink-muted-48 uppercase font-bold block">Current Assets</span>
           <span className="text-xl font-bold text-primary">{data.balance} U</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted-48" />
          <input 
            type="text" 
            placeholder="Search by Rank or Node ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-canvas-parchment border border-divider-soft rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="relative flex-shrink-0 w-full sm:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted-48" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-canvas-parchment border border-divider-soft rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none appearance-none"
          >
            <option value="all">All Status</option>
            <option value="settled">Settled</option>
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Void</option>
          </select>
        </div>
      </div>

      <div className="apple-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-canvas-parchment text-[12px] font-bold uppercase text-ink-muted-48 border-b border-divider-soft">
              <tr>
                <th className="p-6">Type</th>
                <th className="p-6">ID</th>
                <th className="p-6">Amount</th>
                <th className="p-6">Status</th>
                <th className="p-6">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-soft">
              {filteredEarnings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-ink-muted-48 italic">No distributions found matching your criteria.</td>
                </tr>
              ) : (
                filteredEarnings.map((e: any) => (
                  <tr key={e.id} className="hover:bg-surface-pearl transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <span className="text-[17px] font-semibold block">{e.level_code} System Reward</span>
                          <span className="text-[12px] text-ink-muted-48">Yield Distribution</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 font-mono text-[14px] text-ink-muted-48">#N{e.seat_id}</td>
                    <td className="p-6 text-[17px] font-semibold tracking-tight text-ink">+{e.reward_amount} U</td>
                    <td className="p-6 text-[14px]">
                       <span className={cn(
                          "px-3 py-1 rounded-full font-semibold uppercase text-[10px]",
                          e.settlement_status === 'settled' ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"
                        )}>{e.settlement_status}</span>
                    </td>
                    <td className="p-6 text-[14px] text-ink-muted-48">
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const InvitePage = ({ user }: { user: any }) => {
  const inviteUrl = `${window.location.origin}/?ref=${user.seats[0]?.id || ''}`;

  return (
    <div className="max-w-xl mx-auto px-6 py-20 space-y-12 animate-apple-fade text-center">
      <div className="space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
           <Users className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-[40px] font-semibold tracking-[-0.015em]">Grow the Matrix</h2>
        <p className="text-[21px] text-ink-muted-48">Expand your network to unlock collective rewards and accelerate your rank.</p>
      </div>

      <div className="apple-card space-y-6">
        <div className="text-left">
           <span className="text-[12px] text-ink-muted-48 uppercase font-bold tracking-widest block mb-2">Referral Link</span>
           <div className="bg-canvas-parchment p-4 rounded-xl font-mono text-[14px] text-primary break-all border border-divider-soft">
             {inviteUrl}
           </div>
        </div>
        <button 
          onClick={() => { navigator.clipboard.writeText(inviteUrl); alert('Copied to clipboard'); }}
          className="btn-apple-primary w-full py-4 text-lg"
        >
          Copy Share Link
        </button>
      </div>

      <div className="apple-card py-16 flex flex-col items-center justify-center border-dashed">
         <div className="p-4 bg-white rounded-2xl shadow-sm mb-6 border border-divider-soft">
            <QRCodeSVG 
              value={inviteUrl} 
              size={160}
              level="H"
              includeMargin={false}
            />
         </div>
         <p className="text-[14px] text-ink-muted-48 font-medium">Scan to join the matrix</p>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('matrix_user');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (wallet: string) => {
    const user = await apiCall('/auth/wallet', {
      method: 'POST',
      body: JSON.stringify({ walletAddress: wallet }),
    });
    setUser(user);
    localStorage.setItem('matrix_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('matrix_user');
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen relative bg-canvas text-ink antialiased">
        <Navbar user={user} onLogout={handleLogout} />
        
        <AnimatePresence mode="wait">
          {!user ? (
            <Landing onLogin={handleLogin} key="landing" />
          ) : (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="pt-[96px] pb-20"
            >
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/system" element={<SystemRules />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/team" element={<TeamPage user={user} />} />
                <Route path="/earnings" element={<EarningsPage user={user} />} />
                <Route path="/invite" element={<InvitePage user={user} />} />
              </Routes>
            </motion.div>
          )}
        </AnimatePresence>

        {user && user.role === 'test' && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 apple-card px-6 py-2 rounded-full border-primary/20 text-primary font-bold text-[11px] uppercase tracking-[0.1em] shadow-xl z-50">
            Internal Test Instance &bull; Kernel v{user.config_version || '2.0'}
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

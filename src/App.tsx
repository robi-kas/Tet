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
  Menu,
  X
} from 'lucide-react';
import { cn, apiCall } from './lib/utils';

import { useAccount, useDisconnect, useChainId, useBalance } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

// --- Components ---

const Navbar = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'System', path: '/system', icon: Shield },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Earnings', path: '/earnings', icon: TrendingUp },
    { name: 'Admin', path: '/admin', icon: Settings, admin: true },
  ];

  return (
    <nav className="glass sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center border border-brand-primary/30">
            <Layers className="w-6 h-6 text-brand-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight uppercase">80U Matrix</span>
        </Link>

        {isConnected && user && (
          <>
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                (!item.admin || user.role === 'admin') && (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-brand-primary",
                      location.pathname === item.path ? "text-brand-primary" : "text-gray-400"
                    )}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>

            <div className="flex items-center gap-4">
              <ConnectKitButton />
              <button 
                onClick={() => { disconnect(); onLogout(); }}
                className="bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"
                title="Logout"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
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
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="inline-block px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-6">
          Phase 1: Genesis Matrix
        </span>
        <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tight">
          Unlock Your Future in the <span className="gradient-text">80U Ecosystem</span>
        </h1>
        <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
          The most advanced, configuration-driven matrix system. Start your V1-V10 journey today with just 80U and unlock automated yields and team performance bonuses.
        </p>

        <div className="flex justify-center scale-150 transform origin-top">
          <ConnectKitButton />
        </div>
      </motion.div>
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
      // simulated txHash
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

  if (!data) return <div className="p-20 text-center animate-pulse">Loading core engine...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Available Balance', value: `${data.balance} U`, icon: CircleDollarSign, color: 'text-brand-primary' },
          { label: 'Active Seats', value: data.seats.length, icon: Layers, color: 'text-brand-secondary' },
          { label: 'Current Rank', value: data.seats[0]?.current_level || 'V0', icon: Shield, color: 'text-yellow-400' },
          { label: 'Total Earnings', value: `${data.earnings.length > 0 ? data.earnings.reduce((a: any, b: any) => a + b.reward_amount, 0) : 0} U`, icon: TrendingUp, color: 'text-white' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={cn("w-6 h-6", stat.color)} />
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Realtime</span>
            </div>
            <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-display font-bold">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-xl font-bold">Your Active Seats</h2>
            <button 
              onClick={purchaseSeat}
              disabled={isPurchasing}
              className="bg-brand-primary text-bg-dark text-xs font-bold px-4 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {isPurchasing ? 'Processing...' : '+ Activate New Seat'}
            </button>
          </div>
          
          <div className="space-y-3">
            {data.seats.length === 0 ? (
              <div className="glass p-12 text-center rounded-2xl border-dashed">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No active seats found. Purchase your first seat to join the matrix.</p>
              </div>
            ) : (
              data.seats.map((seat: any) => (
                <div key={seat.id} className="glass p-5 rounded-2xl flex items-center justify-between group hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-mono text-xs font-bold">
                      {seat.seat_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold underline decoration-brand-primary/30 underline-offset-4">{seat.current_level}</h4>
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded uppercase">{seat.origin.replace('_', ' ')}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Activated on {new Date(seat.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>{seat.direct_referral_count} Dir</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-brand-primary font-bold mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                      <span className="uppercase">{seat.matrix_status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold">Recent Earnings</h2>
          <div className="space-y-3">
            {data.earnings.length === 0 ? (
              <p className="text-sm text-gray-500 italic p-8 text-center glass rounded-2xl">No earnings yet. Keep building!</p>
            ) : (
              data.earnings.slice(0, 5).map((earn: any) => (
                <div key={earn.id} className="glass p-4 rounded-xl flex items-center justify-between border-l-2 border-l-brand-primary">
                  <div>
                    <p className="text-xs font-bold text-brand-primary uppercase">{earn.level_code} REWARD</p>
                    <p className="text-[10px] text-gray-500">{new Date(earn.trigger_time).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">+{earn.reward_amount} U</p>
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      earn.settlement_status === 'settled' ? "text-brand-primary" : "text-yellow-400"
                    )}>{earn.settlement_status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link to="/earnings" className="text-xs text-gray-400 flex items-center gap-1 hover:text-white transition-colors">
            View full history <ChevronRight className="w-3 h-3" />
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="font-display text-4xl font-bold mb-4">Membership Matrix Logic</h2>
        <p className="text-gray-400">All rules are server-authoritative and dynamically updated by the administration engine.</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
          <span className="text-xs font-mono text-gray-500">Version:</span>
          <span className="text-xs font-bold text-brand-primary">{config.levels[0]?.version}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {config.levels.sort((a: any, b: any) => a.level_rank - b.level_rank).map((lv: any, i: number) => (
          <div key={lv.id} className="glass p-8 rounded-3xl relative overflow-hidden group hover:border-brand-primary/40 transition-all">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/20 transition-all" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center font-display text-2xl font-black text-brand-primary border border-brand-primary/20">
                {lv.level_code}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Reward Amount</span>
                <p className="text-2xl font-display font-bold text-white">{lv.reward_amount} U</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest border-b border-white/5 pb-2">Upgrade Path</h4>
              <ul className="space-y-3">
                {lv.min_direct_referral_required > 0 && (
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                    Direct Seat Requirement: <span className="text-white font-bold ml-auto">{lv.min_direct_referral_required}</span>
                  </li>
                )}
                {lv.direct_v1_required > 0 && (
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    Direct V1 Required: <span className="text-white font-bold ml-auto">{lv.direct_v1_required}</span>
                  </li>
                )}
                {lv.cultivation_level_code && lv.cultivation_count_required > 0 && (
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary" />
                    Cultivate {lv.cultivation_count_required} Branches @ <span className="text-white font-bold ml-auto">{lv.cultivation_level_code}</span>
                  </li>
                )}
                {lv.performance_reward_rate > 0 && (
                  <li className="flex items-center gap-3 text-sm text-brand-primary font-bold">
                    <TrendingUp className="w-4 h-4" />
                    Team Volume: <span className="ml-auto">{lv.performance_reward_rate}%</span>
                  </li>
                )}
                {lv.matrix_enabled ? (
                  <li className="flex items-center gap-3 text-sm text-brand-secondary font-bold italic">
                    <ArrowRightLeft className="w-4 h-4" />
                    Public Matrix Path
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
              <span>Settlement: {lv.reward_settlement_days} Days</span>
              <span className={cn(lv.is_active ? "text-brand-primary" : "text-red-500")}>
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

  useEffect(() => {
    apiCall('/admin/rewards').then(setRewards);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-4xl font-bold">Admin Engine</h2>
        <span className="px-3 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full border border-red-500/20">System Restricted</span>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/2">
          <h3 className="font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-brand-primary" />
            Reward Settlement Queue
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/2 text-[10px] font-bold uppercase text-gray-500 border-b border-white/5">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Seat</th>
                <th className="p-4">Level</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Settlement Time</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {rewards.map((r: any) => (
                <tr key={r.id} className="hover:bg-white/2 transition-colors">
                  <td className="p-4 font-mono text-xs">{r.wallet_address.slice(0, 10)}...</td>
                  <td className="p-4 font-bold">{r.seat_number}</td>
                  <td className="p-4"><span className="bg-white/5 px-2 py-1 rounded text-xs">{r.level_code}</span></td>
                  <td className="p-4 font-bold text-brand-primary">{r.reward_amount} U</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      r.settlement_status === 'settled' ? "bg-brand-primary/10 text-brand-primary" : "bg-yellow-400/10 text-yellow-400"
                    )}>{r.settlement_status}</span>
                  </td>
                  <td className="p-4 text-xs text-gray-400">{new Date(r.default_settlement_time).toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {r.settlement_status === 'scheduled' && (
                        <>
                          <button 
                            onClick={async () => {
                              await apiCall(`/admin/rewards/${r.id}/action`, {
                                method: 'POST',
                                body: JSON.stringify({ action: 'early_settle', reason: 'Admin Manual override' })
                              });
                              window.location.reload();
                            }}
                            className="bg-brand-primary/20 text-brand-primary text-[10px] px-2 py-1 rounded"
                          >Settle Now</button>
                          <button 
                             onClick={async () => {
                              await apiCall(`/admin/rewards/${r.id}/action`, {
                                method: 'POST',
                                body: JSON.stringify({ action: 'cancel', reason: 'Disqualified' })
                              });
                              window.location.reload();
                            }}
                            className="bg-red-500/20 text-red-500 text-[10px] px-2 py-1 rounded"
                          >Cancel</button>
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
  );
};

// --- Main Root Component ---

const TeamPage = ({ user }: { user: any }) => {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiCall(`/user/${user.id}/data`).then(setData); }, [user.id]);

  if (!data) return <div className="p-20 text-center">Loading team graph...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-4xl font-bold">Team Matrix</h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-bold rounded-full border border-brand-primary/20">Directs: {data.seats.reduce((a:any, b:any) => a + b.direct_referral_count, 0)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl md:col-span-1">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Seat Distribution</h3>
          <div className="space-y-4">
            {['V1', 'V2', 'V3', 'V4', 'V5'].map(lv => (
              <div key={lv} className="flex items-center justify-between">
                <span className="text-xs font-mono">{lv} Qualified</span>
                <div className="flex items-center gap-2">
                   <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary" style={{ width: '20%' }} />
                   </div>
                   <span className="text-xs font-bold">0</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl md:col-span-2">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">Downline Performance</h3>
          <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/2">
             <div className="text-center">
                <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Tree view rendering...<br/>(Beta v2 Engine)</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EarningsPage = ({ user }: { user: any }) => {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiCall(`/user/${user.id}/data`).then(setData); }, [user.id]);

  if (!data) return <div className="p-20 text-center">Loading ledger...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-4xl font-bold">Transactions & Earnings</h2>
        <div className="flex gap-4">
           <div className="glass px-4 py-2 rounded-xl">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Current Balance</span>
              <span className="text-xl font-bold text-brand-primary">{data.balance} U</span>
           </div>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/2 text-[10px] font-bold uppercase text-gray-500 border-b border-white/10">
              <tr>
                <th className="p-4">Type</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.earnings.map((e: any) => (
                <tr key={e.id} className="hover:bg-white/2 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-brand-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-bold block">{e.level_code} Reward</span>
                        <span className="text-[10px] text-gray-500 uppercase">Yield Distribution</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-mono text-gray-400">REF#{e.seat_id}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-bold text-white">+{e.reward_amount} U</span>
                  </td>
                  <td className="p-4">
                     <div className="flex items-center gap-1.5">
                       <div className={cn(
                         "w-1.5 h-1.5 rounded-full",
                         e.settlement_status === 'settled' ? "bg-brand-primary" : "bg-yellow-400"
                       )} />
                       <span className={cn(
                          "text-[10px] font-bold uppercase",
                          e.settlement_status === 'settled' ? "text-brand-primary" : "text-yellow-400"
                        )}>{e.settlement_status}</span>
                     </div>
                  </td>
                  <td className="p-4 text-xs text-gray-500 font-mono">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
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
    <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-8">
      <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-brand-primary/20">
         <Users className="w-10 h-10 text-brand-primary" />
      </div>
      <h2 className="font-display text-4xl font-bold">Invite Your Team</h2>
      <p className="text-gray-400">Share your referral link to build your direct network and qualify for V1-V10 rewards.</p>
      
      <div className="glass p-6 rounded-2xl space-y-4">
        <div className="bg-white/5 p-4 rounded-xl font-mono text-sm break-all border border-white/10">
          {inviteUrl}
        </div>
        <button 
          onClick={() => { navigator.clipboard.writeText(inviteUrl); alert('Link copied!'); }}
          className="w-full bg-brand-primary text-bg-dark font-bold py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all"
        >
          Copy Referral Link
        </button>
      </div>

      <div className="p-8 glass rounded-3xl border-dashed border-2 flex items-center justify-center h-48">
         <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-loose">
            QR Code Generator<br/>In Beta Production
         </p>
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

  if (loading) return <div className="h-screen flex items-center justify-center font-display text-2xl font-bold animate-pulse">Initializing Ecosystem...</div>;

  return (
    <BrowserRouter>
      <div className="min-h-screen pb-20">
        <Navbar user={user} onLogout={handleLogout} />
        
        <AnimatePresence mode="wait">
          {!user ? (
            <Landing onLogin={handleLogin} />
          ) : (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Routes>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/system" element={<SystemRules />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/team" element={<TeamPage user={user} />} />
                <Route path="/earnings" element={<EarningsPage user={user} />} />
                <Route path="/transactions" element={<EarningsPage user={user} />} />
                <Route path="/invite" element={<InvitePage user={user} />} />
              </Routes>
            </motion.div>
          )}
        </AnimatePresence>

        {user && user.role === 'test' && (
          <div className="fixed bottom-0 left-0 right-0 bg-yellow-400 text-bg-dark font-bold text-center py-1 text-[10px] uppercase tracking-[0.2em] shadow-2xl z-50">
            Internal Test Mode Active &bull; Rule Version: {user.config_version || 'DEV'}
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

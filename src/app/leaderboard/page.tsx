'use client';

import { useState, useEffect } from 'react';
import TopNav from '@/components/layout/TopNav';
import BottomNav from '@/components/layout/BottomNav';
import { Trophy, Crown, Zap, Medal } from 'lucide-react';
import { useMe } from '@/store/useMe';

const RANK_ICONS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const COLORS = ['bg-emerald-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500'];

export default function LeaderboardPage() {
  const { stats } = useMe();
  const [range, setRange] = useState<'week' | 'all'>('week');
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?range=${range}`);
        if (res.ok) {
          const data = await res.json();
          setPlayers(data.leaderboard);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [range]);

  return (
    <>
      <TopNav />
      <div className="max-w-2xl w-full mx-auto px-4 py-6 flex-1 mb-16">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-amber-500" /> Leaderboard
          </h1>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full max-w-sm mb-4">
            <button 
              onClick={() => setRange('week')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition ${range === 'week' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Minggu Ini
            </button>
            <button 
              onClick={() => setRange('all')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition ${range === 'all' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sepanjang Waktu
            </button>
          </div>
          
          {range === 'week' && (
            <p className="text-sm text-slate-500 font-semibold">XP dari hari Senin hingga saat ini.</p>
          )}
        </div>

        {/* League Banner */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-3xl p-5 mb-6 banner-3d relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-lg pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <Medal className="w-10 h-10" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider opacity-80">
                {range === 'week' ? 'Liga Mingguan' : 'Hall of Fame'}
              </p>
              <p className="font-black text-xl">Prism League</p>
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden min-h-[300px] relative">
          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center">
               <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-purple-600 rounded-full" />
             </div>
          ) : players.length === 0 ? (
             <div className="p-8 text-center text-slate-500 font-bold">Belum ada data.</div>
          ) : (
            players.map((player, idx) => {
              const avatarLetter = player.username?.[0]?.toUpperCase() || 'P';
              const color = player.isCurrentUser ? 'bg-purple-600' : COLORS[idx % COLORS.length];

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-5 py-4 ${
                    idx < players.length - 1 ? 'border-b border-slate-100' : ''
                  } ${player.isCurrentUser ? 'bg-purple-50 border-l-4 border-l-purple-500' : 'hover:bg-slate-50'} transition`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center">
                      {RANK_ICONS[player.rank] ? (
                        <span className="text-xl">{RANK_ICONS[player.rank]}</span>
                      ) : (
                        <span className="font-black text-slate-400">{player.rank}</span>
                      )}
                    </div>
                    <div className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center text-sm font-black shadow-sm`}>
                      {avatarLetter}
                    </div>
                    <div>
                      <p className={`font-extrabold text-sm ${player.isCurrentUser ? 'text-purple-700' : 'text-slate-800'}`}>
                        {player.username} {player.isCurrentUser && <span className="text-purple-400 font-bold">(Kamu)</span>}
                      </p>
                      {player.rank <= 3 && (
                        <div className="flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] font-black text-amber-600 uppercase">Top 3</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-black text-sm">
                    <Zap className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                    <span className={player.isCurrentUser ? 'text-purple-700' : 'text-slate-600'}>{player.xp} XP</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <BottomNav active="leaderboard" />
    </>
  );
}

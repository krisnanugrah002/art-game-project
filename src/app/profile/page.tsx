'use client';

import TopNav from '@/components/layout/TopNav';
import BottomNav from '@/components/layout/BottomNav';
import { Flame, Zap, Droplet, Settings, ChevronRight, LogOut, Palette, Loader2 } from 'lucide-react';
import { useMe } from '@/store/useMe';
import { useState } from 'react';

export default function ProfilePage() {
  const { stats, isLoading, refetch } = useMe();
  const [isChangingName, setIsChangingName] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleExport = () => {
    window.location.href = '/api/me/export';
  };

  const handleChangeUsername = async () => {
    if (newUsername.length < 3) return alert('Minimal 3 karakter');
    try {
      const res = await fetch('/api/me/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
      });
      if (res.ok) {
        alert('Username berhasil diubah!');
        setIsChangingName(false);
        setNewUsername('');
        refetch();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mengubah username');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  const BADGES = [
    { emoji: '🎨', name: 'Pelukis Pertama', desc: 'Menyelesaikan level pertama', locked: !stats?.chapterProgress?.length },
    { emoji: '🔥', name: '3 Hari Menyala', desc: 'Streak 3 hari berturut-turut', locked: (stats?.current_streak || 0) < 3 },
    { emoji: '⭐', name: 'Sang Bintang', desc: 'Mendapat bintang sempurna', locked: true },
    { emoji: '🏆', name: 'Sang Maestro', desc: 'Selesaikan semua level Unit 1', locked: true },
  ];

  return (
    <>
      <TopNav />
      <div className="max-w-2xl w-full mx-auto px-4 py-6 flex-1 mb-20">
        
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-6 text-white banner-3d relative overflow-hidden mb-6">
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl shadow-lg">
              {stats?.profile?.username?.[0]?.toUpperCase() || '🎨'}
            </div>
            <div>
              <h2 className="font-black text-2xl tracking-tight">{stats?.profile?.username || 'Pemain'}</h2>
              <p className="text-purple-200 font-semibold text-sm">@{stats?.profile?.username_key || 'pemain'}</p>
              <p className="text-purple-100 text-xs mt-1 font-bold">🛤️ Jalur Seni Lukis & Ilustrasi</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-4 flex flex-col items-center gap-1">
            <Flame className="w-6 h-6 fill-amber-500 stroke-amber-500" />
            <span className="font-black text-2xl text-amber-600">{stats?.current_streak || 0}</span>
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wide">Streak</span>
          </div>
          <div className="bg-white rounded-2xl border-2 border-yellow-200 shadow-sm p-4 flex flex-col items-center gap-1">
            <Zap className="w-6 h-6 fill-yellow-400 stroke-yellow-500" />
            <span className="font-black text-2xl text-yellow-600">{stats?.total_xp || 0}</span>
            <span className="text-[11px] font-bold text-yellow-500 uppercase tracking-wide">Total XP</span>
          </div>
          <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-sm p-4 flex flex-col items-center gap-1">
            <Droplet className="w-6 h-6 fill-rose-500 stroke-rose-500" />
            <span className="font-black text-2xl text-rose-600">{stats?.lives ?? 0}</span>
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wide">Nyawa</span>
          </div>
        </div>

        {/* Badges / Achievements */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-5 mb-6">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
            <span>🏅</span> Badge & Pencapaian
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {BADGES.map(badge => (
              <div key={badge.name} className={`flex items-center gap-3 p-3 rounded-2xl border ${
                badge.locked ? 'border-slate-200 opacity-50 grayscale' : 'border-purple-200 bg-purple-50'
              }`}>
                <span className="text-2xl">{badge.emoji}</span>
                <div>
                  <p className="font-extrabold text-xs text-slate-800">{badge.name}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings List */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden mb-6">
          <h3 className="font-black text-slate-800 px-5 pt-5 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-500" /> Pengaturan
          </h3>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
            {isChangingName ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newUsername} 
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="Username baru"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300"
                />
                <button onClick={handleChangeUsername} className="bg-purple-600 text-white font-bold px-4 py-2 rounded-xl">Simpan</button>
                <button onClick={() => setIsChangingName(false)} className="bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl">Batal</button>
              </div>
            ) : (
              <button onClick={() => setIsChangingName(true)} className="w-full flex items-center justify-between py-2 hover:bg-slate-100 transition rounded-lg">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <Palette className="w-4 h-4" /> Ganti Username
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          <button onClick={handleExport} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition border-t border-slate-100">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <span className="text-sm">📥</span> Ekspor Data
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-rose-200 text-rose-600 font-extrabold text-sm hover:bg-rose-50 transition">
          <LogOut className="w-4 h-4" />
          Keluar dari Akun
        </button>
      </div>
      <BottomNav active="profile" />
    </>
  );
}

'use client';

import { Palette, Flame, Zap, Droplet, Gem } from 'lucide-react';
import { useMe } from '@/store/useMe';

export default function TopNav() {
  const { stats } = useMe();
  // stats?.lives will now have the computed lives from the API
  const lives = stats?.lives ?? 0;
  const xp = stats?.total_xp ?? 0;
  const streak = stats?.current_streak ?? 0;

  return (
    <header className="sticky top-0 z-50 bg-slate-50/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent hidden sm:inline">
              ArtMastery
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-amber-200/80 shadow-sm hover:border-amber-300 transition cursor-pointer group">
            <Flame className="w-5 h-5 fill-amber-500 stroke-amber-500 transition-transform group-hover:scale-110" />
            <span className="font-extrabold text-amber-600 text-sm sm:text-base">{streak}</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-yellow-200/80 shadow-sm hover:border-yellow-300 transition cursor-pointer group">
            <Zap className="w-5 h-5 fill-yellow-400 stroke-yellow-500 transition-transform group-hover:scale-110" />
            <span className="font-extrabold text-yellow-600 text-sm sm:text-base">
              {xp} <span className="hidden md:inline text-xs uppercase tracking-wider text-yellow-500">XP</span>
            </span>
          </div>

          {/* Lives */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-rose-200/80 shadow-sm hover:border-rose-300 transition cursor-pointer group">
            <Droplet className="w-5 h-5 fill-rose-500 stroke-rose-500 transition-transform group-hover:scale-110" />
            <span className="font-extrabold text-rose-600 text-sm sm:text-base">{lives}</span>
          </div>

          {/* Unit Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 font-bold text-sm">
            <Gem className="w-4 h-4 text-purple-600" />
            <span>Unit 1</span>
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Trophy, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Map, label: 'Learn', id: 'learn' },
  { href: '/leaderboard', icon: Trophy, label: 'Rank', id: 'leaderboard' },
  { href: '/profile', icon: User, label: 'Profile', id: 'profile' },
];

interface BottomNavProps {
  active?: string;
}

export default function BottomNav({ active }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200/90 py-2 sm:py-3 px-6 shadow-lg md:max-w-md md:left-1/2 md:-translate-x-1/2 md:bottom-4 md:rounded-full md:border md:shadow-xl">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = active ? active === href.replace('/', '') || (href === '/' && active === 'learn') : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 transition transform hover:-translate-y-1 active:scale-95 group ${
                isActive ? 'text-purple-700' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-2xl transition ${
                isActive ? 'bg-purple-100 group-hover:bg-purple-200' : 'group-hover:bg-slate-100'
              }`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span className={`text-[11px] uppercase tracking-wider ${isActive ? 'font-black' : 'font-bold'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

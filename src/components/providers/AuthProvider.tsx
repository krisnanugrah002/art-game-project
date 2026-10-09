'use client';

import { useEffect, useState } from 'react';
import { useMe } from '@/store/useMe';
import { usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, refetch } = useMe();
  const [init, setInit] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    refetch().finally(() => setInit(true));
  }, [refetch]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!init || isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-purple-600 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

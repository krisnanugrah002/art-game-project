'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, ArrowRight, UserPlus, LogIn, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [checkResult, setCheckResult] = useState<{ exists: boolean; summary: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError('Username minimal 3 karakter.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setCheckResult(data);
        setStep('confirm');
      } else {
        setError(data.error || 'Terjadi kesalahan');
      }
    } catch (err) {
      setError('Gagal menghubungi server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const endpoint = checkResult?.exists ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      
      if (res.ok) {
        // Force reload to get session data across the app (Zustand will sync from API later, or we just reload for simplicity)
        window.location.href = '/';
      } else {
        setError(data.error || 'Gagal masuk');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Gagal menghubungi server');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-purple-200">
      <div className="max-w-md w-full">
        
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mx-auto mb-4 relative">
            <Palette className="w-8 h-8" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs border-2 border-white">✨</div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ArtMastery</h1>
          <p className="text-slate-500 font-bold mt-1">Platform Belajar Seni Rupa Dasar</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {step === 'input' ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-slate-800">Selamat datang! 🎨</h2>
                  <p className="text-sm text-slate-500 font-semibold mt-1">Masukkan username kamu untuk mulai belajar atau melanjutkan progres.</p>
                </div>

                <form onSubmit={handleCheck} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError('');
                      }}
                      placeholder="Username (tanpa spasi)"
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-4 font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
                      autoFocus
                    />
                    {error && <p className="text-rose-500 text-sm font-bold mt-2 ml-1">{error}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || username.length < 3}
                    className="w-full btn-3d-purple text-white font-black text-base py-4 rounded-2xl flex items-center justify-center gap-2 tracking-wide uppercase transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lanjutkan'}
                    {!isLoading && <ArrowRight className="w-5 h-5 stroke-[3]" />}
                  </button>
                </form>

                <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3 text-sm">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-blue-800 font-medium leading-relaxed">
                    Username kamu menyimpan semua progres (XP, nyawa, stage). Tanpa password! Catat username kamu baik-baik untuk login di perangkat lain.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  {checkResult?.exists ? (
                    <LogIn className="w-8 h-8 text-purple-600" />
                  ) : (
                    <UserPlus className="w-8 h-8 text-purple-600" />
                  )}
                </div>
                
                <h2 className="text-xl font-extrabold text-slate-800 mb-2">
                  {checkResult?.exists ? 'Selamat datang kembali!' : 'Akun Baru'}
                </h2>
                <p className="text-slate-600 font-medium mb-6 px-4">
                  {checkResult?.summary}
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full btn-3d-green text-white font-black text-base py-4 rounded-2xl flex items-center justify-center gap-2 tracking-wide uppercase transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (checkResult?.exists ? 'Ya, Lanjutkan' : 'Buat & Mulai')}
                  </button>
                  <button
                    onClick={() => setStep('input')}
                    disabled={isLoading}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-2xl transition"
                  >
                    Bukan aku, ganti nama
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

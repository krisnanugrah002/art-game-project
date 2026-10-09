'use client';

import { useState } from 'react';
import { getGameComponent } from '@/lib/games/registry';
import { GameResult } from '@/lib/games/types';
import { X, Play } from 'lucide-react';

interface GameShellProps {
  type: string;
  title: string;
  config: any;
  attemptId: string;
  onComplete: (result: GameResult) => void;
  onExit: () => void;
}

export default function GameShell({ type, title, config, attemptId, onComplete, onExit }: GameShellProps) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [result, setResult] = useState<GameResult | null>(null);

  const GameComponent = getGameComponent(type);

  const handleFinish = (res: GameResult) => {
    setResult(res);
    setPhase('result');
  };

  if (phase === 'intro') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full relative">
        <button onClick={onExit} className="absolute top-0 right-0 p-3 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <div className="w-48 h-48 mx-auto mb-6 rounded-3xl overflow-hidden shadow-xl border-4 border-purple-200">
          <img src="/assets/art_minigame.jpg" alt="Art Minigame" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 mb-8 font-bold bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
          Tantangan Praktik
        </p>
        
        <button 
          onClick={() => setPhase('playing')}
          className="w-full btn-3d-purple text-white font-black py-4 rounded-2xl text-lg uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-white" /> Mulai Bermain
        </button>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
        <div className="text-6xl mb-6">{result.score >= 70 ? '🎉' : '👍'}</div>
        <h2 className={`text-3xl font-black mb-2 ${result.score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
          Skor: {result.score}
        </h2>
        <p className="text-slate-500 font-bold mb-8">
          Waktu: {Math.round(result.durationMs / 1000)} detik
        </p>
        
        <button 
          onClick={() => onComplete(result)}
          className="w-full btn-3d-emerald text-white font-black py-4 rounded-2xl text-lg uppercase tracking-wider"
        >
          Lanjut
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full relative">
      <button onClick={onExit} className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-slate-600 z-50">
        <X className="w-5 h-5" />
      </button>
      <GameComponent 
        config={config} 
        seed={attemptId} 
        difficulty={1} 
        onFinish={handleFinish} 
        onExit={onExit} 
      />
    </div>
  );
}

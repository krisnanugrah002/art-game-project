'use client';
import { GameProps } from '@/lib/games/types';
import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function FallbackGame({ config, onFinish }: GameProps) {
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const startTime = useState(Date.now())[0];

  const handleFinish = (win: boolean) => {
    const duration = Date.now() - startTime;
    onFinish({
      score: win ? 100 : 50,
      durationMs: duration,
      stats: { correct: win ? 1 : 0 }
    });
  };

  const options = config?.targets ? config.targets : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'];

  return (
    <div className="flex-1 flex flex-col w-full h-full pb-8">
      <h3 className="text-xl font-bold text-slate-800 text-center mb-6">Pilih jawaban yang paling tepat!</h3>
      <div className="grid grid-cols-2 gap-4 mb-auto">
        {options.map((opt: string, i: number) => (
          <button
            key={i}
            onClick={() => setSelectedMatch(i)}
            className={`p-4 rounded-2xl font-bold text-lg border-4 transition break-words ${selectedMatch === i ? 'border-purple-500 bg-purple-100 text-purple-700 scale-105' : 'border-slate-200 bg-white text-slate-600'}`}
          >
            {opt}
          </button>
        ))}
      </div>
      <button 
        onClick={() => handleFinish(selectedMatch !== null)}
        disabled={selectedMatch === null}
        className={`mt-6 w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition ${selectedMatch !== null ? 'btn-3d-purple text-white' : 'bg-slate-300 text-slate-500 border-b-4 border-slate-400'}`}
      >
        Konfirmasi
      </button>
    </div>
  );
}

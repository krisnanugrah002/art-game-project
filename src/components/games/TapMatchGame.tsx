'use client';
import { GameProps } from '@/lib/games/types';
import { useState } from 'react';

export default function TapMatchGame({ config, onFinish }: GameProps) {
  const prompt = config?.prompt || 'Pilih jawaban yang benar!';
  const items = config?.items || [
    { id: '1', label: 'Pilihan Benar', correct: true },
    { id: '2', label: 'Pilihan Salah', correct: false },
    { id: '3', label: 'Salah', correct: false },
    { id: '4', label: 'Benar', correct: true },
  ];
  
  const expectedCorrect = items.filter((i: any) => i.correct).length;
  
  const [selected, setSelected] = useState<string[]>([]);
  const startTime = useState(Date.now())[0];

  const handleToggle = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    let correctCount = 0;
    let wrongCount = 0;
    
    selected.forEach(id => {
      const it = items.find((i: any) => i.id === id);
      if (it?.correct) correctCount++;
      else wrongCount++;
    });
    
    let score = 0;
    if (expectedCorrect > 0) {
       score = Math.max(0, Math.round(((correctCount - wrongCount) / expectedCorrect) * 100));
       score = Math.min(100, score);
    } else {
       score = 100;
    }
    
    onFinish({
      score: score === 100 && selected.length === expectedCorrect ? 100 : score,
      durationMs: Date.now() - startTime,
      stats: { correct: correctCount, mistakes: wrongCount }
    });
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full pb-8">
      <h3 className="text-xl font-bold text-slate-800 text-center mb-6">{prompt}</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-auto px-4">
        {items.map((it: any) => {
          const isSel = selected.includes(it.id);
          return (
            <button
              key={it.id}
              onClick={() => handleToggle(it.id)}
              className={`p-6 rounded-3xl font-black text-lg transition-all border-4 shadow-sm active:scale-95 ${
                isSel 
                  ? 'border-purple-500 bg-purple-100 text-purple-700 scale-105' 
                  : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:bg-slate-50'
              }`}
            >
              {it.label}
            </button>
          );
        })}
      </div>

      <button 
        onClick={handleSubmit}
        disabled={selected.length === 0}
        className={`mt-8 mx-4 py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition ${
          selected.length > 0 ? 'btn-3d-purple text-white' : 'bg-slate-300 text-slate-500 border-b-4 border-slate-400 cursor-not-allowed'
        }`}
      >
        Konfirmasi Jawaban
      </button>
    </div>
  );
}

'use client';
import { GameProps } from '@/lib/games/types';
import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function SwipeDeckGame({ config, onFinish }: GameProps) {
  const leftLabel = config?.leftLabel || 'Kiri';
  const rightLabel = config?.rightLabel || 'Kanan';
  const cards = config?.cards || [
    { id: '1', label: 'Item 1', target: 'left' },
    { id: '2', label: 'Item 2', target: 'right' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [animationDir, setAnimationDir] = useState<string | null>(null);
  
  const startTime = useState(Date.now())[0];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (animationDir) return;
    
    const card = cards[currentIndex];
    const isCorrect = card.target === direction;
    
    if (isCorrect) {
      setCorrect(c => c + 1);
    }
    
    setAnimationDir(direction);
    
    setTimeout(() => {
      setAnimationDir(null);
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        const finalCorrect = isCorrect ? correct + 1 : correct;
        onFinish({
          score: Math.round((finalCorrect / cards.length) * 100),
          durationMs: Date.now() - startTime,
          stats: { correct: finalCorrect, total: cards.length }
        });
      }
    }, 300);
  };

  const card = cards[currentIndex];

  return (
    <div className="flex-1 flex flex-col w-full h-full pb-8 items-center overflow-hidden relative">
      <h3 className="text-xl font-bold text-slate-800 text-center mb-8">Geser ke kategori yang tepat!</h3>
      
      <div className="flex-1 w-full max-w-sm flex items-center justify-center relative">
        {card ? (
          <div 
            className={`w-full aspect-square bg-white border-4 border-slate-200 rounded-3xl shadow-xl flex items-center justify-center p-8 text-center transition-all duration-300 ${
              animationDir === 'left' ? '-translate-x-full rotate-[-20deg] opacity-0' :
              animationDir === 'right' ? 'translate-x-full rotate-[20deg] opacity-0' :
              'translate-x-0 rotate-0 opacity-100'
            }`}
          >
             <span className="text-4xl font-black text-slate-700">{card.label}</span>
          </div>
        ) : (
          <div className="w-full aspect-square flex items-center justify-center text-slate-400 font-bold">
            Selesai!
          </div>
        )}
      </div>

      <div className="w-full flex gap-4 mt-8 px-4">
        <button 
          onClick={() => handleSwipe('left')}
          className="flex-1 btn-3d-rose text-white py-4 rounded-2xl font-black text-sm md:text-base uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3]" /> {leftLabel}
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="flex-1 btn-3d-emerald text-white py-4 rounded-2xl font-black text-sm md:text-base uppercase tracking-wider flex items-center justify-center gap-2"
        >
          {rightLabel} <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
      
      <div className="mt-6 text-slate-400 font-bold bg-slate-100 px-4 py-1.5 rounded-full">
        Kartu {currentIndex + 1 > cards.length ? cards.length : currentIndex + 1} dari {cards.length}
      </div>
    </div>
  );
}

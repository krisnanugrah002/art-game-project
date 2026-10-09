'use client';
import { GameProps } from '@/lib/games/types';
import { useState, useEffect } from 'react';

export default function MemoryMatchGame({ config, onFinish }: GameProps) {
  const initialCards = config?.cards || [
    { id: '1', content: 'Merah', pairId: 'A' },
    { id: '2', content: 'Kuning', pairId: 'B' },
    { id: '3', content: 'Hijau (Merah)', pairId: 'A' },
    { id: '4', content: 'Ungu (Kuning)', pairId: 'B' },
  ];
  
  // shuffle cards on mount
  const [cards] = useState(() => [...initialCards].sort(() => Math.random() - 0.5));
  
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const startTime = useState(Date.now())[0];

  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      if (cards[first].pairId === cards[second].pairId) {
        setMatched(prev => [...prev, cards[first].pairId]);
        setFlipped([]);
      } else {
        const timer = setTimeout(() => setFlipped([]), 1000);
        return () => clearTimeout(timer);
      }
      setMoves(m => m + 1);
    }
  }, [flipped, cards]);
  
  useEffect(() => {
    const totalPairs = new Set(cards.map((c: any) => c.pairId)).size;
    if (matched.length > 0 && matched.length === totalPairs) {
      const idealMoves = totalPairs;
      const penalty = Math.max(0, moves - idealMoves) * 10;
      const score = Math.max(50, 100 - penalty);
      
      const timer = setTimeout(() => {
        onFinish({
          score,
          durationMs: Date.now() - startTime,
          stats: { moves }
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [matched, cards, moves, onFinish, startTime]);

  const handleFlip = (index: number) => {
    if (flipped.length < 2 && !flipped.includes(index) && !matched.includes(cards[index].pairId)) {
      setFlipped([...flipped, index]);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full pb-8">
      <h3 className="text-xl font-bold text-slate-800 text-center mb-6">Temukan Pasangannya!</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-auto px-4">
        {cards.map((card: any, i: number) => {
          const isFlipped = flipped.includes(i) || matched.includes(card.pairId);
          return (
            <div 
              key={i}
              onClick={() => handleFlip(i)}
              className="aspect-[4/3] rounded-3xl cursor-pointer perspective-1000"
            >
              <div 
                className={`w-full h-full rounded-3xl flex items-center justify-center text-center font-bold border-4 shadow-sm transition-all duration-500 transform-gpu ${
                  isFlipped 
                    ? matched.includes(card.pairId) 
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800' 
                      : 'bg-white border-purple-300 text-slate-800'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-700 shadow-md'
                }`}
                style={{ rotate: isFlipped ? '0deg' : '0deg', transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)' }}
              >
                <span className={`text-xl px-2 ${!isFlipped && 'hidden'}`}>{card.content}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 text-center font-black text-slate-400 bg-slate-100 py-2 rounded-2xl mx-12">
        Langkah: {moves}
      </div>
    </div>
  );
}

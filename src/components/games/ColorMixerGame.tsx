'use client';
import { GameProps } from '@/lib/games/types';
import { useState } from 'react';

const RYB_TO_HEX: Record<string, string> = {
  'merah': '#ef4444',
  'kuning': '#eab308',
  'biru': '#3b82f6',
  'putih': '#ffffff',
  'hitam': '#1e293b',
  
  // Mixed (1:1)
  'kuning-merah': '#f97316', // Oranye
  'biru-kuning': '#22c55e', // Hijau
  'biru-merah': '#a855f7', // Ungu
  
  // Mixed (all)
  'biru-kuning-merah': '#78350f', // Coklat
};

function mixNames(names: string[]) {
  if (names.length === 0) return '#ffffff';
  if (names.length === 1) return RYB_TO_HEX[names[0]] || '#ccc';
  
  const sorted = [...new Set(names)].sort().join('-');
  return RYB_TO_HEX[sorted] || '#57534e'; // Fallback
}

export default function ColorMixerGame({ config, onFinish }: GameProps) {
  const targetColor = config?.target || { name: 'Hijau (Biru + Kuning)', hex: '#22c55e' };
  
  const [drops, setDrops] = useState<string[]>([]);
  const startTime = useState(Date.now())[0];

  const handleDrop = (color: string) => {
    if (drops.length < 3) {
      setDrops([...drops, color]);
    }
  };
  
  const currentHex = mixNames(drops);
  
  const handleMix = () => {
    const isCorrect = currentHex === targetColor.hex;
    onFinish({
      score: isCorrect ? 100 : 0,
      durationMs: Date.now() - startTime,
      stats: { drops: drops.length }
    });
  };

  const handleReset = () => setDrops([]);

  return (
    <div className="flex-1 flex flex-col w-full h-full pb-8">
      <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Racik Cat: {targetColor.name}</h3>
      <p className="text-center text-slate-500 mb-8 font-medium">Ketuk warna untuk diteteskan ke palet.</p>
      
      <div className="flex-1 flex flex-col items-center justify-center mb-8 relative">
        <div 
          className="w-56 h-56 rounded-full border-[12px] border-slate-100 shadow-xl transition-colors duration-500 flex items-center justify-center text-slate-400 font-bold"
          style={{ backgroundColor: currentHex }}
        >
           {drops.length === 0 ? 'Palet Kosong' : ''}
        </div>
        
        <div className="absolute top-0 right-4 bg-white p-3 rounded-2xl shadow-lg border-2 border-slate-100">
           <div className="text-xs font-black text-slate-400 mb-1 uppercase text-center">Target</div>
           <div className="w-12 h-12 rounded-full border-4 border-slate-200 shadow-inner" style={{ backgroundColor: targetColor.hex }} />
        </div>
      </div>
      
      <div className="flex gap-4 justify-center mb-8 px-4">
         {['merah', 'kuning', 'biru'].map(col => (
           <button 
             key={col}
             onClick={() => handleDrop(col)}
             className="w-16 h-16 rounded-full border-4 border-white shadow-md active:scale-90 transition transform hover:scale-105"
             style={{ backgroundColor: RYB_TO_HEX[col] }}
           />
         ))}
      </div>
      
      <div className="flex gap-4 px-4">
        <button onClick={handleReset} className="w-1/3 py-4 rounded-2xl border-4 border-slate-200 text-slate-500 font-bold hover:bg-slate-50 active:bg-slate-200 transition">Ulang</button>
        <button onClick={handleMix} className="flex-1 btn-3d-purple text-white py-4 rounded-2xl font-black uppercase tracking-wide">Aduk & Cek!</button>
      </div>
    </div>
  );
}

'use client';
import { GameProps } from '@/lib/games/types';
import { useState } from 'react';

export default function DragSortGame({ config, onFinish }: GameProps) {
  const categories = config?.categories || ['Kategori A', 'Kategori B'];
  const initialItems = config?.items || [
    { id: '1', label: 'Benda 1', target: categories[0] },
    { id: '2', label: 'Benda 2', target: categories[1] },
    { id: '3', label: 'Benda 3', target: categories[0] },
  ];

  const [items] = useState(initialItems);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  const startTime = useState(Date.now())[0];

  const handleItemClick = (id: string) => {
    if (placed[id]) {
      const newPlaced = { ...placed };
      delete newPlaced[id];
      setPlaced(newPlaced);
      setSelectedItem(id);
    } else {
      setSelectedItem(id === selectedItem ? null : id);
    }
  };

  const handleCategoryClick = (cat: string) => {
    if (selectedItem) {
      setPlaced({ ...placed, [selectedItem]: cat });
      setSelectedItem(null);
    }
  };

  const handleSubmit = () => {
    let correct = 0;
    items.forEach((item: any) => {
      if (placed[item.id] === item.target) correct++;
    });
    
    const isWin = correct === items.length;
    onFinish({
      score: isWin ? 100 : Math.round((correct / items.length) * 100),
      durationMs: Date.now() - startTime,
      stats: { correct, total: items.length }
    });
  };

  const allPlaced = items.length === Object.keys(placed).length;

  return (
    <div className="flex-1 flex flex-col w-full h-full pb-8">
      <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Kelompokkan Benda!</h3>
      <p className="text-center text-slate-500 font-medium mb-6 text-sm">
        Ketuk benda di bawah, lalu ketuk kotak kategori untuk meletakkannya.
      </p>
      
      {/* Categories */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4 px-2 snap-x">
        {categories.map((cat: string, i: number) => {
          const itemsInCat = items.filter((it: any) => placed[it.id] === cat);
          return (
            <div 
              key={i} 
              onClick={() => handleCategoryClick(cat)}
              className={`flex-1 min-w-[140px] bg-slate-50 border-4 border-dashed rounded-3xl p-4 flex flex-col items-center justify-start snap-center cursor-pointer transition ${selectedItem ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className="font-black text-slate-700 text-center mb-4">{cat}</span>
              <div className="flex flex-col gap-2 w-full">
                {itemsInCat.map((it: any) => (
                  <div 
                    key={it.id} 
                    onClick={(e) => { e.stopPropagation(); handleItemClick(it.id); }} 
                    className="bg-white border-2 border-slate-200 rounded-xl py-2 px-3 text-center text-sm font-bold text-slate-600 shadow-sm active:scale-95 transition"
                  >
                    {it.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unplaced Items */}
      <div className="flex gap-3 justify-center mb-auto flex-wrap px-4">
        {items.filter((it: any) => !placed[it.id]).map((it: any) => (
          <button 
            key={it.id} 
            onClick={() => handleItemClick(it.id)}
            className={`bg-white border-2 shadow-sm rounded-xl px-5 py-3 font-bold transition transform active:scale-95 ${selectedItem === it.id ? 'border-purple-500 text-purple-700 scale-110 ring-4 ring-purple-100' : 'border-slate-300 text-slate-700 hover:scale-105 hover:border-slate-400'}`}
          >
            {it.label}
          </button>
        ))}
      </div>

      <button 
        onClick={handleSubmit}
        disabled={!allPlaced}
        className={`mt-8 w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition ${allPlaced ? 'btn-3d-emerald text-white' : 'bg-slate-300 text-slate-500 border-b-4 border-slate-400 cursor-not-allowed'}`}
      >
        Periksa Jawaban
      </button>
    </div>
  );
}

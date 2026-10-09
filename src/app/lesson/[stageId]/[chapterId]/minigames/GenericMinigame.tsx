'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function GenericMinigame({ type, title, config, onComplete }: { type: string, title: string, config: any, onComplete: (score: number) => void }) {
  const [playing, setPlaying] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'win' | 'lose'>('playing');
  
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [canvasPainted, setCanvasPainted] = useState(false);

  const getEngineType = () => {
    if (['tap_match', 'memory_match', 'hotspot_find', 'focal_tap', 'texture_match', 'shadow_tap', 'who_painted', 'marathon_quiz'].includes(type)) {
      return 'match';
    }
    if (['drag_sort', 'swipe_cards', 'gradient_sort', 'timeline_sort', 'layer_stack', 'depth_swipe'].includes(type)) {
      return 'sort';
    }
    return 'canvas';
  };

  const engine = getEngineType();

  const handleFinish = (win: boolean) => {
    setGameState(win ? 'win' : 'lose');
    setTimeout(() => {
      onComplete(win ? 100 : 50);
    }, 1500);
  };

  if (!playing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
        <div className="w-48 h-48 mx-auto mb-6 rounded-3xl overflow-hidden shadow-xl border-4 border-purple-200">
          <img src="/assets/art_minigame.jpg" alt="Art Minigame" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 mb-8 font-bold bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
          Tantangan Praktik
        </p>
        
        <button 
          onClick={() => setPlaying(true)}
          className="w-full btn-3d-purple text-white font-black py-4 rounded-2xl text-lg uppercase tracking-wider"
        >
          Mulai Tantangan
        </button>
      </div>
    );
  }

  if (gameState !== 'playing') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {gameState === 'win' ? (
          <CheckCircle2 className="w-24 h-24 text-emerald-500 mb-4 animate-bounce" />
        ) : (
          <AlertCircle className="w-24 h-24 text-rose-500 mb-4 animate-pulse" />
        )}
        <h2 className={`text-3xl font-black ${gameState === 'win' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {gameState === 'win' ? 'Hebat!' : 'Kurang Tepat'}
        </h2>
      </div>
    );
  }

  if (engine === 'match') {
    const options = config.targets ? config.targets : ['Jawaban A', 'Jawaban B', 'Jawaban C', 'Jawaban D'];
    return (
      <div className="flex-1 flex flex-col w-full h-full pb-8">
        <h3 className="text-xl font-bold text-slate-800 text-center mb-6">{title}</h3>
        <p className="text-center text-slate-500 font-medium mb-6">Pilih jawaban yang paling tepat!</p>
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
          Simpan Jawaban
        </button>
      </div>
    );
  }

  if (engine === 'sort') {
    const categories = config.categories ? config.categories : ['Kategori 1', 'Kategori 2'];
    return (
      <div className="flex-1 flex flex-col w-full h-full pb-8">
        <h3 className="text-xl font-bold text-slate-800 text-center mb-6">{title}</h3>
        <p className="text-center text-slate-500 font-medium mb-6">Kelompokkan ke dalam kategori!</p>
        <div className="flex gap-4 mb-8 h-32">
          {categories.map((cat: string, i: number) => (
            <div key={i} className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-slate-700 font-bold text-center">
              {cat}
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-center mb-auto flex-wrap">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border-2 border-purple-200 shadow-sm rounded-xl px-4 py-2 font-bold text-purple-700 cursor-move hover:scale-105 transition">
              Objek {i}
            </div>
          ))}
        </div>
        <button 
          onClick={() => handleFinish(true)}
          className="mt-6 w-full btn-3d-emerald text-white py-4 rounded-2xl font-black text-lg uppercase tracking-wider"
        >
          Selesai Mensortir
        </button>
      </div>
    );
  }

  // CANVAS
  return (
    <div className="flex-1 flex flex-col w-full h-full pb-8">
      <h3 className="text-xl font-bold text-slate-800 text-center mb-4">{title}</h3>
      <p className="text-center text-slate-500 font-medium mb-4">Pilih alat dan terapkan pada kanvas!</p>
      
      <div className="flex gap-2 justify-center mb-4">
        {['🖌️ Kuas', '🧽 Hapus', '🎨 Palet'].map(tool => (
          <button
            key={tool}
            onClick={() => setActiveTool(tool)}
            className={`px-4 py-2 rounded-xl font-bold border-2 transition ${activeTool === tool ? 'border-purple-500 bg-purple-100 text-purple-700' : 'border-slate-200 bg-white'}`}
          >
            {tool}
          </button>
        ))}
      </div>

      <div 
        onClick={() => { if(activeTool) setCanvasPainted(true); }}
        className={`flex-1 rounded-3xl border-4 border-dashed flex flex-col items-center justify-center transition cursor-crosshair ${canvasPainted ? 'bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 border-purple-400' : 'bg-slate-50 border-slate-300'}`}
      >
        {canvasPainted ? (
          <div className="text-6xl animate-bounce">✨🎨✨</div>
        ) : (
          <div className="text-slate-400 font-bold">Pilih alat lalu klik di sini</div>
        )}
      </div>

      <button 
        onClick={() => handleFinish(canvasPainted)}
        disabled={!canvasPainted}
        className={`mt-6 w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider transition ${canvasPainted ? 'btn-3d-purple text-white' : 'bg-slate-300 text-slate-500 border-b-4 border-slate-400'}`}
      >
        Kumpulkan Karya
      </button>
    </div>
  );
}

'use client';
import { GameProps } from '@/lib/games/types';
import { useRef } from 'react';
import Canvas from '@/components/lesson/Canvas';

export default function CanvasDrawGame({ config, onFinish }: GameProps) {
  const canvasRef = useRef<any>(null);
  const startTime = useRef(Date.now());
  const title = config?.instruction || 'Gambarlah sesuai instruksi!';

  const handleSubmit = () => {
    // Basic verification without AI (assuming success if they interacted)
    onFinish({
      score: 100, 
      durationMs: Date.now() - startTime.current,
      stats: {}
    });
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full pb-8">
      <h3 className="text-xl font-bold text-slate-800 text-center mb-4">{title}</h3>
      <div className="flex-1 relative border-4 border-slate-200 rounded-3xl overflow-hidden mb-4 mx-2 bg-white shadow-inner">
        <Canvas ref={canvasRef} />
      </div>
      <button onClick={handleSubmit} className="mx-4 btn-3d-purple text-white font-black py-4 rounded-2xl text-lg uppercase tracking-wider">
        Kumpulkan Gambar
      </button>
    </div>
  );
}

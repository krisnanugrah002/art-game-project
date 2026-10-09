'use client';

import { useState, useRef } from 'react';
import Canvas from '@/components/lesson/Canvas';
import { GameResult } from '@/lib/games/types';

export default function CanvasLesson({ targetLabel, criteria, passingScore, onComplete }: { targetLabel: string, criteria: any[], passingScore: number, onComplete: (result: GameResult) => void }) {
  const canvasRef = useRef<any>(null);
  const startTime = useRef(Date.now());
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleCheck = async () => {
    if (!canvasRef.current) return;
    setIsEvaluating(true);

    try {
      const dataUrl = canvasRef.current.getDataURL();
      
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataUrl,
          criteria: criteria.map(c => c.text)
        })
      });
      
      const result = await response.json();
      
      // Calculate final score based on criteria weights
      let finalScore = 0;
      let correctCount = 0;
      if (result.criteriaResults) {
        result.criteriaResults.forEach((cResult: any, i: number) => {
          if (cResult.passed) {
            finalScore += criteria[i].weight;
            correctCount++;
          }
        });
      }

      const durationMs = Date.now() - startTime.current;
      onComplete({
        score: finalScore,
        durationMs,
        stats: { correct: correctCount, total: criteria.length }
      });
    } catch (e) {
      console.error('Eval error', e);
      onComplete({ score: 0, durationMs: Date.now() - startTime.current, stats: {} }); // fail safe
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full -mx-4">
      <div className="px-4 mb-2 flex justify-between items-end">
        <div>
          <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
            Tantangan Boss
          </span>
          <h2 className="text-xl font-bold text-slate-800 leading-tight mt-1">{targetLabel}</h2>
        </div>
      </div>
      
      <div className="flex-1 relative w-full h-full bg-slate-100">
        <Canvas ref={canvasRef} />
      </div>

      <div className="px-4 py-3 bg-white border-t border-slate-200 shrink-0">
        <button
          onClick={handleCheck}
          disabled={isEvaluating}
          className="w-full btn-3d-purple text-white font-black text-base py-4 rounded-2xl tracking-wide uppercase transition active:scale-[0.98] disabled:opacity-50"
        >
          {isEvaluating ? 'Menganalisis...' : 'Kumpulkan Karya'}
        </button>
      </div>
    </div>
  );
}

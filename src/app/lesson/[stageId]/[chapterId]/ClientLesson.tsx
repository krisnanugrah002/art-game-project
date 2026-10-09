'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, Zap, Check, XCircle, ArrowRight } from 'lucide-react';
import { useMe } from '@/store/useMe'; // Assuming we have this, else we need to create it

import CanvasLesson from './minigames/CanvasLesson';
import GameShell from '@/components/games/GameShell';
import { GameResult } from '@/lib/games/types';

type QuizState = 'idle' | 'selected' | 'checking' | 'correct' | 'wrong' | 'failed';

export default function ClientLesson({ stage, chapter }: { stage: any, chapter: any }) {
  const router = useRouter();
  const { stats, refetch } = useMe();
  
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [initError, setInitError] = useState('');

  const [step, setStep] = useState<'theory' | 'quiz' | 'minigame' | 'result'>('theory');
  const [theoryIndex, setTheoryIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  
  const [minigameScore, setMinigameScore] = useState(0);
  
  const [isSaving, setIsSaving] = useState(false);
  const [starsGained, setStarsGained] = useState(0);
  const [xpGained, setXpGained] = useState(0);

  // Quiz state
  const [quizState, setQuizState] = useState<QuizState>('idle');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    // Check lives on mount
    if (stats && stats.lives <= 0) {
      alert("Nyawa Anda sudah habis! Tunggu hingga pulih.");
      router.replace('/');
      return;
    }

    async function startAttempt() {
      try {
        const res = await fetch(`/api/chapters/${chapter.id}/start`, { method: 'POST' });
        if (res.status === 409) {
          alert("Nyawa Anda sudah habis! Tunggu hingga pulih.");
          router.replace('/');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setAttemptId(data.attemptId);
        } else {
          setInitError('Gagal memulai pelajaran');
        }
      } catch (e) {
        setInitError('Gagal memulai pelajaran');
      }
    }
    startAttempt();
  }, [chapter.id, router, stats]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && stats?.lives <= 0) {
        alert("Nyawa Anda sudah habis! Tunggu hingga pulih.");
        router.replace('/');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stats, router]);

  // Skip steps if empty
  useEffect(() => {
    if (step === 'theory' && (!chapter.theory || chapter.theory.length === 0)) {
      setStep('quiz');
    }
    if (step === 'quiz' && (!chapter.quiz || chapter.quiz.length === 0)) {
      setStep('minigame');
    }
  }, [step, chapter]);

  if (initError) {
    return <div className="flex h-screen items-center justify-center font-bold text-red-500">{initError}</div>;
  }

  const handleNextTheory = () => {
    if (theoryIndex < chapter.theory.length - 1) {
      setTheoryIndex(theoryIndex + 1);
    } else {
      setStep('quiz');
    }
  };

  const checkAnswer = async () => {
    if (selectedOption === null || quizState === 'checking') return;
    setQuizState('checking');

    const currentQ = chapter.quiz[quizIndex];
    try {
      const res = await fetch(`/api/chapters/${chapter.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          questionId: currentQ.id,
          answerIndex: selectedOption
        })
      });

      if (res.status === 409) {
        setQuizState('failed');
        setTimeout(() => router.replace('/'), 3000);
        return;
      }

      const data = await res.json();
      setExplanation(data.explanation || '');
      
      if (data.isCorrect) {
        setQuizState('correct');
        setQuizCorrect(prev => prev + 1);
      } else {
        setQuizState(data.sessionEnded ? 'failed' : 'wrong');
        refetch(); // sync lives
        if (data.sessionEnded) {
          setTimeout(() => router.replace('/'), 3000);
        }
      }
    } catch (e) {
      setQuizState('idle'); // revert on network error
    }
  };

  const handleNextQuiz = () => {
    if (quizState === 'failed') {
      router.replace('/');
      return;
    }
    
    setQuizState('idle');
    setSelectedOption(null);
    setExplanation('');

    if (quizIndex < chapter.quiz.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      setStep('minigame');
    }
  };

  const handleMinigameComplete = async (result: GameResult) => {
    setMinigameScore(result.score);
    setIsSaving(true);
    setStep('result');

    try {
      const res = await fetch(`/api/chapters/${chapter.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          minigameScore: result.score,
          minigameResult: result
        })
      });
      if (res.ok) {
        const data = await res.json();
        setStarsGained(data.stars || 0);
        setXpGained(data.xp || 0);
        refetch(); // sync xp and stars
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const renderTopBar = () => (
    <div className="w-full flex items-center justify-between p-4 absolute top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur">
      <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-slate-200 transition text-slate-400 hover:text-slate-600">
        <X className="w-6 h-6 stroke-[3]" />
      </button>
      
      {/* Progress Bar */}
      <div className="flex-1 max-w-sm mx-4">
        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: step === 'theory' ? '25%' : 
                     step === 'quiz' ? `${25 + (quizIndex/chapter.quiz.length)*25}%` :
                     step === 'minigame' ? '75%' : '100%' 
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 font-bold text-rose-500">
        <Heart className="w-5 h-5 fill-rose-500" />
        <span>{stats?.lives ?? 0}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col pt-16 h-[100dvh] overflow-hidden">
      {renderTopBar()}

      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col relative px-4 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          
          {/* THEORY STEP */}
          {step === 'theory' && chapter.theory && (
            <motion.div key="theory" className="flex-1 flex flex-col items-center justify-center text-center py-8"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-8xl mb-8">{chapter.theory[theoryIndex]?.image}</div>
              <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Pelajari Dulu!</h2>
              <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-md">
                {chapter.theory[theoryIndex]?.text}
              </p>
            </motion.div>
          )}

          {/* QUIZ STEP */}
          {step === 'quiz' && chapter.quiz && (
            <motion.div key="quiz" className="flex-1 flex flex-col pt-8"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                  {chapter.quiz[quizIndex]?.question}
                </h2>
              </div>
              
              <div className="flex-1 flex flex-col gap-3">
                {chapter.quiz[quizIndex]?.options.map((opt: string, i: number) => {
                  const isSelected = selectedOption === i;
                  return (
                    <button 
                      key={i}
                      onClick={() => { setQuizState('selected'); setSelectedOption(i); }}
                      disabled={quizState === 'checking' || quizState === 'correct' || quizState === 'wrong' || quizState === 'failed'}
                      className={`w-full border-2 rounded-2xl p-5 text-left transition active:scale-[0.98] ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-50 text-purple-700' 
                          : 'border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <span className="font-bold text-lg">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* MINIGAME STEP */}
          {step === 'minigame' && attemptId && (
            <motion.div key="minigame" className="flex-1 flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
              {chapter.minigame.type === 'canvas_ai' ? (
                <CanvasLesson 
                  targetLabel={chapter.minigame.title}
                  criteria={chapter.minigame.config.criteria} 
                  passingScore={chapter.minigame.config.passing_score}
                  onComplete={handleMinigameComplete} 
                />
              ) : (
                <GameShell 
                  type={chapter.minigame.type} 
                  title={chapter.minigame.title} 
                  config={chapter.minigame.config}
                  attemptId={attemptId}
                  onComplete={handleMinigameComplete} 
                  onExit={() => router.replace('/')}
                />
              )}
            </motion.div>
          )}

          {/* RESULT STEP */}
          {step === 'result' && (
            <motion.div key="result" className="flex-1 flex flex-col items-center justify-center text-center py-8"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              
              {isSaving ? (
                <div className="animate-spin w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full" />
              ) : (
                <>
                  <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map((star) => (
                      <motion.div 
                        key={star} 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        transition={{ delay: star * 0.2, type: 'spring' }}
                      >
                        <Star className={`w-16 h-16 ${star <= starsGained ? 'fill-amber-400 text-amber-500' : 'fill-slate-200 text-slate-300'}`} />
                      </motion.div>
                    ))}
                  </div>

                  <h2 className="text-3xl font-black text-slate-800 mb-2">Lesson Selesai!</h2>
                  <p className="text-slate-600 font-bold mb-8">Kuis benar: {quizCorrect}/{chapter.quiz?.length || 0} • Skor Minigame: {minigameScore}</p>
                  
                  <div className="bg-amber-100 border-2 border-amber-200 text-amber-700 px-6 py-3 rounded-2xl font-black text-xl flex items-center gap-2 mb-12">
                    <Zap className="fill-amber-500" /> +{xpGained} XP
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM BAR / ANSWER BAR */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 border-t-2 z-50 transition-colors ${
        quizState === 'correct' ? 'bg-emerald-100 border-emerald-200' :
        quizState === 'wrong' || quizState === 'failed' ? 'bg-rose-100 border-rose-200' :
        'bg-white border-slate-200'
      }`}>
        <div className="max-w-2xl mx-auto">
          {step === 'theory' && (
             <button onClick={handleNextTheory} className="w-full btn-3d-purple text-white font-black py-4 rounded-2xl text-lg uppercase tracking-wider">
               Lanjut
             </button>
          )}

          {step === 'quiz' && (
            <div className="flex flex-col gap-2">
              {quizState === 'correct' && (
                <div className="flex items-center gap-2 text-emerald-700 font-black text-xl mb-2">
                  <div className="bg-white rounded-full p-1"><Check className="stroke-[3]" /></div>
                  Benar!
                </div>
              )}
              {(quizState === 'wrong' || quizState === 'failed') && (
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex items-center gap-2 text-rose-700 font-black text-xl">
                    <div className="bg-white rounded-full p-1"><XCircle className="stroke-[3]" /></div>
                    {quizState === 'failed' ? 'Nyawa Habis' : 'Jawaban Kurang Tepat'}
                  </div>
                  {explanation && <p className="text-rose-600 font-bold">{explanation}</p>}
                </div>
              )}

              <button 
                onClick={quizState === 'idle' || quizState === 'selected' ? checkAnswer : handleNextQuiz}
                disabled={quizState === 'idle' || quizState === 'checking'}
                className={`w-full font-black py-4 rounded-2xl text-lg uppercase tracking-wider transition ${
                  quizState === 'idle' ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-b-4 border-slate-400' :
                  quizState === 'selected' ? 'bg-white text-purple-600 border-2 border-b-4 border-purple-600 active:border-b-0 active:translate-y-1' :
                  quizState === 'checking' ? 'bg-purple-100 text-purple-400 border-2 border-purple-200' :
                  quizState === 'correct' ? 'btn-3d-emerald text-white' : 
                  quizState === 'wrong' ? 'btn-3d-rose text-white' : 'bg-slate-800 text-white'
                }`}
              >
                {quizState === 'idle' || quizState === 'selected' || quizState === 'checking' ? (
                  quizState === 'checking' ? 'Memeriksa...' : 'Cek Jawaban'
                ) : quizState === 'failed' ? (
                  'Kembali ke Beranda'
                ) : (
                  'Lanjut'
                )}
              </button>
            </div>
          )}

          {step === 'result' && !isSaving && (
             <button onClick={() => router.push('/')} className="w-full btn-3d-emerald text-white font-black py-4 rounded-2xl text-lg uppercase tracking-wider flex items-center justify-center gap-2">
               Lanjut <ArrowRight className="stroke-[3]" />
             </button>
          )}
        </div>
      </div>
    </div>
  );
}

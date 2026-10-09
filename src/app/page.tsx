'use client';

import { useMe } from '@/store/useMe';
import TopNav from '@/components/layout/TopNav';
import BottomNav from '@/components/layout/BottomNav';
import CURRICULUM_DATA from '../../content/curriculum.json';
const CURRICULUM = CURRICULUM_DATA as any;
import { Sparkles, BookOpen, Crown, Check, Play, Brush, Lock, Gift, Trophy, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Using a custom SVG drawing component based on node statuses
function SvgPath({ nodes }: { nodes: { x: number, y: number, completed: boolean }[] }) {
  if (nodes.length < 2) return null;

  let bgPath = `M ${nodes[0].x} ${nodes[0].y}`;
  let activePath = `M ${nodes[0].x} ${nodes[0].y}`;
  let hasActive = false;

  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];

    // Simple smooth curve calculation
    const controlPointY = (prev.y + curr.y) / 2;
    const curve = ` C ${prev.x} ${controlPointY}, ${curr.x} ${controlPointY}, ${curr.x} ${curr.y}`;
    
    bgPath += curve;

    if (prev.completed) {
      activePath += curve;
      hasActive = true;
    }
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 380 900" preserveAspectRatio="none" fill="none">
      <path d={bgPath} stroke="#cbd5e1" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
      {hasActive && (
        <path d={activePath} stroke="#8b5cf6" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function Home() {
  const { stats, chapterProgress, isLoading } = useMe();
  const [guideModalStage, setGuideModalStage] = useState<any | null>(null);

  const getChapterStars = (chapterId: string) => {
    if (!chapterProgress) return 0;
    const prog = chapterProgress.find((c: any) => c.chapter_id === chapterId);
    return prog ? prog.stars : 0;
  };

  const isStageUnlocked = (stageOrder: number) => {
    if (stageOrder === 1) return true;
    // Check if previous stage boss is completed
    const prevStage = CURRICULUM.stages.find((s: any) => s.order === stageOrder - 1);
    if (!prevStage) return false;
    const boss = prevStage.chapters.find((c: any) => c.is_boss);
    if (!boss) return false;
    return getChapterStars(boss.id) > 0;
  };

  const isChapterUnlocked = (stageId: string, chapterOrder: number) => {
    const stage = CURRICULUM.stages.find((s: any) => s.id === stageId);
    if (!stage) return false;
    if (!isStageUnlocked(stage.order)) return false;
    if (chapterOrder === 1) return true;
    
    const prevChapter = stage.chapters.find((c: any) => c.order === chapterOrder - 1);
    if (!prevChapter) return false;
    
    return getChapterStars(prevChapter.id) > 0;
  };

  const nodePositions = [
    { x: -1, y: 0, delay: '0s' },
    { x: 18, y: 0, delay: '0.3s' },
    { x: -18, y: 0, delay: '0s' },
    { x: 18, y: 0, delay: '0.2s' },
    { x: 0, y: 0, delay: '0s' },
  ];

  // Map nodes to coordinates for SVG viewBox 0 0 380 900
  const yCoords = [70, 220, 370, 540, 710];
  const getX = (pos: number) => 190 + (pos * 4);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center font-bold">Loading...</div>;
  }

  return (
    <>
      <TopNav />
      <div className="max-w-4xl w-full mx-auto px-4 flex-1 flex flex-col md:flex-row gap-8 pt-4 pb-20">
        <main className="flex-1 max-w-lg mx-auto w-full flex flex-col items-center gap-12">
          {CURRICULUM.stages.map((stage: any) => {
            const unlocked = isStageUnlocked(stage.order);
            
            // Build nodes for the curve
            const svgNodes = stage.chapters.map((chapter: any, cIdx: number) => {
              const stars = getChapterStars(chapter.id);
              const completed = stars > 0;
              const pos = nodePositions[cIdx];
              return {
                x: getX(pos.x),
                y: yCoords[cIdx] || (150 * cIdx + 70),
                completed
              };
            });

            return (
              <section key={stage.id} className={`w-full flex flex-col items-center ${!unlocked ? 'opacity-70 grayscale' : ''}`}>
                {/* Stage Banner */}
                <div className={`w-full mb-8 ${unlocked ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600' : 'bg-slate-400'} text-white rounded-3xl p-5 sm:p-6 banner-3d relative overflow-hidden flex items-center justify-between`}>
                  <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                  <div className="absolute -left-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-lg pointer-events-none"></div>
                  
                  <div className="relative z-10 pr-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider mb-2 backdrop-blur-sm">
                      <Sparkles className="w-3.5 h-3.5" /> Stage {stage.order}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                      {stage.title}
                    </h2>
                  </div>

                  <button onClick={() => setGuideModalStage(stage)} className="relative z-10 shrink-0 p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white border border-white/25 transition flex flex-col items-center gap-1">
                    <BookOpen className="w-6 h-6" />
                    <span className="text-[11px] font-bold">Guide</span>
                  </button>
                </div>

                {/* Path Container */}
                <div className="relative w-full max-w-sm py-4 flex flex-col items-center">
                  <SvgPath nodes={svgNodes} />

                  <div className="relative z-10 w-full flex flex-col items-center gap-16 py-2">
                    {stage.chapters.map((chapter: any, cIdx: number) => {
                      const pos = nodePositions[cIdx];
                      const chapterUnlocked = isChapterUnlocked(stage.id, chapter.order);
                      const stars = getChapterStars(chapter.id);
                      const isCompleted = stars > 0;
                      const isCurrent = chapterUnlocked && !isCompleted;
                      const isBoss = chapter.is_boss;

                      return (
                        <div key={chapter.id} className="relative flex flex-col items-center group" style={{ transform: `translateX(${pos.x * 4}px)` }}>
                          {isCompleted && (
                            <div className="absolute -top-6 animate-bounce-gentle z-20" style={{ animationDelay: pos.delay }}>
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 shadow-md border-2 border-amber-200 text-xs font-black">
                                {'⭐'.repeat(stars)}
                              </span>
                            </div>
                          )}

                          {isCurrent && (
                            <div className="absolute -top-11 z-30 animate-bounce-gentle">
                              <div className="speech-tail bg-purple-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                                <Play className="w-3.5 h-3.5 fill-white" /> Start
                              </div>
                            </div>
                          )}

                          {chapterUnlocked ? (
                            <Link href={`/lesson/${stage.id}/${chapter.id}`} className="relative flex items-center justify-center">
                              {isCurrent && (
                                <>
                                  <div className="absolute -inset-2 rounded-full bg-purple-400/30 animate-ping pointer-events-none"></div>
                                  <div className="absolute -inset-1.5 rounded-full border-4 border-purple-500/40 animate-pulse pointer-events-none"></div>
                                </>
                              )}
                              <button className={`w-20 h-20 rounded-full flex items-center justify-center transform group-hover:-translate-y-1 transition duration-150 relative z-20 ${isCompleted ? 'bg-emerald-500 btn-3d-emerald text-white' : 'bg-gradient-to-b from-purple-500 to-purple-600 btn-3d-purple text-white'}`}>
                                <div className={`w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center ${isCompleted ? 'border-emerald-400/60' : 'border-purple-300/60 bg-purple-600'}`}>
                                  {isCompleted ? <Check className="w-9 h-9 stroke-[3.5]" /> : (isBoss ? <Crown className="w-9 h-9 text-white fill-white" /> : <Brush className="w-8 h-8 stroke-[2]" />)}
                                </div>
                              </button>
                            </Link>
                          ) : (
                            <button className="w-20 h-20 rounded-full bg-slate-300 btn-3d-gray text-slate-500 flex items-center justify-center relative cursor-not-allowed" disabled>
                              <div className="w-16 h-16 rounded-full border-4 border-slate-200 flex items-center justify-center bg-slate-300">
                                {isBoss ? <Gift className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
                              </div>
                            </button>
                          )}

                          <span className={`mt-4 text-xs font-black uppercase tracking-wide px-3.5 py-1 rounded-full shadow-sm text-center max-w-[120px] ${
                            isCompleted ? 'text-emerald-800 bg-emerald-100' :
                            chapterUnlocked ? 'text-purple-900 bg-purple-100 border border-purple-200' :
                            'text-slate-500 bg-slate-200'
                          }`}>
                            {chapter.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </main>

        <aside className="hidden lg:flex flex-col w-80 shrink-0 gap-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-slate-800 text-base">Prism League</h3>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm p-2 rounded-2xl bg-purple-50 font-bold border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">{stats?.profile?.username?.[0]?.toUpperCase() || 'P'}</div>
                  <span className="text-slate-800 font-extrabold">{stats?.profile?.username || 'You'}</span>
                </div>
                <span className="text-purple-700 font-black">{stats?.total_xp || 0} XP</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <BottomNav />
      
      {/* Guide Modal */}
      {guideModalStage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 relative shrink-0">
              <button 
                onClick={() => setGuideModalStage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-black text-white">Guide Stage {guideModalStage.order}</h2>
              <p className="text-white/80 mt-1 font-medium">{guideModalStage.guide?.summary}</p>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <h3 className="font-black text-slate-800 text-lg mb-3">Poin Penting</h3>
              <ul className="list-disc pl-5 space-y-2 mb-6">
                {guideModalStage.guide?.key_points?.map((kp: string, i: number) => (
                  <li key={i} className="text-slate-600 font-medium">{kp}</li>
                ))}
              </ul>
              
              <h3 className="font-black text-slate-800 text-lg mb-3">Istilah & Konsep</h3>
              <div className="space-y-4">
                {guideModalStage.guide?.terms?.map((term: any, i: number) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-1">{term.term}</h4>
                    <p className="text-sm text-slate-600">{term.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

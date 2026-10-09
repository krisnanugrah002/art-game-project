import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { getChapterData } from '../route';

export async function POST(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.playerId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { chapterId } = await params;
    const { attemptId, minigameScore } = await req.json();

    if (!attemptId) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Missing attemptId' } }, { status: 400 });
    }

    const chapterData = getChapterData(chapterId);
    if (!chapterData) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Chapter not found' } }, { status: 404 });
    }

    const isBoss = chapterData.chapter.is_boss;
    const totalQuestions = chapterData.chapter.quiz ? chapterData.chapter.quiz.length : 0;

    const result = await db.transaction().execute(async (trx) => {
      const attempt = await trx.selectFrom('chapter_attempts')
        .selectAll()
        .where('id', '=', attemptId)
        .where('player_id', '=', session.playerId)
        .executeTakeFirst();
      
      if (!attempt) throw new Error('Attempt not found');
      if (attempt.status === 'completed') return { alreadyCompleted: true }; // prevent double compute

      // 1. Calculate Stars
      let stars = 0;
      const quizCorrect = attempt.quiz_correct as number;
      if (totalQuestions > 0) {
        if (quizCorrect === totalQuestions) stars = 3;
        else if (quizCorrect >= totalQuestions / 2) stars = 2;
        else if (quizCorrect > 0) stars = 1;
      } else {
        // If no quiz, maybe minigame only
        if (minigameScore >= 80) stars = 3;
        else if (minigameScore >= 50) stars = 2;
        else stars = 1;
      }

      // Boss pass criteria
      if (isBoss) {
         if ((minigameScore !== undefined && minigameScore < 70) || quizCorrect < totalQuestions / 2) {
            stars = 0; // Failed boss
         }
      }

      if (stars > 0) {
        await trx.updateTable('chapter_attempts')
          .set({ status: 'completed', finished_at: new Date().toISOString() })
          .where('id', '=', attemptId)
          .execute();
      } else {
        await trx.updateTable('chapter_attempts')
          .set({ status: 'failed', finished_at: new Date().toISOString() })
          .where('id', '=', attemptId)
          .execute();
        return { stars: 0, xp: 0 };
      }

      // 2. Update Progress
      const existingProg = await trx.selectFrom('chapter_progress')
        .selectAll()
        .where('player_id', '=', session.playerId)
        .where('chapter_id', '=', chapterId)
        .executeTakeFirst();

      const newBestMinigame = Math.max(minigameScore || 0, existingProg?.best_minigame_score as number || 0);
      const newBestQuiz = Math.max(quizCorrect, existingProg?.best_quiz_correct as number || 0);
      const newBestStars = Math.max(stars, existingProg?.stars as number || 0);

      if (existingProg) {
        await trx.updateTable('chapter_progress')
          .set({
            stars: newBestStars,
            best_minigame_score: newBestMinigame,
            best_quiz_correct: newBestQuiz,
          })
          .where('player_id', '=', session.playerId)
          .where('chapter_id', '=', chapterId)
          .execute();
      } else {
        await trx.insertInto('chapter_progress')
          .values({
            player_id: session.playerId,
            chapter_id: chapterId,
            stars: newBestStars,
            best_minigame_score: newBestMinigame,
            best_quiz_correct: newBestQuiz,
            completed_at: new Date().toISOString(),
          })
          .execute();
      }

      // 3. XP Logic
      let xpEarned = 0;
      
      const awardXp = async (amount: number, source: string, refKey: string) => {
        try {
          await trx.insertInto('xp_events')
            .values({ player_id: session.playerId, amount, source, ref_key: refKey })
            .execute();
          xpEarned += amount;
        } catch (e: any) {
           // ignore duplicate
        }
      };

      if (!existingProg) {
        await awardXp(10, 'chapter_completion', `chapter:${chapterId}:completion`);
      }
      if (newBestStars === 3 && (!existingProg || existingProg.stars < 3)) {
        await awardXp(5, 'chapter_3_stars', `chapter:${chapterId}:stars:3`);
      }
      if (isBoss && !existingProg) {
        await awardXp(25, 'boss_passed', `chapter:${chapterId}:boss`);
      }

      if (xpEarned > 0) {
        await trx.updateTable('user_stats')
          .set((eb) => ({ 
             total_xp: eb('total_xp', '+', xpEarned),
             version: eb('version', '+', 1)
          }))
          .where('player_id', '=', session.playerId)
          .execute();
      }

      return { stars: newBestStars, xp: xpEarned };
    });

    if (result.alreadyCompleted) {
      return NextResponse.json({ success: true, message: 'Already completed' });
    }

    return NextResponse.json({ success: true, stars: result.stars, xp: result.xp });

  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal Server Error' } }, { status: 500 });
  }
}

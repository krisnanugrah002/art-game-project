import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { computeLives } from '@/lib/game/lives';
import { getChapterData } from '../route';

export async function POST(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.playerId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { chapterId } = await params;
    const { questionId, answerIndex, attemptId } = await req.json();

    if (!attemptId || !questionId || answerIndex === undefined) {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Missing fields' } }, { status: 400 });
    }

    const chapterData = getChapterData(chapterId);
    if (!chapterData) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Chapter not found' } }, { status: 404 });
    }

    const question = chapterData.chapter.quiz?.find((q: any) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Question not found' } }, { status: 404 });
    }

    const isCorrect = question.answer_index === answerIndex;

    // Process answer in a transaction
    const result = await db.transaction().execute(async (trx) => {
      // 1. Check attempt status
      const attempt = await trx.selectFrom('chapter_attempts')
        .select('status')
        .where('id', '=', attemptId)
        .executeTakeFirst();
      
      if (!attempt || attempt.status !== 'active') {
        return { isCorrect: false, sessionEnded: true }; // Force fail if attempt is not active
      }

      // 2. Lock user stats
      const stats = await trx.selectFrom('user_stats')
        .selectAll()
        .where('player_id', '=', session.playerId)
        .forUpdate()
        .executeTakeFirst();
      
      if (!stats) {
        throw new Error('Stats not found');
      }

      const anchorDate = new Date(stats.lives_anchor_at as string);
      const now = new Date();
      let { lives, anchor } = computeLives(stats.lives_count as number, anchorDate, now);

      if (lives <= 0) {
        return { noLives: true }; // Nyawa sudah 0 sebelum request
      }

      // Check if already answered
      const existingAnswer = await trx.selectFrom('attempt_answers')
        .select('is_correct')
        .where('attempt_id', '=', attemptId)
        .where('question_id', '=', questionId)
        .executeTakeFirst();
      
      if (existingAnswer) {
        return { isCorrect: existingAnswer.is_correct === 1 || existingAnswer.is_correct === true, explanation: question.explanation, alreadyAnswered: true };
      }

      // Record answer
      await trx.insertInto('attempt_answers')
        .values({
          attempt_id: attemptId,
          question_id: questionId,
          is_correct: isCorrect ? 1 : 0
        })
        .execute();
      
      // Update attempt counters
      if (isCorrect) {
        await trx.updateTable('chapter_attempts')
          .set((eb) => ({ quiz_correct: eb('quiz_correct', '+', 1) }))
          .where('id', '=', attemptId)
          .execute();
      } else {
        await trx.updateTable('chapter_attempts')
          .set((eb) => ({ quiz_wrong: eb('quiz_wrong', '+', 1) }))
          .where('id', '=', attemptId)
          .execute();
        
        // Deduct life
        lives -= 1;
        
        if (stats.lives_count === 5) {
          // just started regenerating, update anchor to now
          anchor = now;
        }

        await trx.updateTable('user_stats')
          .set({
            lives_count: lives,
            lives_anchor_at: anchor.toISOString(),
            version: (stats.version as number) + 1
          })
          .where('player_id', '=', session.playerId)
          .execute();
      }

      let sessionEnded = false;
      if (lives <= 0) {
        sessionEnded = true;
        await trx.updateTable('chapter_attempts')
          .set({ status: 'failed', finished_at: now.toISOString() })
          .where('id', '=', attemptId)
          .execute();
      }

      return { isCorrect, explanation: question.explanation, sessionEnded };
    });

    if (result.noLives) {
      return NextResponse.json({ error: { code: 'NO_LIVES', message: 'Nyawa habis' } }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      isCorrect: result.isCorrect,
      explanation: result.explanation,
      sessionEnded: result.sessionEnded,
      alreadyAnswered: result.alreadyAnswered
    });

  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal Server Error' } }, { status: 500 });
  }
}

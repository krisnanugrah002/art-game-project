import { db } from '../index';
import { isDuplicateError } from '../errors';

export async function createAttempt(playerId: string, chapterId: string) {
  const attemptId = crypto.randomUUID();
  await db.insertInto('chapter_attempts')
    .values({
      id: attemptId,
      player_id: playerId,
      chapter_id: chapterId,
      status: 'active',
      quiz_correct: 0,
      quiz_wrong: 0,
    })
    .execute();
  return attemptId;
}

export async function finishAttempt(attemptId: string, status: 'completed' | 'failed') {
  await db.updateTable('chapter_attempts')
    .set({
      status,
      finished_at: new Date().toISOString(),
    })
    .where('id', '=', attemptId)
    .execute();
}

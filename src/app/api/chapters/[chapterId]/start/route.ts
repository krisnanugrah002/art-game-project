import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { computeLives } from '@/lib/game/lives';
import { createAttempt } from '@/lib/db/repositories/attempts';

export async function POST(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    const session = await getSession();
    if (!session || !session.playerId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { chapterId } = await params;

    // Check lives
    const stats = await db.selectFrom('user_stats')
      .selectAll()
      .where('player_id', '=', session.playerId)
      .executeTakeFirst();

    if (!stats) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Stats not found' } }, { status: 404 });
    }

    const anchorDate = new Date(stats.lives_anchor_at as string);
    const { lives } = computeLives(stats.lives_count as number, anchorDate, new Date());

    if (lives <= 0) {
      return NextResponse.json({ error: { code: 'NO_LIVES', message: 'Nyawa habis' } }, { status: 409 });
    }

    // Optional: check if chapter is locked
    
    const attemptId = await createAttempt(session.playerId, chapterId);

    return NextResponse.json({ success: true, attemptId });

  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal Server Error' } }, { status: 500 });
  }
}

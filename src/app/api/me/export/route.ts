import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { computeLives } from '@/lib/game/lives';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.playerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playerId = session.playerId;

    const [player, stats, progress, xpEvents, submissions] = await Promise.all([
      db.selectFrom('players').selectAll().where('id', '=', playerId).executeTakeFirst(),
      db.selectFrom('user_stats').selectAll().where('player_id', '=', playerId).executeTakeFirst(),
      db.selectFrom('chapter_progress').selectAll().where('player_id', '=', playerId).execute(),
      db.selectFrom('xp_events').selectAll().where('player_id', '=', playerId).orderBy('created_at', 'desc').execute(),
      db.selectFrom('submissions').selectAll().where('player_id', '=', playerId).orderBy('created_at', 'desc').execute(),
    ]);

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const anchorDate = new Date(stats.lives_anchor_at as string);
    const { lives } = computeLives(stats.lives_count as number, anchorDate, new Date());

    const data = {
      profile: player,
      statistics: {
        ...stats,
        lives: lives
      },
      chapter_progress: progress,
      history: {
        xp_events: xpEvents,
        submissions: submissions,
      }
    };

    const username = player.display_name;
    const jsonString = JSON.stringify(data, null, 2);

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="data-${username}.json"`,
      }
    });

  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

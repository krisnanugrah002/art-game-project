import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all'; // 'week' | 'all'
    
    const session = await getSession();
    const currentUserId = session?.playerId;

    let entries: any[] = [];

    if (range === 'all') {
      entries = await db.selectFrom('user_stats')
        .innerJoin('players', 'players.id', 'user_stats.player_id')
        .select([
          'players.id',
          'players.display_name as username',
          'user_stats.total_xp as xp',
          'players.created_at'
        ])
        .where('user_stats.total_xp', '>', 0)
        .orderBy('user_stats.total_xp', 'desc')
        .orderBy('players.created_at', 'asc')
        .limit(50)
        .execute();
    } else if (range === 'week') {
      // Find Monday 00:00 WIB (UTC+7)
      // This is slightly complex in pure SQL without timezone extensions, 
      // so we compute the date in JS and pass it as a parameter.
      const now = new Date();
      // UTC time for Monday 00:00 WIB:
      // WIB is UTC+7. 00:00 WIB = 17:00 UTC previous day.
      // So find the last Monday in WIB.
      const wibOffset = 7 * 60 * 60 * 1000;
      const wibTime = new Date(now.getTime() + wibOffset);
      const day = wibTime.getUTCDay();
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      
      const lastMondayWib = new Date(wibTime);
      lastMondayWib.setUTCDate(wibTime.getUTCDate() + diffToMonday);
      lastMondayWib.setUTCHours(0, 0, 0, 0);

      // Convert back to UTC
      const lastMondayUTC = new Date(lastMondayWib.getTime() - wibOffset);

      entries = await db.selectFrom('xp_events')
        .innerJoin('players', 'players.id', 'xp_events.player_id')
        .select([
          'players.id',
          'players.display_name as username',
        ])
        .select(({ fn }) => [
          fn.sum('xp_events.amount').as('xp')
        ])
        .where('xp_events.created_at', '>=', lastMondayUTC.toISOString())
        .groupBy(['players.id', 'players.display_name', 'players.created_at'])
        .having(({ fn }) => fn.sum('xp_events.amount'), '>', 0)
        .orderBy('xp', 'desc')
        .orderBy('players.created_at', 'asc')
        .limit(50)
        .execute();
    }

    let currentUserEntry = null;

    // Map to include rank
    const leaderboard: any[] = entries.map((e, index) => ({
      rank: index + 1,
      id: e.id,
      username: e.username,
      xp: Number(e.xp)
    }));

    if (currentUserId) {
      const userInTop50 = leaderboard.find(e => e.id === currentUserId);
      if (userInTop50) {
         userInTop50.isCurrentUser = true;
      } else {
        // Fetch current user rank and xp
        // For 'all' time:
        if (range === 'all') {
          const userStat = await db.selectFrom('user_stats')
            .innerJoin('players', 'players.id', 'user_stats.player_id')
            .select(['user_stats.total_xp as xp', 'players.display_name as username', 'players.created_at'])
            .where('players.id', '=', currentUserId)
            .executeTakeFirst();
          
          if (userStat && userStat.xp > 0) {
             const higherCount = await db.selectFrom('user_stats')
               .select(({ fn }) => [fn.count('player_id').as('count')])
               .where('total_xp', '>', userStat.xp as number)
               .executeTakeFirst();
             
             // ties handling: we should count those with same XP but older created_at
             const tieCount = await db.selectFrom('user_stats')
               .innerJoin('players', 'players.id', 'user_stats.player_id')
               .select(({ fn }) => [fn.count('user_stats.player_id').as('count')])
               .where('user_stats.total_xp', '=', userStat.xp as number)
               .where('players.created_at', '<', userStat.created_at as string)
               .executeTakeFirst();

             const rank = Number(higherCount?.count || 0) + Number(tieCount?.count || 0) + 1;
             
             leaderboard.push({
               rank,
               id: currentUserId,
               username: userStat.username,
               xp: userStat.xp as number,
               isCurrentUser: true
             });
          }
        } else {
           // For week, similar query
        }
      }
    }

    return NextResponse.json({ success: true, leaderboard });

  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

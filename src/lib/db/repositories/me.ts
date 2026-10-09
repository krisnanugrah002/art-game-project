import { db } from '../index';
import { computeLives } from '../../game/lives';

export async function getPlayerSnapshot(playerId: string) {
  const [player, stats, progress] = await Promise.all([
    db.selectFrom('players')
      .selectAll()
      .where('id', '=', playerId)
      .executeTakeFirst(),
    db.selectFrom('user_stats')
      .selectAll()
      .where('player_id', '=', playerId)
      .executeTakeFirst(),
    db.selectFrom('chapter_progress')
      .select(['chapter_id', 'stars'])
      .where('player_id', '=', playerId)
      .execute()
  ]);

  if (!player || !stats) {
    return null;
  }

  const now = new Date();
  
  // Calculate lives lazily
  const anchorDate = new Date(stats.lives_anchor_at as string);
  const { lives, anchor } = computeLives(stats.lives_count as number, anchorDate, now);

  // If lives changed, we could theoretically update it here, but GET shouldn't ideally mutate.
  // We'll return the computed lives, and let actions mutate it.
  
  let nextLifeAt: string | null = null;
  if (lives < 5) {
     nextLifeAt = new Date(anchor.getTime() + 60 * 60 * 1000).toISOString();
  }

  return {
    player: {
      id: player.id,
      displayName: player.display_name,
      timezone: player.timezone,
    },
    stats: {
      lives,
      maxLives: 5,
      nextLifeAt,
      totalXp: stats.total_xp,
      streak: stats.current_streak,
      version: stats.version,
    },
    progress: progress.map(p => ({
      chapterId: p.chapter_id,
      stars: p.stars,
    })),
    serverTime: now.toISOString(),
  };
}

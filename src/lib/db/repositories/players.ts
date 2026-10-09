import { db } from '../index';
import { isDuplicateError } from '../errors';

export async function getPlayerByUsername(usernameKey: string) {
  return await db
    .selectFrom('players')
    .selectAll()
    .where('username_key', '=', usernameKey)
    .executeTakeFirst();
}

export async function createPlayer(id: string, usernameKey: string, displayName: string) {
  try {
    await db.transaction().execute(async (trx) => {
      // 1. Create player
      await trx.insertInto('players')
        .values({
          id,
          username_key: usernameKey,
          display_name: displayName,
          timezone: 'Asia/Jakarta',
        })
        .execute();

      // 2. Create initial user stats
      await trx.insertInto('user_stats')
        .values({
          player_id: id,
          lives_count: 5,
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
        })
        .execute();
    });
    return true;
  } catch (e: any) {
    if (isDuplicateError(e)) {
      return false; // username exists
    }
    throw e;
  }
}

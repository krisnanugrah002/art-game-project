import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { getPlayerSnapshot } from '@/lib/db/repositories/me';
import { isDuplicateError } from '@/lib/db/errors';

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.playerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await req.json();

    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 16) {
      return NextResponse.json({ error: 'Username harus terdiri dari 3 hingga 16 karakter.' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: 'Username hanya boleh berisi huruf, angka, dan underscore.' }, { status: 400 });
    }

    const usernameKey = username.toLowerCase();

    // Check rate limit: 1 kali per 24 jam
    const player = await db.selectFrom('players')
      .select('username_changed_at')
      .where('id', '=', session.playerId)
      .executeTakeFirst();
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    if (player.username_changed_at) {
      const changedAt = new Date(player.username_changed_at);
      const now = new Date();
      const diffHours = (now.getTime() - changedAt.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        return NextResponse.json({ error: 'Username hanya dapat diubah 1 kali per 24 jam.' }, { status: 429 });
      }
    }

    try {
      await db.updateTable('players')
        .set({
          username_key: usernameKey,
          display_name: username,
          username_changed_at: new Date().toISOString()
        })
        .where('id', '=', session.playerId)
        .execute();
    } catch (e: any) {
      if (isDuplicateError(e)) {
        return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 409 });
      }
      throw e;
    }

    // Return new snapshot
    const snapshot = await getPlayerSnapshot(session.playerId);
    return NextResponse.json(snapshot);

  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

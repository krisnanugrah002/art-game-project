import { NextResponse } from 'next/server';
import { getPlayerByUsername } from '@/lib/db/repositories/players';
import { setSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== 'string' || username.length < 3 || username.length > 16) {
      return NextResponse.json({ error: 'Username harus terdiri dari 3 hingga 16 karakter.' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: 'Username hanya boleh berisi huruf, angka, dan underscore.' }, { status: 400 });
    }

    const usernameKey = username.toLowerCase();
    const player = await getPlayerByUsername(usernameKey);
    
    if (!player) {
      return NextResponse.json({ error: 'Username tidak ditemukan.' }, { status: 404 });
    }

    await setSession(player.id);

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        username: player.display_name
      }
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

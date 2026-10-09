import { NextResponse } from 'next/server';
import { getPlayerByUsername, createPlayer } from '@/lib/db/repositories/players';
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
    
    // Check if exists
    const existing = await getPlayerByUsername(usernameKey);
    if (existing) {
      return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 409 });
    }

    const newId = crypto.randomUUID();
    const success = await createPlayer(newId, usernameKey, username);

    if (!success) {
       return NextResponse.json({ error: 'Username sudah dipakai (konflik).' }, { status: 409 });
    }

    await setSession(newId);

    return NextResponse.json({
      success: true,
      player: {
        id: newId,
        username: username,
      }
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

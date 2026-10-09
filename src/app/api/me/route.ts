import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getPlayerSnapshot } from '@/lib/db/repositories/me';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.playerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await getPlayerSnapshot(session.playerId);
    if (!snapshot) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json(snapshot);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

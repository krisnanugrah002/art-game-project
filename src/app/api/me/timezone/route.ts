import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { getPlayerSnapshot } from '@/lib/db/repositories/me';

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.playerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timezone } = await req.json();

    if (!timezone || typeof timezone !== 'string') {
      return NextResponse.json({ error: 'Timezone is required.' }, { status: 400 });
    }

    // A simple validation for standard IANA timezones could be done here, 
    // for now we trust the client's dropdown. 

    await db.updateTable('players')
      .set({ timezone })
      .where('id', '=', session.playerId)
      .execute();

    const snapshot = await getPlayerSnapshot(session.playerId);
    return NextResponse.json(snapshot);

  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

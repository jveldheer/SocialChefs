import { NextResponse } from 'next/server';
import { getDb, creators } from '@ultimate-social-chef/db';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const results = await db
      .select()
      .from(creators)
      .orderBy(desc(creators.creatorScore))
      .limit(25);

    const parsedResults = results.map((c) => ({
      ...c,
      creatorScoreBreakdown: c.creatorScoreBreakdown
        ? JSON.parse(c.creatorScoreBreakdown as string)
        : null,
    }));

    return NextResponse.json(parsedResults);
  } catch (error) {
    console.error('Error fetching creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}

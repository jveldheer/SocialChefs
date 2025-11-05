import { NextResponse } from 'next/server';
import { getDb, creators } from '@ultimate-social-chef/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const results = await db
      .select()
      .from(creators)
      .limit(25);

    const parsedResults = results.map((c) => ({
      ...c,
      creatorScoreBreakdown: c.creatorScoreBreakdown
        ? JSON.parse(c.creatorScoreBreakdown as string)
        : null,
    }));

    // Sort by creator score in JavaScript to avoid drizzle-orm type conflicts
    const sorted = parsedResults.sort((a, b) => b.creatorScore - a.creatorScore);

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error fetching creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}

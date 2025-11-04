import { NextResponse } from 'next/server';
import { getDb, recipes } from '@ultimate-social-chef/db';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const results = await db.select().from(recipes).orderBy(desc(recipes.createdAt));

    const parsedResults = results.map((r) => ({
      ...r,
      ingredients: JSON.parse(r.ingredients as string),
      steps: JSON.parse(r.steps as string),
      equipment: JSON.parse(r.equipment as string),
      allergens: JSON.parse(r.allergens as string),
      nutrition: r.nutrition ? JSON.parse(r.nutrition as string) : null,
      confidence: JSON.parse(r.confidence as string),
    }));

    return NextResponse.json(parsedResults);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

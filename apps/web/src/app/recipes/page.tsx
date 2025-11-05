import Link from 'next/link';
import { getDb, recipes as recipesTable } from '@ultimate-social-chef/db';
import type { Recipe } from '@ultimate-social-chef/shared';

export const dynamic = 'force-dynamic';

async function getRecipes(): Promise<Recipe[]> {
  const db = getDb();
  const results = await db.select().from(recipesTable);

  const parsed = results.map((r) => ({
    ...r,
    ingredients: JSON.parse(r.ingredients as string),
    steps: JSON.parse(r.steps as string),
    equipment: JSON.parse(r.equipment as string),
    allergens: JSON.parse(r.allergens as string),
    nutrition: r.nutrition ? JSON.parse(r.nutrition as string) : null,
    confidence: JSON.parse(r.confidence as string),
  })) as Recipe[];

  // Sort by created date (newest first) in JavaScript to avoid drizzle-orm type conflicts
  return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export default async function RecipesPage() {
  const recipes = await getRecipes();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Recipes</h1>
          <p className="text-gray-600">
            {recipes.length} actionable recipes extracted from short-form
            content
          </p>
        </div>

        {recipes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              No recipes found. Run the extraction:
            </p>
            <code className="bg-gray-100 px-4 py-2 rounded">
              pnpm demo-seed
            </code>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 block"
              >
                <h2 className="text-lg font-bold mb-3 line-clamp-2">
                  {recipe.name}
                </h2>

                <div className="flex flex-wrap gap-2 mb-4">
                  {recipe.cuisine && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {recipe.cuisine}
                    </span>
                  )}
                  {recipe.difficulty && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        recipe.difficulty === 'EASY'
                          ? 'bg-green-100 text-green-800'
                          : recipe.difficulty === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {recipe.difficulty}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>
                    ⏱️ {recipe.totalMin} min
                    {recipe.servings && ` • Serves ${recipe.servings}`}
                  </div>
                  <div>
                    🥘 {recipe.ingredients.length} ingredients • {recipe.steps.length} steps
                  </div>
                </div>

                {recipe.allergens.length > 0 && (
                  <div className="text-xs text-gray-500">
                    ⚠️ Contains: {recipe.allergens.join(', ')}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

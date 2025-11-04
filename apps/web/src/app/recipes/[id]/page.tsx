import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb, recipes as recipesTable, videos } from '@ultimate-social-chef/db';
import { eq } from 'drizzle-orm';
import type { Recipe, Video } from '@ultimate-social-chef/shared';

export const dynamic = 'force-dynamic';

async function getRecipeWithVideo(
  id: string
): Promise<{ recipe: Recipe; video: Video } | null> {
  const db = getDb();

  const [recipeData] = await db
    .select()
    .from(recipesTable)
    .where(eq(recipesTable.id, id))
    .limit(1);

  if (!recipeData) return null;

  const [videoData] = await db
    .select()
    .from(videos)
    .where(eq(videos.id, recipeData.videoId))
    .limit(1);

  if (!videoData) return null;

  const recipe = {
    ...recipeData,
    ingredients: JSON.parse(recipeData.ingredients as string),
    steps: JSON.parse(recipeData.steps as string),
    equipment: JSON.parse(recipeData.equipment as string),
    allergens: JSON.parse(recipeData.allergens as string),
    nutrition: recipeData.nutrition
      ? JSON.parse(recipeData.nutrition as string)
      : null,
    confidence: JSON.parse(recipeData.confidence as string),
  } as Recipe;

  const video = {
    ...videoData,
    stats: JSON.parse(videoData.stats as string),
    hashtags: JSON.parse(videoData.hashtags as string),
    recipeScoreBreakdown: videoData.recipeScoreBreakdown
      ? JSON.parse(videoData.recipeScoreBreakdown as string)
      : null,
  } as Video;

  return { recipe, video };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRecipeWithVideo(id);

  if (!data) {
    notFound();
  }

  const { recipe, video } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm print-hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/recipes" className="text-primary-600 hover:text-primary-700">
            ← Back to Recipes
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            🖨️ Print Recipe
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Recipe Header */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <h1 className="text-3xl font-bold mb-4">{recipe.name}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            {recipe.cuisine && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {recipe.cuisine}
              </span>
            )}
            {recipe.difficulty && (
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {recipe.totalMin && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-primary-600">
                  {recipe.totalMin}
                </div>
                <div className="text-sm text-gray-600">Total Time (min)</div>
              </div>
            )}
            {recipe.servings && (
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-primary-600">
                  {recipe.servings}
                </div>
                <div className="text-sm text-gray-600">Servings</div>
              </div>
            )}
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-primary-600">
                {recipe.ingredients.length}
              </div>
              <div className="text-sm text-gray-600">Ingredients</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-primary-600">
                {recipe.steps.length}
              </div>
              <div className="text-sm text-gray-600">Steps</div>
            </div>
          </div>

          {recipe.allergens.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">
                ⚠️ Allergen Information
              </h3>
              <p className="text-sm text-yellow-800">
                Contains: {recipe.allergens.join(', ')}
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Ingredients */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    {ing.qty && `${ing.qty} `}
                    {ing.unit && `${ing.unit} `}
                    {ing.name}
                    {ing.notes && ` (${ing.notes})`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Equipment & Nutrition */}
          <div className="space-y-6">
            {recipe.equipment.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Equipment</h2>
                <div className="flex flex-wrap gap-2">
                  {recipe.equipment.map((eq) => (
                    <span
                      key={eq}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recipe.nutrition && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">
                  Nutrition (per serving)
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-sm text-gray-600">Calories</div>
                    <div className="font-semibold">{recipe.nutrition.kcal}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Protein</div>
                    <div className="font-semibold">
                      {recipe.nutrition.protein}g
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Carbs</div>
                    <div className="font-semibold">{recipe.nutrition.carbs}g</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Fat</div>
                    <div className="font-semibold">{recipe.nutrition.fat}g</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  * Rough estimates based on ingredient database
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Method Steps */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Method</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step) => (
              <li key={step.n} className="flex">
                <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  {step.n}
                </span>
                <div className="flex-1">
                  <p>{step.text}</p>
                  {step.timers && step.timers.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      ⏱️{' '}
                      {step.timers.map((t) => `${t.min} min`).join(', ')}
                    </div>
                  )}
                  {step.tempC && (
                    <div className="mt-1 text-sm text-gray-600">
                      🌡️ {step.tempC}°C ({Math.round(step.tempC * 9 / 5 + 32)}°F)
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Video Embed */}
        {video.embedHtml && (
          <div className="bg-white rounded-lg shadow p-6 print-hidden">
            <h2 className="text-xl font-bold mb-4">Watch the Original Video</h2>
            <div
              className="flex justify-center"
              dangerouslySetInnerHTML={{ __html: video.embedHtml }}
            />
            <div className="mt-4 text-center">
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                Open on {video.url.includes('youtube') ? 'YouTube' : 'TikTok'} →
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

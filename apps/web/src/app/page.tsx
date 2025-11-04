import Link from 'next/link';
import { getDb, creators } from '@ultimate-social-chef/db';
import { desc } from 'drizzle-orm';
import type { Creator } from '@ultimate-social-chef/shared';

export const dynamic = 'force-dynamic';

async function getTopCreators(): Promise<Creator[]> {
  const db = getDb();
  const results = await db
    .select()
    .from(creators)
    .orderBy(desc(creators.creatorScore))
    .limit(25);

  return results.map((c) => ({
    ...c,
    creatorScoreBreakdown: c.creatorScoreBreakdown
      ? JSON.parse(c.creatorScoreBreakdown as string)
      : null,
  })) as Creator[];
}

function DemoBanner() {
  const isDemoMode = process.env.DEMO_MODE === 'true';

  if (!isDemoMode) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <p className="text-sm text-yellow-800 text-center">
          📦 <strong>Demo Mode:</strong> Using fixture data. To use live APIs,
          set API keys in .env and set DEMO_MODE=false
        </p>
      </div>
    </div>
  );
}

export default async function Home() {
  const topCreators = await getTopCreators();

  return (
    <div className="min-h-screen">
      <DemoBanner />

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🧑‍🍳 Ultimate Social Chef
          </h1>
          <p className="mt-2 text-gray-600">
            Discover actionable recipes from the Top 25 short-form cooking
            creators
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">ELITE25 Creators</h2>
          <p className="text-gray-600">
            Ranked by viral momentum, engagement depth, consistency,
            actionability, and novelty
          </p>
        </div>

        {topCreators.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">
              No creators found. Run the seed script:
            </p>
            <code className="bg-gray-100 px-4 py-2 rounded">
              pnpm demo-seed
            </code>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topCreators.map((creator, idx) => (
              <Link
                key={creator.id}
                href={`/creators/${creator.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                      #{idx + 1}
                    </div>
                    {creator.avatarUrl && (
                      <img
                        src={creator.avatarUrl}
                        alt={creator.displayName}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      creator.platform === 'youtube'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {creator.platform === 'youtube' ? 'YouTube' : 'TikTok'}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-1">
                  {creator.displayName}
                </h3>
                <p className="text-sm text-gray-600 mb-3">@{creator.handle}</p>

                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-600">
                    {(creator.followers / 1000).toFixed(0)}K followers
                  </span>
                  <span className="font-semibold text-primary-600">
                    Score: {(creator.creatorScore * 100).toFixed(0)}
                  </span>
                </div>

                {creator.cuisinePrimary && (
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {creator.cuisinePrimary}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold mb-4">Explore Recipes</h3>
          <Link
            href="/recipes"
            className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse All Recipes →
          </Link>
        </div>
      </main>
    </div>
  );
}

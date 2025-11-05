import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb, creators, videos } from '@ultimate-social-chef/db';
import type { Creator, Video } from '@ultimate-social-chef/shared';

export const dynamic = 'force-dynamic';

async function getCreatorWithVideos(
  id: string
): Promise<{ creator: Creator; videos: Video[] } | null> {
  const db = getDb();

  // Fetch all creators and filter in JavaScript to avoid drizzle-orm type conflicts
  const allCreators = await db.select().from(creators);
  const creatorData = allCreators.find((c) => c.id === id);

  if (!creatorData) return null;

  // Fetch all videos and filter in JavaScript to avoid drizzle-orm type conflicts
  const allVideos = await db.select().from(videos);
  const videosData = allVideos.filter((v) => v.creatorId === id);

  const creator = {
    ...creatorData,
    creatorScoreBreakdown: creatorData.creatorScoreBreakdown
      ? JSON.parse(creatorData.creatorScoreBreakdown as string)
      : null,
  } as Creator;

  const parsedVideos = videosData.map((v) => ({
    ...v,
    stats: JSON.parse(v.stats as string),
    hashtags: JSON.parse(v.hashtags as string),
    recipeScoreBreakdown: v.recipeScoreBreakdown
      ? JSON.parse(v.recipeScoreBreakdown as string)
      : null,
  })) as Video[];

  return { creator, videos: parsedVideos };
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCreatorWithVideos(id);

  if (!data) {
    notFound();
  }

  const { creator, videos: creatorVideos } = data;
  const breakdown = creator.creatorScoreBreakdown;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Back to Creators
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Creator Banner */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-start space-x-6">
            {creator.avatarUrl && (
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-24 h-24 rounded-full"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">{creator.displayName}</h1>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded ${
                    creator.platform === 'youtube'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {creator.platform === 'youtube' ? 'YouTube' : 'TikTok'}
                </span>
              </div>
              <p className="text-gray-600 mb-4">@{creator.handle}</p>

              <div className="flex items-center space-x-6 text-sm mb-6">
                <div>
                  <span className="text-gray-600">Followers:</span>{' '}
                  <span className="font-semibold">
                    {(creator.followers / 1000).toFixed(0)}K
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Creator Score:</span>{' '}
                  <span className="font-semibold text-primary-600">
                    {(creator.creatorScore * 100).toFixed(1)}
                  </span>
                </div>
                {creator.cuisinePrimary && (
                  <div>
                    <span className="text-gray-600">Cuisine:</span>{' '}
                    <span className="font-semibold">
                      {creator.cuisinePrimary}
                    </span>
                  </div>
                )}
              </div>

              {/* Score Breakdown */}
              {breakdown && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3">
                    ELITE25 Score Breakdown:
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600">
                        Viral Momentum
                      </div>
                      <div className="font-semibold">
                        {(breakdown.vm * 100).toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600">
                        Engagement Depth
                      </div>
                      <div className="font-semibold">
                        {(breakdown.ed * 100).toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600">Consistency</div>
                      <div className="font-semibold">
                        {(breakdown.cons * 100).toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600">
                        Actionability
                      </div>
                      <div className="font-semibold">
                        {(breakdown.act * 100).toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600">Novelty</div>
                      <div className="font-semibold">
                        {(breakdown.nov * 100).toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600">Authenticity</div>
                      <div className="font-semibold">
                        {(breakdown.auth * 100).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Videos */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            Top Videos ({creatorVideos.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorVideos.map((video) => (
              <Link
                key={video.id}
                href={`/recipes?video=${video.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 block"
              >
                <h3 className="font-bold mb-2 line-clamp-2">{video.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {video.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {video.hashtags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {(video.stats.views / 1000).toFixed(0)}K views
                  </span>
                  {video.recipeScore && (
                    <span className="font-semibold text-primary-600">
                      Recipe Score: {(video.recipeScore * 100).toFixed(0)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

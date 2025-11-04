/**
 * Pick top 10 videos per creator - applies RANK10 algorithm
 */

import { config } from 'dotenv';
import { getDb, creators, videos } from '@ultimate-social-chef/db';
import { selectTop10Videos } from '@ultimate-social-chef/ranker';
import type { Video } from '@ultimate-social-chef/shared';
import { eq } from 'drizzle-orm';

config();

async function pickTop10() {
  console.log('🎯 Running top 10 video selection job (RANK10)...\n');

  const db = getDb();

  try {
    // Fetch all creators and videos
    const allCreators = await db.select().from(creators);
    const allVideos = await db.select().from(videos);

    if (allCreators.length === 0) {
      console.log('⚠️  No creators found in database. Run discovery or demo-seed first.');
      return;
    }

    console.log(`Processing ${allCreators.length} creators...\n`);

    // Parse JSON fields
    const parsedVideos = allVideos.map(v => ({
      ...v,
      stats: JSON.parse(v.stats as string),
      hashtags: JSON.parse(v.hashtags as string),
      recipeScoreBreakdown: v.recipeScoreBreakdown
        ? JSON.parse(v.recipeScoreBreakdown as string)
        : null,
    })) as Video[];

    for (const creator of allCreators) {
      const creatorVideos = parsedVideos.filter(v => v.creatorId === creator.id);

      if (creatorVideos.length === 0) {
        console.log(`   ${creator.displayName}: No videos found`);
        continue;
      }

      // Run RANK10 algorithm
      const top10 = selectTop10Videos({ videos: creatorVideos });

      console.log(`   ${creator.displayName}: Selected ${top10.length} videos`);

      // Update videos in database with recipe scores
      for (const video of top10) {
        await db
          .update(videos)
          .set({
            recipeScore: video.recipeScore,
            recipeScoreBreakdown: JSON.stringify(video.recipeScoreBreakdown),
          })
          .where(eq(videos.id, video.id));
      }
    }

    console.log('\n✅ Top 10 video selection completed!');
  } catch (error) {
    console.error('❌ Error selecting top 10 videos:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  pickTop10().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { pickTop10 };

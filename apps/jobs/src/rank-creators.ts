/**
 * Rank creators job - applies ELITE25 algorithm
 */

import { config } from 'dotenv';
import { getDb, creators, videos } from '@ultimate-social-chef/db';
import { selectElite25 } from '@ultimate-social-chef/ranker';
import type { Creator, Video } from '@ultimate-social-chef/shared';
import { eq } from 'drizzle-orm';

config();

async function rankCreators() {
  console.log('📊 Running creator ranking job (ELITE25)...\n');

  const db = getDb();

  try {
    // Fetch all creators and their videos
    const allCreators = await db.select().from(creators);
    const allVideos = await db.select().from(videos);

    if (allCreators.length === 0) {
      console.log('⚠️  No creators found in database. Run discovery or demo-seed first.');
      return;
    }

    console.log(`Found ${allCreators.length} creators and ${allVideos.length} videos`);

    // Parse JSON fields
    const parsedCreators = allCreators.map(c => ({
      ...c,
      creatorScoreBreakdown: c.creatorScoreBreakdown
        ? JSON.parse(c.creatorScoreBreakdown as string)
        : null,
    })) as Creator[];

    const parsedVideos = allVideos.map(v => ({
      ...v,
      stats: JSON.parse(v.stats as string),
      hashtags: JSON.parse(v.hashtags as string),
      recipeScoreBreakdown: v.recipeScoreBreakdown
        ? JSON.parse(v.recipeScoreBreakdown as string)
        : null,
    })) as Video[];

    // Group videos by creator
    const creatorsWithVideos = parsedCreators.map(creator => ({
      creator,
      videos: parsedVideos.filter(v => v.creatorId === creator.id),
    }));

    // Run ELITE25 algorithm
    console.log('Running ELITE25 algorithm...');
    const elite25 = selectElite25({
      creators: creatorsWithVideos,
      allVideos: parsedVideos,
    });

    console.log(`\n✅ Selected ${elite25.length} elite creators:\n`);

    for (const creator of elite25) {
      console.log(`   ${creator.displayName} (@${creator.handle})`);
      console.log(`      Platform: ${creator.platform} | Score: ${creator.creatorScore.toFixed(3)}`);
      console.log(`      Cuisine: ${creator.cuisinePrimary || 'N/A'}`);

      // Update creator in database
      await db
        .update(creators)
        .set({
          creatorScore: creator.creatorScore,
          creatorScoreBreakdown: JSON.stringify(creator.creatorScoreBreakdown),
          updatedAt: new Date(),
        })
        .where(eq(creators.id, creator.id));
    }

    console.log('\n✅ Creator ranking completed!');
  } catch (error) {
    console.error('❌ Error ranking creators:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  rankCreators().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { rankCreators };

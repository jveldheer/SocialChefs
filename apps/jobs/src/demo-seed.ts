/**
 * Demo seed script - loads fixture data into database
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb, creators, videos, recipes, migrate } from '@ultimate-social-chef/db';
import type { Creator, Video, Recipe } from '@ultimate-social-chef/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadFixtures() {
  console.log('Loading fixtures from JSON files...\n');

  const fixturesDir = resolve(__dirname, '../../../fixtures');

  const creatorsData: Creator[] = JSON.parse(
    readFileSync(resolve(fixturesDir, 'creators.json'), 'utf-8')
  );

  const videosData: Video[] = JSON.parse(
    readFileSync(resolve(fixturesDir, 'videos.json'), 'utf-8')
  );

  const recipesData: Recipe[] = JSON.parse(
    readFileSync(resolve(fixturesDir, 'recipes.json'), 'utf-8')
  );

  return { creatorsData, videosData, recipesData };
}

async function seed() {
  console.log('🌱 Seeding database with demo data...\n');

  try {
    // Run migrations
    console.log('Running migrations...');
    await migrate();

    const db = getDb();

    // Load fixtures
    const { creatorsData, videosData, recipesData } = await loadFixtures();

    // Insert creators
    console.log(`Inserting ${creatorsData.length} creators...`);
    for (const creator of creatorsData) {
      await db.insert(creators).values({
        id: creator.id,
        platform: creator.platform,
        handle: creator.handle,
        displayName: creator.displayName,
        avatarUrl: creator.avatarUrl,
        followers: creator.followers,
        creatorScore: creator.creatorScore,
        creatorScoreBreakdown: JSON.stringify(creator.creatorScoreBreakdown),
        cuisinePrimary: creator.cuisinePrimary,
      });
    }

    // Insert videos
    console.log(`Inserting ${videosData.length} videos...`);
    for (const video of videosData) {
      await db.insert(videos).values({
        id: video.id,
        platformId: video.platformId,
        creatorId: video.creatorId,
        url: video.url,
        title: video.title,
        description: video.description,
        publishedAt: new Date(video.publishedAt),
        durationSec: video.durationSec,
        stats: JSON.stringify(video.stats),
        hashtags: JSON.stringify(video.hashtags),
        recipeScore: video.recipeScore,
        recipeScoreBreakdown: JSON.stringify(video.recipeScoreBreakdown),
        embedHtml: video.embedHtml,
      });
    }

    // Insert recipes
    console.log(`Inserting ${recipesData.length} recipes...`);
    for (const recipe of recipesData) {
      await db.insert(recipes).values({
        id: recipe.id,
        videoId: recipe.videoId,
        name: recipe.name,
        cuisine: recipe.cuisine,
        difficulty: recipe.difficulty,
        yieldText: recipe.yieldText,
        servings: recipe.servings,
        totalMin: recipe.totalMin,
        activeMin: recipe.activeMin,
        passiveMin: recipe.passiveMin,
        ingredients: JSON.stringify(recipe.ingredients),
        steps: JSON.stringify(recipe.steps),
        equipment: JSON.stringify(recipe.equipment),
        allergens: JSON.stringify(recipe.allergens),
        nutrition: JSON.stringify(recipe.nutrition),
        confidence: JSON.stringify(recipe.confidence),
      });
    }

    console.log('\n✅ Demo data seeded successfully!');
    console.log(`   - ${creatorsData.length} creators`);
    console.log(`   - ${videosData.length} videos`);
    console.log(`   - ${recipesData.length} recipes`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seed };

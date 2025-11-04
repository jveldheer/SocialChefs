/**
 * Extract recipes from videos - applies CHEF-IE pipeline
 */

import { config } from 'dotenv';
import { getDb, videos, recipes as recipesTable } from '@ultimate-social-chef/db';
import { extractRecipe, computeActionabilityScore } from '@ultimate-social-chef/chef-ie';
import type { Video } from '@ultimate-social-chef/shared';
import { eq } from 'drizzle-orm';

config();

async function extract() {
  console.log('🧑‍🍳 Running recipe extraction job (CHEF-IE)...\n');

  const db = getDb();

  try {
    // Fetch all videos
    const allVideos = await db.select().from(videos);

    if (allVideos.length === 0) {
      console.log('⚠️  No videos found in database. Run discovery or demo-seed first.');
      return;
    }

    console.log(`Processing ${allVideos.length} videos...\n`);

    // Parse JSON fields
    const parsedVideos = allVideos.map(v => ({
      ...v,
      stats: JSON.parse(v.stats as string),
      hashtags: JSON.parse(v.hashtags as string),
      recipeScoreBreakdown: v.recipeScoreBreakdown
        ? JSON.parse(v.recipeScoreBreakdown as string)
        : null,
    })) as Video[];

    let extracted = 0;

    for (const video of parsedVideos) {
      // Check if recipe already exists
      const existing = await db
        .select()
        .from(recipesTable)
        .where(eq(recipesTable.videoId, video.id))
        .limit(1);

      if (existing.length > 0) {
        console.log(`   ⏭️  Skipping "${video.title}" (recipe exists)`);
        continue;
      }

      // Extract recipe
      const recipe = extractRecipe({ video });

      // Compute actionability score
      const actionability = computeActionabilityScore(
        recipe.ingredients,
        recipe.steps,
        recipe.yieldText,
        recipe.equipment
      );

      console.log(`   ✅ Extracted "${recipe.name}"`);
      console.log(`      Actionability: ${(actionability * 100).toFixed(1)}%`);
      console.log(`      ${recipe.ingredients.length} ingredients, ${recipe.steps.length} steps`);

      // Insert recipe into database
      await db.insert(recipesTable).values({
        ...recipe,
        ingredients: JSON.stringify(recipe.ingredients),
        steps: JSON.stringify(recipe.steps),
        equipment: JSON.stringify(recipe.equipment),
        allergens: JSON.stringify(recipe.allergens),
        nutrition: JSON.stringify(recipe.nutrition),
        confidence: JSON.stringify(recipe.confidence),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      extracted++;
    }

    console.log(`\n✅ Recipe extraction completed! Extracted ${extracted} recipes.`);
  } catch (error) {
    console.error('❌ Error extracting recipes:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  extract().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { extract };

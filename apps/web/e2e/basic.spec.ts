import { test, expect } from '@playwright/test';

test.describe('Ultimate Social Chef', () => {
  test('homepage loads and shows creators', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page.locator('h1')).toContainText('Ultimate Social Chef');

    // Check for ELITE25 heading
    await expect(page.locator('h2')).toContainText('ELITE25 Creators');
  });

  test('can navigate to recipes page', async ({ page }) => {
    await page.goto('/');

    // Click on Browse All Recipes
    await page.click('text=Browse All Recipes');

    // Should be on recipes page
    await expect(page).toHaveURL('/recipes');
    await expect(page.locator('h1')).toContainText('All Recipes');
  });

  test('can view a recipe detail', async ({ page }) => {
    await page.goto('/recipes');

    // Wait for recipes to load
    await page.waitForSelector('a[href^="/recipes/"]', { timeout: 10000 });

    // Click first recipe
    const firstRecipe = page.locator('a[href^="/recipes/recipe_"]').first();
    await firstRecipe.click();

    // Should show recipe details
    await expect(page.locator('h1')).toBeTruthy();
    await expect(page.locator('text=Ingredients')).toBeVisible();
    await expect(page.locator('text=Method')).toBeVisible();
  });
});

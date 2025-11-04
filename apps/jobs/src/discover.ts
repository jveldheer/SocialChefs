/**
 * Discovery job - placeholder for API-based discovery
 * In demo mode, uses fixture data
 */

import { config } from 'dotenv';

config();

async function discover() {
  console.log('🔍 Running discovery job...\n');

  const demoMode = process.env.DEMO_MODE === 'true';

  if (demoMode) {
    console.log('📦 Demo mode enabled - using fixture data');
    console.log('   Run `pnpm demo-seed` to load fixtures into database\n');
    return;
  }

  // TODO: Implement real discovery using YouTube Data API v3 and TikTok API
  console.log('🚧 API-based discovery not yet implemented');
  console.log('   Would search for:');
  console.log('   - YouTube Shorts with cooking keywords');
  console.log('   - TikTok videos with #recipe, #food, etc.');
  console.log('   - Aggregate last 30 videos per creator candidate');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  discover().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { discover };

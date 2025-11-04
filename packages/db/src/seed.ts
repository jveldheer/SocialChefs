/**
 * Database seed script
 * Creates initial schema (placeholder for now, actual seeding happens in apps/jobs)
 */

import { migrate } from './migrate.js';

async function seed() {
  console.log('Seeding database...');

  // Run migrations first
  await migrate();

  console.log('Database seeded successfully!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { seed };

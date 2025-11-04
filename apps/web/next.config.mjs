/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ultimate-social-chef/db',
    '@ultimate-social-chef/shared',
    '@ultimate-social-chef/ranker',
    '@ultimate-social-chef/chef-ie',
  ],
  serverExternalPackages: ['better-sqlite3'],
  // Disable static optimization for DB-dependent pages
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Ensure environment variables are available
  env: {
    DEMO_MODE: process.env.DEMO_MODE || 'true',
    DATABASE_URL: process.env.DATABASE_URL || 'file:./data/social-chef.db',
  },
};

export default nextConfig;

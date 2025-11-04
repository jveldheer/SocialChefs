/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ultimate-social-chef/db',
    '@ultimate-social-chef/shared',
    '@ultimate-social-chef/ranker',
    '@ultimate-social-chef/chef-ie',
  ],
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;

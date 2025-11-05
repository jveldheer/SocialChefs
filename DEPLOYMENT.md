# Deployment Guide

## Deploying to Vercel

Since this is a Turborepo monorepo, configure your Vercel project with these settings:

### Project Settings

1. **Root Directory**: `apps/web`
2. **Framework Preset**: Next.js (auto-detected)
3. **Build Command**: Leave as default (Vercel will auto-detect and use `pnpm turbo build`)
4. **Output Directory**: Leave as default (`.next`)
5. **Install Command**: `pnpm install`

### Environment Variables

Add these environment variables in your Vercel project settings:

```
DEMO_MODE=true
DATABASE_URL=file:./data/social-chef.db
```

### Important Notes

- **Remove or ignore vercel.json**: The root-level `vercel.json` may conflict with proper monorepo detection. Vercel's automatic configuration works best for Turborepo monorepos.
- **Database**: In production on Vercel, you'll need to use a serverless-compatible database like Turso (LibSQL) since Vercel's serverless functions don't support persistent file storage for SQLite. For demo purposes with `DEMO_MODE=true`, the in-memory fallback will work.

### Steps to Deploy

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import your GitHub repository
3. Configure the settings as listed above
4. Click "Deploy"

### Switching to Turso for Production

For a production deployment with persistent data:

1. Sign up for [Turso](https://turso.tech/)
2. Create a database
3. Update your environment variables:
   ```
   DEMO_MODE=false
   DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   ```
4. Update `packages/db/src/index.ts` to use `@libsql/client` instead of `better-sqlite3`

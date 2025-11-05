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
```

That's it! The app will automatically detect Vercel's read-only serverless environment and use an in-memory SQLite database with demo data.

### Important Notes

- **In-Memory Database**: When deployed to Vercel, the app automatically detects the read-only file system and uses an in-memory SQLite database. This is seeded with demo data when `DEMO_MODE=true`.
- **Data Persistence**: Note that in-memory data resets on each serverless function cold start. For persistent data in production, see the Turso configuration below.
- **No vercel.json Needed**: The app works best without a root-level `vercel.json`. Vercel's automatic Turborepo detection handles everything.

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

# Vercel Deployment Guide

## Quick Deploy

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /home/user/SocialChefs/apps/web
   vercel
   ```

3. **Follow prompts:**
   - Link to GitHub repo (jveldheer/SocialChefs)
   - Set root directory: `apps/web`
   - Accept build settings

## Database Considerations

Since Vercel doesn't support persistent file storage, you have options:

### Option A: Turso (Serverless SQLite - Free)
1. Sign up at https://turso.tech
2. Create database
3. Update `.env`:
   ```
   DATABASE_URL=libsql://your-db.turso.io
   TURSO_AUTH_TOKEN=your-token
   ```
4. Install: `pnpm add @libsql/client`

### Option B: Demo Mode (No DB Changes)
Keep `DEMO_MODE=true` - app works read-only with fixtures

### Option C: Vercel Blob Storage
Use Vercel's blob storage for SQLite file

## Environment Variables

In Vercel dashboard, add:
- `DEMO_MODE=true` (for demo mode)
- `DATABASE_URL=...` (if using Turso)
- `ADMIN_PASSWORD=...`

## Auto-Deploy

After first deploy:
- Every push to your branch auto-deploys
- Preview deployments for PRs
- Production domain assigned

## Custom Domain (Optional)

In Vercel dashboard:
- Settings > Domains
- Add your domain
- Update DNS records

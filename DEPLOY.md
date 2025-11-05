# Vercel Deployment Guide

## Quick Deploy (Monorepo Method)

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to https://vercel.com** and sign in

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Import your GitHub repo: `jveldheer/SocialChefs`
   - Select branch: `claude/ultimate-social-chef-monorepo-011CUoT2zc9ZZjsnuK3v6Cgj`

3. **Configure Build Settings:**
   - **Root Directory:** Leave as `.` (root of repo)
   - **Build Command:** Will auto-detect from `vercel.json` ✅
   - **Output Directory:** Will auto-detect from `vercel.json` ✅
   - **Install Command:** Will auto-detect from `vercel.json` ✅

4. **Environment Variables:**
   Click "Environment Variables" and add:
   - `DEMO_MODE` = `true`
   - `DATABASE_URL` = `file:./apps/web/data/social-chef.db`
   - `ADMIN_PASSWORD` = `your-password` (optional)

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes

### Option B: Via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from repository root:**
   ```bash
   cd /home/user/SocialChefs
   vercel
   ```

3. **Follow prompts:**
   - Link to GitHub repo
   - Accept defaults (vercel.json will handle configuration)

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

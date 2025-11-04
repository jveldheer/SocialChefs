# 🚀 Git Push Instructions

This guide explains how to push the Ultimate Social Chef monorepo to GitHub.

## Prerequisites

- Git installed and configured
- GitHub account
- GitHub repository created (or will create new one)

## Steps to Push

### 1. Initialize Git (if not already done)

```bash
cd /home/user/SocialChefs
git init
```

### 2. Add All Files

```bash
git add .
```

### 3. Create Initial Commit

```bash
git commit -m "Initial commit: Ultimate Social Chef monorepo

- Complete monorepo with pnpm + Turbo
- ELITE25 creator ranking algorithm
- RANK10 video selection algorithm
- CHEF-IE recipe extraction pipeline
- Next.js 15 web app with Tailwind CSS
- SQLite database with FTS5 search
- Demo mode with fixtures
- Full test coverage (Vitest + Playwright)
- CI/CD with GitHub Actions"
```

### 4. Create GitHub Repository

Option A: Via GitHub CLI (if installed):
```bash
gh repo create ultimate-social-chef --public --source=. --remote=origin
```

Option B: Via GitHub Web UI:
1. Go to https://github.com/new
2. Create repository named `ultimate-social-chef`
3. Do NOT initialize with README, .gitignore, or license (we already have these)
4. Copy the repository URL

### 5. Add Remote and Push

If you created the repo via web UI:

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/ultimate-social-chef.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

If you used GitHub CLI, it already added the remote and you can just:

```bash
git push -u origin main
```

### 6. Verify

Visit your repository URL to confirm all files were pushed:
```
https://github.com/YOUR_USERNAME/ultimate-social-chef
```

## Branch Strategy

The project is configured to work with the branch:
```
claude/ultimate-social-chef-monorepo-011CUoT2zc9ZZjsnuK3v6Cgj
```

To push to this specific branch:

```bash
# Create and switch to the branch
git checkout -b claude/ultimate-social-chef-monorepo-011CUoT2zc9ZZjsnuK3v6Cgj

# Push to remote
git push -u origin claude/ultimate-social-chef-monorepo-011CUoT2zc9ZZjsnuK3v6Cgj
```

## Subsequent Pushes

After the initial push, you can make changes and push with:

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Your commit message"

# Push
git push
```

## GitHub Actions

Once pushed, GitHub Actions will automatically:
- Type check all packages
- Run unit tests
- Build packages
- Seed demo database
- Run E2E tests with Playwright

Check the Actions tab in your repository to see the CI pipeline results.

## Troubleshooting

### Large files warning

If you get warnings about large files:
- The database file (`data/*.db`) is gitignored
- Ensure `node_modules/` is gitignored
- Check `.gitignore` is properly configured

### Authentication issues

For HTTPS:
- Use a Personal Access Token (PAT) instead of password
- Generate at: https://github.com/settings/tokens

For SSH:
- Add SSH key to GitHub: https://github.com/settings/keys
- Use SSH URL: `git@github.com:YOUR_USERNAME/ultimate-social-chef.git`

### Push rejected (non-fast-forward)

If someone else pushed to the branch:
```bash
# Pull changes first
git pull --rebase origin main

# Resolve any conflicts

# Push again
git push
```

## Next Steps

After pushing:

1. **Set up branch protection** (recommended):
   - Go to Settings > Branches
   - Add rule for `main` branch
   - Require status checks (CI) to pass
   - Require pull request reviews

2. **Add repository secrets** (if using APIs):
   - Go to Settings > Secrets and variables > Actions
   - Add: `YT_API_KEY`, `TIKTOK_CLIENT_KEY`, etc.

3. **Enable GitHub Pages** (optional):
   - Build and deploy the Next.js app
   - Use Vercel, Netlify, or GitHub Pages

4. **Create first PR**:
   - Make a feature branch
   - Push changes
   - Create pull request to `main`

---

**Happy coding! 🎉**

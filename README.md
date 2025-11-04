# 🧑‍🍳 Ultimate Social Chef

A production-grade monorepo for discovering, ranking, and extracting actionable recipes from short-form cooking content on TikTok and YouTube Shorts.

## 🎯 Overview

Ultimate Social Chef uses custom algorithms to:

1. **ELITE25**: Rank the top 25 cooking content creators using viral momentum, engagement depth, consistency, actionability, novelty, and authenticity scores
2. **RANK10**: Select each creator's 10 best videos optimized for recipe actionability
3. **CHEF-IE**: Extract full, structured recipes from video metadata with ingredients, steps, timing, equipment, nutrition estimates, and more

## ✨ Features

- ⚡ **Fast, elegant web UI** built with Next.js 15 (App Router) + Tailwind CSS
- 🎬 **Embedded videos** from YouTube and TikTok with full recipe details
- 🔍 **Full-text search** powered by SQLite FTS5
- 🎨 **Rich recipe pages** with ingredients, steps, timing, equipment, allergens, and nutrition
- 📊 **Creator profiles** with ELITE25 score breakdowns
- 🖨️ **Print-friendly** recipe pages
- 📦 **Demo mode** with fixtures - runs without API keys
- 🧪 **Full test coverage** with Vitest and Playwright
- 🚀 **CI/CD ready** with GitHub Actions

## 🏗️ Architecture

**Monorepo Structure** (pnpm + Turbo):

```
ultimate-social-chef/
├── apps/
│   ├── web/              # Next.js app (App Router + Tailwind)
│   └── jobs/             # CLI scripts for discovery & processing
├── packages/
│   ├── db/               # Drizzle ORM + SQLite + FTS5
│   ├── ranker/           # ELITE25 + RANK10 algorithms
│   ├── chef-ie/          # Recipe extraction pipeline
│   └── shared/           # Shared types + Zod schemas
└── fixtures/             # Demo data (creators, videos, recipes)
```

**Tech Stack**:
- TypeScript end-to-end
- Next.js 15 (App Router)
- SQLite via Drizzle ORM with FTS5 for search
- Tailwind CSS for styling
- Vitest for unit tests
- Playwright for E2E tests

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 8

### Installation

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build

# Seed demo database
pnpm demo-seed

# Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app!

## 📝 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Demo mode (uses fixtures, no API keys needed)
DEMO_MODE=true

# Database
DATABASE_URL=file:./data/social-chef.db

# Admin password for refresh/reindex endpoints
ADMIN_PASSWORD=admin123

# Optional: YouTube Data API v3
YT_API_KEY=

# Optional: TikTok API
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_ACCESS_TOKEN=
```

## 🎬 Demo Mode

The app ships with rich fixture data and runs without API keys:

```bash
# Load fixtures into database
pnpm demo-seed

# Start dev server
pnpm dev
```

Demo mode includes:
- 5 diverse creators (Italian, Korean, Mexican, Indian, Japanese)
- 7 complete videos with metadata
- 7 fully extracted recipes with ingredients, steps, timing, equipment, allergens, and nutrition

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests (starts dev server automatically)
pnpm test:e2e

# Type checking
pnpm typecheck
```

## 📊 Algorithms

### ELITE25: Creator Ranking

Ranks creators using:

- **Viral Momentum (VM)**: EMA of view velocity normalized by audience size
- **Engagement Depth (ED)**: Weighted comments, shares, likes
- **Consistency (CONS)**: Posting regularity (1 - CV of intervals)
- **Actionability (ACT)**: Mean recipe actionability of videos
- **Novelty (NOV)**: Uniqueness vs. peer corpus (Jaccard + MinHash)
- **Authenticity (AUTH)**: Penalizes suspicious engagement patterns

**Formula**:
```
CREATOR_SCORE = 0.42*VM + 0.22*ED + 0.16*CONS + 0.12*ACT + 0.08*NOV - 0.10*(1 - AUTH)
```

With diversity constraints:
- Max 60% from one platform
- Min 8 distinct cuisines
- Max 4 creators per cuisine/style

### RANK10: Video Selection

Selects top 10 videos per creator:

- **Performance (PERF)**: 0.6*VM + 0.4*ED at video level
- **Actionability (ACT)**: Recipe extraction score
- **Recency (REC)**: Logistic decay favoring last 120 days

**Formula**:
```
RECIPE_SCORE = 0.6*PERF + 0.3*ACT + 0.1*REC
```

Near-duplicate videos are removed using MinHash similarity.

### CHEF-IE: Recipe Extraction

Deterministic, LLM-free pipeline:

1. **Ingest**: Video title, description, hashtags, captions
2. **Parse**:
   - Ingredients: regex + unit normalization
   - Steps: verb-led sentence detection
   - Time/temp: pattern matching
   - Equipment: keyword detection
3. **Classify**:
   - Cuisine: rule-based taxonomy (YAML)
   - Difficulty: based on ingredient count, step count, techniques
4. **Enrich**:
   - Allergens: heuristic detection
   - Nutrition: offline ingredient database (per 100g macros)
5. **Score**: Actionability from 0-1 based on completeness

## 🛠️ CLI Commands

```bash
# Discovery (placeholder - requires API keys)
pnpm discover

# Rank creators with ELITE25
pnpm rank-creators

# Select top 10 videos per creator
pnpm pick-top10

# Extract recipes with CHEF-IE
pnpm extract
```

## 📦 Production Build

```bash
# Build all packages
pnpm build

# Start production server
pnpm --filter web start
```

## 🔒 Security & Compliance

- Only uses **public** metadata from official APIs
- No video downloading or scraping
- Respects platform ToS (YouTube Data API v3, TikTok Open/Business API)
- No PII storage
- Admin endpoints protected by password

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🙏 Acknowledgments

- **Nutrition data**: USDA FoodData Central (simplified)
- **Cuisine rules**: Community-curated taxonomy
- **Algorithms**: Custom implementations of statistical ranking methods

## 🐛 Issues & Contributing

Found a bug or want to contribute?

1. Check [existing issues](https://github.com/yourusername/ultimate-social-chef/issues)
2. Open a new issue with reproduction steps
3. Submit a PR with tests

## 🎉 Next Steps

- [ ] Implement live API discovery (YouTube Data API v3, TikTok API)
- [ ] Add user accounts & saved recipes
- [ ] Meal planning features
- [ ] Grocery list generation
- [ ] Recipe difficulty filters
- [ ] Advanced search (cuisine, time, dietary)
- [ ] Mobile app (React Native)

---

**Built with ❤️ for cooking enthusiasts and data nerds**

/**
 * ELITE25: Creator ranking algorithm
 * Selects top 25 cooking content creators from short-form platforms
 */

import type { Creator, Video, CreatorScore, Cuisine, Platform } from '@ultimate-social-chef/shared';
import { clamp, coefficientOfVariation, ema, minMaxNormalize, robustZScore, isOutlier } from './utils.js';
import { computeNoveltyScore } from './novelty.js';

export interface CreatorRankInput {
  creators: Array<{
    creator: Creator;
    videos: Video[]; // Last K videos (typically 30)
  }>;
  allVideos: Video[]; // All videos for novelty computation
}

export interface CreatorWithScore extends Creator {
  creatorScore: number;
  creatorScoreBreakdown: CreatorScore;
}

/**
 * Compute Viral Momentum (VM) for a creator
 * VM = EMA_7 of (views / max(1, hours_since_post)) / max(1, followers)
 */
export function computeViralMomentum(creator: Creator, videos: Video[]): number {
  if (videos.length === 0) return 0;

  const velocities = videos.map(v => {
    const hoursSince = v.stats.hoursSincePost || 24;
    return v.stats.views / Math.max(1, hoursSince);
  });

  const emaVelocity = ema(velocities, 7);
  const normalizedVM = Math.min(1, emaVelocity / Math.max(1, creator.followers / 1000));

  return clamp(normalizedVM, 0, 1);
}

/**
 * Compute Engagement Depth (ED) for a creator
 * ED = 0.5*(comments/views) + 0.3*(shares/views) + 0.2*(likes/views)
 */
export function computeEngagementDepth(videos: Video[]): number {
  if (videos.length === 0) return 0;

  const totalViews = videos.reduce((sum, v) => sum + v.stats.views, 0);
  if (totalViews === 0) return 0;

  const totalComments = videos.reduce((sum, v) => sum + v.stats.comments, 0);
  const totalShares = videos.reduce((sum, v) => sum + v.stats.shares, 0);
  const totalLikes = videos.reduce((sum, v) => sum + v.stats.likes, 0);

  const commentRate = totalComments / totalViews;
  const shareRate = totalShares / totalViews;
  const likeRate = totalLikes / totalViews;

  const ed = 0.5 * commentRate + 0.3 * shareRate + 0.2 * likeRate;

  // Normalize (typical values are small)
  const edNormalized = Math.min(1, ed * 20);

  return clamp(edNormalized, 0, 1);
}

/**
 * Compute Consistency (CONS) for a creator
 * CONS = 1 - clamp(CV(inter-post intervals), 0, 1)
 */
export function computeConsistency(videos: Video[]): number {
  if (videos.length < 2) return 0.5; // Not enough data, neutral score

  // Sort by published date
  const sorted = [...videos].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  // Compute inter-post intervals in days
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].publishedAt);
    const currDate = new Date(sorted[i].publishedAt);
    const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(daysDiff);
  }

  if (intervals.length === 0) return 0.5;

  const cv = coefficientOfVariation(intervals);
  const cons = 1 - clamp(cv, 0, 1);

  return clamp(cons, 0, 1);
}

/**
 * Compute Actionability (ACT) for a creator
 * Mean of each video's "Recipe Actionability Score"
 */
export function computeActionability(videos: Video[]): number {
  if (videos.length === 0) return 0;

  // Use pre-computed recipe scores if available, otherwise estimate
  const scores = videos.map(v => {
    if (v.recipeScore != null) return v.recipeScore;
    // Estimate based on video metadata (rough heuristic)
    const hasDescription = (v.description?.length || 0) > 50;
    const hasHashtags = v.hashtags.length > 0;
    const hasCookingHashtags = v.hashtags.some(tag =>
      /recipe|cooking|food|chef|meal|baking|ingredients/i.test(tag)
    );
    return (hasDescription ? 0.5 : 0) + (hasHashtags ? 0.25 : 0) + (hasCookingHashtags ? 0.25 : 0);
  });

  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return clamp(mean, 0, 1);
}

/**
 * Compute Authenticity (AUTH) for a creator
 * Penalizes suspicious engagement ratios and burstiness
 */
export function computeAuthenticity(videos: Video[]): number {
  if (videos.length === 0) return 0.5;

  // Check for suspicious engagement ratios
  const engagementRatios = videos.map(v => {
    const views = Math.max(1, v.stats.views);
    const totalEngagement = v.stats.likes + v.stats.comments + v.stats.shares;
    return totalEngagement / views;
  });

  // Detect outliers (bot-like behavior)
  const outlierCount = engagementRatios.filter(
    (ratio) => isOutlier(ratio, engagementRatios)
  ).length;

  const outlierPenalty = outlierCount / videos.length;

  // Check for burstiness in posting (bot accounts often post in bursts)
  const sorted = [...videos].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  let burstCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].publishedAt);
    const currDate = new Date(sorted[i].publishedAt);
    const hoursDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60);

    // Flag if posted within 1 hour (suspicious)
    if (hoursDiff < 1) burstCount++;
  }

  const burstPenalty = burstCount / Math.max(1, videos.length - 1);

  const auth = 1 - clamp(outlierPenalty + burstPenalty, 0, 1);
  return clamp(auth, 0, 1);
}

/**
 * Compute final creator score
 * CREATOR_SCORE = 0.42*VM + 0.22*ED + 0.16*CONS + 0.12*ACT + 0.08*NOV - 0.10*(1 - AUTH)
 */
export function computeCreatorScore(
  creator: Creator,
  videos: Video[],
  noveltyContext: { videos: Video[] }
): CreatorScore {
  const vm = computeViralMomentum(creator, videos);
  const ed = computeEngagementDepth(videos);
  const cons = computeConsistency(videos);
  const act = computeActionability(videos);
  const nov = computeNoveltyScore(videos, noveltyContext);
  const auth = computeAuthenticity(videos);

  const total = 0.42 * vm + 0.22 * ed + 0.16 * cons + 0.12 * act + 0.08 * nov - 0.10 * (1 - auth);

  return {
    vm,
    ed,
    cons,
    act,
    nov,
    auth,
    total,
  };
}

/**
 * Platform-wise normalization using robust Z-scores and min-max scaling
 */
function normalizePlatformScores(
  creators: CreatorWithScore[]
): CreatorWithScore[] {
  const platforms = new Set(creators.map(c => c.platform));

  const normalized = [];
  for (const platform of platforms) {
    const platformCreators = creators.filter(c => c.platform === platform);
    const scores = platformCreators.map(c => c.creatorScore);

    // Robust Z-score normalization then min-max to [0, 1]
    const zScores = scores.map((score) => robustZScore(score, scores));
    const normalizedScores = minMaxNormalize(zScores);

    normalized.push(
      ...platformCreators.map((creator, creatorIdx) => ({
        ...creator,
        creatorScore: normalizedScores[creatorIdx],
      }))
    );
  }

  return normalized;
}

/**
 * Enforce diversity constraints
 * - Max 60% from single platform
 * - At least 8 distinct cuisines
 * - Cap any single style to ≤ 4 creators
 */
function enforceDiversityConstraints(
  candidates: CreatorWithScore[]
): CreatorWithScore[] {
  const maxPlatformRatio = 0.6;
  const minCuisines = 8;
  const maxPerStyle = 4; // Simplified: we'll use cuisine as proxy for style

  const selected: CreatorWithScore[] = [];
  const platformCounts = new Map<Platform, number>();
  const cuisineCounts = new Map<Cuisine, number>();

  // Sort by score descending
  const sorted = [...candidates].sort((a, b) => b.creatorScore - a.creatorScore);

  for (const creator of sorted) {
    if (selected.length >= 25) break;

    const platformCount = platformCounts.get(creator.platform) || 0;
    const cuisineCount = cuisineCounts.get(creator.cuisinePrimary!) || 0;

    // Check platform constraint
    if (platformCount / (selected.length + 1) > maxPlatformRatio && selected.length > 0) {
      continue; // Skip to maintain platform balance
    }

    // Check cuisine/style constraint
    if (cuisineCount >= maxPerStyle) {
      continue; // Skip to maintain diversity
    }

    // Add creator
    selected.push(creator);
    platformCounts.set(creator.platform, platformCount + 1);
    if (creator.cuisinePrimary) {
      cuisineCounts.set(creator.cuisinePrimary, cuisineCount + 1);
    }
  }

  // Ensure at least 8 cuisines if possible
  const uniqueCuisines = new Set(selected.map(c => c.cuisinePrimary).filter(Boolean));
  if (uniqueCuisines.size < minCuisines) {
    // Try to add more diverse creators (relaxing other constraints slightly)
    for (const creator of sorted) {
      if (selected.length >= 25) break;
      if (selected.some(c => c.id === creator.id)) continue;
      if (!creator.cuisinePrimary || uniqueCuisines.has(creator.cuisinePrimary)) continue;

      selected.push(creator);
      uniqueCuisines.add(creator.cuisinePrimary);
    }
  }

  return selected.slice(0, 25);
}

/**
 * ELITE25: Select top 25 creators with diversity constraints
 */
export function selectElite25(input: CreatorRankInput): CreatorWithScore[] {
  const { creators, allVideos } = input;

  if (creators.length === 0) return [];

  // Compute scores for all creators
  const scored = creators.map(({ creator, videos }) => {
    const scoreBreakdown = computeCreatorScore(creator, videos, { videos: allVideos });

    return {
      ...creator,
      creatorScore: scoreBreakdown.total,
      creatorScoreBreakdown: scoreBreakdown,
    };
  });

  // Platform-wise normalization
  const normalized = normalizePlatformScores(scored);

  // Apply diversity constraints and select top 25
  const elite25 = enforceDiversityConstraints(normalized);

  return elite25;
}

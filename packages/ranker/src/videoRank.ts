/**
 * RANK10: Video selection algorithm per creator
 * Selects top 10 videos per creator based on recipe-worthiness
 */

import type { Video, VideoScore } from '@ultimate-social-chef/shared';
import { clamp, logisticDecay } from './utils.js';
import { deduplicateVideos } from './novelty.js';

export interface VideoRankInput {
  videos: Video[]; // All videos for a creator
  actionabilityScores?: Map<string, number>; // Pre-computed actionability from CHEF-IE
}

/**
 * Compute performance score for a video
 * PERF = 0.6*VM_video + 0.4*ED_video
 */
export function computePerformanceScore(video: Video): number {
  const stats = video.stats;
  const followers = 100000; // Default, would come from creator

  // Viral Momentum at video level
  const hoursSince = stats.hoursSincePost || 24;
  const viewVelocity = stats.views / Math.max(1, hoursSince);
  const vm = Math.min(1, viewVelocity / Math.max(1, followers / 1000)); // Normalize

  // Engagement Depth
  const views = Math.max(1, stats.views);
  const commentRate = stats.comments / views;
  const shareRate = stats.shares / views;
  const likeRate = stats.likes / views;
  const ed = 0.5 * commentRate + 0.3 * shareRate + 0.2 * likeRate;

  // Normalize ED (typical values are small)
  const edNormalized = Math.min(1, ed * 20); // Scale up typical engagement rates

  const perf = 0.6 * vm + 0.4 * edNormalized;
  return clamp(perf, 0, 1);
}

/**
 * Compute recency boost
 * Favors videos from last 120 days with logistic decay
 */
export function computeRecencyBoost(video: Video): number {
  const now = new Date();
  const published = new Date(video.publishedAt);
  const daysSince = (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24);

  return logisticDecay(daysSince, 60, 0.05);
}

/**
 * Compute recipe-worthiness score for a video
 * RECIPE_SCORE = 0.6*PERF + 0.3*ACT_video + 0.1*REC
 */
export function computeRecipeScore(
  video: Video,
  actionability: number = 0.5
): VideoScore {
  const perf = computePerformanceScore(video);
  const act = actionability;
  const rec = computeRecencyBoost(video);

  const total = 0.6 * perf + 0.3 * act + 0.1 * rec;

  return {
    perf,
    act,
    rec,
    total: clamp(total, 0, 1),
  };
}

/**
 * Select top 10 videos for a creator using RANK10 algorithm
 */
export function selectTop10Videos(input: VideoRankInput): Video[] {
  const { videos, actionabilityScores = new Map() } = input;

  if (videos.length === 0) return [];

  // Compute recipe scores for all videos
  const scoredVideos = videos.map(video => {
    const actionability = actionabilityScores.get(video.id) || 0.5;
    const scoreBreakdown = computeRecipeScore(video, actionability);

    return {
      ...video,
      recipeScore: scoreBreakdown.total,
      recipeScoreBreakdown: scoreBreakdown,
    };
  });

  // Sort by recipe score
  const sorted = scoredVideos.sort((a, b) =>
    (b.recipeScore || 0) - (a.recipeScore || 0)
  );

  // Take top candidates (2x to allow for deduplication)
  const topCandidates = sorted.slice(0, 20);

  // Deduplicate near-duplicates
  const deduplicated = deduplicateVideos(topCandidates, 0.75);

  // Return top 10
  return deduplicated.slice(0, 10);
}

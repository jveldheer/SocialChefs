/**
 * Novelty scoring using MinHash LSH and Jaccard similarity
 */

import { jaccardSimilarity, minHash, minHashSimilarity, generateShingles } from './utils.js';
import type { Video } from '@ultimate-social-chef/shared';

export interface NoveltyContext {
  videos: Video[];
}

/**
 * Compute novelty score for a creator based on their content's uniqueness
 * compared to the peer corpus
 */
export function computeNoveltyScore(
  creatorVideos: Video[],
  context: NoveltyContext
): number {
  if (creatorVideos.length === 0) return 0;

  // Extract creator's hashtags and content
  const creatorHashtags = new Set<string>();
  const creatorContent: string[] = [];

  for (const video of creatorVideos) {
    video.hashtags.forEach(tag => creatorHashtags.add(tag.toLowerCase()));
    creatorContent.push(`${video.title} ${video.description || ''}`);
  }

  // Build peer corpus (all other videos)
  const peerVideos = context.videos.filter(
    v => !creatorVideos.some(cv => cv.id === v.id)
  );

  if (peerVideos.length === 0) return 1; // No peers to compare against, maximally novel

  // Compute hashtag-based novelty using Jaccard
  const peerHashtags = new Set<string>();
  for (const video of peerVideos) {
    video.hashtags.forEach(tag => peerHashtags.add(tag.toLowerCase()));
  }

  const hashtagNovelty = 1 - jaccardSimilarity(creatorHashtags, peerHashtags);

  // Compute content-based novelty using MinHash on shingles
  const creatorShingles = new Set<string>();
  for (const content of creatorContent) {
    const shingles = generateShingles(content, 3);
    shingles.forEach(s => creatorShingles.add(s));
  }

  const peerShingles = new Set<string>();
  for (const video of peerVideos) {
    const content = `${video.title} ${video.description || ''}`;
    const shingles = generateShingles(content, 3);
    shingles.forEach(s => peerShingles.add(s));
  }

  // Use MinHash to estimate Jaccard similarity (more efficient for large sets)
  const creatorSig = minHash(creatorShingles, 100);
  const peerSig = minHash(peerShingles, 100);
  const contentSimilarity = minHashSimilarity(creatorSig, peerSig);
  const contentNovelty = 1 - contentSimilarity;

  // Combine hashtag and content novelty
  const noveltyScore = 0.4 * hashtagNovelty + 0.6 * contentNovelty;

  return Math.max(0, Math.min(1, noveltyScore));
}

/**
 * Compute pairwise video similarity for deduplication
 */
export function computeVideoSimilarity(video1: Video, video2: Video): number {
  // Hashtag similarity
  const tags1 = new Set(video1.hashtags.map(t => t.toLowerCase()));
  const tags2 = new Set(video2.hashtags.map(t => t.toLowerCase()));
  const tagSimilarity = jaccardSimilarity(tags1, tags2);

  // Content similarity using shingles
  const content1 = `${video1.title} ${video1.description || ''}`;
  const content2 = `${video2.title} ${video2.description || ''}`;

  const shingles1 = generateShingles(content1, 3);
  const shingles2 = generateShingles(content2, 3);

  const contentSimilarity = jaccardSimilarity(shingles1, shingles2);

  // Combine
  return 0.3 * tagSimilarity + 0.7 * contentSimilarity;
}

/**
 * Deduplicate videos by removing near-duplicates
 * Keeps the video with higher recipe score
 */
export function deduplicateVideos(
  videos: Video[],
  similarityThreshold: number = 0.75
): Video[] {
  const kept = new Set<string>();
  const sorted = [...videos].sort((a, b) =>
    (b.recipeScore || 0) - (a.recipeScore || 0)
  );

  for (const video of sorted) {
    let isDuplicate = false;

    for (const keptId of kept) {
      const keptVideo = sorted.find(v => v.id === keptId);
      if (!keptVideo) continue;

      const similarity = computeVideoSimilarity(video, keptVideo);
      if (similarity >= similarityThreshold) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      kept.add(video.id);
    }
  }

  return videos.filter(v => kept.has(v.id));
}

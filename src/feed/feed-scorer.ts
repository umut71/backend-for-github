/**
 * ADIM 4 — Heuristik feed skorlayıcı (saf fonksiyon, jest ile test edilebilir).
 * Ağırlıklar env üzerinden yapılandırılabilir:
 *   FEED_WATCH_TIME_WEIGHT, FEED_LIKE_WEIGHT, FEED_COMMENT_WEIGHT,
 *   FEED_VIEW_WEIGHT, FEED_RECENCY_WEIGHT, FEED_FOLLOW_BOOST, FEED_SEEN_PENALTY
 */

export interface FeedWeights {
  watchTimeWeight: number;
  likeWeight: number;
  commentWeight: number;
  viewWeight: number;
  recencyWeight: number;
  followBoost: number;
  seenPenalty: number;
}

export const DEFAULT_FEED_WEIGHTS: FeedWeights = {
  watchTimeWeight: 2,
  likeWeight: 3,
  commentWeight: 5,
  viewWeight: 1,
  recencyWeight: 24,
  followBoost: 40,
  seenPenalty: 18,
};

function parseWeight(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadFeedWeightsFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): FeedWeights {
  return {
    watchTimeWeight: parseWeight(
      env.FEED_WATCH_TIME_WEIGHT,
      DEFAULT_FEED_WEIGHTS.watchTimeWeight,
    ),
    likeWeight: parseWeight(env.FEED_LIKE_WEIGHT, DEFAULT_FEED_WEIGHTS.likeWeight),
    commentWeight: parseWeight(
      env.FEED_COMMENT_WEIGHT,
      DEFAULT_FEED_WEIGHTS.commentWeight,
    ),
    viewWeight: parseWeight(env.FEED_VIEW_WEIGHT, DEFAULT_FEED_WEIGHTS.viewWeight),
    recencyWeight: parseWeight(
      env.FEED_RECENCY_WEIGHT,
      DEFAULT_FEED_WEIGHTS.recencyWeight,
    ),
    followBoost: parseWeight(env.FEED_FOLLOW_BOOST, DEFAULT_FEED_WEIGHTS.followBoost),
    seenPenalty: parseWeight(env.FEED_SEEN_PENALTY, DEFAULT_FEED_WEIGHTS.seenPenalty),
  };
}

export interface ScorableVideo {
  id: string;
  creatorId: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: Date | string;
  /** Ortalama izlenme süresi (saniye) — veri yoksa 0 geç. */
  avgWatchTimeSec?: number;
}

export interface ViewerContext {
  followedCreatorIds: Set<string>;
  seenVideoIds: Set<string>;
}

export const EMPTY_VIEWER_CONTEXT: ViewerContext = {
  followedCreatorIds: new Set<string>(),
  seenVideoIds: new Set<string>(),
};

/**
 * Skor = etkileşim (like/comment/view/watchTime ağırlıklı)
 *      + tazelik (recencyWeight / yaş-saat)
 *      + takip boost'u − görülmüş cezası
 */
export function scoreVideo(
  video: ScorableVideo,
  ctx: ViewerContext = EMPTY_VIEWER_CONTEXT,
  weights: FeedWeights = DEFAULT_FEED_WEIGHTS,
): number {
  const ageHours = Math.max(
    1,
    (Date.now() - new Date(video.createdAt).getTime()) / 36e5,
  );

  const engagement =
    (video.likeCount ?? 0) * weights.likeWeight +
    (video.commentCount ?? 0) * weights.commentWeight +
    (video.viewCount ?? 0) * weights.viewWeight +
    (video.avgWatchTimeSec ?? 0) * weights.watchTimeWeight;

  const freshness = weights.recencyWeight / ageHours;

  const personal =
    (ctx.followedCreatorIds.has(video.creatorId) ? weights.followBoost : 0) -
    (ctx.seenVideoIds.has(video.id) ? weights.seenPenalty : 0);

  return engagement + freshness + personal;
}

/** Videoları skorlarına göre azalan sırada döndürür (stabil). */
export function rankVideos<T extends ScorableVideo>(
  videos: T[],
  ctx: ViewerContext = EMPTY_VIEWER_CONTEXT,
  weights: FeedWeights = DEFAULT_FEED_WEIGHTS,
): T[] {
  return videos
    .map((video, index) => ({ video, index, score: scoreVideo(video, ctx, weights) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.video);
}

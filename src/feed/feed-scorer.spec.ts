import {
  DEFAULT_FEED_WEIGHTS,
  EMPTY_VIEWER_CONTEXT,
  loadFeedWeightsFromEnv,
  rankVideos,
  scoreVideo,
  ScorableVideo,
} from './feed-scorer';

const now = Date.now();

function makeVideo(overrides: Partial<ScorableVideo> = {}): ScorableVideo {
  return {
    id: 'v1',
    creatorId: 'c1',
    likeCount: 0,
    commentCount: 0,
    viewCount: 0,
    createdAt: new Date(now - 36e5), // 1 saat önce
    ...overrides,
  };
}

describe('feed-scorer', () => {
  it('daha çok etkileşim alan video daha yüksek skor alır', () => {
    const low = scoreVideo(makeVideo({ likeCount: 1 }));
    const high = scoreVideo(makeVideo({ likeCount: 100, commentCount: 20 }));
    expect(high).toBeGreaterThan(low);
  });

  it('yeni video eski videoya göre tazelik boost\'u alır', () => {
    const fresh = scoreVideo(makeVideo({ createdAt: new Date(now - 36e5) }));
    const stale = scoreVideo(
      makeVideo({ createdAt: new Date(now - 240 * 36e5) }),
    );
    expect(fresh).toBeGreaterThan(stale);
  });

  it('takip edilen içerik üreticisi followBoost kadar öne çıkar', () => {
    const video = makeVideo();
    const base = scoreVideo(video);
    const boosted = scoreVideo(video, {
      followedCreatorIds: new Set(['c1']),
      seenVideoIds: new Set(),
    });
    expect(boosted - base).toBeCloseTo(DEFAULT_FEED_WEIGHTS.followBoost, 5);
  });

  it('görülmüş video seenPenalty kadar cezalandırılır', () => {
    const video = makeVideo();
    const base = scoreVideo(video);
    const penalized = scoreVideo(video, {
      followedCreatorIds: new Set(),
      seenVideoIds: new Set(['v1']),
    });
    expect(base - penalized).toBeCloseTo(DEFAULT_FEED_WEIGHTS.seenPenalty, 5);
  });

  it('watch time ağırlığı skoru artırır', () => {
    const noWatch = scoreVideo(makeVideo());
    const watched = scoreVideo(makeVideo({ avgWatchTimeSec: 30 }));
    expect(watched - noWatch).toBeCloseTo(
      30 * DEFAULT_FEED_WEIGHTS.watchTimeWeight,
      5,
    );
  });

  it('rankVideos skorlara göre azalan sıralar', () => {
    const videos = [
      makeVideo({ id: 'a', likeCount: 1 }),
      makeVideo({ id: 'b', likeCount: 500 }),
      makeVideo({ id: 'c', likeCount: 50 }),
    ];
    const ranked = rankVideos(videos, EMPTY_VIEWER_CONTEXT);
    expect(ranked.map((v) => v.id)).toEqual(['b', 'c', 'a']);
  });

  it('loadFeedWeightsFromEnv geçerli env değerlerini okur, geçersizde default kullanır', () => {
    const weights = loadFeedWeightsFromEnv({
      FEED_LIKE_WEIGHT: '7',
      FEED_RECENCY_WEIGHT: 'abc',
    } as NodeJS.ProcessEnv);
    expect(weights.likeWeight).toBe(7);
    expect(weights.recencyWeight).toBe(DEFAULT_FEED_WEIGHTS.recencyWeight);
    expect(weights.commentWeight).toBe(DEFAULT_FEED_WEIGHTS.commentWeight);
  });
});

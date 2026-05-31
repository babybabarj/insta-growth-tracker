import type { DailyChecklist, DailyPlan, ReelPerformance, WeeklyReview } from '../types/models'
import { calculateDailyScore, calculateReelMetrics, calculateWeeklyMetrics } from './calculations'

export const getTodayRecommendation = (
  checklist?: DailyChecklist,
  plan?: DailyPlan,
  recentReel?: ReelPerformance,
) => {
  const score = calculateDailyScore(checklist)

  if (!plan) return 'Plan one simple Reel for today so execution has a clear next step.'
  if (!checklist?.reelPosted) return 'Post the primary Reel first. Everything else can stay lightweight today.'
  if (!checklist?.reelSharedToStory) return 'Share the Reel to stories so existing followers get a second chance to see it.'
  if (!checklist?.yesterdayStatsUpdated) return "Update yesterday's Reel stats before planning changes."
  if (score < 70) return 'Make the day easier: finish comments, stats, and one plan for tomorrow.'

  if (recentReel) {
    const metrics = calculateReelMetrics(recentReel)
    if (metrics.shareRate >= 2) return 'Recent share rate is strong. Make another version of that topic.'
    if (metrics.saveRate >= 2) return 'Recent save rate is strong. This may work as a useful carousel later.'
  }

  return 'Good execution. Keep the next Reel close to the same workflow and review results tomorrow.'
}

export const getWeeklyDiagnosis = (review: WeeklyReview, reels: ReelPerformance[]) => {
  const metrics = calculateWeeklyMetrics(review)
  const totalShares = reels.reduce((sum, reel) => sum + reel.shares, 0)
  const totalSaves = reels.reduce((sum, reel) => sum + reel.saves, 0)
  const totalComments = reels.reduce((sum, reel) => sum + reel.comments, 0)
  const avgWatchTime =
    reels.length > 0
      ? reels.reduce((sum, reel) => sum + reel.averageWatchTime, 0) / reels.length
      : 0

  if (review.totalReach >= 1000 && metrics.followersGained <= Math.max(1, review.totalReach * 0.002)) {
    return 'Reach is working, but profile conversion is weak. Improve bio, pinned Reels, cover clarity, and follow CTA.'
  }
  if (totalShares >= Math.max(10, review.totalReach * 0.01)) {
    return 'This topic has share potential. Create 3 more versions next week.'
  }
  if (totalSaves >= Math.max(10, review.totalReach * 0.01)) {
    return 'This content is useful. Convert it into a carousel.'
  }
  if (totalComments >= Math.max(5, review.totalReach * 0.005)) {
    return 'This topic creates conversation. Make comment-reply Reels.'
  }
  if (review.profileVisits >= 50 && metrics.profileVisitConversion < 10) {
    return 'People are curious, but profile is not converting. Check bio, pinned posts, grid clarity, and intro Reel.'
  }
  if (review.totalReach < 500 && avgWatchTime > 0 && avgWatchTime < 3) {
    return 'Hook or opening is weak. Rewrite the first 2 seconds.'
  }
  if (review.totalReach < 500) {
    const hasQualitySignal = reels.some((reel) => {
      const reelMetrics = calculateReelMetrics(reel)
      return reelMetrics.shareRate >= 2 || reelMetrics.saveRate >= 2
    })
    if (hasQualitySignal) {
      return 'Content quality may be good but distribution is low. Remake with stronger hook, cover, and caption.'
    }
  }
  if (metrics.postingConsistencyScore < 50) {
    return 'Consistency is weak. Plan easier Reel formats this week.'
  }

  return 'Review your best Reel, repeat the topic with a sharper hook, and keep tracking manually.'
}

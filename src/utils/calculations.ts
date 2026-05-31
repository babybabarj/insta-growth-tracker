import type { DailyChecklist, ReelPerformance, WeeklyReview } from '../types/models'

export const numberOrZero = (value: unknown) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export const safeDivide = (numerator: number, denominator: number) => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0
  }
  return numerator / denominator
}

export const percent = (numerator: number, denominator: number) =>
  safeDivide(numerator, denominator) * 100

export const formatPercent = (value: number) =>
  `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`

export const formatNumber = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 1 })

export const calculateDailyScore = (checklist?: DailyChecklist) => {
  if (!checklist) return 0
  let score = 0
  const storyCount = [
    checklist.story1Posted,
    checklist.story2Posted,
    checklist.story3Posted,
    checklist.story4Posted,
    checklist.story5Posted,
  ].filter(Boolean).length

  if (checklist.reelPosted) score += 30
  if (storyCount >= 3) score += 20
  if (checklist.commentsReplied) score += 15
  if (checklist.yesterdayStatsUpdated) score += 15
  if (checklist.tomorrowIdeaPlanned) score += 10
  if (checklist.reelSharedToStory) score += 10

  return score
}

export const scoreLabel = (score: number) => {
  if (score <= 39) return 'Weak day'
  if (score <= 69) return 'Okay, but incomplete'
  if (score <= 89) return 'Good day'
  return 'Excellent execution'
}

export const calculateReelMetrics = (reel: ReelPerformance, currentFollowers = 0) => {
  const interactions = reel.likes + reel.comments + reel.saves + reel.shares

  return {
    engagementRate: percent(interactions, reel.reach),
    shareRate: percent(reel.shares, reel.reach),
    saveRate: percent(reel.saves, reel.reach),
    commentRate: percent(reel.comments, reel.reach),
    profileVisitRate: percent(reel.profileVisits, reel.reach),
    followConversionRate: percent(reel.followsGained, reel.reach),
    profileVisitConversion: percent(reel.followsGained, reel.profileVisits),
    followsPerThousandReach: safeDivide(reel.followsGained, reel.reach) * 1000,
    reachPerFollower: safeDivide(reel.reach, currentFollowers),
  }
}

export const calculateWeeklyMetrics = (review: WeeklyReview) => {
  const followersGained = review.endingFollowers - review.startingFollowers
  const consistencyBase = 7
  const reelScore = Math.min(review.reelsPosted / consistencyBase, 1) * 60
  const storyScore = Math.min(review.storiesPosted / 21, 1) * 40

  return {
    followersGained,
    followConversionRate: percent(followersGained, review.totalReach),
    profileVisitConversion: percent(followersGained, review.profileVisits),
    averageReachPerReel: safeDivide(review.totalReach, review.reelsPosted),
    postingConsistencyScore: Math.round(reelScore + storyScore),
  }
}

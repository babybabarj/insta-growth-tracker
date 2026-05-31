import { reelStages } from '../constants/options'
import { nowISO, todayISO } from '../utils/dates'
import { createDailyChecklist, createDailyPlan, createReelPerformance, createStageStats, createWeeklyReview } from './factories'
import { db } from './dexie'

export const loadDemoData = async () => {
  const today = todayISO()
  const plan = {
    ...createDailyPlan(today),
    primaryReelTitle: 'Sleep when baby sleeps is the biggest scam',
    secondReelTitle: 'Advice is not help',
    contentPillar: 'Things Moms Are Tired of Hearing',
    seriesName: 'Mom Rant',
    hook: 'If sleep when baby sleeps annoys you, welcome home.',
    scriptOutline: 'Open with exhausted face, list three things still pending, end with a question.',
    storyFollowUp: 'Ask: what advice are you tired of hearing?',
    plannedPostingTime: '20:30',
    status: 'Planned' as const,
  }
  const checklist = {
    ...createDailyChecklist(today),
    story1Posted: true,
    story2Posted: true,
    commentsReplied: true,
  }
  const reel = {
    ...createReelPerformance(),
    reelTitle: 'Dear relatives, advice is not help',
    datePosted: today,
    timePosted: '20:15',
    contentPillar: 'Dear Relatives',
    seriesName: 'Dear Relatives',
    reelGoal: 'Comments',
    hookType: 'Direct address',
    coverText: 'ADVICE IS NOT HELP',
    views: 4200,
    reach: 3600,
    likes: 210,
    comments: 48,
    saves: 39,
    shares: 92,
    profileVisits: 130,
    followsGained: 24,
    averageWatchTime: 7,
    retentionPercentage: 42,
    decision: 'Scale this format' as const,
    updatedAt: nowISO(),
  }
  const stages = reelStages.map((stage, index) => ({
    ...createStageStats(reel.id, stage),
    reach: [900, 2400, 3600][index],
    views: [1100, 2900, 4200][index],
    likes: [60, 150, 210][index],
    comments: [12, 31, 48][index],
    saves: [8, 26, 39][index],
    shares: [22, 65, 92][index],
    profileVisits: [30, 82, 130][index],
    follows: [5, 15, 24][index],
  }))
  const review = {
    ...createWeeklyReview(),
    weekNumber: 'Demo week',
    startingFollowers: 1200,
    endingFollowers: 1240,
    totalReach: 8200,
    totalViews: 9600,
    profileVisits: 300,
    accountsEngaged: 520,
    reelsPosted: 5,
    storiesPosted: 18,
    bestReel: reel.reelTitle,
    worstReel: 'Cold chai again',
    bestContentPillar: 'Dear Relatives',
    mainLesson: 'Direct hooks create comments.',
    nextWeekFocus: 'Make two more Dear Relatives formats.',
  }

  await db.transaction(
    'rw',
    [db.dailyPlans, db.dailyChecklists, db.reelPerformances, db.reelStageStats, db.weeklyReviews],
    async () => {
      await db.dailyPlans.add(plan)
      await db.dailyChecklists.add(checklist)
      await db.reelPerformances.add(reel)
      await db.reelStageStats.bulkAdd(stages)
      await db.weeklyReviews.add(review)
    },
  )
}

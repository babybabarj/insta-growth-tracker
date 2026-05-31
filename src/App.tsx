import { Children, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import Tesseract from 'tesseract.js'
import { activeDayOptions, ageGroups, appName, captionCategories, captionCtas, carouselStatuses, checklistLabels, collabStatuses, collabTypes, commentEmotions, connectedHandle, contentDifficulties, contentPillars, coverCategories, experimentDecisions, experimentResultStatuses, experimentVariables, genderSplits, hashtagSets, hookCategories, hookLanguages, hookTypes, inspirationStatuses, libraryGoals, planStatuses, postingTimeOptions, privacyReminders, profileDisplayName, reelDecisions, reelGoals, reelStages, remakeTypes, rewardBadges, safeVisuals, searchKeywordOptions, seriesNames, shortAppName, tabs, themeOptions, videoBackgrounds, videoLengths, visualGuideItems } from './constants/options'
import { createBackupPayload, downloadJsonBackup, importBackupPayload, isBackupPayload } from './db/backup'
import { exportAudienceInsightsCsv, exportDailyPlansCsv, exportReelsCsv, exportStoryTrackersCsv, exportWeeklyReviewsCsv } from './db/csv'
import { db } from './db/dexie'
import { loadDemoData } from './db/demo'
import { createAudienceInsight, createBackupMetadata, createCaptionTemplate, createCarouselPlan, createChildPrivacyChecklist, createCollabTracker, createCommentIdea, createContentIdea, createDailyChecklist, createDailyPlan, createExperiment, createGoalTracker, createHashtagSetRecord, createHookItem, createIdeaMap, createInspirationTracker, createMonthlyReview, createOcrImport, createProfileChecklist, createRemakeIdea, createRewardProgress, createReelPerformance, createStageStats, createStreakHistory, createStoryTracker, createWeeklyReview } from './db/factories'
import type { AppSettings, AudienceInsight, BackupMetadata, CaptionTemplate, CarouselPlan, ChildPrivacyChecklist, CollabTracker, CommentIdea, ContentIdea, DailyChecklist, DailyPlan, Experiment, GoalStatus, GoalTracker, HashtagSetRecord, HookItem, IdeaMap, InspirationTracker, MonthlyReview, OcrImport, ProfileChecklist, RemakeIdea, RewardProgress, ReelPerformance, ReelStageStats, StreakHistory, StoryTracker, TabKey, ThemeName, WeeklyReview } from './types/models'
import { calculateDailyScore, calculateReelMetrics, calculateWeeklyMetrics, formatNumber, formatPercent, numberOrZero } from './utils/calculations'
import { formatDate, getWeekRangeLabel, nowISO, todayISO } from './utils/dates'
import { getTodayRecommendation, getWeeklyDiagnosis } from './utils/recommendations'

type ChecklistKey = keyof typeof checklistLabels
type SortKey = 'datePosted' | 'reach' | 'shares' | 'saves' | 'followsGained' | 'followConversionRate'
type LibrarySection = 'ideas' | 'hooks' | 'captions' | 'hashtags' | 'guide'
type MoreSection = 'backup' | 'settings' | 'privacy'
type ReviewSection = 'weekly' | 'monthly' | 'pillars' | 'audience' | 'experiments' | 'remakes' | 'comments' | 'profile' | 'streak'
type OcrFieldStatus = 'Detected' | 'Needs review' | 'Not found'
type OcrDetectedFields = Partial<Pick<ReelPerformance, 'reelTitle' | 'datePosted' | 'views' | 'reach' | 'likes' | 'comments' | 'saves' | 'shares' | 'profileVisits' | 'followsGained' | 'averageWatchTime' | 'nonFollowerReach'>>
type OcrReviewField = { key: keyof OcrDetectedFields; label: string; value: string; status: OcrFieldStatus }
type StoryBooleanKey =
  | 'morningCheckInPosted'
  | 'pollPosted'
  | 'questionStickerPosted'
  | 'miniRantPosted'
  | 'reelReshared'
  | 'dmReplyInteraction'
  | 'nightCheckIn'

interface AppData {
  settings?: AppSettings
  dailyPlans: DailyPlan[]
  dailyChecklists: DailyChecklist[]
  reelPerformances: ReelPerformance[]
  reelStageStats: ReelStageStats[]
  weeklyReviews: WeeklyReview[]
  ocrImports: OcrImport[]
  contentIdeas: ContentIdea[]
  hooks: HookItem[]
  captionTemplates: CaptionTemplate[]
  hashtagSetRecords: HashtagSetRecord[]
  storyTrackers: StoryTracker[]
  carouselPlans: CarouselPlan[]
  monthlyReviews: MonthlyReview[]
  experiments: Experiment[]
  remakeIdeas: RemakeIdea[]
  commentIdeas: CommentIdea[]
  audienceInsights: AudienceInsight[]
  profileChecklists: ProfileChecklist[]
  streakHistory: StreakHistory[]
  rewardProgress: RewardProgress[]
  ideaMaps: IdeaMap[]
  goalTrackers: GoalTracker[]
  collabTrackers: CollabTracker[]
  inspirationTrackers: InspirationTracker[]
  childPrivacyChecklists: ChildPrivacyChecklist[]
  backupMetadata?: BackupMetadata
}

const emptyData: AppData = {
  settings: undefined,
  dailyPlans: [],
  dailyChecklists: [],
  reelPerformances: [],
  reelStageStats: [],
  weeklyReviews: [],
  ocrImports: [],
  contentIdeas: [],
  hooks: [],
  captionTemplates: [],
  hashtagSetRecords: [],
  storyTrackers: [],
  carouselPlans: [],
  monthlyReviews: [],
  experiments: [],
  remakeIdeas: [],
  commentIdeas: [],
  audienceInsights: [],
  profileChecklists: [],
  streakHistory: [],
  rewardProgress: [],
  ideaMaps: [],
  goalTrackers: [],
  collabTrackers: [],
  inspirationTrackers: [],
  childPrivacyChecklists: [],
  backupMetadata: undefined,
}

const createDefaultSettings = (lastOpenedTab: TabKey = 'today'): AppSettings => ({
  id: 'default',
  theme: 'minimal-pink',
  lastOpenedTab,
  appName,
  shortAppName,
  connectedHandle,
  profileDisplayName,
  updatedAt: nowISO(),
})

const defaultStageStats = (reelId: string) => reelStages.map((stage) => createStageStats(reelId, stage))

const starterIdeas = [
  ['Sleep when baby sleeps is the biggest scam', 'If sleep when baby sleeps annoys you, welcome home.', 'Things Moms Are Tired of Hearing', 'Face camera', 'Shares'],
  ['Advice is not help', 'Dear relatives, advice is not help.', 'Dear Relatives', 'Face camera', 'Comments'],
  ['Banana meltdown', 'Peak toddler behaviour: asked for banana and cried because banana.', 'Toddler Chaos', 'Toys on floor', 'Shares'],
  ['I miss myself', 'I love my child, but I miss myself.', 'Mom Confessions', 'Bedroom/night light', 'Follows'],
  ['Gentle parenting with relatives', 'Gentle parenting is hard when the whole family is watching.', 'Gentle Parenting Reality', 'Face camera', 'Comments'],
] as const

const starterHooks = [
  'Motherhood beautiful hai... but yaar, koi sach kyun nahi bolta?',
  'Perfect motherhood wale log please scroll kar lo.',
  'This page is for moms who are tired of pretending everything is okay.',
  "Moms don't need more advice. Moms need help.",
  'If sleep when baby sleeps annoys you, welcome home.',
  'Dear relatives, advice is not help.',
  "Indian moms, please tell me I'm not alone.",
  'Motherhood is not just cute baby videos.',
  'Nobody talks about the mental load of moms.',
  'I love my child, but I miss myself.',
  "I'm not angry. I'm overstimulated.",
  'Gentle parenting is hard when the whole family is watching.',
  'Peak toddler behaviour should be studied by scientists.',
  'New moms are tired of hearing this.',
  'Things Indian moms silently tolerate.',
]

const starterCaptions = [
  {
    captionTitle: 'Share caption',
    category: 'Share',
    bestFor: 'Shares',
    captionText:
      "Sleep when baby sleeps? Okay, but who will do everything else?\nNew moms don't need more advice. We need rest, food, and actual help.\nMoms, what's one line you're tired of hearing?\nSend this to someone who still says this.",
  },
  {
    captionTitle: 'Comment caption',
    category: 'Comment',
    bestFor: 'Comments',
    captionText:
      'Dear relatives, advice is not help.\nHelp is holding the baby while mom eats.\nHelp is washing bottles.\nHelp is not judging the messy house.\nAgree or not?',
  },
  {
    captionTitle: 'Emotional caption',
    category: 'Emotional',
    bestFor: 'Saves',
    captionText:
      "I love my child more than anything, but some days motherhood feels heavy.\nIf you're tired but still trying, you're not alone.\nSave this for a hard day.",
  },
] as const

const starterHashtags = [
  ['Indian Mom Life', '#indianmomlife #momlifeindia #motherhoodunfiltered #momrants #relatablemom #newmomlife #toddlermomlife', 'Community'],
  ['Toddler Mom', '#toddlermomlife #toddlerchaos #indianmomlife #momlifeindia #relatablemom #motherhoodunfiltered', 'Shares'],
  ['Postpartum/Emotional', '#postpartumlife #newmomlife #motherhoodunfiltered #momguilt #indianmomlife #relatablemom', 'Trust'],
  ['Gentle Parenting', '#gentleparenting #gentleparentingreality #indianmomlife #toddlermomlife #motherhoodunfiltered #momlifeindia', 'Community'],
] as const

const phase3Topics = [
  'Intro Reel for unfiltered Indian mom life',
  'Things Moms Are Tired of Hearing',
  'Dear Relatives and free advice',
  'Toddler Chaos banana-level meltdown',
  '3 AM Mom Thoughts',
  'Mom Confessions about identity',
  'Gentle Parenting Reality',
  'Mom guilt after shouting',
  'Overstimulation and noise',
  'Mental load no one sees',
  'Useful Mom Saves',
  'Community Question for Indian moms',
  'Comment Reply Reel',
  'Weekly Recap',
  'Profile conversion intro',
]

const getRewardForDay = (streakDay: number) => rewardBadges[(Math.max(streakDay, 1) - 1) % rewardBadges.length]

const countCompletedTasks = (checklist?: DailyChecklist) =>
  checklist ? (Object.keys(checklistLabels) as ChecklistKey[]).filter((key) => Boolean(checklist[key])).length : 0

const buildStreakStats = (history: StreakHistory[], todayScore: number, checklist?: DailyChecklist) => {
  const today = todayISO()
  const byDate = new Map(history.map((item) => [item.date, item]))
  const todayCompleted = todayScore >= 75
  byDate.set(today, {
    ...(byDate.get(today) ?? createStreakHistory(today)),
    date: today,
    score: todayScore,
    completed: todayCompleted,
    tasksCompletedCount: countCompletedTasks(checklist),
    rewardEarned: '',
  })
  const cursor = new Date(`${today}T00:00:00`)
  let currentStreak = 0
  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (!byDate.get(key)?.completed) break
    currentStreak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  const weekItems = Array.from(byDate.values()).filter((item) => {
    const age = (new Date(`${today}T00:00:00`).getTime() - new Date(`${item.date}T00:00:00`).getTime()) / 86_400_000
    return age >= 0 && age < 7
  })
  const completedThisWeek = weekItems.filter((item) => item.completed).length
  const rewardDay = ((currentStreak - 1 + 7) % 7) + 1
  const nextRewardDay = (currentStreak % 7) + 1
  return {
    currentStreak,
    todayCompleted,
    completedThisWeek,
    missedThisWeek: Math.max(7 - completedThisWeek, 0),
    weeklyProgress: completedThisWeek,
    currentReward: todayCompleted ? getRewardForDay(rewardDay) : getRewardForDay(nextRewardDay),
    nextReward: getRewardForDay(nextRewardDay),
    weeklyCompleted: completedThisWeek >= 7,
  }
}

const generateIdeaMapItems = () =>
  Array.from({ length: 90 }, (_, index) => {
    const day = index + 1
    const phase =
      day <= 15 ? 'Foundation and testing' : day <= 30 ? 'Double down on best formats' : day <= 60 ? 'Series building' : 'Scaling'
    const topic = phase3Topics[index % phase3Topics.length]
    const pillar = contentPillars[index % contentPillars.length]
    const series = seriesNames[index % seriesNames.length]
    return {
      ...createIdeaMap(day),
      date: '',
      reelTitle: `Day ${day}: ${topic}`,
      contentPillar: pillar,
      seriesName: series,
      reelGoal: reelGoals[index % reelGoals.length],
      hook:
        day <= 15
          ? `Indian moms, can we talk about ${topic.toLowerCase()}?`
          : day <= 30
            ? `Trying this again because moms related to ${topic.toLowerCase()}.`
            : day <= 60
              ? `Part ${Math.ceil(day / 3)} of ${series}: ${topic}.`
              : `Let's remake this into a stronger ${pillar} Reel.`,
      fullIdea: `A practical ${pillar} Reel about ${topic}, written for @twinklesaysso's mom-life audience.`,
      scriptOutline: `${phase}: show a real mom-life moment, name the feeling, add one relatable Indian context, end with a question.`,
      videoBackground: videoBackgrounds[index % videoBackgrounds.length],
      reelLength: videoLengths[index % videoLengths.length],
      suggestedPostingTime: postingTimeOptions[index % postingTimeOptions.length],
      caption: `Real mom-life note for ${topic}.`,
      captionCTA: captionCtas[index % captionCtas.length],
      hashtagSet: hashtagSets[index % hashtagSets.length],
      searchKeywords: searchKeywordOptions.slice(index % 5, (index % 5) + 4).join(', '),
      coverText: topic.slice(0, 32).toUpperCase(),
      storyFollowUp: 'Ask followers if they have lived this today.',
      secondReelIdea: day % 5 === 0 ? `Hinglish version of Day ${day}` : '',
      notes: phase,
    }
  })

const getAudienceRecommendation = (insight: AudienceInsight) => {
  if (!insight.week) return 'Not enough data yet.'
  if (insight.topAgeGroup === '25-34') return 'Audience likely relates to new mom/toddler mom content. Use practical, emotional, and Hinglish hooks.'
  if (`${insight.topCountry} ${insight.topCity}`.toLowerCase().includes('india')) return 'Use Indian mom references, relatives/free advice topics, Hinglish captions, and night posting tests.'
  if (insight.nonFollowerReach > insight.followerReach * 1.5) return 'Discovery is working. Improve profile conversion and follow CTA.'
  if (insight.followerReach > insight.nonFollowerReach * 1.5) return 'Existing audience is engaging, but discovery is weak. Make more shareable Reels.'
  return 'Keep tracking audience patterns before changing strategy.'
}

const getCommentRecommendation = (comment: CommentIdea, all: CommentIdea[]) => {
  const sameTopic = all.filter((item) => item.topic && item.topic.toLowerCase() === comment.topic.toLowerCase()).length
  if (sameTopic >= 2) return 'This is a strong audience pain point. Make a Reel on it.'
  if (comment.emotion === 'Emotional') return 'Turn this into a Mom Confession or 3 AM Mom Thought.'
  if (comment.emotion === 'Controversial') return 'Turn this into a Dear Relatives or Things Moms Are Tired of Hearing Reel.'
  return comment.canBecomeReel ? 'This can become a simple comment-reply Reel.' : 'Reply first, then watch if the topic repeats.'
}

const getThisWeekReels = (reels: ReelPerformance[]) => {
  const now = new Date(`${todayISO()}T00:00:00`)
  return reels.filter((reel) => {
    const age = (now.getTime() - new Date(`${reel.datePosted}T00:00:00`).getTime()) / 86_400_000
    return age >= 0 && age < 7
  })
}

const calculatePillarBalance = (reels: ReelPerformance[]) => {
  const weekReels = getThisWeekReels(reels)
  const rows = contentPillars.map((pillar) => {
    const items = weekReels.filter((reel) => reel.contentPillar === pillar)
    const score = items.reduce((sum, reel) => sum + reel.shares + reel.saves + reel.followsGained, 0)
    return {
      pillar,
      count: items.length,
      percentage: weekReels.length ? (items.length / weekReels.length) * 100 : 0,
      follows: items.reduce((sum, reel) => sum + reel.followsGained, 0),
      shares: items.reduce((sum, reel) => sum + reel.shares, 0),
      saves: items.reduce((sum, reel) => sum + reel.saves, 0),
      score,
    }
  })
  const active = rows.filter((row) => row.count > 0)
  const best = active.sort((a, b) => b.score - a.score)[0]
  const weakest = rows.sort((a, b) => a.count - b.count || a.score - b.score)[0]
  const recommendation = weekReels.length === 0
    ? 'No weekly Reel data yet. Log Reels to calculate pillar balance.'
    : best && weakest && best.pillar !== weakest.pillar
      ? `Double down on ${best.pillar}, then add one ${weakest.pillar} post to keep the week balanced.`
      : 'Keep posting across at least three pillars so one format does not carry the whole week.'
  return { rows, best, weakest, recommendation, total: weekReels.length }
}

const suggestionRules: Record<string, { hooks: string[]; ctas: string[]; keywords: string[]; backgrounds: string[]; hashtagSet: string }> = {
  'Dear Relatives': {
    hooks: ['Dear relatives, advice is not help.', 'Please stop saying this to new moms.'],
    ctas: ['Send this to a mom', 'Tag someone who says this'],
    keywords: ['relatives advice', 'Indian mom life', 'mom rants', 'new mom struggles'],
    backgrounds: ['Face camera', 'Kitchen chaos', 'Text-only Reel'],
    hashtagSet: 'Indian Mom Life',
  },
  'Toddler Chaos': {
    hooks: ['Peak toddler behaviour should be studied.', 'My toddler asked for this and then cried because I gave it.'],
    ctas: ['Comment "same"', 'Share with your mom group'],
    keywords: ['toddler chaos', 'mom life India', 'overstimulated mom'],
    backgrounds: ['Toys on floor', 'Messy room', 'POV acting'],
    hashtagSet: 'Toddler Mom',
  },
  'Mom Confessions': {
    hooks: ['I love my child, but I miss myself.', 'Nobody told me motherhood could feel like this.'],
    ctas: ['Save this for later', 'Tell me your experience'],
    keywords: ['motherhood unfiltered', 'mom guilt', 'postpartum emotions', 'tired mom'],
    backgrounds: ['Bedroom/night light', 'Face camera', 'Voiceover over daily clips'],
    hashtagSet: 'Postpartum',
  },
}

const getPlanSuggestions = (pillar: string, hooks: HookItem[], captions: CaptionTemplate[], hashtagRecords: HashtagSetRecord[]) => {
  const rule = suggestionRules[pillar] ?? {
    hooks: ['Indian moms, please tell me I am not alone.', 'This is your reminder that real mom life is messy.'],
    ctas: ['Follow for real mom life', 'Tell me your experience'],
    keywords: searchKeywordOptions.slice(0, 4),
    backgrounds: videoBackgrounds.slice(0, 3),
    hashtagSet: hashtagSets[0],
  }
  const libraryHooks = hooks.filter((hook) => hook.category === pillar || hook.hookText.toLowerCase().includes(pillar.toLowerCase().split(' ')[0])).map((hook) => hook.hookText)
  const libraryCaptions = captions.filter((caption) => caption.bestFor === 'Shares' || caption.category === 'Share').map((caption) => caption.captionText)
  const matchingHashtag = hashtagRecords.find((set) => set.setName === rule.hashtagSet || set.hashtags.toLowerCase().includes(pillar.toLowerCase().split(' ')[0]))?.setName
  return {
    hooks: Array.from(new Set([...libraryHooks, ...rule.hooks])).slice(0, 5),
    captions: libraryCaptions.slice(0, 3),
    ctas: rule.ctas,
    keywords: rule.keywords,
    backgrounds: rule.backgrounds,
    hashtagSet: matchingHashtag ?? rule.hashtagSet,
  }
}

const planFromIdea = (idea: IdeaMap, hashtagOptions: string[], date = todayISO()): DailyPlan => ({
  ...createDailyPlan(date),
  dayNumber: idea.dayNumber,
  primaryReelTitle: idea.reelTitle,
  secondReelTitle: idea.secondReelIdea,
  contentPillar: idea.contentPillar,
  seriesName: idea.seriesName,
  reelGoal: idea.reelGoal || reelGoals[0],
  hook: idea.hook,
  fullIdea: idea.fullIdea || '',
  scriptOutline: idea.scriptOutline,
  videoBackground: idea.videoBackground,
  videoLength: idea.reelLength,
  captionDraft: idea.caption || '',
  captionCTA: idea.captionCTA,
  hashtagSet: hashtagOptions.includes(idea.hashtagSet) ? idea.hashtagSet : (hashtagOptions[0] ?? hashtagSets[0]),
  searchKeywords: idea.searchKeywords || '',
  coverText: idea.coverText || '',
  storyFollowUp: idea.storyFollowUp,
  plannedPostingTime: idea.suggestedPostingTime || postingTimeOptions[0],
  status: 'Planned',
  notes: idea.notes,
})

const getReelRecommendation = (reel: ReelPerformance, currentFollowers = 0) => {
  const metrics = calculateReelMetrics(reel, currentFollowers)
  if (!reel.views && !reel.reach && !reel.likes && !reel.comments && !reel.saves && !reel.shares && !reel.followsGained) {
    return 'Add Reel stats to get a recommendation.'
  }
  if (reel.shares >= reel.saves && reel.shares >= 5) return 'This Reel is shareable. Make 2 more versions.'
  if (reel.saves >= reel.shares && reel.saves >= 5) return 'This topic is useful. Turn it into a carousel.'
  if (reel.profileVisits >= 10 && reel.followsGained < Math.max(2, reel.profileVisits * 0.08)) return 'Improve follow CTA and profile conversion.'
  if (reel.reach < 1000 && metrics.engagementRate >= 5) return 'Try this idea again with a stronger hook.'
  return reel.decision || 'Keep tracking this format and choose the next action after 24h, 72h, and 7d data.'
}

const parseMetricNumber = (raw: string) => {
  const normalized = raw.replace(/,/g, '').trim().toLowerCase()
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*([km])?/)
  if (!match) return undefined
  const value = Number(match[1])
  if (!Number.isFinite(value)) return undefined
  const suffix = match[2]
  return Math.round(value * (suffix === 'k' ? 1000 : suffix === 'm' ? 1_000_000 : 1))
}

const detectOcrFields = (rawText: string): OcrReviewField[] => {
  const text = rawText.replace(/\r/g, '\n')
  const labels: Array<{ key: keyof OcrDetectedFields; label: string; aliases: string[]; type: 'number' | 'text' | 'date' }> = [
    { key: 'reelTitle', label: 'Reel title', aliases: ['reel title', 'title'], type: 'text' },
    { key: 'datePosted', label: 'Date', aliases: ['date', 'posted'], type: 'date' },
    { key: 'views', label: 'Views / Plays', aliases: ['views', 'plays'], type: 'number' },
    { key: 'reach', label: 'Reach', aliases: ['reach', 'accounts reached'], type: 'number' },
    { key: 'likes', label: 'Likes', aliases: ['likes'], type: 'number' },
    { key: 'comments', label: 'Comments', aliases: ['comments'], type: 'number' },
    { key: 'saves', label: 'Saves', aliases: ['saves'], type: 'number' },
    { key: 'shares', label: 'Shares', aliases: ['shares'], type: 'number' },
    { key: 'profileVisits', label: 'Profile visits', aliases: ['profile visits', 'profile activity'], type: 'number' },
    { key: 'followsGained', label: 'Follows', aliases: ['follows', 'followers'], type: 'number' },
    { key: 'averageWatchTime', label: 'Average watch time', aliases: ['average watch time', 'watch time'], type: 'number' },
    { key: 'nonFollowerReach', label: 'Non-follower reach', aliases: ['non-followers', 'non followers'], type: 'number' },
  ]
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  return labels.map((field) => {
    const line = lines.find((item) => field.aliases.some((alias) => item.toLowerCase().includes(alias)))
    if (!line) return { key: field.key, label: field.label, value: '', status: 'Not found' }
    if (field.type === 'number') {
      const number = parseMetricNumber(line)
      return { key: field.key, label: field.label, value: number === undefined ? '' : String(number), status: number === undefined ? 'Needs review' : 'Detected' }
    }
    if (field.type === 'date') {
      const date = line.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? ''
      return { key: field.key, label: field.label, value: date, status: date ? 'Detected' : 'Needs review' }
    }
    return { key: field.key, label: field.label, value: line.replace(/reel title|title/gi, '').trim(), status: 'Needs review' }
  })
}

const applyOcrFieldsToReel = (base: ReelPerformance, fields: OcrReviewField[], ocr?: OcrImport): ReelPerformance => {
  const next = { ...base }
  fields.forEach((field) => {
    if (!field.value.trim()) return
    if (field.key === 'reelTitle' || field.key === 'datePosted') {
      next[field.key] = field.value
    } else {
      next[field.key] = numberOrZero(field.value) as never
    }
  })
  return {
    ...next,
    ocrImportId: ocr?.id ?? next.ocrImportId,
    ocrRawText: ocr?.rawText ?? next.ocrRawText,
    screenshotFileName: ocr?.fileName ?? next.screenshotFileName,
    notes: [next.notes, ocr?.rawText ? 'Imported from screenshot OCR. Review numbers before posting decisions.' : ''].filter(Boolean).join('\n'),
    updatedAt: nowISO(),
  }
}

const getBackupReminder = (metadata?: BackupMetadata) => {
  if (!metadata?.lastBackupDate) return true
  const daysSinceBackup = (Date.now() - new Date(`${metadata.lastBackupDate}T00:00:00`).getTime()) / 86_400_000
  return daysSinceBackup >= 7 || metadata.entriesSinceLastBackup >= 20
}

const calculateGoal = (goal?: GoalTracker, reviews: WeeklyReview[] = []) => {
  if (!goal) return { remaining: 0, daysRemaining: 0, perDay: 0, perWeek: 0, currentPace: 0, status: 'Not enough data yet.' }
  const remaining = Math.max(goal.ninetyDayFollowerTarget - goal.currentFollowers, 0)
  const daysRemaining = Math.max(Math.ceil((new Date(`${goal.targetEndDate}T00:00:00`).getTime() - Date.now()) / 86_400_000), 0)
  const perDay = daysRemaining > 0 ? remaining / daysRemaining : remaining
  const perWeek = perDay * 7
  const recentGains = reviews.slice(0, 4).map((review) => calculateWeeklyMetrics(review).followersGained)
  const currentPace = recentGains.length > 0 ? recentGains.reduce((sum, gain) => sum + gain, 0) / recentGains.length : 0
  let label: GoalStatus | 'Not enough data yet.' = 'Not enough data yet.'
  if (recentGains.length > 0) {
    if (currentPace >= perWeek) label = 'On track'
    else if (currentPace >= perWeek * 0.75) label = 'Slightly behind'
    else if (currentPace >= perWeek * 0.4) label = 'Behind'
    else label = 'Needs viral breakout'
  }
  return { remaining, daysRemaining, perDay, perWeek, currentPace, status: label }
}

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => (localStorage.getItem('twinkle.lastTab') as TabKey) || 'today')
  const [data, setData] = useState<AppData>(emptyData)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState<string>(() => localStorage.getItem('twinkle.lastSaved') || '')
  const [notice, setNotice] = useState('')
  const [offlineReady, setOfflineReady] = useState(false)

  const refreshData = async () => {
    const [
      settingsRecords,
      dailyPlans,
      dailyChecklists,
      reelPerformances,
      reelStageStats,
      weeklyReviews,
      ocrImports,
      contentIdeas,
      hooks,
      captionTemplates,
      hashtagSetRecords,
      storyTrackers,
      carouselPlans,
      monthlyReviews,
      experiments,
      remakeIdeas,
      commentIdeas,
      audienceInsights,
      profileChecklists,
      streakHistory,
      rewardProgress,
      ideaMaps,
      goalTrackers,
      collabTrackers,
      inspirationTrackers,
      childPrivacyChecklists,
      backupMetadataRecords,
    ] = await Promise.all([
      db.settings.toArray(),
      db.dailyPlans.orderBy('date').reverse().toArray(),
      db.dailyChecklists.orderBy('date').reverse().toArray(),
      db.reelPerformances.orderBy('datePosted').reverse().toArray(),
      db.reelStageStats.toArray(),
      db.weeklyReviews.orderBy('startDate').reverse().toArray(),
      db.ocrImports.toArray(),
      db.contentIdeas.toArray(),
      db.hooks.toArray(),
      db.captionTemplates.toArray(),
      db.hashtagSetRecords.toArray(),
      db.storyTrackers.orderBy('date').reverse().toArray(),
      db.carouselPlans.toArray(),
      db.monthlyReviews.orderBy('month').reverse().toArray(),
      db.experiments.toArray(),
      db.remakeIdeas.toArray(),
      db.commentIdeas.toArray(),
      db.audienceInsights.orderBy('week').reverse().toArray(),
      db.profileChecklists.toArray(),
      db.streakHistory.orderBy('date').reverse().toArray(),
      db.rewardProgress.toArray(),
      db.ideaMaps.orderBy('dayNumber').toArray(),
      db.goalTrackers.toArray(),
      db.collabTrackers.toArray(),
      db.inspirationTrackers.toArray(),
      db.childPrivacyChecklists.orderBy('date').reverse().toArray(),
      db.backupMetadata.toArray(),
    ])
    setData({
      settings: settingsRecords[0],
      dailyPlans,
      dailyChecklists,
      reelPerformances,
      reelStageStats,
      weeklyReviews,
      ocrImports,
      contentIdeas,
      hooks,
      captionTemplates,
      hashtagSetRecords,
      storyTrackers,
      carouselPlans,
      monthlyReviews,
      experiments,
      remakeIdeas,
      commentIdeas,
      audienceInsights,
      profileChecklists,
      streakHistory,
      rewardProgress,
      ideaMaps,
      goalTrackers,
      collabTrackers,
      inspirationTrackers,
      childPrivacyChecklists,
      backupMetadata: backupMetadataRecords[0],
    })
    setIsLoading(false)
  }

  const bumpBackupCounter = async () => {
    const current = (await db.backupMetadata.get('default')) ?? createBackupMetadata()
    await db.backupMetadata.put({
      ...current,
      entriesSinceLastBackup: current.entriesSinceLastBackup + 1,
      updatedAt: nowISO(),
    })
  }

  const markSaved = (message = 'Saved locally', countEntry = true) => {
    const savedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setLastSaved(savedAt)
    setNotice(message)
    localStorage.setItem('twinkle.lastSaved', savedAt)
    if (countEntry) void bumpBackupCounter().then(refreshData)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const saveTodayStreakHistory = async (checklist: DailyChecklist) => {
    const score = calculateDailyScore(checklist)
    const completed = score >= 75
    const existing = await db.streakHistory.where('date').equals(checklist.date).first()
    const currentHistory = existing ?? createStreakHistory(checklist.date)
    const priorCompletedDays = data.streakHistory.filter((item) => item.completed && item.date < checklist.date).length
    const rewardEarned = completed ? getRewardForDay((priorCompletedDays % 7) + 1) : ''
    await db.streakHistory.put({
      ...currentHistory,
      score,
      completed,
      tasksCompletedCount: countCompletedTasks(checklist),
      rewardEarned,
      updatedAt: nowISO(),
    })
    if (completed) {
      const week = getWeekRangeLabel(checklist.date, checklist.date)
      const existingReward = await db.rewardProgress.where('week').equals(week).first()
      await db.rewardProgress.put({
        ...(existingReward ?? createRewardProgress()),
        week,
        points: buildStreakStats(data.streakHistory, score, checklist).weeklyProgress,
        rewardBadge: rewardEarned,
        completed: (priorCompletedDays + 1) % 7 === 0,
        updatedAt: nowISO(),
      })
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  useEffect(() => {
    if (isLoading || data.settings) return
    void db.settings.put(createDefaultSettings(activeTab)).then(refreshData)
  }, [activeTab, data.settings, isLoading])

  useEffect(() => {
    localStorage.setItem('twinkle.lastTab', activeTab)
  }, [activeTab])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then(() => setOfflineReady(true)).catch(() => undefined)
  }, [])

  const today = todayISO()
  const todaysChecklist = data.dailyChecklists.find((item) => item.date === today)
  const todaysPlan = data.dailyPlans.find((item) => item.date === today)
  const latestReview = data.weeklyReviews[0]
  const currentFollowers = latestReview?.endingFollowers ?? 0
  const backupReminder = getBackupReminder(data.backupMetadata)
  const appSettings = data.settings ?? createDefaultSettings(activeTab)
  const dynamicHashtagNames = useMemo(
    () => Array.from(new Set([...hashtagSets, ...data.hashtagSetRecords.map((set) => set.setName).filter(Boolean)])),
    [data.hashtagSetRecords],
  )

  const markBackupDone = async () => {
    const current = data.backupMetadata ?? createBackupMetadata()
    await db.backupMetadata.put({
      ...current,
      lastBackupDate: todayISO(),
      lastReminderDate: todayISO(),
      entriesSinceLastBackup: 0,
      updatedAt: nowISO(),
    })
  }

  const renderTab = () => {
    if (isLoading) return <EmptyState title="Opening your tracker" text="Loading saved local data." />
    if (activeTab === 'today') {
      return (
        <TodayScreen
          checklist={todaysChecklist}
          plan={todaysPlan}
          reels={data.reelPerformances}
          latestReview={latestReview}
          storyTrackers={data.storyTrackers}
          goal={data.goalTrackers[0]}
          streakHistory={data.streakHistory}
          backupMetadata={data.backupMetadata}
          backupReminder={backupReminder}
          onToggleChecklist={async (key) => {
            const base = todaysChecklist ?? createDailyChecklist(today)
            const next = { ...base, [key]: !base[key], updatedAt: nowISO() }
            await db.dailyChecklists.put(next)
            await saveTodayStreakHistory(next)
            await refreshData()
            markSaved('Today checklist saved')
          }}
          onToggleStoryBundle={async () => {
            const base = todaysChecklist ?? createDailyChecklist(today)
            const storyCount = [base.story1Posted, base.story2Posted, base.story3Posted, base.story4Posted, base.story5Posted].filter(Boolean).length
            const next = {
              ...base,
              story1Posted: storyCount < 3,
              story2Posted: storyCount < 3,
              story3Posted: storyCount < 3,
              story4Posted: storyCount >= 3 ? false : base.story4Posted,
              story5Posted: storyCount >= 3 ? false : base.story5Posted,
              updatedAt: nowISO(),
            }
            await db.dailyChecklists.put(next)
            await saveTodayStreakHistory(next)
            await refreshData()
            markSaved('Story checklist saved')
          }}
          onCreatePlan={async () => {
            setActiveTab('plan')
            markSaved('Choose a day from the 90-day plan', false)
          }}
          onOpenPlan={() => setActiveTab('plan')}
        />
      )
    }
    if (activeTab === 'plan') {
      return (
        <PlannerScreen
          plans={data.dailyPlans}
          ideaMaps={data.ideaMaps}
          hooks={data.hooks}
          captions={data.captionTemplates}
          hashtagRecords={data.hashtagSetRecords}
          hashtagOptions={dynamicHashtagNames}
          onSave={markSaved}
          refreshData={refreshData}
        />
      )
    }
    if (activeTab === 'reels') {
      return (
        <ReelsScreen
          reels={data.reelPerformances}
          stageStats={data.reelStageStats}
          remakeIdeas={data.remakeIdeas}
          ocrImports={data.ocrImports}
          currentFollowers={currentFollowers}
          hashtagOptions={dynamicHashtagNames}
          onSave={markSaved}
          refreshData={refreshData}
        />
      )
    }
    if (activeTab === 'review') {
      return (
        <ReviewScreen
          data={data}
          onSave={markSaved}
          refreshData={refreshData}
        />
      )
    }
    if (activeTab === 'library') {
      return (
        <LibraryScreen
          contentIdeas={data.contentIdeas}
          hooks={data.hooks}
          captions={data.captionTemplates}
          ideaMaps={data.ideaMaps}
          hashtagRecords={data.hashtagSetRecords}
          storyTrackers={data.storyTrackers}
          carouselPlans={data.carouselPlans}
          hashtagOptions={dynamicHashtagNames}
          onSave={markSaved}
          refreshData={refreshData}
        />
      )
    }
    return (
        <MoreScreen
        data={data}
        backupReminder={backupReminder}
        onExport={async () => {
          await downloadJsonBackup()
          await markBackupDone()
          await refreshData()
          markSaved('Backup exported', false)
        }}
        onCsvExport={markSaved}
        onImport={async (file, mode) => {
          const text = await file.text()
          const parsed = JSON.parse(text) as unknown
          if (!isBackupPayload(parsed)) throw new Error('This is not an Insta Growth Tracker backup file.')
          if (!window.confirm(`Import backup now using ${mode} mode?`)) return
          await importBackupPayload(parsed, mode)
          await refreshData()
          markSaved('Backup imported', false)
        }}
        onImportText={async (text, mode) => {
          const parsed = JSON.parse(text) as unknown
          if (!isBackupPayload(parsed)) throw new Error('This is not an Insta Growth Tracker backup file.')
          if (!window.confirm(`Import pasted backup now using ${mode} mode?`)) return
          await importBackupPayload(parsed, mode)
          await refreshData()
          markSaved('Backup imported', false)
        }}
        onClear={async () => {
          await Promise.all([
            db.dailyPlans.clear(),
            db.dailyChecklists.clear(),
            db.reelPerformances.clear(),
            db.reelStageStats.clear(),
            db.weeklyReviews.clear(),
            db.ocrImports.clear(),
            db.contentIdeas.clear(),
            db.hooks.clear(),
            db.captionTemplates.clear(),
            db.hashtagSetRecords.clear(),
            db.storyTrackers.clear(),
            db.carouselPlans.clear(),
            db.goalTrackers.clear(),
            db.collabTrackers.clear(),
            db.inspirationTrackers.clear(),
            db.childPrivacyChecklists.clear(),
            db.backupMetadata.clear(),
            db.monthlyReviews.clear(),
            db.experiments.clear(),
            db.remakeIdeas.clear(),
            db.commentIdeas.clear(),
            db.audienceInsights.clear(),
            db.profileChecklists.clear(),
            db.streakHistory.clear(),
            db.rewardProgress.clear(),
            db.ideaMaps.clear(),
          ])
          await refreshData()
          markSaved('All tracker data cleared', false)
        }}
        onDemo={async () => {
          await loadDemoData()
          await refreshData()
          markSaved('Demo data loaded')
        }}
        onBackupLater={async () => {
          const current = data.backupMetadata ?? createBackupMetadata()
          await db.backupMetadata.put({ ...current, lastReminderDate: todayISO(), updatedAt: nowISO() })
          await refreshData()
          markSaved('Backup reminder snoozed', false)
        }}
        onBackupDone={async () => {
          await markBackupDone()
          await refreshData()
          markSaved('Backup marked done', false)
        }}
        settings={appSettings}
        onThemeChange={async (theme) => {
          await db.settings.put({ ...appSettings, theme, updatedAt: nowISO() })
          await refreshData()
          markSaved('Theme updated', false)
        }}
        refreshData={refreshData}
      />
    )
  }

  return (
    <div className={`app-shell theme-${appSettings.theme}`}>
      <header className="app-header">
        <div className="brand-block">
          <span className="brand-accent" aria-hidden="true" />
          <div>
            <p className="eyebrow">{appSettings.connectedHandle ?? connectedHandle} · {appSettings.profileDisplayName ?? profileDisplayName}</p>
            <h1>{appSettings.appName ?? appName}</h1>
          </div>
        </div>
        <div className="save-status" aria-live="polite">
          {offlineReady ? `Offline ready${lastSaved ? ` · ${lastSaved}` : ''}` : lastSaved ? `Last saved ${lastSaved}` : 'Local only'}
        </div>
      </header>

      {notice && <div className="notice">{notice}</div>}

      <main className="main-content">{renderTab()}</main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? 'active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

function TodayScreen({
  checklist,
  plan,
  reels,
  latestReview,
  storyTrackers,
  goal,
  backupMetadata,
  backupReminder,
  streakHistory,
  onToggleChecklist,
  onToggleStoryBundle,
  onCreatePlan,
  onOpenPlan,
}: {
  checklist?: DailyChecklist
  plan?: DailyPlan
  reels: ReelPerformance[]
  latestReview?: WeeklyReview
  storyTrackers: StoryTracker[]
  goal?: GoalTracker
  backupMetadata?: BackupMetadata
  backupReminder: boolean
  streakHistory: StreakHistory[]
  onToggleChecklist: (key: ChecklistKey) => void
  onToggleStoryBundle: () => void
  onCreatePlan: () => void
  onOpenPlan: () => void
}) {
  const score = calculateDailyScore(checklist)
  const storyCount = checklist
    ? [checklist.story1Posted, checklist.story2Posted, checklist.story3Posted, checklist.story4Posted, checklist.story5Posted].filter(Boolean).length
    : 0
  const latestReel = reels[0]
  const recommendation = getTodayRecommendation(checklist, plan, latestReel)
  const followersGained = latestReview ? calculateWeeklyMetrics(latestReview).followersGained : 0
  const bestReel = reels.reduce<ReelPerformance | undefined>((best, reel) => (!best || reel.reach > best.reach ? reel : best), undefined)
  const worstReel = reels.reduce<ReelPerformance | undefined>((worst, reel) => (!worst || reel.reach < worst.reach ? reel : worst), undefined)
  const streakStats = buildStreakStats(streakHistory, score, checklist)
  const goalStatus = calculateGoal(goal, latestReview ? [latestReview] : [])
  const [showDetails, setShowDetails] = useState(false)
  const weeklyMetrics = latestReview ? calculateWeeklyMetrics(latestReview) : undefined
  const todayStatus = score >= 90 ? 'Excellent day' : score >= 75 ? 'Strong day' : score >= 45 ? 'On track' : 'Weak day'
  const todayReward = streakStats.todayCompleted ? streakStats.currentReward : streakStats.nextReward
  const monthlyCheesecakes = Math.min(Math.floor(streakStats.completedThisWeek / 7), 4)
  const rewardPath = [
    ['🍪', 'Cookie'],
    ['🍩', 'Donut'],
    ['🍫', 'Brownie'],
    ['🧁', 'Cupcake'],
    ['🧇', 'Waffle'],
    ['🍦', 'Ice Cream'],
    ['🍰', 'Cheesecake'],
  ] as const
  const pillarCounts = contentPillars
    .map((pillar) => `${pillar}: ${reels.filter((reel) => reel.contentPillar === pillar).length}`)
    .filter((item) => !item.endsWith(': 0'))
    .slice(0, 3)
    .join(' · ') || 'Not enough data'

  return (
    <Screen title="Today" eyebrow={formatDate(todayISO())}>
      <Card>
        <div className="streak-hero">
          <div>
            <p className="eyebrow">Weekly progress {streakStats.weeklyProgress}/7</p>
            <h2>{streakStats.currentStreak} day streak</h2>
            <p className="muted">Today’s reward: {todayReward}</p>
          </div>
          <div className="cheesecake-orb" aria-label="Cheesecake reward">🍰</div>
        </div>
        <div className="reward-path" aria-label="7 day reward path">
          {rewardPath.map(([icon, label], index) => {
            const done = index < streakStats.weeklyProgress
            const finalDone = index === 6 && streakStats.weeklyCompleted
            return (
              <div className={`reward-node ${done ? 'done' : ''} ${finalDone ? 'final' : ''}`} key={label}>
                <span>{icon}</span>
                <small>Day {index + 1}</small>
              </div>
            )
          })}
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min((streakStats.weeklyProgress / 7) * 100, 100)}%` }} /></div>
        {streakStats.weeklyCompleted && (
          <div className="celebration-card">
            <span>✨ 🍰 ✨</span>
            <strong>Congratulations! Weekly streak completed.</strong>
          </div>
        )}
        {score < 75 && (
          <div className="risk-card">
            <strong>Streak at risk</strong>
            <span>Reach 75 by finishing the basics today.</span>
          </div>
        )}
        <div className="monthly-cheesecake">
          <div>
            <p className="eyebrow">Monthly Cheesecake Goal</p>
            <h3>{monthlyCheesecakes}/4 cheesecakes earned this month</h3>
          </div>
          <div className="mini-rewards">
            {Array.from({ length: 4 }, (_, index) => <span className={index < monthlyCheesecakes ? 'earned' : ''} key={index}>🍰</span>)}
          </div>
        </div>
      </Card>

      <Card>
        <div className="section-head">
          <div>
            <p className="eyebrow">Today’s focus</p>
            <h2>{plan?.primaryReelTitle || 'No Reel planned for today.'}</h2>
          </div>
          {plan ? (
            <button className="primary-button" type="button" onClick={onOpenPlan}>
              Open plan
            </button>
          ) : (
            <button className="primary-button" type="button" onClick={onCreatePlan}>
              Choose from 90-day plan
            </button>
          )}
        </div>
        {plan ? (
          <div className="stack">
            <p className="muted">{plan.hook || 'No hook added yet.'}</p>
            <div className="chip-row">
              {plan.dayNumber && <span className="chip">Day {plan.dayNumber}</span>}
              <span className="chip">{plan.contentPillar}</span>
              <span className="chip">{plan.status}</span>
            </div>
            {plan.secondReelTitle && <p><strong>Optional second Reel:</strong> {plan.secondReelTitle}</p>}
          </div>
        ) : (
          <p className="muted">Plan one clear Reel for today.</p>
        )}
      </Card>

      <Card>
        <div className="section-head">
          <div>
            <p className="eyebrow">Execution score</p>
            <h2>{score}/100 · {todayStatus}</h2>
          </div>
          <span className="score-pill">{score}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${score}%` }} />
        </div>
      </Card>

      <Card>
        <h2>Daily checklist</h2>
        <div className="check-grid">
          {(['reelPosted', 'captionAdded', 'hashtagsAdded', 'coverChecked', 'reelSharedToStory'] as ChecklistKey[]).map((key) => (
            <label className="check-row" key={key}>
              <input type="checkbox" checked={Boolean(checklist?.[key])} onChange={() => onToggleChecklist(key)} />
              <span>{checklistLabels[key]}</span>
            </label>
          ))}
          <label className="check-row">
            <input type="checkbox" checked={storyCount >= 3} onChange={onToggleStoryBundle} />
            <span>3+ Stories posted</span>
          </label>
          {(['commentsReplied', 'yesterdayStatsUpdated', 'tomorrowIdeaPlanned'] as ChecklistKey[]).map((key) => (
            <label className="check-row" key={key}>
              <input type="checkbox" checked={Boolean(checklist?.[key])} onChange={() => onToggleChecklist(key)} />
              <span>{key === 'yesterdayStatsUpdated' ? 'Stats updated' : key === 'tomorrowIdeaPlanned' ? 'Tomorrow planned' : checklistLabels[key]}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h2>Weekly snapshot</h2>
        <DashboardGrid>
          <MetricCard label="Followers" value={formatNumber(followersGained)} />
          <MetricCard label="Reach" value={formatNumber(latestReview?.totalReach ?? 0)} />
          <MetricCard label="Profile visits" value={formatNumber(latestReview?.profileVisits ?? 0)} />
          <MetricCard label="Best Reel" value={bestReel?.reelTitle || 'No data'} />
          <MetricCard label="Stories" value={`${storyCount}/5 today`} />
        </DashboardGrid>
      </Card>

      <Card tone="blue">
        <p className="eyebrow">Coach insight</p>
        <h2>{recommendation}</h2>
      </Card>

      <Card>
        <div className="section-head">
          <div>
            <p className="eyebrow">Dashboard details</p>
            <h2>More signals</h2>
          </div>
          <button className="secondary-button" type="button" onClick={() => setShowDetails(!showDetails)}>{showDetails ? 'Hide' : 'Show'}</button>
        </div>
        {showDetails && (
          <div className="stack">
            <DashboardGrid>
              <MetricCard label="Current followers" value={formatNumber(latestReview?.endingFollowers ?? 0)} />
              <MetricCard label="Follow conversion" value={weeklyMetrics ? formatPercent(weeklyMetrics.followConversionRate) : '0%'} />
              <MetricCard label="Worst Reel" value={worstReel?.reelTitle || 'No data'} />
              <MetricCard label="Backup" value={backupReminder ? 'Backup due' : backupMetadata?.lastBackupDate ? 'Backed up' : 'No backup yet'} />
              <MetricCard label="Goal" value={String(goalStatus.status)} />
              <MetricCard label="Missed days" value={String(streakStats.missedThisWeek)} />
            </DashboardGrid>
            <p className="muted">Content pillar balance: {pillarCounts}</p>
            <p className="muted">Story tracker entries: {storyTrackers.length}</p>
            <h2>Pending actions</h2>
            <ActionList
              items={[
                !checklist?.reelPosted && 'Post today\'s Reel',
                storyCount < 3 && 'Post at least 3 stories',
                !checklist?.commentsReplied && 'Reply to comments',
                !checklist?.yesterdayStatsUpdated && "Update yesterday's Reel stats",
                !checklist?.tomorrowIdeaPlanned && "Plan tomorrow's idea",
              ].filter(Boolean) as string[]}
            />
          </div>
        )}
      </Card>
    </Screen>
  )
}

function PlannerScreen({
  plans,
  ideaMaps,
  hooks,
  captions,
  hashtagRecords,
  hashtagOptions,
  onSave,
  refreshData,
}: {
  plans: DailyPlan[]
  ideaMaps: IdeaMap[]
  hooks: HookItem[]
  captions: CaptionTemplate[]
  hashtagRecords: HashtagSetRecord[]
  hashtagOptions: string[]
  onSave: (message?: string) => void
  refreshData: () => Promise<void>
}) {
  const [editing, setEditing] = useState<DailyPlan>(() => createDailyPlan())
  const [editingIdea, setEditingIdea] = useState<IdeaMap>(() => createIdeaMap())
  const [selectedDay, setSelectedDay] = useState(() => ideaMaps[0]?.dayNumber ?? 1)
  const [showIdeaEditor, setShowIdeaEditor] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const filteredPlans = plans.filter((plan) =>
    [plan.primaryReelTitle, plan.hook, plan.notes, plan.contentPillar].some((field) => field.toLowerCase().includes(search.toLowerCase())),
  )
  const selectedIdea = ideaMaps.find((idea) => idea.dayNumber === selectedDay)
  const daySearch = search.toLowerCase()
  const dayOptions = Array.from({ length: 90 }, (_, index) => {
    const dayNumber = index + 1
    const idea = ideaMaps.find((item) => item.dayNumber === dayNumber)
    return { dayNumber, idea }
  }).filter(({ idea, dayNumber }) => {
    const matchesSearch = !daySearch || String(dayNumber).includes(daySearch) || [idea?.reelTitle, idea?.hook, idea?.contentPillar].filter(Boolean).some((field) => String(field).toLowerCase().includes(daySearch))
    const matchesStatus = !statusFilter || idea?.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const savePlan = async (event: FormEvent) => {
    event.preventDefault()
    await db.dailyPlans.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Daily plan saved')
    setEditing(createDailyPlan())
  }

  const deletePlan = async (id: string) => {
    await db.dailyPlans.delete(id)
    await refreshData()
    onSave('Daily plan deleted')
    if (editing.id === id) setEditing(createDailyPlan())
  }

  const saveIdea = async (event: FormEvent) => {
    event.preventDefault()
    await db.ideaMaps.put({ ...editingIdea, updatedAt: nowISO() })
    await refreshData()
    onSave('90-day idea saved')
    setShowIdeaEditor(false)
  }

  const loadMap = async () => {
    if (ideaMaps.length > 0 && !window.confirm('Add another 90-day idea map? Existing ideas will stay.')) return
    await db.ideaMaps.bulkAdd(generateIdeaMapItems())
    await refreshData()
    onSave('90-day idea map loaded')
  }

  const useIdeaForToday = async (idea: IdeaMap) => {
    const today = todayISO()
    const existing = plans.find((plan) => plan.date === today)
    const nextPlan = planFromIdea(idea, hashtagOptions, today)
    if (existing) {
      const choice = window.prompt('A plan already exists for today. Type "replace" to replace it, "keep" to keep both, or "cancel" to stop.', 'replace')?.toLowerCase().trim()
      if (!choice || choice === 'cancel') return
      if (choice === 'replace') {
        await db.dailyPlans.put({ ...nextPlan, id: existing.id, createdAt: existing.createdAt, updatedAt: nowISO() })
      } else if (choice === 'keep') {
        await db.dailyPlans.add({ ...nextPlan, updatedAt: nowISO() })
      } else {
        return
      }
    } else {
      await db.dailyPlans.add({ ...nextPlan, updatedAt: nowISO() })
    }
    await db.ideaMaps.put({ ...idea, status: 'Planned', updatedAt: nowISO() })
    setEditing(nextPlan)
    await refreshData()
    onSave('Today plan filled from 90-day map')
  }

  const updateIdeaStatus = async (idea: IdeaMap, status: IdeaMap['status']) => {
    await db.ideaMaps.put({ ...idea, status, updatedAt: nowISO() })
    const todayPlan = plans.find((plan) => plan.date === todayISO() && plan.dayNumber === idea.dayNumber)
    if (todayPlan) await db.dailyPlans.put({ ...todayPlan, status, updatedAt: nowISO() })
    await refreshData()
    onSave(status === 'Completed' ? 'Day marked completed' : 'Day updated')
  }

  const completePlan = async (plan: DailyPlan) => {
    await db.dailyPlans.put({ ...plan, status: 'Completed', updatedAt: nowISO() })
    const linkedIdea = plan.dayNumber ? ideaMaps.find((idea) => idea.dayNumber === plan.dayNumber) : undefined
    if (linkedIdea) await db.ideaMaps.put({ ...linkedIdea, status: 'Completed', updatedAt: nowISO() })
    await refreshData()
    onSave('Plan marked completed')
  }

  return (
    <Screen title="Plan" eyebrow="Daily planner">
      <Card>
        <div className="section-head">
          <div>
            <p className="eyebrow">Select content day</p>
            <h2>Choose Day 1-90</h2>
          </div>
          <button className="secondary-button" type="button" onClick={loadMap}>Load 90-Day Idea Map</button>
        </div>
        <div className="form-grid compact">
          <Select label="Selected day" value={String(selectedDay)} onChange={(value) => setSelectedDay(numberOrZero(value))} options={Array.from({ length: 90 }, (_, index) => String(index + 1))} getOptionLabel={(value) => `Day ${value}`} />
          <Input label="Search day/title" value={search} onChange={setSearch} />
          <Select label="Filter status" value={statusFilter} onChange={setStatusFilter} options={['', ...planStatuses]} />
        </div>
        <div className="day-picker" aria-label="90-day content picker">
          {dayOptions.map(({ dayNumber, idea }) => (
            <button
              className={`day-tile ${dayNumber === selectedDay ? 'active' : ''} ${idea?.status === 'Completed' || idea?.status === 'Posted' ? 'completed' : ''} ${idea?.status === 'Skipped' ? 'skipped' : ''}`}
              key={dayNumber}
              type="button"
              onClick={() => setSelectedDay(dayNumber)}
            >
              <span>Day {dayNumber}</span>
              <small>{idea?.status ?? 'Empty'}</small>
            </button>
          ))}
        </div>
      </Card>

      {selectedIdea ? (
        <Card>
          <div className="section-head">
            <div>
              <p className="eyebrow">Day {selectedIdea.dayNumber} · {selectedIdea.status}</p>
              <h2>{selectedIdea.reelTitle || 'Untitled idea'}</h2>
            </div>
            <div className="button-cluster">
              <button className="primary-button" type="button" onClick={() => useIdeaForToday(selectedIdea)}>Use this for today</button>
              <button className="secondary-button" type="button" onClick={() => { setEditingIdea(selectedIdea); setShowIdeaEditor(true) }}>Edit idea</button>
            </div>
          </div>
          <div className="idea-preview">
            <p><strong>Pillar:</strong> {selectedIdea.contentPillar}</p>
            <p><strong>Series:</strong> {selectedIdea.seriesName}</p>
            <p><strong>Hook:</strong> {selectedIdea.hook || 'No hook yet.'}</p>
            <p><strong>Idea:</strong> {selectedIdea.fullIdea || selectedIdea.scriptOutline || 'No idea summary yet.'}</p>
            <p><strong>Duration:</strong> {selectedIdea.reelLength}</p>
            <p><strong>Posting:</strong> {selectedIdea.suggestedPostingTime}</p>
            <p><strong>CTA:</strong> {selectedIdea.captionCTA}</p>
            <p><strong>Hashtags:</strong> {selectedIdea.hashtagSet}</p>
            <p><strong>Keywords:</strong> {selectedIdea.searchKeywords || 'Not set'}</p>
            <p><strong>Cover:</strong> {selectedIdea.coverText || 'Not set'}</p>
            <p><strong>Story:</strong> {selectedIdea.storyFollowUp || 'Not set'}</p>
            {selectedIdea.secondReelIdea && <p><strong>Optional second Reel:</strong> {selectedIdea.secondReelIdea}</p>}
          </div>
          <div className="button-cluster">
            <button className="secondary-button" type="button" onClick={() => updateIdeaStatus(selectedIdea, 'Completed')}>Mark completed</button>
            <button className="secondary-button" type="button" onClick={() => updateIdeaStatus(selectedIdea, 'Skipped')}>Skip day</button>
          </div>
        </Card>
      ) : (
        <EmptyState title="No idea for this day yet" text="Load the 90-day idea map or edit this day to add one." />
      )}

      {showIdeaEditor && (
        <details className="form-panel" open>
          <summary>Edit selected 90-day idea</summary>
          <IdeaMapForm idea={editingIdea} setIdea={setEditingIdea} hashtagOptions={hashtagOptions} onSubmit={saveIdea} />
        </details>
      )}

      <details className="form-panel" open>
        <summary>Daily plan fields</summary>
        <PlanForm
          plan={editing}
          setPlan={setEditing}
          onSubmit={savePlan}
          hooks={hooks}
          captions={captions}
          hashtagOptions={hashtagOptions}
          suggestions={getPlanSuggestions(editing.contentPillar, hooks, captions, hashtagRecords)}
        />
      </details>

      <RecordList
        title="Saved plans"
        emptyTitle="No daily plans yet"
        emptyText="Add your first Reel plan above. Data stays on this device."
      >
        {filteredPlans.map((plan) => (
          <Card key={plan.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{formatDate(plan.date)} · {plan.dayNumber ? `Day ${plan.dayNumber}` : 'No day'} · {plan.status}</p>
                <h2>{plan.primaryReelTitle || 'Untitled Reel plan'}</h2>
              </div>
              <div className="button-cluster">
                <button className="secondary-button" type="button" onClick={() => setEditing(plan)}>Edit</button>
                <button className="secondary-button" type="button" onClick={() => completePlan(plan)}>Complete</button>
                <button className="danger-button" type="button" onClick={() => deletePlan(plan.id)}>Delete</button>
              </div>
            </div>
            <div className={`chip-row ${plan.status === 'Completed' ? 'muted-row' : ''}`}>
              <span className="chip">{plan.contentPillar}</span>
              <span className="chip">{plan.status}</span>
            </div>
          </Card>
        ))}
      </RecordList>
    </Screen>
  )
}

function ReelsScreen({
  reels,
  stageStats,
  remakeIdeas,
  ocrImports,
  currentFollowers,
  hashtagOptions,
  onSave,
  refreshData,
}: {
  reels: ReelPerformance[]
  stageStats: ReelStageStats[]
  remakeIdeas: RemakeIdea[]
  ocrImports: OcrImport[]
  currentFollowers: number
  hashtagOptions: string[]
  onSave: (message?: string) => void
  refreshData: () => Promise<void>
}) {
  const [editing, setEditing] = useState<ReelPerformance>(() => createReelPerformance())
  const [editingStages, setEditingStages] = useState<ReelStageStats[]>(() => defaultStageStats(editing.id))
  const [showOcrImport, setShowOcrImport] = useState(false)
  const [search, setSearch] = useState('')
  const [pillarFilter, setPillarFilter] = useState('')
  const [decisionFilter, setDecisionFilter] = useState('')
  const [goalFilter, setGoalFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('datePosted')

  const filteredReels = useMemo(() => {
    const result = reels.filter((reel) => {
      const pillarOk = !pillarFilter || reel.contentPillar === pillarFilter
      const decisionOk = !decisionFilter || reel.decision === decisionFilter
      const goalOk = !goalFilter || reel.reelGoal === goalFilter
      const dateOk = (!dateFrom || reel.datePosted >= dateFrom) && (!dateTo || reel.datePosted <= dateTo)
      const searchOk = [reel.reelTitle, reel.hookType, reel.notes, reel.contentPillar].some((field) => field.toLowerCase().includes(search.toLowerCase()))
      return pillarOk && decisionOk && goalOk && dateOk && searchOk
    })
    return [...result].sort((a, b) => {
      if (sortKey === 'datePosted') return b.datePosted.localeCompare(a.datePosted)
      if (sortKey === 'followConversionRate') {
        return calculateReelMetrics(b).followConversionRate - calculateReelMetrics(a).followConversionRate
      }
      return b[sortKey] - a[sortKey]
    })
  }, [dateFrom, dateTo, decisionFilter, goalFilter, pillarFilter, reels, search, sortKey])

  const startEdit = (reel: ReelPerformance) => {
    setEditing(reel)
    const existing = reelStages.map((stage) => stageStats.find((stats) => stats.reelId === reel.id && stats.stage === stage) ?? createStageStats(reel.id, stage))
    setEditingStages(existing)
  }

  const resetForm = () => {
    const fresh = createReelPerformance()
    setEditing(fresh)
    setEditingStages(defaultStageStats(fresh.id))
  }

  const saveReel = async (event: FormEvent) => {
    event.preventDefault()
    const nextReel = { ...editing, updatedAt: nowISO() }
    const nextStages = editingStages.map((stats) => ({ ...stats, reelId: editing.id, updatedAt: nowISO() }))
    await db.transaction('rw', db.reelPerformances, db.reelStageStats, async () => {
      await db.reelPerformances.put(nextReel)
      await db.reelStageStats.bulkPut(nextStages)
    })
    await refreshData()
    onSave('Reel performance saved')
    resetForm()
  }

  const deleteReel = async (id: string) => {
    await db.transaction('rw', db.reelPerformances, db.reelStageStats, async () => {
      await db.reelPerformances.delete(id)
      await db.reelStageStats.where('reelId').equals(id).delete()
    })
    await refreshData()
    onSave('Reel deleted')
    if (editing.id === id) resetForm()
  }

  const createRemakeFromReel = async (reel: ReelPerformance) => {
    const metrics = calculateReelMetrics(reel, currentFollowers)
    await db.remakeIdeas.add({
      ...createRemakeIdea(),
      originalReel: reel.reelTitle || 'Untitled Reel',
      originalPerformanceSummary: `Reach ${formatNumber(reel.reach)} · Shares ${formatNumber(reel.shares)} · Saves ${formatNumber(reel.saves)} · Follows ${formatNumber(reel.followsGained)} · Follow conversion ${formatPercent(metrics.followConversionRate)}`,
      whyItWorked: reel.decision || 'Pulled from Reel performance log.',
      newHook: reel.hookType,
      newAngle: reel.contentPillar,
    })
    await refreshData()
    onSave('Remake idea created from Reel')
  }

  const metrics = calculateReelMetrics(editing, currentFollowers)

  return (
    <Screen title="Reels" eyebrow="Performance log">
      <Card tone="blue">
        <div className="section-head">
          <div>
            <h2>Add Reel performance</h2>
            <p className="muted">Add manually or import analytics from a screenshot.</p>
          </div>
          <div className="button-cluster">
            <button className="secondary-button" type="button" onClick={resetForm}>Add manually</button>
            <button className="primary-button" type="button" onClick={() => setShowOcrImport(!showOcrImport)}>Import from screenshot</button>
          </div>
        </div>
      </Card>
      {showOcrImport && (
        <OcrImportPanel
          reels={reels}
          onApplyToCurrent={(ocr, fields) => {
            setEditing(applyOcrFieldsToReel(editing, fields, ocr))
            setShowOcrImport(false)
            onSave('OCR values applied to Reel form')
          }}
          onApplyToExisting={async (reelId, ocr, fields) => {
            const reel = reels.find((item) => item.id === reelId)
            if (!reel) return
            await db.reelPerformances.put(applyOcrFieldsToReel(reel, fields, ocr))
            await db.ocrImports.put({ ...ocr, appliedToReelId: reelId, status: 'Applied', updatedAt: nowISO() })
            await refreshData()
            onSave('OCR values applied to existing Reel')
            setShowOcrImport(false)
          }}
          onCreateReel={async (ocr, fields) => {
            const reel = applyOcrFieldsToReel(createReelPerformance(), fields, ocr)
            const stages = defaultStageStats(reel.id)
            await db.transaction('rw', db.reelPerformances, db.reelStageStats, db.ocrImports, async () => {
              await db.reelPerformances.add(reel)
              await db.reelStageStats.bulkAdd(stages)
              await db.ocrImports.put({ ...ocr, appliedToReelId: reel.id, status: 'Applied', updatedAt: nowISO() })
            })
            await refreshData()
            onSave('Reel created from OCR')
            setShowOcrImport(false)
          }}
          onCancel={() => setShowOcrImport(false)}
        />
      )}
      <Card>
        <ReelForm
          reel={editing}
          setReel={setEditing}
          stages={editingStages}
          setStages={setEditingStages}
          metrics={metrics}
          hashtagOptions={hashtagOptions}
          onSubmit={saveReel}
          onReset={resetForm}
        />
      </Card>

      <Card>
        <div className="form-grid compact">
          <Input label="Search Reels" value={search} onChange={setSearch} />
          <Input label="Date from" type="date" value={dateFrom} onChange={setDateFrom} />
          <Input label="Date to" type="date" value={dateTo} onChange={setDateTo} />
          <Select label="Filter pillar" value={pillarFilter} onChange={setPillarFilter} options={['', ...contentPillars]} />
          <Select label="Filter goal" value={goalFilter} onChange={setGoalFilter} options={['', ...reelGoals]} />
          <Select label="Filter decision" value={decisionFilter} onChange={setDecisionFilter} options={['', ...reelDecisions]} />
          <Select
            label="Sort by"
            value={sortKey}
            onChange={(value) => setSortKey(value as SortKey)}
            options={['datePosted', 'reach', 'shares', 'saves', 'followsGained', 'followConversionRate']}
          />
        </div>
      </Card>

      <RecordList
        title="Saved Reels"
        emptyTitle="No Reel entries yet"
        emptyText="Log a posted Reel above, then add 24h, 72h, and 7-day stats."
      >
        {filteredReels.map((reel) => {
          const reelMetrics = calculateReelMetrics(reel, currentFollowers)
          return (
            <Card key={reel.id}>
              <div className="section-head">
                <div>
                  <p className="eyebrow">{formatDate(reel.datePosted)} · {reel.reelGoal}</p>
                  <h2>{reel.reelTitle || 'Untitled Reel'}</h2>
                  <p className="muted">{reel.decision || 'No decision yet'}</p>
                </div>
                <div className="button-cluster">
                  <button className="secondary-button" type="button" onClick={() => createRemakeFromReel(reel)}>Create Remake Idea</button>
                  <button className="secondary-button" type="button" onClick={() => startEdit(reel)}>Edit</button>
                  <button className="danger-button" type="button" onClick={() => deleteReel(reel.id)}>Delete</button>
                </div>
              </div>
              <DashboardGrid>
                <MetricCard label="Reach" value={formatNumber(reel.reach)} />
                <MetricCard label="Saves" value={formatNumber(reel.saves)} />
                <MetricCard label="Shares" value={formatNumber(reel.shares)} />
                <MetricCard label="Follows" value={formatNumber(reel.followsGained)} />
              </DashboardGrid>
              <div className="inline-insight">
                <p className="eyebrow">Recommendation</p>
                <h2>{getReelRecommendation(reel, currentFollowers)}</h2>
              </div>
              <details>
                <summary>Full details</summary>
                <DashboardGrid>
                  <MetricCard label="Views" value={formatNumber(reel.views)} />
                  <MetricCard label="Likes" value={formatNumber(reel.likes)} />
                  <MetricCard label="Comments" value={formatNumber(reel.comments)} />
                  <MetricCard label="Profile visits" value={formatNumber(reel.profileVisits)} />
                  <MetricCard label="Engagement" value={formatPercent(reelMetrics.engagementRate)} />
                  <MetricCard label="Follow conversion" value={formatPercent(reelMetrics.followConversionRate)} />
                </DashboardGrid>
              </details>
            </Card>
          )
        })}
      </RecordList>
      {remakeIdeas.length > 0 && (
        <Card tone="blue">
          <h2>{remakeIdeas.length} remake ideas saved</h2>
          <p className="muted">Open Review → Remakes to edit, decide, or turn them into future content.</p>
        </Card>
      )}
      {ocrImports.length > 0 && (
        <Card>
          <h2>Screenshot import history</h2>
          <p className="muted">{ocrImports.length} OCR import records saved in local backup data.</p>
        </Card>
      )}
    </Screen>
  )
}

function OcrImportPanel({
  reels,
  onApplyToCurrent,
  onApplyToExisting,
  onCreateReel,
  onCancel,
}: {
  reels: ReelPerformance[]
  onApplyToCurrent: (ocr: OcrImport, fields: OcrReviewField[]) => void
  onApplyToExisting: (reelId: string, ocr: OcrImport, fields: OcrReviewField[]) => Promise<void>
  onCreateReel: (ocr: OcrImport, fields: OcrReviewField[]) => Promise<void>
  onCancel: () => void
}) {
  const [ocr, setOcr] = useState<OcrImport>(() => createOcrImport())
  const [fields, setFields] = useState<OcrReviewField[]>(() => detectOcrFields(''))
  const [selectedReelId, setSelectedReelId] = useState('')
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState('')
  const updateField = (key: keyof OcrDetectedFields, value: string) => {
    setFields(fields.map((field) => (field.key === key ? { ...field, value, status: value.trim() ? 'Detected' : 'Not found' } : field)))
  }
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setIsReading(true)
    const preview = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('Could not read screenshot preview.'))
      reader.readAsDataURL(file)
    })
    try {
      const result = await Tesseract.recognize(file, 'eng')
      const rawText = result.data.text
      const next = { ...createOcrImport(), fileName: file.name, imagePreviewUrl: preview, rawText, detectedFieldsJson: JSON.stringify(detectOcrFields(rawText)), updatedAt: nowISO() }
      await db.ocrImports.add(next)
      setOcr(next)
      setFields(detectOcrFields(rawText))
    } catch (ocrError) {
      setError(ocrError instanceof Error ? ocrError.message : 'OCR failed.')
    } finally {
      setIsReading(false)
    }
  }
  return (
    <Card>
      <div className="section-head">
        <div>
          <p className="eyebrow">Upload analytics screenshot</p>
          <h2>Extracted values review</h2>
          <p className="muted">OCR may not be perfect. Review values before saving.</p>
        </div>
        <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
      </div>
      <label className="secondary-button file-button">
        Upload analytics screenshot
        <input type="file" accept="image/*" onChange={handleFile} />
      </label>
      {isReading && <p className="muted">Reading screenshot locally...</p>}
      {error && <p className="error-text">{error}</p>}
      {ocr.imagePreviewUrl && <img className="ocr-preview" src={ocr.imagePreviewUrl} alt="Uploaded analytics screenshot preview" />}
      {ocr.rawText && (
        <div className="stack">
          <Textarea label="Extracted raw text" value={ocr.rawText} onChange={(value) => setOcr({ ...ocr, rawText: value })} />
          <div className="form-grid compact">
            {fields.map((field) => (
              <label className="field" key={String(field.key)}>
                <span>{field.label} · {field.status}</span>
                <input value={field.value} onChange={(event) => updateField(field.key, event.target.value)} />
              </label>
            ))}
          </div>
        </div>
      )}
      <Select
        label="Apply to existing Reel"
        value={selectedReelId}
        onChange={setSelectedReelId}
        options={['', ...reels.map((reel) => reel.id)]}
        getOptionLabel={(value) => reels.find((reel) => reel.id === value)?.reelTitle || 'Choose existing Reel'}
      />
      <div className="button-cluster">
        <button className="secondary-button" type="button" disabled={!ocr.rawText} onClick={() => onApplyToCurrent(ocr, fields)}>Apply to Reel form</button>
        <button className="secondary-button" type="button" disabled={!ocr.rawText || !selectedReelId} onClick={() => onApplyToExisting(selectedReelId, ocr, fields)}>Apply to existing Reel</button>
        <button className="primary-button" type="button" disabled={!ocr.rawText} onClick={() => onCreateReel(ocr, fields)}>Create new Reel</button>
      </div>
    </Card>
  )
}

function ReviewScreen({ data, onSave, refreshData }: { data: AppData; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [section, setSection] = useState<ReviewSection>('weekly')
  const [editing, setEditing] = useState<WeeklyReview>(() => createWeeklyReview())
  const metrics = calculateWeeklyMetrics(editing)
  const diagnosis = getWeeklyDiagnosis(editing, data.reelPerformances)
  const sections: Array<{ key: ReviewSection; label: string }> = [
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'pillars', label: 'Pillars' },
  ]
  const advancedSections: Array<{ key: ReviewSection; label: string }> = [
    { key: 'audience', label: 'Audience' },
    { key: 'experiments', label: 'Experiments' },
    { key: 'remakes', label: 'Remakes' },
    { key: 'comments', label: 'Comments' },
    { key: 'profile', label: 'Profile' },
    { key: 'streak', label: 'Streak' },
  ]
  const latestReview = data.weeklyReviews[0]
  const latestMetrics = latestReview ? calculateWeeklyMetrics(latestReview) : undefined
  const bestReel = data.reelPerformances.reduce<ReelPerformance | undefined>((best, reel) => (!best || reel.reach > best.reach ? reel : best), undefined)
  const weakArea = latestReview?.worstContentPillar || latestReview?.worstReel || 'Add weekly stats'
  const nextAction = latestReview?.nextWeekFocus || diagnosis

  const saveReview = async (event: FormEvent) => {
    event.preventDefault()
    await db.weeklyReviews.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Weekly review saved')
    setEditing(createWeeklyReview())
  }

  const deleteReview = async (id: string) => {
    await db.weeklyReviews.delete(id)
    await refreshData()
    onSave('Weekly review deleted')
    if (editing.id === id) setEditing(createWeeklyReview())
  }

  return (
    <Screen title="Review" eyebrow="Insights">
      <div className="section-tabs">
        {sections.map((item) => (
          <button key={item.key} type="button" className={section === item.key ? 'active' : ''} onClick={() => setSection(item.key)}>
            {item.label}
          </button>
        ))}
      </div>
      {section === 'weekly' && (
        <div className="stack">
          <DashboardGrid>
            <MetricCard label="Followers gained" value={formatNumber(latestMetrics?.followersGained ?? metrics.followersGained)} />
            <MetricCard label="Total reach" value={formatNumber(latestReview?.totalReach ?? editing.totalReach)} />
            <MetricCard label="Reels posted" value={formatNumber(latestReview?.reelsPosted ?? editing.reelsPosted)} />
            <MetricCard label="Best Reel" value={latestReview?.bestReel || bestReel?.reelTitle || 'No data'} />
            <MetricCard label="Weak area" value={weakArea} />
            <MetricCard label="Next action" value={nextAction} />
          </DashboardGrid>
          <details className="form-panel">
            <summary>Add or edit weekly review</summary>
            <ReviewForm review={editing} setReview={setEditing} onSubmit={saveReview} metrics={metrics} diagnosis={diagnosis} />
          </details>
          <RecordList title="Saved weekly reviews" emptyTitle="No weekly reviews yet" emptyText="Add a weekly review to calculate follower gain, conversion, consistency, and diagnosis.">
            {data.weeklyReviews.map((review) => {
              const reviewMetrics = calculateWeeklyMetrics(review)
              return (
                <Card key={review.id}>
                  <div className="section-head">
                    <div>
                      <p className="eyebrow">{getWeekRangeLabel(review.startDate, review.endDate)}</p>
                      <h2>{review.weekNumber || 'Weekly review'}</h2>
                      <p className="muted">{getWeeklyDiagnosis(review, data.reelPerformances)}</p>
                    </div>
                    <div className="button-cluster">
                      <button className="secondary-button" type="button" onClick={() => setEditing(review)}>Edit</button>
                      <button className="danger-button" type="button" onClick={() => deleteReview(review.id)}>Delete</button>
                    </div>
                  </div>
                  <DashboardGrid>
                    <MetricCard label="Followers gained" value={formatNumber(reviewMetrics.followersGained)} />
                    <MetricCard label="Follow conversion" value={formatPercent(reviewMetrics.followConversionRate)} />
                    <MetricCard label="Avg reach / Reel" value={formatNumber(reviewMetrics.averageReachPerReel)} />
                    <MetricCard label="Consistency" value={`${reviewMetrics.postingConsistencyScore}/100`} />
                  </DashboardGrid>
                </Card>
              )
            })}
          </RecordList>
        </div>
      )}
      {section === 'monthly' && <MonthlyReviewsSection reviews={data.monthlyReviews} onSave={onSave} refreshData={refreshData} />}
      {section === 'pillars' && <PillarBalanceSection reels={data.reelPerformances} />}
      <details className="form-panel" open={advancedSections.some((item) => item.key === section)}>
        <summary>Advanced Review</summary>
        <p className="muted">Advanced tools are optional.</p>
        <div className="section-tabs">
          {advancedSections.map((item) => (
            <button key={item.key} type="button" className={section === item.key ? 'active' : ''} onClick={() => setSection(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
      </details>
      {section === 'audience' && <AudienceInsightsSection insights={data.audienceInsights} onSave={onSave} refreshData={refreshData} />}
      {section === 'experiments' && <ExperimentsSection experiments={data.experiments} onSave={onSave} refreshData={refreshData} />}
      {section === 'remakes' && <RemakeIdeasSection ideas={data.remakeIdeas} reels={data.reelPerformances} onSave={onSave} refreshData={refreshData} />}
      {section === 'comments' && <CommentIdeasSection ideas={data.commentIdeas} onSave={onSave} refreshData={refreshData} />}
      {section === 'profile' && <ProfileChecklistSection checklists={data.profileChecklists} onSave={onSave} refreshData={refreshData} />}
      {section === 'streak' && <StreakHistorySection history={data.streakHistory} rewards={data.rewardProgress} />}
    </Screen>
  )
}

function PillarBalanceSection({ reels }: { reels: ReelPerformance[] }) {
  const balance = calculatePillarBalance(reels)
  const activeRows = balance.rows.filter((row) => row.count > 0)
  if (balance.total === 0) {
    return <EmptyState title="No weekly Reel data yet" text="Add Reel stats to see pillar balance." />
  }
  return (
    <div className="stack">
      <DashboardGrid>
        <MetricCard label="Reels this week" value={formatNumber(balance.total)} />
        <MetricCard label="Best pillar" value={balance.best?.pillar ?? 'No data'} />
        <MetricCard label="Weakest pillar" value={balance.weakest?.pillar ?? 'No data'} />
      </DashboardGrid>
      <Card tone="blue"><h2>{balance.recommendation}</h2></Card>
      <RecordList title="Weekly pillar balance" emptyTitle="No weekly Reel data" emptyText="Add Reel stats to see pillar balance.">
        {activeRows.map((row) => (
          <Card key={row.pillar}>
            <div className="section-head"><div><p className="eyebrow">{formatPercent(row.percentage)} of this week</p><h2>{row.pillar}</h2></div></div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(row.percentage, 100)}%` }} /></div>
            <div className="chip-row">
              <span className="chip">{formatNumber(row.count)} Reels</span>
              <span className="chip">{formatNumber(row.shares)} shares</span>
              <span className="chip">{formatNumber(row.saves)} saves</span>
              <span className="chip">{formatNumber(row.follows)} follows</span>
            </div>
          </Card>
        ))}
      </RecordList>
    </div>
  )
}

function AudienceInsightsSection({ insights, onSave, refreshData }: { insights: AudienceInsight[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<AudienceInsight>(() => createAudienceInsight())
  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.audienceInsights.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Audience insight saved')
    setEditing(createAudienceInsight())
  }
  const remove = async (id: string) => {
    await db.audienceInsights.delete(id)
    await refreshData()
    onSave('Audience insight deleted')
  }
  return (
    <CrudSection title="Audience insights" emptyTitle="No audience insights yet" emptyText="Add weekly audience data manually.">
      <Card><AudienceInsightForm insight={editing} setInsight={setEditing} onSubmit={save} /></Card>
      {insights.map((insight) => (
        <Card key={insight.id}>
          <div className="section-head"><div><p className="eyebrow">{insight.week || 'Unlabeled week'}</p><h2>{insight.topAgeGroup} · {insight.genderSplit}</h2><p className="muted">{getAudienceRecommendation(insight)}</p></div><RowActions onEdit={() => setEditing(insight)} onDelete={() => remove(insight.id)} /></div>
        </Card>
      ))}
    </CrudSection>
  )
}

function ExperimentsSection({ experiments, onSave, refreshData }: { experiments: Experiment[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<Experiment>(() => createExperiment())
  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.experiments.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Experiment saved')
    setEditing(createExperiment())
  }
  const remove = async (id: string) => {
    await db.experiments.delete(id)
    await refreshData()
    onSave('Experiment deleted')
  }
  return (
    <CrudSection title="Experiment tracker" emptyTitle="No experiments yet" emptyText="Add a hook, length, time, cover, CTA, pillar, caption, or hashtag experiment.">
      <Card><ExperimentForm experiment={editing} setExperiment={setEditing} onSubmit={save} /></Card>
      {experiments.map((experiment) => (
        <Card key={experiment.id}><div className="section-head"><div><p className="eyebrow">{experiment.variableTested} · {experiment.decision}</p><h2>{experiment.experimentName || 'Untitled experiment'}</h2><p className="muted">{experiment.hypothesis || experiment.result || 'No notes yet.'}</p></div><RowActions onEdit={() => setEditing(experiment)} onDelete={() => remove(experiment.id)} /></div></Card>
      ))}
    </CrudSection>
  )
}

function RemakeIdeasSection({ ideas, reels, onSave, refreshData }: { ideas: RemakeIdea[]; reels: ReelPerformance[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<RemakeIdea>(() => createRemakeIdea())
  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.remakeIdeas.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Remake idea saved')
    setEditing(createRemakeIdea())
  }
  const remove = async (id: string) => {
    await db.remakeIdeas.delete(id)
    await refreshData()
    onSave('Remake idea deleted')
  }
  return (
    <CrudSection title="Remake tracker" emptyTitle="No remake ideas yet" emptyText="Create one from a Reel or add one manually.">
      <Card><RemakeForm idea={editing} setIdea={setEditing} reels={reels} onSubmit={save} /></Card>
      {ideas.map((idea) => (
        <Card key={idea.id}><div className="section-head"><div><p className="eyebrow">{idea.remakeType} · {idea.status}</p><h2>{idea.originalReel || 'Untitled remake'}</h2><p className="muted">{idea.newHook || idea.originalPerformanceSummary || 'No hook yet.'}</p></div><RowActions onEdit={() => setEditing(idea)} onDelete={() => remove(idea.id)} /></div></Card>
      ))}
    </CrudSection>
  )
}

function CommentIdeasSection({ ideas, onSave, refreshData }: { ideas: CommentIdea[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<CommentIdea>(() => createCommentIdea())
  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.commentIdeas.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Comment idea saved')
    setEditing(createCommentIdea())
  }
  const remove = async (id: string) => {
    await db.commentIdeas.delete(id)
    await refreshData()
    onSave('Comment idea deleted')
  }
  return (
    <CrudSection title="Comment-to-content tracker" emptyTitle="No comment ideas yet" emptyText="Save audience comments that could become Reels.">
      <Card><CommentIdeaForm idea={editing} setIdea={setEditing} onSubmit={save} /></Card>
      {ideas.map((idea) => (
        <Card key={idea.id}><div className="section-head"><div><p className="eyebrow">{idea.emotion} · {idea.canBecomeReel ? 'Can become Reel' : 'Reply first'}</p><h2>{idea.topic || 'Untitled comment idea'}</h2><p className="muted">{getCommentRecommendation(idea, ideas)}</p></div><RowActions onEdit={() => setEditing(idea)} onDelete={() => remove(idea.id)} /></div></Card>
      ))}
    </CrudSection>
  )
}

function ProfileChecklistSection({ checklists, onSave, refreshData }: { checklists: ProfileChecklist[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<ProfileChecklist>(() => checklists[0] ?? createProfileChecklist())
  const score = getProfileScore(editing)
  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.profileChecklists.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Profile checklist saved')
  }
  return (
    <div className="stack">
      <DashboardGrid><MetricCard label="Profile conversion score" value={`${score}/100`} /><MetricCard label="Status" value={score >= 80 ? 'Strong' : score >= 50 ? 'Needs polish' : 'Incomplete'} /></DashboardGrid>
      <Card tone={score >= 75 ? 'blue' : 'danger'}><h2>{score >= 75 ? 'Profile is ready to convert discovery reach into follows.' : 'Add pinned Reels, niche keyword, highlights, and a clear follow CTA.'}</h2></Card>
      <Card><ProfileForm checklist={editing} setChecklist={setEditing} onSubmit={save} /></Card>
    </div>
  )
}

function MonthlyReviewsSection({ reviews, onSave, refreshData }: { reviews: MonthlyReview[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<MonthlyReview>(() => createMonthlyReview())
  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.monthlyReviews.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Monthly review saved')
    setEditing(createMonthlyReview())
  }
  const remove = async (id: string) => {
    await db.monthlyReviews.delete(id)
    await refreshData()
    onSave('Monthly review deleted')
  }
  const latest = reviews[0]
  const latestGain = latest ? latest.endingFollowers - latest.startingFollowers : 0
  return (
    <div className="stack">
      <h2>Monthly reviews</h2>
      <DashboardGrid>
        <MetricCard label="Followers gained" value={formatNumber(latestGain)} />
        <MetricCard label="Total reach" value={formatNumber(latest?.totalReach ?? 0)} />
        <MetricCard label="Reels posted" value={formatNumber(latest?.totalReelsPosted ?? 0)} />
        <MetricCard label="Best pillar" value={latest?.bestPillar || 'No data'} />
        <MetricCard label="Weakest pillar" value={latest?.weakestPillar || 'No data'} />
        <MetricCard label="Next month focus" value={latest?.nextMonthStrategy || 'Add monthly stats'} />
      </DashboardGrid>
      <details className="form-panel">
        <summary>Add or edit monthly review</summary>
        <MonthlyReviewForm review={editing} setReview={setEditing} onSubmit={save} />
      </details>
      {reviews.map((review) => {
        const followerGain = review.endingFollowers - review.startingFollowers
        const avgReach = review.totalReelsPosted > 0 ? review.totalReach / review.totalReelsPosted : 0
        return (
          <Card key={review.id}>
            <div className="section-head"><div><p className="eyebrow">{review.month}</p><h2>{formatNumber(followerGain)} followers gained</h2><p className="muted">{review.nextMonthStrategy || 'No next month strategy yet.'}</p></div><RowActions onEdit={() => setEditing(review)} onDelete={() => remove(review.id)} /></div>
            <DashboardGrid><MetricCard label="Reach" value={formatNumber(review.totalReach)} /><MetricCard label="Avg reach / Reel" value={formatNumber(avgReach)} /><MetricCard label="Best pillar" value={review.bestPillar || 'Not set'} /><MetricCard label="Weakest pillar" value={review.weakestPillar || 'Not set'} /></DashboardGrid>
          </Card>
        )
      })}
      {reviews.length === 0 && <EmptyState title="No monthly reviews yet" text="Add a monthly review to summarize growth and strategy." />}
    </div>
  )
}

function StreakHistorySection({ history, rewards }: { history: StreakHistory[]; rewards: RewardProgress[] }) {
  const stats = buildStreakStats(history, 0)
  return (
    <div className="stack">
      <DashboardGrid>
        <MetricCard label="Current streak" value={`${stats.currentStreak} days`} />
        <MetricCard label="Weekly progress" value={`${stats.weeklyProgress}/7`} />
        <MetricCard label="Next reward" value={stats.nextReward} />
        <MetricCard label="Reward records" value={formatNumber(rewards.length)} />
      </DashboardGrid>
      <RecordList title="Streak history" emptyTitle="No streak history yet" emptyText="Complete at least 75% of the daily checklist to save a streak day.">
        {history.map((item) => (
          <Card key={item.id}><div className="section-head"><div><p className="eyebrow">{formatDate(item.date)} · {item.completed ? 'Completed' : 'Below 75%'}</p><h2>{formatPercent(item.score)} execution score</h2><p className="muted">{item.rewardEarned ? `Reward earned: ${item.rewardEarned}` : 'No reward earned.'}</p></div></div></Card>
        ))}
      </RecordList>
    </div>
  )
}

function LibraryScreen({
  contentIdeas,
  hooks,
  captions,
  ideaMaps,
  hashtagRecords,
  storyTrackers,
  carouselPlans,
  hashtagOptions,
  onSave,
  refreshData,
}: {
  contentIdeas: ContentIdea[]
  hooks: HookItem[]
  captions: CaptionTemplate[]
  ideaMaps: IdeaMap[]
  hashtagRecords: HashtagSetRecord[]
  storyTrackers: StoryTracker[]
  carouselPlans: CarouselPlan[]
  hashtagOptions: string[]
  onSave: (message?: string) => void
  refreshData: () => Promise<void>
}) {
  const [section, setSection] = useState<LibrarySection>('ideas')
  const sections: Array<{ key: LibrarySection; label: string }> = [
    { key: 'ideas', label: 'Idea Map' },
    { key: 'hooks', label: 'Hooks' },
    { key: 'captions', label: 'Captions' },
    { key: 'hashtags', label: 'Hashtags' },
    { key: 'guide', label: 'Guide' },
  ]

  return (
    <Screen title="Library" eyebrow="Content vault">
      <div className="section-tabs">
        {sections.map((item) => (
          <button key={item.key} type="button" className={section === item.key ? 'active' : ''} onClick={() => setSection(item.key)}>
            {item.label}
          </button>
        ))}
      </div>
      {section === 'ideas' && <LibraryIdeaMapSection ideas={ideaMaps} hashtagOptions={hashtagOptions} onSave={onSave} refreshData={refreshData} />}
      {section === 'hooks' && <HooksSection hooks={hooks} onSave={onSave} refreshData={refreshData} />}
      {section === 'captions' && <CaptionsSection captions={captions} onSave={onSave} refreshData={refreshData} />}
      {section === 'hashtags' && <HashtagsSection hashtagRecords={hashtagRecords} onSave={onSave} refreshData={refreshData} />}
      {section === 'guide' && <VisualGuideSection />}
      <details className="form-panel">
        <summary>Advanced Library</summary>
        <div className="stack">
          <details>
            <summary>Manual Content Ideas</summary>
            <ContentIdeasSection ideas={contentIdeas} hashtagOptions={hashtagOptions} onSave={onSave} refreshData={refreshData} />
          </details>
          <details>
            <summary>Stories</summary>
            <StoriesSection trackers={storyTrackers} onSave={onSave} refreshData={refreshData} />
          </details>
          <details>
            <summary>Carousels</summary>
            <CarouselsSection plans={carouselPlans} onSave={onSave} refreshData={refreshData} />
          </details>
        </div>
      </details>
    </Screen>
  )
}

function LibraryIdeaMapSection({ ideas, hashtagOptions, onSave, refreshData }: { ideas: IdeaMap[]; hashtagOptions: string[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<IdeaMap>(() => createIdeaMap())
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const filtered = ideas.filter((idea) => {
    const query = search.toLowerCase()
    return [idea.reelTitle, idea.hook, idea.contentPillar, idea.notes].some((field) => field.toLowerCase().includes(query)) && (!status || idea.status === status)
  })
  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.ideaMaps.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('90-day idea saved')
    setEditing(createIdeaMap())
    setShowForm(false)
  }
  const loadMap = async () => {
    if (ideas.length > 0 && !window.confirm('Add another 90-day idea map? Existing ideas will stay.')) return
    await db.ideaMaps.bulkAdd(generateIdeaMapItems())
    await refreshData()
    onSave('90-day idea map loaded')
  }
  const moveToPlan = async (idea: IdeaMap) => {
    await db.dailyPlans.add(planFromIdea(idea, hashtagOptions, idea.date || todayISO()))
    await db.ideaMaps.put({ ...idea, status: 'Planned', updatedAt: nowISO() })
    await refreshData()
    onSave('Idea moved to Daily Plan')
  }
  return (
    <div className="stack">
      <Card tone="blue">
        <div className="section-head">
          <div><h2>90-Day Idea Map</h2><p className="muted">Search days and move ideas into Plan.</p></div>
          <button className="secondary-button" type="button" onClick={loadMap}>Load 90-Day Idea Map</button>
        </div>
      </Card>
      <Card>
        <div className="form-grid compact">
          <Input label="Search ideas" value={search} onChange={setSearch} />
          <Select label="Filter status" value={status} onChange={setStatus} options={['', ...planStatuses]} />
        </div>
      </Card>
      <RecordList title="Day cards" emptyTitle="No idea map yet" emptyText="Load the 90-day idea map to start.">
        {filtered.map((idea) => (
          <Card key={idea.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">Day {idea.dayNumber} · {idea.contentPillar}</p>
                <h2>{idea.reelTitle || 'Untitled idea'}</h2>
                <div className="chip-row"><span className="chip">{idea.status}</span></div>
              </div>
              <div className="button-cluster">
                <button className="secondary-button" type="button" onClick={() => moveToPlan(idea)}>Move to Plan</button>
                <button className="secondary-button" type="button" onClick={() => { setEditing(idea); setShowForm(true) }}>Edit</button>
              </div>
            </div>
          </Card>
        ))}
      </RecordList>
      <button className="secondary-button" type="button" onClick={() => setShowForm(!showForm)}>Add idea</button>
      {showForm && (
        <details className="form-panel" open>
          <summary>Add or edit idea</summary>
          <IdeaMapForm idea={editing} setIdea={setEditing} hashtagOptions={hashtagOptions} onSubmit={save} />
        </details>
      )}
    </div>
  )
}

function ContentIdeasSection({
  ideas,
  hashtagOptions,
  onSave,
  refreshData,
}: {
  ideas: ContentIdea[]
  hashtagOptions: string[]
  onSave: (message?: string) => void
  refreshData: () => Promise<void>
}) {
  const [editing, setEditing] = useState<ContentIdea>(() => createContentIdea())
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [pillarFilter, setPillarFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [goalFilter, setGoalFilter] = useState('')

  const filtered = ideas.filter((idea) => {
    const query = search.toLowerCase()
    const matchesSearch = [idea.reelTitle, idea.hook, idea.caption, idea.notes].some((field) => field.toLowerCase().includes(query))
    return matchesSearch && (!pillarFilter || idea.contentPillar === pillarFilter) && (!statusFilter || idea.status === statusFilter) && (!goalFilter || idea.expectedGoal === goalFilter)
  })

  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.contentIdeas.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Content idea saved')
    setEditing(createContentIdea())
    setShowForm(false)
  }

  const remove = async (id: string) => {
    await db.contentIdeas.delete(id)
    await refreshData()
    onSave('Content idea deleted')
    if (editing.id === id) setEditing(createContentIdea())
  }

  const convertToPlan = async (idea: ContentIdea) => {
    const plan = {
      ...createDailyPlan(),
      primaryReelTitle: idea.reelTitle,
      contentPillar: idea.contentPillar,
      seriesName: idea.seriesName,
      reelGoal: idea.expectedGoal,
      hook: idea.hook,
      fullIdea: idea.scriptOutline,
      scriptOutline: idea.scriptOutline,
      videoBackground: idea.videoBackground,
      captionDraft: idea.caption,
      captionCTA: idea.cta,
      hashtagSet: idea.hashtagSet,
      searchKeywords: idea.searchKeywords ?? '',
      coverText: idea.coverText ?? '',
      status: 'Planned' as const,
      notes: idea.notes,
    }
    await db.dailyPlans.add(plan)
    await refreshData()
    onSave('Content idea converted to daily plan')
  }

  const loadStarter = async () => {
    const records = starterIdeas.map(([reelTitle, hook, contentPillar, videoBackground, expectedGoal]) => ({
      ...createContentIdea(),
      reelTitle,
      hook,
      contentPillar,
      seriesName:
        contentPillar === 'Toddler Chaos'
          ? 'Peak Toddler Behaviour'
          : contentPillar === 'Mom Confessions'
            ? 'Mom Confession'
            : contentPillar,
      videoBackground,
      expectedGoal,
      searchKeywords: searchKeywordOptions.slice(0, 3).join(', '),
      coverText: reelTitle.slice(0, 28).toUpperCase(),
    }))
    await db.contentIdeas.bulkAdd(records)
    await refreshData()
    onSave('Library starter ideas loaded')
  }

  return (
    <div className="stack">
      <Card tone="blue">
        <div className="section-head">
          <div>
            <h2>Starter ideas</h2>
          </div>
          <button className="secondary-button" type="button" onClick={loadStarter}>Load Library Starter Ideas</button>
        </div>
      </Card>
      <Card>
        <div className="form-grid compact">
          <Input label="Search ideas" value={search} onChange={setSearch} />
          <Select label="Filter pillar" value={pillarFilter} onChange={setPillarFilter} options={['', ...contentPillars]} />
          <Select label="Filter status" value={statusFilter} onChange={setStatusFilter} options={['', ...planStatuses]} />
          <Select label="Filter goal" value={goalFilter} onChange={setGoalFilter} options={['', ...libraryGoals]} />
        </div>
      </Card>
      <RecordList title="Content ideas" emptyTitle="No content ideas yet" emptyText="Add an idea or load starter ideas when you want them.">
        {filtered.map((idea) => (
          <Card key={idea.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{idea.contentPillar} · {idea.status}</p>
                <h2>{idea.reelTitle || 'Untitled idea'}</h2>
                <p className="muted">{idea.hook || 'No hook yet.'}</p>
              </div>
              <div className="button-cluster">
                <button className="secondary-button" type="button" onClick={() => convertToPlan(idea)}>Make plan</button>
                <button className="secondary-button" type="button" onClick={() => { setEditing(idea); setShowForm(true) }}>Edit</button>
                <button className="danger-button" type="button" onClick={() => remove(idea.id)}>Delete</button>
              </div>
            </div>
            <div className="chip-row">
              <span className="chip">{idea.expectedGoal}</span>
              <span className="chip">{idea.difficulty}</span>
              <span className="chip">{idea.videoBackground}</span>
            </div>
          </Card>
        ))}
      </RecordList>
      <button className="secondary-button" type="button" onClick={() => { setEditing(createContentIdea()); setShowForm(!showForm) }}>Add idea</button>
      {showForm && (
        <details className="form-panel" open>
          <summary>Add or edit manual idea</summary>
          <ContentIdeaForm idea={editing} setIdea={setEditing} hashtagOptions={hashtagOptions} onSubmit={save} />
        </details>
      )}
    </div>
  )
}

function HooksSection({ hooks, onSave, refreshData }: { hooks: HookItem[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<HookItem>(() => createHookItem())
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const filtered = hooks.filter((hook) => {
    const query = search.toLowerCase()
    return hook.hookText.toLowerCase().includes(query) && (!category || hook.category === category)
  })

  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.hooks.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Hook saved')
    setEditing(createHookItem())
    setShowForm(false)
  }

  const remove = async (id: string) => {
    await db.hooks.delete(id)
    await refreshData()
    onSave('Hook deleted')
    if (editing.id === id) setEditing(createHookItem())
  }

  const loadStarter = async () => {
    await db.hooks.bulkAdd(starterHooks.map((hookText) => ({ ...createHookItem(), hookText, category: hookText.includes('relatives') ? 'Dear Relatives' : 'Mom Rant', language: hookText.includes('hai') || hookText.includes('yaar') ? 'Hinglish' : 'English' })))
    await refreshData()
    onSave('Starter hooks loaded')
  }

  return (
    <div className="stack">
      <Card tone="blue">
        <div className="section-head">
          <div><h2>Hooks</h2></div>
          <button className="secondary-button" type="button" onClick={loadStarter}>Load Starter Hooks</button>
        </div>
      </Card>
      <Card>
        <div className="form-grid compact">
          <Input label="Search hooks" value={search} onChange={setSearch} />
          <Select label="Filter category" value={category} onChange={setCategory} options={['', ...hookCategories]} />
        </div>
      </Card>
      <RecordList title="Hook bank" emptyTitle="No hooks yet" emptyText="Add hooks manually or load starter hooks.">
        {filtered.map((hook) => (
          <Card key={hook.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{hook.category} · {hook.bestFor} · {hook.language}</p>
                <h2>{hook.hookText || 'Untitled hook'}</h2>
                {hook.notes && <p className="muted">{hook.notes}</p>}
              </div>
              <div className="button-cluster">
                <button className="secondary-button" type="button" onClick={() => { setEditing(hook); setShowForm(true) }}>Edit</button>
                <button className="danger-button" type="button" onClick={() => remove(hook.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </RecordList>
      <button className="secondary-button" type="button" onClick={() => { setEditing(createHookItem()); setShowForm(!showForm) }}>Add hook</button>
      {showForm && <details className="form-panel" open><summary>Add or edit hook</summary><HookForm hook={editing} setHook={setEditing} onSubmit={save} /></details>}
    </div>
  )
}

function CaptionsSection({ captions, onSave, refreshData }: { captions: CaptionTemplate[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<CaptionTemplate>(() => createCaptionTemplate())
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const filtered = captions.filter((caption) => [caption.captionTitle, caption.captionText, caption.notes].some((field) => field.toLowerCase().includes(search.toLowerCase())))

  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.captionTemplates.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Caption template saved')
    setEditing(createCaptionTemplate())
    setShowForm(false)
  }

  const remove = async (id: string) => {
    await db.captionTemplates.delete(id)
    await refreshData()
    onSave('Caption template deleted')
    if (editing.id === id) setEditing(createCaptionTemplate())
  }

  const loadStarter = async () => {
    await db.captionTemplates.bulkAdd(starterCaptions.map((caption) => ({ ...createCaptionTemplate(), ...caption })))
    await refreshData()
    onSave('Starter captions loaded')
  }

  return (
    <div className="stack">
      <Card tone="blue">
        <div className="section-head">
          <div><h2>Captions</h2></div>
          <button className="secondary-button" type="button" onClick={loadStarter}>Load Starter Captions</button>
        </div>
      </Card>
      <Card><Input label="Search captions" value={search} onChange={setSearch} /></Card>
      <RecordList title="Caption bank" emptyTitle="No captions yet" emptyText="Add reusable caption templates here.">
        {filtered.map((caption) => (
          <Card key={caption.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{caption.category} · {caption.bestFor}</p>
                <h2>{caption.captionTitle || 'Untitled caption'}</h2>
                <p className="muted preline">{caption.captionText || 'No caption text.'}</p>
              </div>
              <div className="button-cluster">
                <button className="secondary-button" type="button" onClick={() => { setEditing(caption); setShowForm(true) }}>Edit</button>
                <button className="danger-button" type="button" onClick={() => remove(caption.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </RecordList>
      <button className="secondary-button" type="button" onClick={() => { setEditing(createCaptionTemplate()); setShowForm(!showForm) }}>Add caption</button>
      {showForm && <details className="form-panel" open><summary>Add or edit caption</summary><CaptionForm caption={editing} setCaption={setEditing} onSubmit={save} /></details>}
    </div>
  )
}

function HashtagsSection({ hashtagRecords, onSave, refreshData }: { hashtagRecords: HashtagSetRecord[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<HashtagSetRecord>(() => createHashtagSetRecord())
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const filtered = hashtagRecords.filter((set) => [set.setName, set.hashtags, set.notes].some((field) => field.toLowerCase().includes(search.toLowerCase())))

  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.hashtagSetRecords.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Hashtag set saved')
    setEditing(createHashtagSetRecord())
    setShowForm(false)
  }

  const remove = async (id: string) => {
    await db.hashtagSetRecords.delete(id)
    await refreshData()
    onSave('Hashtag set deleted')
    if (editing.id === id) setEditing(createHashtagSetRecord())
  }

  const loadStarter = async () => {
    await db.hashtagSetRecords.bulkAdd(starterHashtags.map(([setName, hashtags, bestFor]) => ({ ...createHashtagSetRecord(), setName, hashtags, bestFor })))
    await refreshData()
    onSave('Starter hashtag sets loaded')
  }

  return (
    <div className="stack">
      <Card tone="blue">
        <div className="section-head">
          <div><h2>Hashtags</h2></div>
          <button className="secondary-button" type="button" onClick={loadStarter}>Load Starter Hashtags</button>
        </div>
      </Card>
      <Card><Input label="Search hashtags" value={search} onChange={setSearch} /></Card>
      <RecordList title="Hashtag bank" emptyTitle="No custom hashtag sets yet" emptyText="Add hashtag sets here, then select them in Plan and Reels.">
        {filtered.map((set) => (
          <Card key={set.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{set.bestFor}</p>
                <h2>{set.setName || 'Untitled hashtag set'}</h2>
                <p className="muted">{set.hashtags}</p>
              </div>
              <div className="button-cluster">
                <button className="secondary-button" type="button" onClick={() => { setEditing(set); setShowForm(true) }}>Edit</button>
                <button className="danger-button" type="button" onClick={() => remove(set.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </RecordList>
      <button className="secondary-button" type="button" onClick={() => { setEditing(createHashtagSetRecord()); setShowForm(!showForm) }}>Add hashtag set</button>
      {showForm && <details className="form-panel" open><summary>Add or edit hashtag set</summary><HashtagForm hashtagSet={editing} setHashtagSet={setEditing} onSubmit={save} /></details>}
    </div>
  )
}

function StoriesSection({ trackers, onSave, refreshData }: { trackers: StoryTracker[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<StoryTracker>(() => createStoryTracker())
  const [showForm, setShowForm] = useState(false)
  const storyKeys: StoryBooleanKey[] = [
    'morningCheckInPosted',
    'pollPosted',
    'questionStickerPosted',
    'miniRantPosted',
    'reelReshared',
    'dmReplyInteraction',
    'nightCheckIn',
  ]
  const completed = storyKeys.filter((key) => editing[key]).length
  const recent = trackers.filter((tracker) => {
    const ageMs = new Date(todayISO()).getTime() - new Date(tracker.date).getTime()
    return ageMs >= 0 && ageMs <= 6 * 24 * 60 * 60 * 1000
  })
  const weeklyCompleted = recent.reduce((sum, tracker) => sum + storyKeys.filter((key) => tracker[key]).length, 0)
  const weeklyPossible = Math.max(recent.length * storyKeys.length, storyKeys.length)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.storyTrackers.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Story tracker saved')
    setEditing(createStoryTracker())
    setShowForm(false)
  }

  const remove = async (id: string) => {
    await db.storyTrackers.delete(id)
    await refreshData()
    onSave('Story tracker deleted')
    if (editing.id === id) setEditing(createStoryTracker())
  }

  return (
    <div className="stack">
      <DashboardGrid>
        <MetricCard label="Stories completed" value={`${completed}/${storyKeys.length}`} />
        <MetricCard label="Today consistency" value={formatPercent((completed / storyKeys.length) * 100)} />
        <MetricCard label="Weekly completed" value={`${weeklyCompleted}/${weeklyPossible}`} />
        <MetricCard label="Weekly story consistency" value={formatPercent((weeklyCompleted / weeklyPossible) * 100)} />
      </DashboardGrid>
      <RecordList title="Story tracker history" emptyTitle="No story tracking yet" emptyText="Add today's story activity above.">
        {trackers.map((tracker) => (
          <Card key={tracker.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{formatDate(tracker.date)}</p>
                <h2>{storyKeys.filter((key) => tracker[key]).length}/{storyKeys.length} story actions</h2>
                <p className="muted">Views: {formatNumber(tracker.storyViews)} · Replies: {formatNumber(tracker.replies)}</p>
              </div>
              <div className="button-cluster">
                <button className="secondary-button" type="button" onClick={() => { setEditing(tracker); setShowForm(true) }}>Edit</button>
                <button className="danger-button" type="button" onClick={() => remove(tracker.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </RecordList>
      <button className="secondary-button" type="button" onClick={() => { setEditing(createStoryTracker()); setShowForm(!showForm) }}>Add story tracker</button>
      {showForm && <details className="form-panel" open><summary>Add or edit story tracker</summary><StoryForm tracker={editing} setTracker={setEditing} onSubmit={save} completed={completed} /></details>}
    </div>
  )
}

function CarouselsSection({ plans, onSave, refreshData }: { plans: CarouselPlan[]; onSave: (message?: string) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<CarouselPlan>(() => createCarouselPlan())
  const [showForm, setShowForm] = useState(false)

  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.carouselPlans.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Carousel plan saved')
    setEditing(createCarouselPlan())
    setShowForm(false)
  }

  const remove = async (id: string) => {
    await db.carouselPlans.delete(id)
    await refreshData()
    onSave('Carousel plan deleted')
    if (editing.id === id) setEditing(createCarouselPlan())
  }

  return (
    <div className="stack">
      <RecordList title="Carousel plans" emptyTitle="No carousel plans yet" emptyText="Plan useful saveable posts here.">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{plan.status} · {plan.numberOfSlides} slides</p>
                <h2>{plan.carouselTitle || 'Untitled carousel'}</h2>
                <p className="muted">{plan.slide1Hook || plan.topic || 'No hook yet.'}</p>
              </div>
              <div className="button-cluster">
                <button className="secondary-button" type="button" onClick={() => { setEditing(plan); setShowForm(true) }}>Edit</button>
                <button className="danger-button" type="button" onClick={() => remove(plan.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </RecordList>
      <button className="secondary-button" type="button" onClick={() => { setEditing(createCarouselPlan()); setShowForm(!showForm) }}>Add carousel</button>
      {showForm && <details className="form-panel" open><summary>Add or edit carousel</summary><CarouselForm plan={editing} setPlan={setEditing} onSubmit={save} /></details>}
    </div>
  )
}

function VisualGuideSection() {
  return (
    <div className="stack">
      <Card>
        <h2>Visual guide</h2>
        <ActionList items={visualGuideItems} />
      </Card>
      <Card tone="blue">
        <h2>Consistent cover categories</h2>
        <div className="chip-row">{coverCategories.map((item) => <span className="chip" key={item}>{item}</span>)}</div>
      </Card>
      <Card>
        <h2>Safe mom-life visuals</h2>
        <div className="chip-row">{safeVisuals.map((item) => <span className="chip" key={item}>{item}</span>)}</div>
      </Card>
      <Card tone="danger">
        <h2>Child privacy reminders</h2>
        <ActionList items={privacyReminders} />
      </Card>
    </div>
  )
}

function MoreScreen({
  data,
  backupReminder,
  onExport,
  onCsvExport,
  onImport,
  onImportText,
  onClear,
  onDemo,
  onBackupLater,
  onBackupDone,
  settings,
  onThemeChange,
  refreshData,
}: {
  data: AppData
  backupReminder: boolean
  onExport: () => Promise<void>
  onCsvExport: (message?: string, countEntry?: boolean) => void
  onImport: (file: File, mode: 'replace' | 'merge') => Promise<void>
  onImportText: (text: string, mode: 'replace' | 'merge') => Promise<void>
  onClear: () => Promise<void>
  onDemo: () => Promise<void>
  onBackupLater: () => Promise<void>
  onBackupDone: () => Promise<void>
  settings: AppSettings
  onThemeChange: (theme: ThemeName) => Promise<void>
  refreshData: () => Promise<void>
}) {
  const [section, setSection] = useState<MoreSection>('backup')
  const sections: Array<{ key: MoreSection; label: string }> = [
    { key: 'backup', label: 'Backup' },
    { key: 'settings', label: 'Settings' },
    { key: 'privacy', label: 'Privacy' },
  ]

  return (
    <Screen title="More" eyebrow="Settings & backup">
      <div className="section-tabs">
        {sections.map((item) => (
          <button key={item.key} type="button" className={section === item.key ? 'active' : ''} onClick={() => setSection(item.key)}>
            {item.label}
          </button>
        ))}
      </div>
      {section === 'backup' && (
        <BackupTools
          backupMetadata={data.backupMetadata}
          backupReminder={backupReminder}
          onExport={onExport}
          onImport={onImport}
          onImportText={onImportText}
          onBackupLater={onBackupLater}
          onBackupDone={onBackupDone}
        />
      )}
      {section === 'settings' && <SettingsTools settings={settings} onThemeChange={onThemeChange} />}
      {section === 'privacy' && <PrivacyChecklistSection checklists={data.childPrivacyChecklists} plans={data.dailyPlans} ideas={data.contentIdeas} onSave={onCsvExport} refreshData={refreshData} />}
      <AdvancedMoreTools
        data={data}
        onCsvExport={onCsvExport}
        onClear={onClear}
        onDemo={onDemo}
        refreshData={refreshData}
      />
    </Screen>
  )
}

function BackupTools({
  backupMetadata,
  backupReminder,
  onExport,
  onImport,
  onImportText,
  onBackupLater,
  onBackupDone,
}: {
  backupMetadata?: BackupMetadata
  backupReminder: boolean
  onExport: () => Promise<void>
  onImport: (file: File, mode: 'replace' | 'merge') => Promise<void>
  onImportText: (text: string, mode: 'replace' | 'merge') => Promise<void>
  onBackupLater: () => Promise<void>
  onBackupDone: () => Promise<void>
}) {
  const [error, setError] = useState('')
  const [pastedBackup, setPastedBackup] = useState('')
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace')

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    try {
      await onImport(file, importMode)
      event.target.value = ''
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed.')
    }
  }

  const handlePasteImport = async () => {
    setError('')
    try {
      await onImportText(pastedBackup, importMode)
      setPastedBackup('')
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed.')
    }
  }

  return (
    <div className="stack">
      {backupReminder && (
        <Card tone="blue">
          <h2>Backup recommended</h2>
          <div className="button-cluster">
            <button className="primary-button" type="button" onClick={onExport}>Export Backup Now</button>
            <button className="secondary-button" type="button" onClick={onBackupLater}>Remind Me Later</button>
            <button className="secondary-button" type="button" onClick={onBackupDone}>Mark Backup Done</button>
          </div>
        </Card>
      )}
      <Card>
        <h2>Backup</h2>
        <p className="muted">Data is stored locally. Export backups regularly.</p>
        <p className="muted">Last backup: {backupMetadata?.lastBackupDate ? formatDate(backupMetadata.lastBackupDate) : 'No backup yet.'}</p>
        <p className="muted">Backup reminder: {backupReminder ? 'Due now' : 'Up to date'} · Entries since backup: {backupMetadata?.entriesSinceLastBackup ?? 0}</p>
        <div className="button-grid">
          <button className="primary-button" type="button" onClick={onExport}>Export JSON Backup</button>
          <Select label="Import mode" value={importMode} onChange={(value) => setImportMode(value as 'replace' | 'merge')} options={['replace', 'merge']} />
          <label className="secondary-button file-button">
            Import JSON Backup
            <input type="file" accept="application/json" onChange={handleImport} />
          </label>
        </div>
        <details>
          <summary>Paste backup text</summary>
          <Textarea label="Paste JSON Backup" value={pastedBackup} onChange={setPastedBackup} />
          <button className="secondary-button" type="button" disabled={!pastedBackup.trim()} onClick={handlePasteImport}>
            Import pasted backup
          </button>
        </details>
        {error && <p className="error-text">{error}</p>}
      </Card>
    </div>
  )
}

function SettingsTools({ settings, onThemeChange }: { settings: AppSettings; onThemeChange: (theme: ThemeName) => Promise<void> }) {
  return (
    <div className="stack">
      <Card>
        <h2>Settings</h2>
        <Select
          label="Theme"
          value={settings.theme}
          onChange={(value) => onThemeChange(value as ThemeName)}
          options={themeOptions.map((theme) => theme.value)}
          getOptionLabel={(value) => themeOptions.find((theme) => theme.value === value)?.label ?? value}
        />
      </Card>
      <Card>
        <h2>App info</h2>
        <p className="muted">{settings.appName ?? appName}</p>
        <p className="muted">{settings.connectedHandle ?? connectedHandle} · {settings.profileDisplayName ?? profileDisplayName}</p>
      </Card>
      <Card>
        <h2>iPhone install</h2>
        <p className="muted">Open in Safari, tap Share, then Add to Home Screen.</p>
        <p className="muted">Offline ready after first load.</p>
      </Card>
    </div>
  )
}

function AdvancedMoreTools({ data, onCsvExport, onClear, onDemo, refreshData }: { data: AppData; onCsvExport: (message?: string, countEntry?: boolean) => void; onClear: () => Promise<void>; onDemo: () => Promise<void>; refreshData: () => Promise<void> }) {
  const [clearStep, setClearStep] = useState(0)
  const [backupPreview, setBackupPreview] = useState('')
  return (
    <details className="form-panel">
      <summary>Advanced Tools</summary>
      <div className="stack">
        <details>
          <summary>Goals</summary>
          <GoalTrackerSection goals={data.goalTrackers} reviews={data.weeklyReviews} onSave={onCsvExport} refreshData={refreshData} />
        </details>
        <details>
          <summary>Collabs</summary>
          <CollabTrackerSection collabs={data.collabTrackers} onSave={onCsvExport} refreshData={refreshData} />
        </details>
        <details>
          <summary>Inspiration</summary>
          <InspirationTrackerSection inspirations={data.inspirationTrackers} onSave={onCsvExport} refreshData={refreshData} />
        </details>
      <Card tone="blue">
        <h2>Future Option: Instagram API Integration</h2>
        <p className="muted">Optional future feature. Official API setup requires Meta permissions and login flow. Screenshot import/manual entry is safer for now.</p>
      </Card>

      <Card>
        <h2>CSV export</h2>
        <div className="button-grid">
          <button className="secondary-button" type="button" onClick={async () => { await exportReelsCsv(); onCsvExport('Reels CSV exported', false) }}>Export all Reels performance</button>
          <button className="secondary-button" type="button" onClick={async () => { await exportWeeklyReviewsCsv(); onCsvExport('Weekly reviews CSV exported', false) }}>Export weekly reviews</button>
          <button className="secondary-button" type="button" onClick={async () => { await exportDailyPlansCsv(); onCsvExport('Daily plans CSV exported', false) }}>Export daily plans</button>
          <button className="secondary-button" type="button" onClick={async () => { await exportStoryTrackersCsv(); onCsvExport('Story tracker CSV exported', false) }}>Export story tracker</button>
          <button className="secondary-button" type="button" onClick={async () => { await exportAudienceInsightsCsv(); onCsvExport('Audience insights CSV exported', false) }}>Export audience insights</button>
          <button
            className="secondary-button"
            type="button"
            onClick={async () => setBackupPreview(JSON.stringify(await createBackupPayload(), null, 2).slice(0, 800))}
          >
            Preview backup data
          </button>
        </div>
        {backupPreview && <pre className="backup-preview">{backupPreview}</pre>}
      </Card>

      <Card tone="blue">
        <h2>Load demo data</h2>
        <button className="secondary-button" type="button" onClick={onDemo}>Load Demo Data</button>
      </Card>

      <Card tone="danger">
        <h2>Clear all data</h2>
        <p className="muted">This removes local tracker data from this browser.</p>
        {clearStep === 0 && (
          <button className="danger-button" type="button" onClick={() => setClearStep(1)}>Clear data</button>
        )}
        {clearStep === 1 && (
          <div className="button-cluster">
            <button className="danger-button" type="button" onClick={() => setClearStep(2)}>Confirm clear</button>
            <button className="secondary-button" type="button" onClick={() => setClearStep(0)}>Cancel</button>
          </div>
        )}
        {clearStep === 2 && (
          <div className="button-cluster">
            <button
              className="danger-button"
              type="button"
              onClick={async () => {
                await onClear()
                setClearStep(0)
              }}
            >
              Yes, permanently clear
            </button>
            <button className="secondary-button" type="button" onClick={() => setClearStep(0)}>Cancel</button>
          </div>
        )}
      </Card>
      </div>
    </details>
  )
}

function GoalTrackerSection({
  goals,
  reviews,
  onSave,
  refreshData,
}: {
  goals: GoalTracker[]
  reviews: WeeklyReview[]
  onSave: (message?: string, countEntry?: boolean) => void
  refreshData: () => Promise<void>
}) {
  const [editing, setEditing] = useState<GoalTracker>(() => goals[0] ?? createGoalTracker())
  const goalMath = calculateGoal(editing, reviews)
  const guidance =
    goalMath.status === 'Needs viral breakout'
      ? 'This target needs viral breakout. Focus on shareable Reels and conversion.'
      : goalMath.status === 'On track'
        ? 'Pace is improving. Keep repeating winning formats.'
        : goalMath.status === 'Not enough data yet.'
          ? 'Not enough data yet.'
          : 'Keep tracking weekly results and simplify execution.'

  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.goalTrackers.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Goal tracker saved')
  }

  return (
    <div className="stack">
      <DashboardGrid>
        <MetricCard label="Followers remaining" value={formatNumber(goalMath.remaining)} />
        <MetricCard label="Days remaining" value={formatNumber(goalMath.daysRemaining)} />
        <MetricCard label="Required / day" value={formatNumber(goalMath.perDay)} />
        <MetricCard label="Required / week" value={formatNumber(goalMath.perWeek)} />
        <MetricCard label="Current pace" value={formatNumber(goalMath.currentPace)} />
        <MetricCard label="Status" value={String(goalMath.status)} />
      </DashboardGrid>
      <Card tone="blue"><h2>{guidance}</h2></Card>
      <details className="form-panel">
        <summary>Add or edit goal</summary>
        <GoalForm goal={editing} setGoal={setEditing} onSubmit={save} />
      </details>
    </div>
  )
}

function CollabTrackerSection({ collabs, onSave, refreshData }: { collabs: CollabTracker[]; onSave: (message?: string, countEntry?: boolean) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<CollabTracker>(() => createCollabTracker())
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [disclosureFilter, setDisclosureFilter] = useState('')
  const filtered = collabs.filter((collab) =>
    (!statusFilter || collab.status === statusFilter) &&
    (!categoryFilter || collab.category === categoryFilter) &&
    (!typeFilter || collab.collabType === typeFilter) &&
    (!disclosureFilter || String(collab.disclosureRequired) === disclosureFilter),
  )

  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.collabTrackers.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Collab saved')
    setEditing(createCollabTracker())
    setShowForm(false)
  }
  const remove = async (id: string) => {
    if (!window.confirm('Delete this collab record?')) return
    await db.collabTrackers.delete(id)
    await refreshData()
    onSave('Collab deleted')
  }

  return (
    <div className="stack">
      <Card tone="blue"><p className="muted">Use clear disclosure for paid, gifted, sponsored, or promotional work.</p></Card>
      <Card>
        <div className="form-grid compact">
          <Select label="Filter status" value={statusFilter} onChange={setStatusFilter} options={['', ...collabStatuses]} />
          <Input label="Filter category" value={categoryFilter} onChange={setCategoryFilter} />
          <Select label="Filter collab type" value={typeFilter} onChange={setTypeFilter} options={['', ...collabTypes]} />
          <Select label="Disclosure required" value={disclosureFilter} onChange={setDisclosureFilter} options={['', 'true', 'false']} />
        </div>
      </Card>
      <RecordList title="Collab / Brand Tracker" emptyTitle="No collabs tracked yet" emptyText="Add a creator, page, or brand to track outreach.">
        {filtered.map((collab) => (
          <Card key={collab.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{collab.status} · {collab.collabType}</p>
                <h2>{collab.name || 'Untitled collab'}</h2>
                <p className="muted">{collab.collabIdea || collab.resultNotes || 'No notes yet.'}</p>
              </div>
              <div className="button-cluster">
                <button className="secondary-button" type="button" onClick={() => { setEditing(collab); setShowForm(true) }}>Edit</button>
                <button className="danger-button" type="button" onClick={() => remove(collab.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </RecordList>
      <button className="secondary-button" type="button" onClick={() => { setEditing(createCollabTracker()); setShowForm(!showForm) }}>Add collab</button>
      {showForm && <details className="form-panel" open><summary>Add or edit collab</summary><CollabForm collab={editing} setCollab={setEditing} onSubmit={save} /></details>}
    </div>
  )
}

function InspirationTrackerSection({ inspirations, onSave, refreshData }: { inspirations: InspirationTracker[]; onSave: (message?: string, countEntry?: boolean) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<InspirationTracker>(() => createInspirationTracker())
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const filtered = inspirations.filter((item) => !statusFilter || item.status === statusFilter)
  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.inspirationTrackers.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Inspiration saved')
    setEditing(createInspirationTracker())
    setShowForm(false)
  }
  const remove = async (id: string) => {
    if (!window.confirm('Delete this inspiration record?')) return
    await db.inspirationTrackers.delete(id)
    await refreshData()
    onSave('Inspiration deleted')
  }
  return (
    <div className="stack">
      <Card tone="blue"><p className="muted">Learn formats and hooks. Adapt ideas to {profileDisplayName}'s voice.</p></Card>
      <Card><Select label="Filter status" value={statusFilter} onChange={setStatusFilter} options={['', ...inspirationStatuses]} /></Card>
      <RecordList title="Manual Inspiration Tracker" emptyTitle="No inspiration saved yet" emptyText="Manually save ethical inspiration. No scraping or Instagram API is used.">
        {filtered.map((item) => (
          <Card key={item.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{item.status} · {item.niche}</p>
                <h2>{item.creatorPageName || 'Untitled inspiration'}</h2>
                <p className="muted">{item.hookUsed || item.topic || 'No hook saved.'}</p>
              </div>
              <div className="button-cluster">
                <button className="secondary-button" type="button" onClick={() => { setEditing(item); setShowForm(true) }}>Edit</button>
                <button className="danger-button" type="button" onClick={() => remove(item.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </RecordList>
      <button className="secondary-button" type="button" onClick={() => { setEditing(createInspirationTracker()); setShowForm(!showForm) }}>Add inspiration</button>
      {showForm && <details className="form-panel" open><summary>Add or edit inspiration</summary><InspirationForm inspiration={editing} setInspiration={setEditing} onSubmit={save} /></details>}
    </div>
  )
}

function PrivacyChecklistSection({ checklists, plans, ideas, onSave, refreshData }: { checklists: ChildPrivacyChecklist[]; plans: DailyPlan[]; ideas: ContentIdea[]; onSave: (message?: string, countEntry?: boolean) => void; refreshData: () => Promise<void> }) {
  const [editing, setEditing] = useState<ChildPrivacyChecklist>(() => createChildPrivacyChecklist())
  const risky = isPrivacyRisky(editing)
  const save = async (event: FormEvent) => {
    event.preventDefault()
    await db.childPrivacyChecklists.put({ ...editing, updatedAt: nowISO() })
    await refreshData()
    onSave('Privacy checklist saved')
    setEditing(createChildPrivacyChecklist())
  }
  const remove = async (id: string) => {
    if (!window.confirm('Delete this privacy checklist?')) return
    await db.childPrivacyChecklists.delete(id)
    await refreshData()
    onSave('Privacy checklist deleted')
  }
  return (
    <div className="stack">
      <Card><PrivacyForm checklist={editing} setChecklist={setEditing} plans={plans} ideas={ideas} onSubmit={save} /></Card>
      <Card tone={risky ? 'danger' : 'blue'}><h2>{risky ? "Review before posting. Make the content about your motherhood experience, not the child's private moment." : 'Looks safer. Keep the story focused on your experience as a mom.'}</h2></Card>
      <RecordList title="Child Privacy Checklists" emptyTitle="No privacy checklists yet" emptyText="Run a quick safety check before posting sensitive mom-life content.">
        {checklists.map((item) => (
          <Card key={item.id}>
            <div className="section-head">
              <div>
                <p className="eyebrow">{formatDate(item.date)}</p>
                <h2>{isPrivacyRisky(item) ? 'Review before posting' : 'Looks safer'}</h2>
                <p className="muted">{item.saferAlternativeNotes || 'No notes.'}</p>
              </div>
              <div className="button-cluster">
                <button className="secondary-button" type="button" onClick={() => setEditing(item)}>Edit</button>
                <button className="danger-button" type="button" onClick={() => remove(item.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </RecordList>
    </div>
  )
}

const isPrivacyRisky = (item: ChildPrivacyChecklist) =>
  item.childFaceVisible ||
  item.privateLocationVisible ||
  item.schoolHospitalVisible ||
  item.cryingDistressHook ||
  item.bathingChangingContent ||
  item.medicalPrivateInfo ||
  item.embarrassChildLater ||
  item.aboutChildInsteadOfMother

const getProfileScore = (checklist: ProfileChecklist) => {
  const keys: Array<keyof ProfileChecklist> = [
    'bioUpdated',
    'nameFieldHasKeyword',
    'threePinnedReelsSelected',
    'introReelPinned',
    'bestRantReelPinned',
    'bestEmotionalReelPinned',
    'highlightsCreated',
    'gridCoversConsistent',
    'contactCollabVisible',
    'noRandomOffNichePosts',
    'coverStyleConsistent',
    'followCtaVisible',
    'storyHighlightsUpdated',
  ]
  return Math.round((keys.filter((key) => checklist[key]).length / keys.length) * 100)
}

function CrudSection({ title, emptyTitle, emptyText, children }: { title: string; emptyTitle: string; emptyText: string; children: ReactNode }) {
  const childItems = Children.toArray(children)
  const hasRecords = childItems.length > 1
  const [form, ...records] = childItems
  return (
    <div className="stack">
      <h2>{title}</h2>
      <details className="form-panel" open={!hasRecords}>
        <summary>Add or edit</summary>
        {form}
      </details>
      {records}
      {!hasRecords && <EmptyState title={emptyTitle} text={emptyText} />}
    </div>
  )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="button-cluster">
      <button className="secondary-button" type="button" onClick={onEdit}>Edit</button>
      <button className="danger-button" type="button" onClick={onDelete}>Delete</button>
    </div>
  )
}

function IdeaMapForm({ idea, setIdea, hashtagOptions, onSubmit }: { idea: IdeaMap; setIdea: (idea: IdeaMap) => void; hashtagOptions: string[]; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof IdeaMap>(key: K, value: IdeaMap[K]) => setIdea({ ...idea, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input label="Day number" type="number" value={idea.dayNumber} onChange={(value) => setField('dayNumber', Math.max(1, numberOrZero(value)))} />
        <Input label="Date" type="date" value={idea.date} onChange={(value) => setField('date', value)} />
        <Input label="Reel title" value={idea.reelTitle} onChange={(value) => setField('reelTitle', value)} />
        <Select label="Content pillar" value={idea.contentPillar} onChange={(value) => setField('contentPillar', value)} options={contentPillars} />
        <Select label="Series name" value={idea.seriesName} onChange={(value) => setField('seriesName', value)} options={seriesNames} />
        <Select label="Reel goal" value={idea.reelGoal} onChange={(value) => setField('reelGoal', value)} options={reelGoals} />
        <Select label="Video background" value={idea.videoBackground} onChange={(value) => setField('videoBackground', value)} options={videoBackgrounds} />
        <Select label="Reel length" value={idea.reelLength} onChange={(value) => setField('reelLength', value)} options={videoLengths} />
        <Select label="Suggested posting time" value={idea.suggestedPostingTime} onChange={(value) => setField('suggestedPostingTime', value)} options={postingTimeOptions} />
        <Select label="CTA" value={idea.captionCTA} onChange={(value) => setField('captionCTA', value)} options={captionCtas} />
        <Select label="Hashtag set" value={idea.hashtagSet} onChange={(value) => setField('hashtagSet', value)} options={hashtagOptions} />
        <Select label="Status" value={idea.status} onChange={(value) => setField('status', value as IdeaMap['status'])} options={planStatuses} />
      </div>
      <Textarea label="Hook" value={idea.hook} onChange={(value) => setField('hook', value)} />
      <Textarea label="Full idea" value={idea.fullIdea ?? ''} onChange={(value) => setField('fullIdea', value)} />
      <Textarea label="Script outline" value={idea.scriptOutline} onChange={(value) => setField('scriptOutline', value)} />
      <Textarea label="Caption" value={idea.caption ?? ''} onChange={(value) => setField('caption', value)} />
      <Textarea label="Search keywords" value={idea.searchKeywords ?? ''} onChange={(value) => setField('searchKeywords', value)} />
      <Input label="Cover text" value={idea.coverText ?? ''} onChange={(value) => setField('coverText', value)} />
      <Textarea label="Story follow-up" value={idea.storyFollowUp} onChange={(value) => setField('storyFollowUp', value)} />
      <Textarea label="Second Reel idea" value={idea.secondReelIdea} onChange={(value) => setField('secondReelIdea', value)} />
      <Textarea label="Notes" value={idea.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save 90-day idea</button>
    </form>
  )
}

function AudienceInsightForm({ insight, setInsight, onSubmit }: { insight: AudienceInsight; setInsight: (insight: AudienceInsight) => void; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof AudienceInsight>(key: K, value: AudienceInsight[K]) => setInsight({ ...insight, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input label="Week" value={insight.week} onChange={(value) => setField('week', value)} />
        <Select label="Top age group" value={insight.topAgeGroup} onChange={(value) => setField('topAgeGroup', value)} options={ageGroups} />
        <Select label="Second age group" value={insight.secondAgeGroup} onChange={(value) => setField('secondAgeGroup', value)} options={ageGroups} />
        <Select label="Gender split" value={insight.genderSplit} onChange={(value) => setField('genderSplit', value)} options={genderSplits} />
        <Input label="Top city" value={insight.topCity} onChange={(value) => setField('topCity', value)} />
        <Input label="Top country" value={insight.topCountry} onChange={(value) => setField('topCountry', value)} />
        <Select label="Most active day" value={insight.mostActiveDay} onChange={(value) => setField('mostActiveDay', value)} options={['', ...activeDayOptions]} />
        <Select label="Most active time" value={insight.mostActiveTime} onChange={(value) => setField('mostActiveTime', value)} options={['', ...postingTimeOptions]} />
        <Input label="Follower reach" type="number" value={insight.followerReach} onChange={(value) => setField('followerReach', numberOrZero(value))} />
        <Input label="Non-follower reach" type="number" value={insight.nonFollowerReach} onChange={(value) => setField('nonFollowerReach', numberOrZero(value))} />
      </div>
      <Textarea label="Content liked most" value={insight.contentLikedMost} onChange={(value) => setField('contentLikedMost', value)} />
      <Textarea label="Content commented most" value={insight.contentCommentedMost} onChange={(value) => setField('contentCommentedMost', value)} />
      <Textarea label="Content shared most" value={insight.contentSharedMost} onChange={(value) => setField('contentSharedMost', value)} />
      <Textarea label="Notes" value={insight.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save audience insight</button>
    </form>
  )
}

function ExperimentForm({ experiment, setExperiment, onSubmit }: { experiment: Experiment; setExperiment: (experiment: Experiment) => void; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof Experiment>(key: K, value: Experiment[K]) => setExperiment({ ...experiment, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input label="Experiment name" value={experiment.experimentName} onChange={(value) => setField('experimentName', value)} />
        <Select label="Variable tested" value={experiment.variableTested} onChange={(value) => setField('variableTested', value as Experiment['variableTested'])} options={experimentVariables} />
        <Input label="Start date" type="date" value={experiment.startDate} onChange={(value) => setField('startDate', value)} />
        <Input label="End date" type="date" value={experiment.endDate} onChange={(value) => setField('endDate', value)} />
        <Select label="Result status" value={experiment.resultStatus} onChange={(value) => setField('resultStatus', value as Experiment['resultStatus'])} options={experimentResultStatuses} />
        <Select label="Decision" value={experiment.decision} onChange={(value) => setField('decision', value as Experiment['decision'])} options={experimentDecisions} />
      </div>
      <Textarea label="Hypothesis" value={experiment.hypothesis} onChange={(value) => setField('hypothesis', value)} />
      <Textarea label="Related Reels" value={experiment.relatedReels} onChange={(value) => setField('relatedReels', value)} />
      <Textarea label="Result" value={experiment.result} onChange={(value) => setField('result', value)} />
      <Textarea label="Notes" value={experiment.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save experiment</button>
    </form>
  )
}

function RemakeForm({ idea, setIdea, reels, onSubmit }: { idea: RemakeIdea; setIdea: (idea: RemakeIdea) => void; reels: ReelPerformance[]; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof RemakeIdea>(key: K, value: RemakeIdea[K]) => setIdea({ ...idea, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      {reels.length > 0 && (
        <Select
          label="Prefill from Reel"
          value=""
          options={['', ...reels.map((reel) => reel.id)]}
          getOptionLabel={(value) => reels.find((reel) => reel.id === value)?.reelTitle || 'Choose Reel'}
          onChange={(value) => {
            const reel = reels.find((item) => item.id === value)
            if (!reel) return
            setIdea({ ...idea, originalReel: reel.reelTitle, originalPerformanceSummary: `Reach ${formatNumber(reel.reach)} · Shares ${formatNumber(reel.shares)} · Saves ${formatNumber(reel.saves)} · Follows ${formatNumber(reel.followsGained)}`, newHook: reel.hookType, newAngle: reel.contentPillar })
          }}
        />
      )}
      <div className="form-grid">
        <Input label="Original Reel" value={idea.originalReel} onChange={(value) => setField('originalReel', value)} />
        <Select label="Remake type" value={idea.remakeType} onChange={(value) => setField('remakeType', value as RemakeIdea['remakeType'])} options={remakeTypes} />
        <Select label="Status" value={idea.status} onChange={(value) => setField('status', value as RemakeIdea['status'])} options={planStatuses} />
      </div>
      <Textarea label="Original performance summary" value={idea.originalPerformanceSummary} onChange={(value) => setField('originalPerformanceSummary', value)} />
      <Textarea label="Why it worked" value={idea.whyItWorked} onChange={(value) => setField('whyItWorked', value)} />
      <Textarea label="New hook" value={idea.newHook} onChange={(value) => setField('newHook', value)} />
      <Textarea label="New angle" value={idea.newAngle} onChange={(value) => setField('newAngle', value)} />
      <Textarea label="Notes" value={idea.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save remake idea</button>
    </form>
  )
}

function CommentIdeaForm({ idea, setIdea, onSubmit }: { idea: CommentIdea; setIdea: (idea: CommentIdea) => void; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof CommentIdea>(key: K, value: CommentIdea[K]) => setIdea({ ...idea, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input label="Source Reel" value={idea.commentSourceReel} onChange={(value) => setField('commentSourceReel', value)} />
        <Input label="Topic" value={idea.topic} onChange={(value) => setField('topic', value)} />
        <Select label="Emotion" value={idea.emotion} onChange={(value) => setField('emotion', value as CommentIdea['emotion'])} options={commentEmotions} />
        <Input label="Reply status" value={idea.replyStatus} onChange={(value) => setField('replyStatus', value)} />
      </div>
      <label className="check-row"><input type="checkbox" checked={idea.canBecomeReel} onChange={() => setField('canBecomeReel', !idea.canBecomeReel)} /><span>Can become Reel</span></label>
      <label className="check-row"><input type="checkbox" checked={idea.reelMade} onChange={() => setField('reelMade', !idea.reelMade)} /><span>Reel made</span></label>
      <Textarea label="Comment text" value={idea.commentText} onChange={(value) => setField('commentText', value)} />
      <Textarea label="New Reel idea" value={idea.newReelIdea} onChange={(value) => setField('newReelIdea', value)} />
      <Textarea label="Notes" value={idea.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save comment idea</button>
    </form>
  )
}

function ProfileForm({ checklist, setChecklist, onSubmit }: { checklist: ProfileChecklist; setChecklist: (checklist: ProfileChecklist) => void; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof ProfileChecklist>(key: K, value: ProfileChecklist[K]) => setChecklist({ ...checklist, [key]: value })
  const keys: Array<[keyof ProfileChecklist, string]> = [
    ['bioUpdated', 'Bio updated'],
    ['nameFieldHasKeyword', 'Name field includes niche keyword'],
    ['threePinnedReelsSelected', 'Three pinned Reels selected'],
    ['introReelPinned', 'Intro Reel pinned'],
    ['bestRantReelPinned', 'Best rant Reel pinned'],
    ['bestEmotionalReelPinned', 'Best emotional Reel pinned'],
    ['highlightsCreated', 'Highlights created'],
    ['gridCoversConsistent', 'Grid covers consistent'],
    ['contactCollabVisible', 'Contact/collab visible'],
    ['noRandomOffNichePosts', 'No random off-niche posts'],
    ['coverStyleConsistent', 'Cover style consistent'],
    ['followCtaVisible', 'Follow CTA visible'],
    ['storyHighlightsUpdated', 'Story highlights updated'],
  ]
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="check-grid">
        {keys.map(([key, label]) => (
          <label className="check-row" key={String(key)}><input type="checkbox" checked={Boolean(checklist[key])} onChange={() => setField(key, !checklist[key] as ProfileChecklist[typeof key])} /><span>{label}</span></label>
        ))}
      </div>
      <Textarea label="Notes" value={checklist.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save profile checklist</button>
    </form>
  )
}

function MonthlyReviewForm({ review, setReview, onSubmit }: { review: MonthlyReview; setReview: (review: MonthlyReview) => void; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof MonthlyReview>(key: K, value: MonthlyReview[K]) => setReview({ ...review, [key]: value })
  const followerGain = review.endingFollowers - review.startingFollowers
  const avgReach = review.totalReelsPosted > 0 ? review.totalReach / review.totalReelsPosted : 0
  return (
    <form className="stack" onSubmit={onSubmit}>
      <h2>Growth</h2>
      <div className="form-grid">
        <Input label="Month" type="month" value={review.month} onChange={(value) => setField('month', value)} />
        {(['startingFollowers', 'endingFollowers', 'totalReach'] as Array<keyof MonthlyReview>).map((key) => (
          <Input key={key} label={labelize(key)} type="number" value={String(review[key])} onChange={(value) => setField(key, numberOrZero(value) as MonthlyReview[typeof key])} />
        ))}
      </div>
      <h2>Posting</h2>
      <div className="form-grid">
        {(['totalReelsPosted', 'totalStoriesPosted', 'totalCarouselsPosted'] as Array<keyof MonthlyReview>).map((key) => (
          <Input key={key} label={labelize(key)} type="number" value={String(review[key])} onChange={(value) => setField(key, numberOrZero(value) as MonthlyReview[typeof key])} />
        ))}
      </div>
      <h2>Performance</h2>
      <Textarea label="Top 5 Reels" value={review.top5Reels} onChange={(value) => setField('top5Reels', value)} />
      <Textarea label="Worst 5 Reels" value={review.worst5Reels} onChange={(value) => setField('worst5Reels', value)} />
      <div className="form-grid">
        <Select label="Best pillar" value={review.bestPillar} onChange={(value) => setField('bestPillar', value)} options={['', ...contentPillars]} />
        <Select label="Weakest pillar" value={review.weakestPillar} onChange={(value) => setField('weakestPillar', value)} options={['', ...contentPillars]} />
        <Select label="Best hook type" value={review.bestHookType} onChange={(value) => setField('bestHookType', value)} options={['', ...hookTypes]} />
        <Select label="Best video background" value={review.bestVideoBackground} onChange={(value) => setField('bestVideoBackground', value)} options={['', ...videoBackgrounds]} />
        <Input label="Best posting time" type="time" value={review.bestPostingTime} onChange={(value) => setField('bestPostingTime', value)} />
        <Select label="Top audience age group" value={review.topAudienceAgeGroup} onChange={(value) => setField('topAudienceAgeGroup', value)} options={['', ...ageGroups]} />
      </div>
      <h2>Learnings</h2>
      <Textarea label="Main lesson" value={review.mainLesson} onChange={(value) => setField('mainLesson', value)} />
      <Textarea label="Next month strategy" value={review.nextMonthStrategy} onChange={(value) => setField('nextMonthStrategy', value)} />
      <details>
        <summary>Calculated monthly metrics</summary>
        <DashboardGrid><MetricCard label="Follower gain" value={formatNumber(followerGain)} /><MetricCard label="Avg reach / Reel" value={formatNumber(avgReach)} /></DashboardGrid>
        <Textarea label="Notes" value={review.notes} onChange={(value) => setField('notes', value)} />
      </details>
      <button className="primary-button" type="submit">Save monthly review</button>
    </form>
  )
}

function GoalForm({ goal, setGoal, onSubmit }: { goal: GoalTracker; setGoal: (goal: GoalTracker) => void; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof GoalTracker>(key: K, value: GoalTracker[K]) => setGoal({ ...goal, [key]: value })
  const numberKeys: Array<keyof GoalTracker> = ['ninetyDayFollowerTarget', 'monthlyFollowerTarget', 'weeklyFollowerTarget', 'weeklyReachTarget', 'weeklyReelsTarget', 'weeklyStoriesTarget', 'weeklyCarouselTarget', 'weeklyCollabTarget', 'startFollowers', 'currentFollowers']
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        {numberKeys.map((key) => (
          <Input key={key} label={labelize(key)} type="number" value={String(goal[key] ?? 0)} onChange={(value) => setField(key, Math.max(0, numberOrZero(value)) as GoalTracker[typeof key])} />
        ))}
        <Input label="Target end date" type="date" value={goal.targetEndDate} onChange={(value) => setField('targetEndDate', value)} />
      </div>
      <Textarea label="Notes" value={goal.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save goal tracker</button>
    </form>
  )
}

function CollabForm({ collab, setCollab, onSubmit }: { collab: CollabTracker; setCollab: (collab: CollabTracker) => void; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof CollabTracker>(key: K, value: CollabTracker[K]) => setCollab({ ...collab, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input label="Creator/page/brand name" value={collab.name} onChange={(value) => setField('name', value)} />
        <Input label="Category" value={collab.category} onChange={(value) => setField('category', value)} />
        <Input label="Contact person" value={collab.contactPerson} onChange={(value) => setField('contactPerson', value)} />
        <Input label="Email/DM" value={collab.emailOrDm} onChange={(value) => setField('emailOrDm', value)} />
        <Select label="Status" value={collab.status} onChange={(value) => setField('status', value as CollabTracker['status'])} options={collabStatuses} />
        <Input label="Date contacted" type="date" value={collab.dateContacted} onChange={(value) => setField('dateContacted', value)} />
        <Input label="Posted date" type="date" value={collab.postedDate} onChange={(value) => setField('postedDate', value)} />
        <Select label="Collab type" value={collab.collabType} onChange={(value) => setField('collabType', value as CollabTracker['collabType'])} options={collabTypes} />
        <Input label="Payment/gifted" value={collab.paymentGifted} onChange={(value) => setField('paymentGifted', value)} />
        <Input label="Follow-up date" type="date" value={collab.followUpDate} onChange={(value) => setField('followUpDate', value)} />
      </div>
      <label className="check-row"><input type="checkbox" checked={collab.disclosureRequired} onChange={() => setField('disclosureRequired', !collab.disclosureRequired)} /><span>Disclosure required</span></label>
      <Textarea label="Collab idea" value={collab.collabIdea} onChange={(value) => setField('collabIdea', value)} />
      <Textarea label="Response" value={collab.response} onChange={(value) => setField('response', value)} />
      <Textarea label="Result notes" value={collab.resultNotes} onChange={(value) => setField('resultNotes', value)} />
      <Textarea label="Performance result" value={collab.performanceResult} onChange={(value) => setField('performanceResult', value)} />
      <button className="primary-button" type="submit">Save collab</button>
    </form>
  )
}

function InspirationForm({ inspiration, setInspiration, onSubmit }: { inspiration: InspirationTracker; setInspiration: (inspiration: InspirationTracker) => void; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof InspirationTracker>(key: K, value: InspirationTracker[K]) => setInspiration({ ...inspiration, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input label="Creator/page name" value={inspiration.creatorPageName} onChange={(value) => setField('creatorPageName', value)} />
        <Input label="Niche" value={inspiration.niche} onChange={(value) => setField('niche', value)} />
        <Input label="Follower count" type="number" value={inspiration.followerCount} onChange={(value) => setField('followerCount', Math.max(0, numberOrZero(value)))} />
        <Input label="Reel link" value={inspiration.reelLink} onChange={(value) => setField('reelLink', value)} />
        <Input label="Hook used" value={inspiration.hookUsed} onChange={(value) => setField('hookUsed', value)} />
        <Input label="Topic" value={inspiration.topic} onChange={(value) => setField('topic', value)} />
        <Input label="Format" value={inspiration.format} onChange={(value) => setField('format', value)} />
        {(['views', 'likes', 'comments', 'sharesVisible'] as Array<keyof InspirationTracker>).map((key) => (
          <Input key={key} label={labelize(key)} type="number" value={String(inspiration[key] ?? 0)} onChange={(value) => setField(key, Math.max(0, numberOrZero(value)) as InspirationTracker[typeof key])} />
        ))}
        <Select label="Status" value={inspiration.status} onChange={(value) => setField('status', value as InspirationTracker['status'])} options={inspirationStatuses} />
      </div>
      <label className="check-row"><input type="checkbox" checked={inspiration.canAdaptEthically} onChange={() => setField('canAdaptEthically', !inspiration.canAdaptEthically)} /><span>Can adapt ethically</span></label>
      <Textarea label="Why it worked" value={inspiration.whyItWorked} onChange={(value) => setField('whyItWorked', value)} />
      <Textarea label="Our version idea" value={inspiration.ourVersionIdea} onChange={(value) => setField('ourVersionIdea', value)} />
      <button className="primary-button" type="submit">Save inspiration</button>
    </form>
  )
}

function PrivacyForm({ checklist, setChecklist, plans, ideas, onSubmit }: { checklist: ChildPrivacyChecklist; setChecklist: (checklist: ChildPrivacyChecklist) => void; plans: DailyPlan[]; ideas: ContentIdea[]; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof ChildPrivacyChecklist>(key: K, value: ChildPrivacyChecklist[K]) => setChecklist({ ...checklist, [key]: value })
  const riskKeys: Array<[keyof ChildPrivacyChecklist, string]> = [
    ['childFaceVisible', 'Child face visible'],
    ['childFaceNecessary', 'Child face necessary'],
    ['privateLocationVisible', 'Private location visible'],
    ['schoolHospitalVisible', 'School/hospital visible'],
    ['cryingDistressHook', 'Crying/distress used as hook'],
    ['bathingChangingContent', 'Bathing/changing content'],
    ['medicalPrivateInfo', 'Medical/private info'],
    ['embarrassChildLater', 'Could this embarrass child later'],
    ['aboutChildInsteadOfMother', "Content about child instead of mother's experience"],
  ]
  const attachmentOptions = ['', ...plans.map((plan) => `Daily Plan:${plan.id}`), ...ideas.map((idea) => `Reel Idea:${idea.id}`)]
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input label="Date" type="date" value={checklist.date} onChange={(value) => setField('date', value)} />
        <Select
          label="Attach checklist to Daily Plan/Reel idea"
          value={checklist.attachedToType && checklist.attachedToId ? `${checklist.attachedToType}:${checklist.attachedToId}` : ''}
          options={attachmentOptions}
          getOptionLabel={(value) => {
            if (!value) return 'No attachment'
            const [type, id] = value.split(':')
            const label = type === 'Daily Plan' ? plans.find((plan) => plan.id === id)?.primaryReelTitle : ideas.find((idea) => idea.id === id)?.reelTitle
            return `${type}: ${label || 'Untitled'}`
          }}
          onChange={(value) => {
            const [type = '', id = ''] = value.split(':')
            setChecklist({ ...checklist, attachedToType: type as ChildPrivacyChecklist['attachedToType'], attachedToId: id })
          }}
        />
      </div>
      <div className="check-grid">
        {riskKeys.map(([key, label]) => (
          <label className="check-row" key={String(key)}>
            <input type="checkbox" checked={Boolean(checklist[key])} onChange={() => setField(key, !checklist[key] as ChildPrivacyChecklist[typeof key])} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <Textarea label="Safer alternative notes" value={checklist.saferAlternativeNotes} onChange={(value) => setField('saferAlternativeNotes', value)} />
      <button className="primary-button" type="submit">Save privacy checklist</button>
    </form>
  )
}

function ContentIdeaForm({
  idea,
  setIdea,
  hashtagOptions,
  onSubmit,
}: {
  idea: ContentIdea
  setIdea: (idea: ContentIdea) => void
  hashtagOptions: string[]
  onSubmit: (event: FormEvent) => void
}) {
  const setField = <K extends keyof ContentIdea>(key: K, value: ContentIdea[K]) => setIdea({ ...idea, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Select label="Content pillar" value={idea.contentPillar} onChange={(value) => setField('contentPillar', value)} options={contentPillars} />
        <Select label="Series name" value={idea.seriesName} onChange={(value) => setField('seriesName', value)} options={seriesNames} />
        <Input label="Reel title" value={idea.reelTitle} onChange={(value) => setField('reelTitle', value)} />
        <Select label="Video background" value={idea.videoBackground} onChange={(value) => setField('videoBackground', value)} options={videoBackgrounds} />
        <Select label="CTA" value={idea.cta} onChange={(value) => setField('cta', value)} options={captionCtas} />
        <Select label="Hashtag set" value={idea.hashtagSet} onChange={(value) => setField('hashtagSet', value)} options={hashtagOptions} />
        <Select label="Difficulty" value={idea.difficulty} onChange={(value) => setField('difficulty', value as ContentIdea['difficulty'])} options={contentDifficulties} />
        <Select label="Expected goal" value={idea.expectedGoal} onChange={(value) => setField('expectedGoal', value as ContentIdea['expectedGoal'])} options={libraryGoals} />
        <Select label="Status" value={idea.status} onChange={(value) => setField('status', value as ContentIdea['status'])} options={planStatuses} />
      </div>
      <Textarea label="Hook" value={idea.hook} onChange={(value) => setField('hook', value)} />
      <Textarea label="Script outline" value={idea.scriptOutline} onChange={(value) => setField('scriptOutline', value)} />
      <Textarea label="Search keywords" value={idea.searchKeywords ?? ''} onChange={(value) => setField('searchKeywords', value)} />
      <Input label="Cover text" value={idea.coverText ?? ''} onChange={(value) => setField('coverText', value)} />
      <Textarea label="Caption" value={idea.caption ?? ''} onChange={(value) => setField('caption', value)} />
      <Textarea label="Notes" value={idea.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save content idea</button>
    </form>
  )
}

function HookForm({ hook, setHook, onSubmit }: { hook: HookItem; setHook: (hook: HookItem) => void; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof HookItem>(key: K, value: HookItem[K]) => setHook({ ...hook, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      <Textarea label="Hook text" value={hook.hookText} onChange={(value) => setField('hookText', value)} />
      <div className="form-grid">
        <Select label="Category" value={hook.category} onChange={(value) => setField('category', value)} options={hookCategories} />
        <Select label="Best for" value={hook.bestFor} onChange={(value) => setField('bestFor', value as HookItem['bestFor'])} options={libraryGoals} />
        <Select label="Language" value={hook.language} onChange={(value) => setField('language', value as HookItem['language'])} options={hookLanguages} />
      </div>
      <Textarea label="Notes" value={hook.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save hook</button>
    </form>
  )
}

function CaptionForm({
  caption,
  setCaption,
  onSubmit,
}: {
  caption: CaptionTemplate
  setCaption: (caption: CaptionTemplate) => void
  onSubmit: (event: FormEvent) => void
}) {
  const setField = <K extends keyof CaptionTemplate>(key: K, value: CaptionTemplate[K]) => setCaption({ ...caption, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input label="Caption title" value={caption.captionTitle} onChange={(value) => setField('captionTitle', value)} />
        <Select label="Category" value={caption.category} onChange={(value) => setField('category', value)} options={captionCategories} />
        <Select label="Best for" value={caption.bestFor} onChange={(value) => setField('bestFor', value as CaptionTemplate['bestFor'])} options={libraryGoals} />
      </div>
      <Textarea label="Caption text" value={caption.captionText} onChange={(value) => setField('captionText', value)} />
      <Textarea label="Notes" value={caption.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save caption</button>
    </form>
  )
}

function HashtagForm({
  hashtagSet,
  setHashtagSet,
  onSubmit,
}: {
  hashtagSet: HashtagSetRecord
  setHashtagSet: (hashtagSet: HashtagSetRecord) => void
  onSubmit: (event: FormEvent) => void
}) {
  const setField = <K extends keyof HashtagSetRecord>(key: K, value: HashtagSetRecord[K]) => setHashtagSet({ ...hashtagSet, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input label="Set name" value={hashtagSet.setName} onChange={(value) => setField('setName', value)} />
        <Select label="Best for" value={hashtagSet.bestFor} onChange={(value) => setField('bestFor', value as HashtagSetRecord['bestFor'])} options={libraryGoals} />
      </div>
      <Textarea label="Hashtags" value={hashtagSet.hashtags} onChange={(value) => setField('hashtags', value)} />
      <Textarea label="Notes" value={hashtagSet.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save hashtag set</button>
    </form>
  )
}

function StoryForm({
  tracker,
  setTracker,
  onSubmit,
  completed,
}: {
  tracker: StoryTracker
  setTracker: (tracker: StoryTracker) => void
  onSubmit: (event: FormEvent) => void
  completed: number
}) {
  const setField = <K extends keyof StoryTracker>(key: K, value: StoryTracker[K]) => setTracker({ ...tracker, [key]: value })
  const storyChecks: Array<[StoryBooleanKey, string]> = [
    ['morningCheckInPosted', 'Morning check-in posted'],
    ['pollPosted', 'Poll posted'],
    ['questionStickerPosted', 'Question sticker posted'],
    ['miniRantPosted', 'Mini rant posted'],
    ['reelReshared', 'Reel reshared'],
    ['dmReplyInteraction', 'DM/reply interaction'],
    ['nightCheckIn', 'Night check-in'],
  ]
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input label="Date" type="date" value={tracker.date} onChange={(value) => setField('date', value)} />
        <Input label="Story views" type="number" value={tracker.storyViews} onChange={(value) => setField('storyViews', numberOrZero(value))} />
        <Input label="Replies" type="number" value={tracker.replies} onChange={(value) => setField('replies', numberOrZero(value))} />
      </div>
      <div className="check-grid">
        {storyChecks.map(([key, label]) => (
          <label className="check-row" key={key}>
            <input type="checkbox" checked={tracker[key]} onChange={() => setField(key, !tracker[key])} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <MetricCard label="Stories completed count" value={`${completed}/7`} />
      <Textarea label="Notes" value={tracker.notes} onChange={(value) => setField('notes', value)} />
      <button className="primary-button" type="submit">Save story tracker</button>
    </form>
  )
}

function CarouselForm({ plan, setPlan, onSubmit }: { plan: CarouselPlan; setPlan: (plan: CarouselPlan) => void; onSubmit: (event: FormEvent) => void }) {
  const setField = <K extends keyof CarouselPlan>(key: K, value: CarouselPlan[K]) => setPlan({ ...plan, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="form-grid">
        <Input label="Carousel title" value={plan.carouselTitle} onChange={(value) => setField('carouselTitle', value)} />
        <Input label="Topic" value={plan.topic} onChange={(value) => setField('topic', value)} />
        <Input label="Number of slides" type="number" value={plan.numberOfSlides} onChange={(value) => setField('numberOfSlides', numberOrZero(value))} />
        <Input label="CTA" value={plan.cta} onChange={(value) => setField('cta', value)} />
        <Select label="Status" value={plan.status} onChange={(value) => setField('status', value as CarouselPlan['status'])} options={carouselStatuses} />
      </div>
      <Textarea label="Slide 1 hook" value={plan.slide1Hook} onChange={(value) => setField('slide1Hook', value)} />
      <Textarea label="Slide outline" value={plan.slideOutline} onChange={(value) => setField('slideOutline', value)} />
      <Textarea label="Performance notes" value={plan.performanceNotes} onChange={(value) => setField('performanceNotes', value)} />
      <button className="primary-button" type="submit">Save carousel plan</button>
    </form>
  )
}

function PlanForm({
  plan,
  setPlan,
  onSubmit,
  hooks,
  captions,
  hashtagOptions,
  suggestions,
}: {
  plan: DailyPlan
  setPlan: (plan: DailyPlan) => void
  onSubmit: (event: FormEvent) => void
  hooks: HookItem[]
  captions: CaptionTemplate[]
  hashtagOptions: string[]
  suggestions: ReturnType<typeof getPlanSuggestions>
}) {
  const setField = <K extends keyof DailyPlan>(key: K, value: DailyPlan[K]) => setPlan({ ...plan, [key]: value })
  return (
    <form className="stack" onSubmit={onSubmit}>
      {(hooks.length > 0 || captions.length > 0) && (
        <div className="form-grid compact">
          {hooks.length > 0 && (
            <Select
              label="Copy hook from Hook Bank"
              value=""
              onChange={(value) => {
                const hook = hooks.find((item) => item.id === value)
                if (hook) setField('hook', hook.hookText)
              }}
              options={['', ...hooks.map((hook) => hook.id)]}
              getOptionLabel={(value) => hooks.find((hook) => hook.id === value)?.hookText || 'Choose hook'}
            />
          )}
          {captions.length > 0 && (
            <Select
              label="Copy caption from Caption Bank"
              value=""
              onChange={(value) => {
                const caption = captions.find((item) => item.id === value)
                if (caption) {
                  setPlan({ ...plan, captionDraft: caption.captionText, captionCTA: caption.category })
                }
              }}
              options={['', ...captions.map((caption) => caption.id)]}
              getOptionLabel={(value) => captions.find((caption) => caption.id === value)?.captionTitle || 'Choose caption'}
            />
          )}
        </div>
      )}
      <details>
        <summary>Suggestions from Library</summary>
        <div className="chip-row suggestion-row">
          {suggestions.hooks.map((hook) => <button className="chip-button" type="button" key={hook} onClick={() => setField('hook', hook)}>{hook}</button>)}
          {suggestions.ctas.map((cta) => <button className="chip-button" type="button" key={cta} onClick={() => setField('captionCTA', cta)}>{cta}</button>)}
          {suggestions.backgrounds.map((background) => <button className="chip-button" type="button" key={background} onClick={() => setField('videoBackground', background)}>{background}</button>)}
          <button className="chip-button" type="button" onClick={() => setField('searchKeywords', suggestions.keywords.join(', '))}>Suggested keywords</button>
          <button className="chip-button" type="button" onClick={() => setField('hashtagSet', suggestions.hashtagSet)}>Suggested hashtag set</button>
        </div>
      </details>
      <h2>Essentials</h2>
      <div className="form-grid">
        <Input label="Date" type="date" value={plan.date} onChange={(value) => setField('date', value)} />
        <Input label="Day number" type="number" value={plan.dayNumber ?? ''} onChange={(value) => setField('dayNumber', value ? numberOrZero(value) : undefined)} />
        <Input label="Primary Reel title" value={plan.primaryReelTitle} onChange={(value) => setField('primaryReelTitle', value)} />
        <Textarea label="Hook" value={plan.hook} onChange={(value) => setField('hook', value)} />
        <Select label="Status" value={plan.status} onChange={(value) => setField('status', value as DailyPlan['status'])} options={planStatuses} />
      </div>
      <details>
        <summary>Content</summary>
        <div className="form-grid details-grid">
        <Select label="Content pillar" value={plan.contentPillar} onChange={(value) => setField('contentPillar', value)} options={contentPillars} />
        <Select label="Series name" value={plan.seriesName} onChange={(value) => setField('seriesName', value)} options={seriesNames} />
        <Select label="Reel goal" value={plan.reelGoal} onChange={(value) => setField('reelGoal', value)} options={reelGoals} />
        <Select label="Video background" value={plan.videoBackground} onChange={(value) => setField('videoBackground', value)} options={videoBackgrounds} />
        <Select label="Video length" value={plan.videoLength} onChange={(value) => setField('videoLength', value)} options={videoLengths} />
          <Select label="Suggested posting time" value={plan.plannedPostingTime} onChange={(value) => setField('plannedPostingTime', value)} options={postingTimeOptions} />
        </div>
        <Textarea label="Full idea" value={plan.fullIdea ?? ''} onChange={(value) => setField('fullIdea', value)} />
        <Textarea label="Script outline" value={plan.scriptOutline} onChange={(value) => setField('scriptOutline', value)} />
      </details>
      <details>
        <summary>Caption & Growth</summary>
        <Textarea label="Caption" value={plan.captionDraft ?? ''} onChange={(value) => setField('captionDraft', value)} />
        <div className="form-grid details-grid">
        <Select label="Caption CTA" value={plan.captionCTA} onChange={(value) => setField('captionCTA', value)} options={Array.from(new Set([...captionCtas, ...captionCategories, ...libraryGoals]))} />
        <Select label="Hashtag set" value={plan.hashtagSet} onChange={(value) => setField('hashtagSet', value)} options={hashtagOptions} />
        </div>
        <Textarea label="Search keywords" value={plan.searchKeywords ?? ''} onChange={(value) => setField('searchKeywords', value)} />
        <Input label="Cover text" value={plan.coverText ?? ''} onChange={(value) => setField('coverText', value)} />
        <Textarea label="Story follow-up" value={plan.storyFollowUp} onChange={(value) => setField('storyFollowUp', value)} />
      </details>
      <details>
        <summary>Advanced</summary>
        <div className="form-grid details-grid">
          <Input label="Optional second Reel title" value={plan.secondReelTitle ?? ''} onChange={(value) => setField('secondReelTitle', value)} />
          <Input label="Actual posted time" type="time" value={plan.actualPostedTime ?? ''} onChange={(value) => setField('actualPostedTime', value)} />
        </div>
        <Textarea label="Notes" value={plan.notes} onChange={(value) => setField('notes', value)} />
      </details>
      <button className="primary-button" type="submit">Save daily plan</button>
    </form>
  )
}

function ReelForm({
  reel,
  setReel,
  stages,
  setStages,
  metrics,
  hashtagOptions,
  onSubmit,
  onReset,
}: {
  reel: ReelPerformance
  setReel: (reel: ReelPerformance) => void
  stages: ReelStageStats[]
  setStages: (stages: ReelStageStats[]) => void
  metrics: ReturnType<typeof calculateReelMetrics>
  hashtagOptions: string[]
  onSubmit: (event: FormEvent) => void
  onReset: () => void
}) {
  const setField = <K extends keyof ReelPerformance>(key: K, value: ReelPerformance[K]) => setReel({ ...reel, [key]: value })
  const setNumber = (key: keyof ReelPerformance, value: string) => setReel({ ...reel, [key]: numberOrZero(value) })

  const updateStage = (stageId: string, key: keyof ReelStageStats, value: string) => {
    setStages(stages.map((stage) => (stage.id === stageId ? { ...stage, [key]: numberOrZero(value) } : stage)))
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <h2>Essentials</h2>
      <div className="form-grid">
        <Input label="Reel title" value={reel.reelTitle} onChange={(value) => setField('reelTitle', value)} />
        <Input label="Date posted" type="date" value={reel.datePosted} onChange={(value) => setField('datePosted', value)} />
      </div>

      <h2>Core metrics</h2>
      <div className="form-grid compact">
        {(['views', 'reach', 'likes', 'comments', 'saves', 'shares', 'profileVisits', 'followsGained', 'averageWatchTime'] as Array<keyof ReelPerformance>).map((key) => (
          <Input key={key} label={labelize(key)} type="number" value={String(reel[key] ?? 0)} onChange={(value) => setNumber(key, value)} />
        ))}
      </div>

      <Select label="Decision / next action" value={reel.decision} onChange={(value) => setField('decision', value as ReelPerformance['decision'])} options={['', ...reelDecisions]} />

      <details>
        <summary>Advanced Reel Details</summary>
        <div className="form-grid details-grid">
          <Input label="Time posted" type="time" value={reel.timePosted} onChange={(value) => setField('timePosted', value)} />
          <Select label="Content pillar" value={reel.contentPillar} onChange={(value) => setField('contentPillar', value)} options={contentPillars} />
          <Select label="Series name" value={reel.seriesName} onChange={(value) => setField('seriesName', value)} options={seriesNames} />
          <Select label="Reel goal" value={reel.reelGoal} onChange={(value) => setField('reelGoal', value)} options={reelGoals} />
          <Select label="Hook type" value={reel.hookType} onChange={(value) => setField('hookType', value)} options={['', ...hookTypes]} />
          <Select label="Video style" value={reel.videoStyle} onChange={(value) => setField('videoStyle', value)} options={videoBackgrounds} />
          <Select label="Video length" value={reel.videoLength} onChange={(value) => setField('videoLength', value)} options={videoLengths} />
          <Input label="Cover text" value={reel.coverText} onChange={(value) => setField('coverText', value)} />
          <Select label="Caption CTA" value={reel.captionCTA} onChange={(value) => setField('captionCTA', value)} options={captionCtas} />
          <Select label="Hashtag set" value={reel.hashtagSet} onChange={(value) => setField('hashtagSet', value)} options={hashtagOptions} />
          <Input label="Non-follower reach" type="number" value={String(reel.nonFollowerReach ?? 0)} onChange={(value) => setNumber('nonFollowerReach', value)} />
          <Input label="Retention percentage" type="number" value={String(reel.retentionPercentage ?? 0)} onChange={(value) => setNumber('retentionPercentage', value)} />
        </div>
        <Textarea label="Notes" value={reel.notes} onChange={(value) => setField('notes', value)} />
      </details>

      <details>
        <summary>24h / 72h / 7d Tracking</summary>
        <div className="stage-grid details-grid">
          {stages.map((stage) => (
            <div className="stage-card" key={stage.id}>
              <h3>{stage.stage}</h3>
              {(['reach', 'views', 'likes', 'comments', 'saves', 'shares', 'profileVisits', 'follows'] as Array<keyof ReelStageStats>).map((key) => (
                <Input key={key} label={labelize(key)} type="number" value={String(stage[key] ?? 0)} onChange={(value) => updateStage(stage.id, key, value)} />
              ))}
            </div>
          ))}
        </div>
      </details>

      <details>
        <summary>Performance Metrics</summary>
        <DashboardGrid>
          <MetricCard label="Engagement" value={formatPercent(metrics.engagementRate)} />
          <MetricCard label="Share rate" value={formatPercent(metrics.shareRate)} />
          <MetricCard label="Save rate" value={formatPercent(metrics.saveRate)} />
          <MetricCard label="Comment rate" value={formatPercent(metrics.commentRate)} />
          <MetricCard label="Profile visit rate" value={formatPercent(metrics.profileVisitRate)} />
          <MetricCard label="Follow conversion" value={formatPercent(metrics.followConversionRate)} />
          <MetricCard label="Follows / 1,000 reach" value={formatNumber(metrics.followsPerThousandReach)} />
        </DashboardGrid>
      </details>
      <div className="button-cluster">
        <button className="primary-button" type="submit">Save Reel</button>
        <button className="secondary-button" type="button" onClick={onReset}>New blank Reel</button>
      </div>
    </form>
  )
}

function ReviewForm({
  review,
  setReview,
  onSubmit,
  metrics,
  diagnosis,
}: {
  review: WeeklyReview
  setReview: (review: WeeklyReview) => void
  onSubmit: (event: FormEvent) => void
  metrics: ReturnType<typeof calculateWeeklyMetrics>
  diagnosis: string
}) {
  const setField = <K extends keyof WeeklyReview>(key: K, value: WeeklyReview[K]) => setReview({ ...review, [key]: value })
  const setNumber = (key: keyof WeeklyReview, value: string) => setReview({ ...review, [key]: numberOrZero(value) })
  const growthKeys: Array<keyof WeeklyReview> = [
    'startingFollowers',
    'endingFollowers',
    'totalReach',
    'totalViews',
    'profileVisits',
    'accountsEngaged',
  ]
  const postingKeys: Array<keyof WeeklyReview> = [
    'reelsPosted',
    'storiesPosted',
    'carouselsPosted',
    'livesDone',
    'collabsDone',
  ]

  return (
    <form className="stack" onSubmit={onSubmit}>
      <h2>Growth</h2>
      <div className="form-grid">
        <Input label="Week number" value={review.weekNumber} onChange={(value) => setField('weekNumber', value)} />
        <Input label="Start date" type="date" value={review.startDate} onChange={(value) => setField('startDate', value)} />
        <Input label="End date" type="date" value={review.endDate} onChange={(value) => setField('endDate', value)} />
        {growthKeys.map((key) => (
          <Input key={key} label={labelize(key)} type="number" value={String(review[key] ?? 0)} onChange={(value) => setNumber(key, value)} />
        ))}
      </div>
      <h2>Posting</h2>
      <div className="form-grid">
        {postingKeys.map((key) => (
          <Input key={key} label={labelize(key)} type="number" value={String(review[key] ?? 0)} onChange={(value) => setNumber(key, value)} />
        ))}
      </div>
      <h2>Learnings</h2>
      <div className="form-grid">
        <Input label="Best Reel" value={review.bestReel} onChange={(value) => setField('bestReel', value)} />
        <Input label="Worst Reel" value={review.worstReel} onChange={(value) => setField('worstReel', value)} />
        <Input label="Best content pillar" value={review.bestContentPillar} onChange={(value) => setField('bestContentPillar', value)} />
        <Input label="Worst content pillar" value={review.worstContentPillar} onChange={(value) => setField('worstContentPillar', value)} />
        <Input label="Best hook" value={review.bestHook} onChange={(value) => setField('bestHook', value)} />
        <Input label="Best posting time" value={review.bestPostingTime} onChange={(value) => setField('bestPostingTime', value)} />
      </div>
      <Textarea label="Main lesson" value={review.mainLesson} onChange={(value) => setField('mainLesson', value)} />
      <Textarea label="Next week focus" value={review.nextWeekFocus} onChange={(value) => setField('nextWeekFocus', value)} />
      <details>
        <summary>Audience notes</summary>
        <div className="form-grid details-grid">
          <Input label="Top audience age group" value={review.topAudienceAgeGroup} onChange={(value) => setField('topAudienceAgeGroup', value)} />
          <Input label="Top gender" value={review.topGender} onChange={(value) => setField('topGender', value)} />
          <Input label="Top city" value={review.topCity} onChange={(value) => setField('topCity', value)} />
          <Input label="Top country" value={review.topCountry} onChange={(value) => setField('topCountry', value)} />
        </div>
      </details>
      <details>
        <summary>Calculated weekly metrics</summary>
        <DashboardGrid>
          <MetricCard label="Followers gained" value={formatNumber(metrics.followersGained)} />
          <MetricCard label="Follow conversion" value={formatPercent(metrics.followConversionRate)} />
          <MetricCard label="Profile visit conversion" value={formatPercent(metrics.profileVisitConversion)} />
          <MetricCard label="Average reach / Reel" value={formatNumber(metrics.averageReachPerReel)} />
          <MetricCard label="Posting consistency" value={`${metrics.postingConsistencyScore}/100`} />
        </DashboardGrid>
        <div className="inline-insight"><p className="eyebrow">Weekly diagnosis</p><h2>{diagnosis}</h2></div>
      </details>
      <button className="primary-button" type="submit">Save weekly review</button>
    </form>
  )
}

function Screen({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  return (
    <section className="screen">
      <div className="screen-title">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Card({ children, tone }: { children: ReactNode; tone?: 'blue' | 'danger' }) {
  return <section className={`card ${tone ? `card-${tone}` : ''}`}>{children}</section>
}

function DashboardGrid({ children }: { children: ReactNode }) {
  return <div className="dashboard-grid">{children}</div>
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}

function RecordList({ title, emptyTitle, emptyText, children }: { title: string; emptyTitle: string; emptyText: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <div className="record-list">
      <h2>{title}</h2>
      {hasChildren ? children : <EmptyState title={emptyTitle} text={emptyText} />}
    </div>
  )
}

function ActionList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="muted">No pending actions. Nice clean day.</p>
  return (
    <ul className="action-list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  )
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string | number; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field field-full">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  )
}

function Select({
  label,
  value,
  options,
  onChange,
  getOptionLabel,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  getOptionLabel?: (value: string) => string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option || 'blank'} value={option}>
            {getOptionLabel ? getOptionLabel(option) : option || 'Any'}
          </option>
        ))}
      </select>
    </label>
  )
}

function labelize(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())
}

export default App

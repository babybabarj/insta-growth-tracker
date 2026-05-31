import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSettings,
  AudienceInsight,
  BackupMetadata,
  CaptionTemplate,
  CarouselPlan,
  ChildPrivacyChecklist,
  CollabTracker,
  CommentIdea,
  ContentIdea,
  DailyChecklist,
  DailyPlan,
  Experiment,
  GoalTracker,
  HashtagSetRecord,
  HookItem,
  IdeaMap,
  InspirationTracker,
  MonthlyReview,
  OcrImport,
  ReelPerformance,
  ReelStageStats,
  ProfileChecklist,
  RemakeIdea,
  RewardProgress,
  StreakHistory,
  StoryTracker,
  WeeklyReview,
} from '../types/models'

export class TwinkleDatabase extends Dexie {
  settings!: EntityTable<AppSettings, 'id'>
  dailyPlans!: EntityTable<DailyPlan, 'id'>
  dailyChecklists!: EntityTable<DailyChecklist, 'id'>
  reelPerformances!: EntityTable<ReelPerformance, 'id'>
  reelStageStats!: EntityTable<ReelStageStats, 'id'>
  weeklyReviews!: EntityTable<WeeklyReview, 'id'>
  ocrImports!: EntityTable<OcrImport, 'id'>
  contentIdeas!: EntityTable<ContentIdea, 'id'>
  hooks!: EntityTable<HookItem, 'id'>
  captionTemplates!: EntityTable<CaptionTemplate, 'id'>
  hashtagSetRecords!: EntityTable<HashtagSetRecord, 'id'>
  storyTrackers!: EntityTable<StoryTracker, 'id'>
  carouselPlans!: EntityTable<CarouselPlan, 'id'>
  monthlyReviews!: EntityTable<MonthlyReview, 'id'>
  experiments!: EntityTable<Experiment, 'id'>
  remakeIdeas!: EntityTable<RemakeIdea, 'id'>
  commentIdeas!: EntityTable<CommentIdea, 'id'>
  audienceInsights!: EntityTable<AudienceInsight, 'id'>
  profileChecklists!: EntityTable<ProfileChecklist, 'id'>
  streakHistory!: EntityTable<StreakHistory, 'id'>
  rewardProgress!: EntityTable<RewardProgress, 'id'>
  ideaMaps!: EntityTable<IdeaMap, 'id'>
  collabTrackers!: EntityTable<CollabTracker, 'id'>
  inspirationTrackers!: EntityTable<InspirationTracker, 'id'>
  childPrivacyChecklists!: EntityTable<ChildPrivacyChecklist, 'id'>
  goalTrackers!: EntityTable<GoalTracker, 'id'>
  backupMetadata!: EntityTable<BackupMetadata, 'id'>

  constructor() {
    super('twinkle-growth-tracker')
    this.version(1).stores({
      settings: 'id',
      dailyPlans: 'id, date, status, contentPillar, seriesName',
      dailyChecklists: 'id, date',
      reelPerformances: 'id, datePosted, contentPillar, seriesName, reelGoal, decision',
      reelStageStats: 'id, reelId, stage',
      weeklyReviews: 'id, startDate, endDate, weekNumber',
    })
    this.version(2).stores({
      settings: 'id',
      dailyPlans: 'id, date, status, contentPillar, seriesName',
      dailyChecklists: 'id, date',
      reelPerformances: 'id, datePosted, contentPillar, seriesName, reelGoal, decision',
      reelStageStats: 'id, reelId, stage',
      weeklyReviews: 'id, startDate, endDate, weekNumber',
      contentIdeas: 'id, contentPillar, seriesName, expectedGoal, status, difficulty',
      hooks: 'id, category, bestFor, language',
      captionTemplates: 'id, category, bestFor',
      hashtagSetRecords: 'id, setName, bestFor',
      storyTrackers: 'id, date',
      carouselPlans: 'id, status, topic',
    })
    this.version(3).stores({
      settings: 'id',
      dailyPlans: 'id, date, status, contentPillar, seriesName',
      dailyChecklists: 'id, date',
      reelPerformances: 'id, datePosted, contentPillar, seriesName, reelGoal, decision',
      reelStageStats: 'id, reelId, stage',
      weeklyReviews: 'id, startDate, endDate, weekNumber',
      contentIdeas: 'id, contentPillar, seriesName, expectedGoal, status, difficulty',
      hooks: 'id, category, bestFor, language',
      captionTemplates: 'id, category, bestFor',
      hashtagSetRecords: 'id, setName, bestFor',
      storyTrackers: 'id, date',
      carouselPlans: 'id, status, topic',
      monthlyReviews: 'id, month',
      experiments: 'id, experimentName',
      remakeIdeas: 'id, originalReel',
      commentIdeas: 'id, commentText',
      audienceInsights: 'id, week',
      profileChecklists: 'id',
      streakHistory: 'id, date',
      rewardProgress: 'id, week',
      ideaMaps: 'id, title',
      collabTrackers: 'id, status, category, collabType, disclosureRequired',
      inspirationTrackers: 'id, status, niche',
      childPrivacyChecklists: 'id, date, attachedToType, attachedToId',
      goalTrackers: 'id, targetEndDate',
      backupMetadata: 'id',
    })
    this.version(4).stores({
      settings: 'id',
      dailyPlans: 'id, date, status, contentPillar, seriesName',
      dailyChecklists: 'id, date',
      reelPerformances: 'id, datePosted, contentPillar, seriesName, reelGoal, decision',
      reelStageStats: 'id, reelId, stage',
      weeklyReviews: 'id, startDate, endDate, weekNumber',
      contentIdeas: 'id, contentPillar, seriesName, expectedGoal, status, difficulty',
      hooks: 'id, category, bestFor, language',
      captionTemplates: 'id, category, bestFor',
      hashtagSetRecords: 'id, setName, bestFor',
      storyTrackers: 'id, date',
      carouselPlans: 'id, status, topic',
      monthlyReviews: 'id, month',
      experiments: 'id, experimentName, variableTested, decision',
      remakeIdeas: 'id, originalReel, remakeType, status',
      commentIdeas: 'id, topic, emotion, canBecomeReel, reelMade',
      audienceInsights: 'id, week, topAgeGroup, topCity, topCountry',
      profileChecklists: 'id',
      streakHistory: 'id, date, completed',
      rewardProgress: 'id, week, rewardBadge, completed',
      ideaMaps: 'id, dayNumber, contentPillar, seriesName, status',
      collabTrackers: 'id, status, category, collabType, disclosureRequired',
      inspirationTrackers: 'id, status, niche',
      childPrivacyChecklists: 'id, date, attachedToType, attachedToId',
      goalTrackers: 'id, targetEndDate',
      backupMetadata: 'id',
    })
    this.version(5).stores({
      settings: 'id',
      dailyPlans: 'id, date, status, contentPillar, seriesName',
      dailyChecklists: 'id, date',
      reelPerformances: 'id, datePosted, contentPillar, seriesName, reelGoal, decision, ocrImportId',
      reelStageStats: 'id, reelId, stage',
      weeklyReviews: 'id, startDate, endDate, weekNumber',
      ocrImports: 'id, status, appliedToReelId',
      contentIdeas: 'id, contentPillar, seriesName, expectedGoal, status, difficulty',
      hooks: 'id, category, bestFor, language',
      captionTemplates: 'id, category, bestFor',
      hashtagSetRecords: 'id, setName, bestFor',
      storyTrackers: 'id, date',
      carouselPlans: 'id, status, topic',
      monthlyReviews: 'id, month',
      experiments: 'id, experimentName, variableTested, decision, resultStatus',
      remakeIdeas: 'id, originalReel, remakeType, status',
      commentIdeas: 'id, topic, emotion, canBecomeReel, reelMade',
      audienceInsights: 'id, week, topAgeGroup, topCity, topCountry',
      profileChecklists: 'id',
      streakHistory: 'id, date, completed',
      rewardProgress: 'id, week, rewardBadge, completed',
      ideaMaps: 'id, dayNumber, contentPillar, seriesName, status',
      collabTrackers: 'id, status, category, collabType, disclosureRequired',
      inspirationTrackers: 'id, status, niche',
      childPrivacyChecklists: 'id, date, attachedToType, attachedToId',
      goalTrackers: 'id, targetEndDate',
      backupMetadata: 'id',
    })
  }
}

export const db = new TwinkleDatabase()

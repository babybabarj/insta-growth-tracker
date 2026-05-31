export type TabKey = 'today' | 'plan' | 'reels' | 'review' | 'library' | 'more'

export type ThemeName = 'minimal-pink' | 'soft-blue' | 'instagram-accent'

export type DailyPlanStatus =
  | 'Idea'
  | 'Planned'
  | 'Scripted'
  | 'Filmed'
  | 'Edited'
  | 'Posted'
  | 'Skipped'
  | 'Reuse Later'

export type ReelDecision =
  | 'Scale this format'
  | 'Remake with stronger hook'
  | 'Make carousel version'
  | 'Turn comment into Reel'
  | 'Improve cover'
  | 'Improve CTA'
  | 'Drop this format'
  | 'Test again at different time'
  | 'Repeat with Hinglish version'
  | 'Repeat with emotional version'
  | 'Repeat with funny version'

export type ReelStage = '24h' | '72h' | '7d'

export interface BaseRecord {
  id: string
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  id: string
  theme: ThemeName
  lastOpenedTab: TabKey
  appName?: string
  shortAppName?: string
  connectedHandle?: string
  profileDisplayName?: string
  backupReminderDate?: string
  currentFollowers?: number
  updatedAt: string
}

export interface DailyPlan extends BaseRecord {
  date: string
  dayNumber?: number
  primaryReelTitle: string
  secondReelTitle?: string
  contentPillar: string
  seriesName: string
  reelGoal: string
  hook: string
  fullIdea: string
  scriptOutline: string
  videoBackground: string
  videoLength: string
  captionDraft?: string
  captionCTA: string
  hashtagSet: string
  searchKeywords: string
  coverText: string
  storyFollowUp: string
  plannedPostingTime: string
  actualPostedTime?: string
  status: DailyPlanStatus
  notes: string
}

export interface DailyChecklist extends BaseRecord {
  date: string
  reelPosted: boolean
  captionAdded: boolean
  hashtagsAdded: boolean
  coverChecked: boolean
  reelSharedToStory: boolean
  story1Posted: boolean
  story2Posted: boolean
  story3Posted: boolean
  story4Posted: boolean
  story5Posted: boolean
  commentsReplied: boolean
  dmsChecked: boolean
  yesterdayStatsUpdated: boolean
  tomorrowIdeaPlanned: boolean
}

export interface ReelPerformance extends BaseRecord {
  reelTitle: string
  datePosted: string
  timePosted: string
  contentPillar: string
  seriesName: string
  reelGoal: string
  hookType: string
  videoStyle: string
  videoLength: string
  coverText: string
  captionCTA: string
  hashtagSet: string
  views: number
  reach: number
  likes: number
  comments: number
  saves: number
  shares: number
  profileVisits: number
  followsGained: number
  nonFollowerReach: number
  averageWatchTime: number
  retentionPercentage: number
  ocrImportId?: string
  ocrRawText?: string
  screenshotFileName?: string
  notes: string
  decision: ReelDecision | ''
}

export interface ReelStageStats extends BaseRecord {
  reelId: string
  stage: ReelStage
  reach: number
  views: number
  likes: number
  comments: number
  saves: number
  shares: number
  profileVisits: number
  follows: number
}

export interface WeeklyReview extends BaseRecord {
  weekNumber: string
  startDate: string
  endDate: string
  startingFollowers: number
  endingFollowers: number
  totalReach: number
  totalViews: number
  profileVisits: number
  accountsEngaged: number
  reelsPosted: number
  storiesPosted: number
  carouselsPosted: number
  livesDone: number
  collabsDone: number
  bestReel: string
  worstReel: string
  bestContentPillar: string
  worstContentPillar: string
  bestHook: string
  bestPostingTime: string
  topAudienceAgeGroup: string
  topGender: string
  topCity: string
  topCountry: string
  mainLesson: string
  nextWeekFocus: string
}

export type ContentDifficulty = 'Easy' | 'Medium' | 'Hard'
export type LibraryGoal = 'Shares' | 'Saves' | 'Comments' | 'Follows' | 'Trust' | 'Community'
export type HookLanguage = 'English' | 'Hindi' | 'Hinglish'
export type CarouselStatus = 'Idea' | 'Planned' | 'Designed' | 'Posted' | 'Reuse Later'
export type GoalStatus = 'On track' | 'Slightly behind' | 'Behind' | 'Needs viral breakout'
export type CollabStatus = 'Not Contacted' | 'Contacted' | 'Replied' | 'Planned' | 'Posted' | 'No Response'
export type CollabType =
  | 'Creator collab'
  | 'Brand collab'
  | 'Gifted'
  | 'Paid'
  | 'Reel exchange'
  | 'Story mention'
  | 'Live'
  | 'Giveaway'
export type InspirationStatus = 'Saved' | 'Adapted' | 'Planned' | 'Posted' | 'Ignore'

export interface ContentIdea extends BaseRecord {
  contentPillar: string
  seriesName: string
  reelTitle: string
  hook: string
  scriptOutline: string
  videoBackground: string
  searchKeywords: string
  coverText: string
  caption: string
  cta: string
  hashtagSet: string
  difficulty: ContentDifficulty
  expectedGoal: LibraryGoal
  status: DailyPlanStatus
  notes: string
}

export interface HookItem extends BaseRecord {
  hookText: string
  category: string
  bestFor: LibraryGoal
  language: HookLanguage
  notes: string
}

export interface CaptionTemplate extends BaseRecord {
  captionTitle: string
  captionText: string
  category: string
  bestFor: LibraryGoal
  notes: string
}

export interface HashtagSetRecord extends BaseRecord {
  setName: string
  hashtags: string
  bestFor: LibraryGoal
  notes: string
}

export interface StoryTracker extends BaseRecord {
  date: string
  morningCheckInPosted: boolean
  pollPosted: boolean
  questionStickerPosted: boolean
  miniRantPosted: boolean
  reelReshared: boolean
  dmReplyInteraction: boolean
  nightCheckIn: boolean
  storyViews: number
  replies: number
  notes: string
}

export interface CarouselPlan extends BaseRecord {
  carouselTitle: string
  topic: string
  numberOfSlides: number
  slide1Hook: string
  slideOutline: string
  cta: string
  status: CarouselStatus
  performanceNotes: string
}

export interface BackupMetadata {
  id: string
  lastBackupDate?: string
  lastReminderDate?: string
  entriesSinceLastBackup: number
  updatedAt: string
}

export interface GoalTracker extends BaseRecord {
  ninetyDayFollowerTarget: number
  monthlyFollowerTarget: number
  weeklyFollowerTarget: number
  weeklyReachTarget: number
  weeklyReelsTarget: number
  weeklyStoriesTarget: number
  weeklyCarouselTarget: number
  weeklyCollabTarget: number
  startFollowers: number
  currentFollowers: number
  targetEndDate: string
  notes: string
}

export interface CollabTracker extends BaseRecord {
  name: string
  category: string
  contactPerson: string
  emailOrDm: string
  status: CollabStatus
  collabIdea: string
  dateContacted: string
  response: string
  postedDate: string
  collabType: CollabType
  paymentGifted: string
  disclosureRequired: boolean
  resultNotes: string
  performanceResult: string
  followUpDate: string
}

export interface InspirationTracker extends BaseRecord {
  creatorPageName: string
  niche: string
  followerCount: number
  reelLink: string
  hookUsed: string
  topic: string
  format: string
  views: number
  likes: number
  comments: number
  sharesVisible: number
  whyItWorked: string
  canAdaptEthically: boolean
  ourVersionIdea: string
  status: InspirationStatus
}

export interface ChildPrivacyChecklist extends BaseRecord {
  date: string
  attachedToType: 'Daily Plan' | 'Reel Idea' | ''
  attachedToId: string
  childFaceVisible: boolean
  childFaceNecessary: boolean
  privateLocationVisible: boolean
  schoolHospitalVisible: boolean
  cryingDistressHook: boolean
  bathingChangingContent: boolean
  medicalPrivateInfo: boolean
  embarrassChildLater: boolean
  aboutChildInsteadOfMother: boolean
  saferAlternativeNotes: string
}

export interface MonthlyReview extends BaseRecord {
  month: string
  startingFollowers: number
  endingFollowers: number
  totalReach: number
  totalReelsPosted: number
  totalStoriesPosted: number
  totalCarouselsPosted: number
  top5Reels: string
  worst5Reels: string
  bestPillar: string
  weakestPillar: string
  bestHookType: string
  bestVideoBackground: string
  bestPostingTime: string
  topAudienceAgeGroup: string
  mainLesson: string
  nextMonthStrategy: string
  notes: string
}

export type ExperimentVariable =
  | 'Hook'
  | 'Reel length'
  | 'Posting time'
  | 'Language'
  | 'Cover style'
  | 'CTA'
  | 'Background'
  | 'Content pillar'
  | 'Caption style'
  | 'Hashtag set'
export type ExperimentDecision = 'Continue' | 'Stop' | 'Test again' | 'Scale' | 'Needs more data'
export type ExperimentResultStatus = 'Positive' | 'Negative' | 'Mixed' | 'Needs more data'

export interface Experiment extends BaseRecord {
  experimentName: string
  hypothesis: string
  variableTested: ExperimentVariable
  startDate: string
  endDate: string
  relatedReels: string
  result: string
  resultStatus: ExperimentResultStatus
  decision: ExperimentDecision
  notes: string
}

export type RemakeType =
  | 'Funny version'
  | 'Emotional version'
  | 'Hinglish version'
  | 'Dear relatives version'
  | 'Toddler version'
  | 'Carousel version'
  | 'Comment-reply version'
  | 'Shorter version'
  | 'Longer storytime version'
  | 'Stronger hook version'

export interface RemakeIdea extends BaseRecord {
  originalReel: string
  originalPerformanceSummary: string
  whyItWorked: string
  remakeType: RemakeType
  newHook: string
  newAngle: string
  status: DailyPlanStatus
  notes: string
}

export type CommentEmotion = 'Funny' | 'Angry' | 'Emotional' | 'Relatable' | 'Helpful' | 'Controversial' | 'Confession'

export interface CommentIdea extends BaseRecord {
  commentText: string
  commentSourceReel: string
  topic: string
  emotion: CommentEmotion
  canBecomeReel: boolean
  replyStatus: string
  reelMade: boolean
  newReelIdea: string
  notes: string
}

export interface AudienceInsight extends BaseRecord {
  week: string
  topAgeGroup: string
  secondAgeGroup: string
  genderSplit: string
  topCity: string
  topCountry: string
  mostActiveDay: string
  mostActiveTime: string
  followerReach: number
  nonFollowerReach: number
  contentLikedMost: string
  contentCommentedMost: string
  contentSharedMost: string
  notes: string
}

export interface ProfileChecklist extends BaseRecord {
  bioUpdated: boolean
  nameFieldHasKeyword: boolean
  threePinnedReelsSelected: boolean
  introReelPinned: boolean
  bestRantReelPinned: boolean
  bestEmotionalReelPinned: boolean
  highlightsCreated: boolean
  gridCoversConsistent: boolean
  contactCollabVisible: boolean
  noRandomOffNichePosts: boolean
  coverStyleConsistent: boolean
  followCtaVisible: boolean
  storyHighlightsUpdated: boolean
  notes: string
}

export interface StreakHistory extends BaseRecord {
  date: string
  score: number
  completed: boolean
  rewardEarned: string
  tasksCompletedCount: number
  notes: string
}

export interface RewardProgress extends BaseRecord {
  week: string
  points: number
  rewardBadge: string
  completed: boolean
}

export interface IdeaMap extends BaseRecord {
  dayNumber: number
  date: string
  reelTitle: string
  contentPillar: string
  seriesName: string
  reelGoal: string
  hook: string
  fullIdea: string
  scriptOutline: string
  videoBackground: string
  reelLength: string
  suggestedPostingTime: string
  caption: string
  captionCTA: string
  hashtagSet: string
  searchKeywords: string
  coverText: string
  storyFollowUp: string
  secondReelIdea: string
  status: DailyPlanStatus
  notes: string
}

export interface OcrImport extends BaseRecord {
  fileName: string
  imagePreviewUrl: string
  rawText: string
  detectedFieldsJson: string
  appliedToReelId?: string
  status: 'Review needed' | 'Applied' | 'Canceled'
}

export interface BackupPayload {
  version: 1
  exportedAt: string
  appName: string
  data: {
    settings: AppSettings[]
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
    collabTrackers: CollabTracker[]
    inspirationTrackers: InspirationTracker[]
    childPrivacyChecklists: ChildPrivacyChecklist[]
    goalTrackers: GoalTracker[]
    backupMetadata: BackupMetadata[]
  }
}

import type { AudienceInsight, BackupMetadata, CaptionTemplate, CarouselPlan, ChildPrivacyChecklist, CollabTracker, CommentIdea, ContentIdea, DailyChecklist, DailyPlan, Experiment, GoalTracker, HashtagSetRecord, HookItem, IdeaMap, InspirationTracker, MonthlyReview, OcrImport, ProfileChecklist, RemakeIdea, RewardProgress, ReelPerformance, ReelStage, ReelStageStats, StreakHistory, StoryTracker, WeeklyReview } from '../types/models'
import { captionCtas, contentPillars, hashtagSets, planStatuses, postingTimeOptions, reelGoals, searchKeywordOptions, seriesNames, videoBackgrounds, videoLengths } from '../constants/options'
import { nowISO, todayISO } from '../utils/dates'

export const makeId = () => crypto.randomUUID()

export const createDailyChecklist = (date = todayISO()): DailyChecklist => {
  const now = nowISO()
  return {
    id: makeId(),
    date,
    reelPosted: false,
    captionAdded: false,
    hashtagsAdded: false,
    coverChecked: false,
    reelSharedToStory: false,
    story1Posted: false,
    story2Posted: false,
    story3Posted: false,
    story4Posted: false,
    story5Posted: false,
    commentsReplied: false,
    dmsChecked: false,
    yesterdayStatsUpdated: false,
    tomorrowIdeaPlanned: false,
    createdAt: now,
    updatedAt: now,
  }
}

export const createDailyPlan = (date = todayISO()): DailyPlan => {
  const now = nowISO()
  return {
    id: makeId(),
    date,
    dayNumber: undefined,
    primaryReelTitle: '',
    secondReelTitle: '',
    contentPillar: contentPillars[0],
    seriesName: seriesNames[0],
    reelGoal: reelGoals[0],
    hook: '',
    fullIdea: '',
    scriptOutline: '',
    videoBackground: videoBackgrounds[0],
    videoLength: videoLengths[1],
    captionDraft: '',
    captionCTA: 'Share with a mom',
    hashtagSet: hashtagSets[0],
    searchKeywords: '',
    coverText: '',
    storyFollowUp: '',
    plannedPostingTime: postingTimeOptions[0],
    actualPostedTime: '',
    status: planStatuses[0],
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createReelPerformance = (): ReelPerformance => {
  const now = nowISO()
  return {
    id: makeId(),
    reelTitle: '',
    datePosted: todayISO(),
    timePosted: '',
    contentPillar: contentPillars[0],
    seriesName: seriesNames[0],
    reelGoal: reelGoals[0],
    hookType: '',
    videoStyle: videoBackgrounds[0],
    videoLength: videoLengths[1],
    coverText: '',
    captionCTA: 'Share with a mom',
    hashtagSet: hashtagSets[0],
    views: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    profileVisits: 0,
    followsGained: 0,
    nonFollowerReach: 0,
    averageWatchTime: 0,
    retentionPercentage: 0,
    ocrImportId: '',
    ocrRawText: '',
    screenshotFileName: '',
    notes: '',
    decision: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createStageStats = (reelId: string, stage: ReelStage): ReelStageStats => {
  const now = nowISO()
  return {
    id: makeId(),
    reelId,
    stage,
    reach: 0,
    views: 0,
    likes: 0,
    comments: 0,
    saves: 0,
    shares: 0,
    profileVisits: 0,
    follows: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export const createWeeklyReview = (): WeeklyReview => {
  const now = nowISO()
  return {
    id: makeId(),
    weekNumber: '',
    startDate: todayISO(),
    endDate: todayISO(),
    startingFollowers: 0,
    endingFollowers: 0,
    totalReach: 0,
    totalViews: 0,
    profileVisits: 0,
    accountsEngaged: 0,
    reelsPosted: 0,
    storiesPosted: 0,
    carouselsPosted: 0,
    livesDone: 0,
    collabsDone: 0,
    bestReel: '',
    worstReel: '',
    bestContentPillar: '',
    worstContentPillar: '',
    bestHook: '',
    bestPostingTime: '',
    topAudienceAgeGroup: '',
    topGender: '',
    topCity: '',
    topCountry: '',
    mainLesson: '',
    nextWeekFocus: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createContentIdea = (): ContentIdea => {
  const now = nowISO()
  return {
    id: makeId(),
    contentPillar: contentPillars[0],
    seriesName: seriesNames[0],
    reelTitle: '',
    hook: '',
    scriptOutline: '',
    videoBackground: videoBackgrounds[0],
    searchKeywords: '',
    coverText: '',
    caption: '',
    cta: 'Share with a mom',
    hashtagSet: hashtagSets[0],
    difficulty: 'Easy',
    expectedGoal: 'Shares',
    status: 'Idea',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createHookItem = (): HookItem => {
  const now = nowISO()
  return {
    id: makeId(),
    hookText: '',
    category: 'Viral Relatable',
    bestFor: 'Shares',
    language: 'English',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createCaptionTemplate = (): CaptionTemplate => {
  const now = nowISO()
  return {
    id: makeId(),
    captionTitle: '',
    captionText: '',
    category: 'Share',
    bestFor: 'Shares',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createHashtagSetRecord = (): HashtagSetRecord => {
  const now = nowISO()
  return {
    id: makeId(),
    setName: '',
    hashtags: '',
    bestFor: 'Shares',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createStoryTracker = (date = todayISO()): StoryTracker => {
  const now = nowISO()
  return {
    id: makeId(),
    date,
    morningCheckInPosted: false,
    pollPosted: false,
    questionStickerPosted: false,
    miniRantPosted: false,
    reelReshared: false,
    dmReplyInteraction: false,
    nightCheckIn: false,
    storyViews: 0,
    replies: 0,
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createCarouselPlan = (): CarouselPlan => {
  const now = nowISO()
  return {
    id: makeId(),
    carouselTitle: '',
    topic: '',
    numberOfSlides: 5,
    slide1Hook: '',
    slideOutline: '',
    cta: 'Save for later',
    status: 'Idea',
    performanceNotes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createGoalTracker = (): GoalTracker => {
  const now = nowISO()
  return {
    id: makeId(),
    ninetyDayFollowerTarget: 0,
    monthlyFollowerTarget: 0,
    weeklyFollowerTarget: 0,
    weeklyReachTarget: 0,
    weeklyReelsTarget: 0,
    weeklyStoriesTarget: 0,
    weeklyCarouselTarget: 0,
    weeklyCollabTarget: 0,
    startFollowers: 0,
    currentFollowers: 0,
    targetEndDate: todayISO(),
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createCollabTracker = (): CollabTracker => {
  const now = nowISO()
  return {
    id: makeId(),
    name: '',
    category: '',
    contactPerson: '',
    emailOrDm: '',
    status: 'Not Contacted',
    collabIdea: '',
    dateContacted: '',
    response: '',
    postedDate: '',
    collabType: 'Creator collab',
    paymentGifted: '',
    disclosureRequired: false,
    resultNotes: '',
    performanceResult: '',
    followUpDate: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createInspirationTracker = (): InspirationTracker => {
  const now = nowISO()
  return {
    id: makeId(),
    creatorPageName: '',
    niche: '',
    followerCount: 0,
    reelLink: '',
    hookUsed: '',
    topic: '',
    format: '',
    views: 0,
    likes: 0,
    comments: 0,
    sharesVisible: 0,
    whyItWorked: '',
    canAdaptEthically: false,
    ourVersionIdea: '',
    status: 'Saved',
    createdAt: now,
    updatedAt: now,
  }
}

export const createChildPrivacyChecklist = (): ChildPrivacyChecklist => {
  const now = nowISO()
  return {
    id: makeId(),
    date: todayISO(),
    attachedToType: '',
    attachedToId: '',
    childFaceVisible: false,
    childFaceNecessary: false,
    privateLocationVisible: false,
    schoolHospitalVisible: false,
    cryingDistressHook: false,
    bathingChangingContent: false,
    medicalPrivateInfo: false,
    embarrassChildLater: false,
    aboutChildInsteadOfMother: false,
    saferAlternativeNotes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createBackupMetadata = (): BackupMetadata => ({
  id: 'default',
  entriesSinceLastBackup: 0,
  updatedAt: nowISO(),
})

export const createStreakHistory = (date = todayISO()): StreakHistory => {
  const now = nowISO()
  return { id: makeId(), date, score: 0, completed: false, rewardEarned: '', tasksCompletedCount: 0, notes: '', createdAt: now, updatedAt: now }
}

export const createRewardProgress = (): RewardProgress => {
  const now = nowISO()
  return { id: makeId(), week: '', points: 0, rewardBadge: '', completed: false, createdAt: now, updatedAt: now }
}

export const createIdeaMap = (dayNumber = 1): IdeaMap => {
  const now = nowISO()
  return {
    id: makeId(),
    dayNumber,
    date: '',
    reelTitle: '',
    contentPillar: contentPillars[0],
    seriesName: seriesNames[0],
    reelGoal: reelGoals[0],
    hook: '',
    fullIdea: '',
    scriptOutline: '',
    videoBackground: videoBackgrounds[0],
    reelLength: videoLengths[1],
    suggestedPostingTime: postingTimeOptions[0],
    caption: '',
    captionCTA: captionCtas[0],
    hashtagSet: hashtagSets[0],
    searchKeywords: searchKeywordOptions.slice(0, 3).join(', '),
    coverText: '',
    storyFollowUp: '',
    secondReelIdea: '',
    status: 'Idea',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createAudienceInsight = (): AudienceInsight => {
  const now = nowISO()
  return {
    id: makeId(),
    week: '',
    topAgeGroup: '25-34',
    secondAgeGroup: '35-44',
    genderSplit: 'Mostly women',
    topCity: '',
    topCountry: '',
    mostActiveDay: '',
    mostActiveTime: '',
    followerReach: 0,
    nonFollowerReach: 0,
    contentLikedMost: '',
    contentCommentedMost: '',
    contentSharedMost: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createExperiment = (): Experiment => {
  const now = nowISO()
  return {
    id: makeId(),
    experimentName: '',
    hypothesis: '',
    variableTested: 'Hook',
    startDate: todayISO(),
    endDate: '',
    relatedReels: '',
    result: '',
    resultStatus: 'Needs more data',
    decision: 'Needs more data',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createOcrImport = (): OcrImport => {
  const now = nowISO()
  return {
    id: makeId(),
    fileName: '',
    imagePreviewUrl: '',
    rawText: '',
    detectedFieldsJson: '{}',
    appliedToReelId: '',
    status: 'Review needed',
    createdAt: now,
    updatedAt: now,
  }
}

export const createRemakeIdea = (): RemakeIdea => {
  const now = nowISO()
  return {
    id: makeId(),
    originalReel: '',
    originalPerformanceSummary: '',
    whyItWorked: '',
    remakeType: 'Stronger hook version',
    newHook: '',
    newAngle: '',
    status: 'Idea',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createCommentIdea = (): CommentIdea => {
  const now = nowISO()
  return {
    id: makeId(),
    commentText: '',
    commentSourceReel: '',
    topic: '',
    emotion: 'Relatable',
    canBecomeReel: false,
    replyStatus: '',
    reelMade: false,
    newReelIdea: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createProfileChecklist = (): ProfileChecklist => {
  const now = nowISO()
  return {
    id: 'default',
    bioUpdated: false,
    nameFieldHasKeyword: false,
    threePinnedReelsSelected: false,
    introReelPinned: false,
    bestRantReelPinned: false,
    bestEmotionalReelPinned: false,
    highlightsCreated: false,
    gridCoversConsistent: false,
    contactCollabVisible: false,
    noRandomOffNichePosts: false,
    coverStyleConsistent: false,
    followCtaVisible: false,
    storyHighlightsUpdated: false,
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const createMonthlyReview = (): MonthlyReview => {
  const now = nowISO()
  return {
    id: makeId(),
    month: todayISO().slice(0, 7),
    startingFollowers: 0,
    endingFollowers: 0,
    totalReach: 0,
    totalReelsPosted: 0,
    totalStoriesPosted: 0,
    totalCarouselsPosted: 0,
    top5Reels: '',
    worst5Reels: '',
    bestPillar: '',
    weakestPillar: '',
    bestHookType: '',
    bestVideoBackground: '',
    bestPostingTime: '',
    topAudienceAgeGroup: '',
    mainLesson: '',
    nextMonthStrategy: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

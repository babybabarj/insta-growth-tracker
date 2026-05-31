import type { CarouselStatus, CollabStatus, CollabType, CommentEmotion, ContentDifficulty, DailyPlanStatus, ExperimentDecision, ExperimentResultStatus, ExperimentVariable, HookLanguage, InspirationStatus, LibraryGoal, RemakeType, ReelDecision, ReelStage, TabKey, ThemeName } from '../types/models'

export const appName = 'Insta Growth Tracker'
export const shortAppName = 'Insta Tracker'
export const connectedHandle = '@twinklesaysso'
export const profileDisplayName = 'Twinkle Says So'

export const themeOptions: Array<{ value: ThemeName; label: string }> = [
  { value: 'minimal-pink', label: 'Minimal Pink' },
  { value: 'soft-blue', label: 'Soft Blue' },
  { value: 'instagram-accent', label: 'Instagram Accent' },
]

export const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'plan', label: 'Plan' },
  { key: 'reels', label: 'Reels' },
  { key: 'review', label: 'Review' },
  { key: 'library', label: 'Library' },
  { key: 'more', label: 'More' },
]

export const contentPillars = [
  'Things Moms Are Tired of Hearing',
  'Dear Relatives',
  'Toddler Chaos',
  '3 AM Mom Thoughts',
  'Mom Confessions',
  'Gentle Parenting Reality',
  'Useful Mom Saves',
  'Community Question',
  'Comment Reply Reel',
  'Weekly Recap',
]

export const seriesNames = [
  'Mom Rant',
  'Dear Relatives',
  'Peak Toddler Behaviour',
  '3 AM Mom Thought',
  'Mom Confession',
  'Gentle Parenting Reality',
  'Things Moms Are Tired of Hearing',
  'Mom Life Reality',
  'Comment Reply Reel',
  'Weekly Recap',
]

export const reelGoals = [
  'Shares',
  'Comments',
  'Saves',
  'Follows',
  'Profile visits',
  'Trust building',
  'Community building',
]

export const videoBackgrounds = [
  'Face camera',
  'Messy room',
  'Cold chai/coffee',
  'Toys on floor',
  'Kitchen chaos',
  'Bedroom/night light',
  'Laundry/bottles',
  'Walking with stroller',
  'Voiceover over daily clips',
  'Text-only Reel',
  'Reaction-style Reel',
  'Before/after style',
  'POV acting',
  'Comment screenshot reply',
]

export const videoLengths = ['7-12 sec', '13-20 sec', '21-30 sec', '31-45 sec', '45-60 sec']

export const captionCtas = [
  'Comment "same"',
  'Send this to a mom',
  'Save this for later',
  'Tag someone who says this',
  'Share with your mom group',
  'Tell me your experience',
  'Follow for real mom life',
  'Share with a mom',
]

export const hashtagSets = [
  'Indian Mom Life',
  'Mom Rants',
  'Toddler Mom',
  'New Mom',
  'Postpartum',
  'Gentle Parenting',
  'Relatable Mom',
  'Emotional Motherhood',
  'Community Question',
]

export const libraryGoals: LibraryGoal[] = ['Shares', 'Saves', 'Comments', 'Follows', 'Trust', 'Community']

export const contentDifficulties: ContentDifficulty[] = ['Easy', 'Medium', 'Hard']

export const hookCategories = [
  'Viral Relatable',
  'Mom Rant',
  'Dear Relatives',
  'Toddler Chaos',
  'Emotional',
  'Hinglish',
  'Community',
  'Gentle Parenting',
  'Comment Reply',
]

export const hookLanguages: HookLanguage[] = ['English', 'Hindi', 'Hinglish']

export const hookTypes = [
  'Bold rant',
  'Emotional truth',
  'Funny POV',
  'Hinglish relatable',
  'Question hook',
  'Dear relatives',
  'Toddler chaos',
  'Confession',
  'Comment reply',
]

export const postingTimeOptions = [
  'Morning 8-10 AM',
  'Midday 11 AM-1 PM',
  'Afternoon 2-4 PM',
  'Evening 5-7 PM',
  'Night 9-11 PM',
  'Late night 11 PM-1 AM',
]

export const searchKeywordOptions = [
  'Indian mom life',
  'mom rants',
  'toddler chaos',
  'new mom struggles',
  'motherhood unfiltered',
  'gentle parenting reality',
  'mom guilt',
  'overstimulated mom',
  'mental load',
  'relatives advice',
  'sleep when baby sleeps',
  '3 AM mom thoughts',
  'postpartum emotions',
  'tired mom',
  'mom life India',
]

export const activeDayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const captionCategories = ['Share', 'Comment', 'Save', 'Emotional', 'Funny', 'Community', 'Collab']

export const carouselStatuses: CarouselStatus[] = ['Idea', 'Planned', 'Designed', 'Posted', 'Reuse Later']

export const collabStatuses: CollabStatus[] = ['Not Contacted', 'Contacted', 'Replied', 'Planned', 'Posted', 'No Response']

export const collabTypes: CollabType[] = [
  'Creator collab',
  'Brand collab',
  'Gifted',
  'Paid',
  'Reel exchange',
  'Story mention',
  'Live',
  'Giveaway',
]

export const inspirationStatuses: InspirationStatus[] = ['Saved', 'Adapted', 'Planned', 'Posted', 'Ignore']

export const rewardBadges = ['Cheesecake', 'Brownie', 'Donut', 'Cupcake', 'Ice Cream', 'Waffle', 'Big Margarita Pizza']

export const experimentVariables: ExperimentVariable[] = [
  'Hook',
  'Reel length',
  'Posting time',
  'Language',
  'Cover style',
  'CTA',
  'Background',
  'Content pillar',
  'Caption style',
  'Hashtag set',
]

export const experimentDecisions: ExperimentDecision[] = ['Continue', 'Stop', 'Test again', 'Scale', 'Needs more data']

export const experimentResultStatuses: ExperimentResultStatus[] = ['Positive', 'Negative', 'Mixed', 'Needs more data']

export const remakeTypes: RemakeType[] = [
  'Funny version',
  'Emotional version',
  'Hinglish version',
  'Dear relatives version',
  'Toddler version',
  'Carousel version',
  'Comment-reply version',
  'Shorter version',
  'Longer storytime version',
  'Stronger hook version',
]

export const commentEmotions: CommentEmotion[] = ['Funny', 'Angry', 'Emotional', 'Relatable', 'Helpful', 'Controversial', 'Confession']

export const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+']

export const genderSplits = ['Mostly women', 'Mostly men', 'Balanced', 'Unknown']

export const visualGuideItems = [
  'Shoot vertical 9:16.',
  'Keep most Reels 12-30 seconds.',
  'Use strong hook in first 2 seconds.',
  'Use clear face expression.',
  'Use big readable text.',
  'Use subtitles/captions.',
  'Avoid slow intros.',
  'Avoid tiny cover text.',
  'Avoid too many fonts.',
]

export const coverCategories = [
  'MOM RANT',
  'DEAR RELATIVES',
  'TODDLER CHAOS',
  '3 AM THOUGHT',
  'MOM CONFESSION',
  'GENTLE PARENTING REALITY',
]

export const safeVisuals = ['face camera', 'cold chai', 'toys', 'messy room', 'bottles', 'laundry', 'kitchen', 'night light']

export const privacyReminders = [
  'no bathing/changing content',
  'no school/location details',
  'no distress crying as content hook',
  'no private medical details',
  'no embarrassing child moments',
  "make the content about motherhood experience, not the child's private life",
]

export const planStatuses: DailyPlanStatus[] = [
  'Idea',
  'Planned',
  'Scripted',
  'Filmed',
  'Edited',
  'Posted',
  'Skipped',
  'Reuse Later',
]

export const reelDecisions: ReelDecision[] = [
  'Scale this format',
  'Remake with stronger hook',
  'Make carousel version',
  'Turn comment into Reel',
  'Improve cover',
  'Improve CTA',
  'Drop this format',
  'Test again at different time',
  'Repeat with Hinglish version',
  'Repeat with emotional version',
  'Repeat with funny version',
]

export const reelStages: ReelStage[] = ['24h', '72h', '7d']

export const checklistLabels = {
  reelPosted: 'Reel posted',
  captionAdded: 'Caption added',
  hashtagsAdded: 'Hashtags added',
  coverChecked: 'Cover checked',
  reelSharedToStory: 'Reel shared to story',
  story1Posted: 'Story 1 posted',
  story2Posted: 'Story 2 posted',
  story3Posted: 'Story 3 posted',
  story4Posted: 'Story 4 posted',
  story5Posted: 'Story 5 posted',
  commentsReplied: 'Comments replied',
  dmsChecked: 'DMs checked',
  yesterdayStatsUpdated: "Yesterday's Reel stats updated",
  tomorrowIdeaPlanned: "Tomorrow's idea planned",
}

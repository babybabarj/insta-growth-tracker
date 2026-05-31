import { db } from './dexie'
import type { BackupPayload } from '../types/models'

const acceptedBackupAppNames = [
  'Insta Growth Tracker',
  'Creator ' + 'Growth Tracker',
  'Twinkle ' + 'Growth Tracker',
]

export const createBackupPayload = async (): Promise<BackupPayload> => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  appName: 'Insta Growth Tracker',
  data: {
    settings: await db.settings.toArray(),
    dailyPlans: await db.dailyPlans.toArray(),
    dailyChecklists: await db.dailyChecklists.toArray(),
    reelPerformances: await db.reelPerformances.toArray(),
    reelStageStats: await db.reelStageStats.toArray(),
    weeklyReviews: await db.weeklyReviews.toArray(),
    ocrImports: await db.ocrImports.toArray(),
    contentIdeas: await db.contentIdeas.toArray(),
    hooks: await db.hooks.toArray(),
    captionTemplates: await db.captionTemplates.toArray(),
    hashtagSetRecords: await db.hashtagSetRecords.toArray(),
    storyTrackers: await db.storyTrackers.toArray(),
    carouselPlans: await db.carouselPlans.toArray(),
    monthlyReviews: await db.monthlyReviews.toArray(),
    experiments: await db.experiments.toArray(),
    remakeIdeas: await db.remakeIdeas.toArray(),
    commentIdeas: await db.commentIdeas.toArray(),
    audienceInsights: await db.audienceInsights.toArray(),
    profileChecklists: await db.profileChecklists.toArray(),
    streakHistory: await db.streakHistory.toArray(),
    rewardProgress: await db.rewardProgress.toArray(),
    ideaMaps: await db.ideaMaps.toArray(),
    collabTrackers: await db.collabTrackers.toArray(),
    inspirationTrackers: await db.inspirationTrackers.toArray(),
    childPrivacyChecklists: await db.childPrivacyChecklists.toArray(),
    goalTrackers: await db.goalTrackers.toArray(),
    backupMetadata: await db.backupMetadata.toArray(),
  },
})

export const downloadJsonBackup = async () => {
  const payload = await createBackupPayload()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `insta-growth-tracker-backup-${payload.exportedAt.slice(0, 10)}.json`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const isBackupPayload = (value: unknown): value is BackupPayload => {
  if (!value || typeof value !== 'object') return false
  const payload = value as BackupPayload
  return (
    payload.version === 1 &&
    acceptedBackupAppNames.includes(payload.appName) &&
    Boolean(payload.data) &&
    Array.isArray(payload.data.dailyPlans) &&
    Array.isArray(payload.data.dailyChecklists) &&
    Array.isArray(payload.data.reelPerformances) &&
    Array.isArray(payload.data.reelStageStats) &&
    Array.isArray(payload.data.weeklyReviews) &&
    (!('goalTrackers' in payload.data) || Array.isArray(payload.data.goalTrackers))
  )
}

export const importBackupPayload = async (payload: BackupPayload, mode: 'replace' | 'merge' = 'replace') => {
  const tables = [
    db.settings,
    db.dailyPlans,
    db.dailyChecklists,
    db.reelPerformances,
    db.reelStageStats,
    db.weeklyReviews,
    db.ocrImports,
    db.contentIdeas,
    db.hooks,
    db.captionTemplates,
    db.hashtagSetRecords,
    db.storyTrackers,
    db.carouselPlans,
    db.monthlyReviews,
    db.experiments,
    db.remakeIdeas,
    db.commentIdeas,
    db.audienceInsights,
    db.profileChecklists,
    db.streakHistory,
    db.rewardProgress,
    db.ideaMaps,
    db.collabTrackers,
    db.inspirationTrackers,
    db.childPrivacyChecklists,
    db.goalTrackers,
    db.backupMetadata,
  ]
  await db.transaction(
    'rw',
    tables,
    async () => {
      if (mode === 'replace') await Promise.all(tables.map((table) => table.clear()))
      await Promise.all([
        db.settings.bulkPut(payload.data.settings ?? []),
        db.dailyPlans.bulkPut(payload.data.dailyPlans ?? []),
        db.dailyChecklists.bulkPut(payload.data.dailyChecklists ?? []),
        db.reelPerformances.bulkPut(payload.data.reelPerformances ?? []),
        db.reelStageStats.bulkPut(payload.data.reelStageStats ?? []),
        db.weeklyReviews.bulkPut(payload.data.weeklyReviews ?? []),
        db.ocrImports.bulkPut(payload.data.ocrImports ?? []),
        db.contentIdeas.bulkPut(payload.data.contentIdeas ?? []),
        db.hooks.bulkPut(payload.data.hooks ?? []),
        db.captionTemplates.bulkPut(payload.data.captionTemplates ?? []),
        db.hashtagSetRecords.bulkPut(payload.data.hashtagSetRecords ?? []),
        db.storyTrackers.bulkPut(payload.data.storyTrackers ?? []),
        db.carouselPlans.bulkPut(payload.data.carouselPlans ?? []),
        db.monthlyReviews.bulkPut(payload.data.monthlyReviews ?? []),
        db.experiments.bulkPut(payload.data.experiments ?? []),
        db.remakeIdeas.bulkPut(payload.data.remakeIdeas ?? []),
        db.commentIdeas.bulkPut(payload.data.commentIdeas ?? []),
        db.audienceInsights.bulkPut(payload.data.audienceInsights ?? []),
        db.profileChecklists.bulkPut(payload.data.profileChecklists ?? []),
        db.streakHistory.bulkPut(payload.data.streakHistory ?? []),
        db.rewardProgress.bulkPut(payload.data.rewardProgress ?? []),
        db.ideaMaps.bulkPut(payload.data.ideaMaps ?? []),
        db.collabTrackers.bulkPut(payload.data.collabTrackers ?? []),
        db.inspirationTrackers.bulkPut(payload.data.inspirationTrackers ?? []),
        db.childPrivacyChecklists.bulkPut(payload.data.childPrivacyChecklists ?? []),
        db.goalTrackers.bulkPut(payload.data.goalTrackers ?? []),
        db.backupMetadata.bulkPut(payload.data.backupMetadata ?? []),
      ])
    },
  )
}

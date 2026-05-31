import { calculateReelMetrics, calculateWeeklyMetrics } from '../utils/calculations'
import { db } from './dexie'

const cleanCell = (value: unknown) => {
  if (value === undefined || value === null) return ''
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const downloadCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => cleanCell(row[header])).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const exportReelsCsv = async () => {
  const reels = await db.reelPerformances.toArray()
  downloadCsv(
    `twinkle-reels-${new Date().toISOString().slice(0, 10)}.csv`,
    reels.map((reel) => ({ ...reel, ...calculateReelMetrics(reel) })),
  )
}

export const exportWeeklyReviewsCsv = async () => {
  const reviews = await db.weeklyReviews.toArray()
  downloadCsv(
    `twinkle-weekly-reviews-${new Date().toISOString().slice(0, 10)}.csv`,
    reviews.map((review) => ({ ...review, ...calculateWeeklyMetrics(review) })),
  )
}

export const exportDailyPlansCsv = async () => {
  downloadCsv(`twinkle-daily-plans-${new Date().toISOString().slice(0, 10)}.csv`, (await db.dailyPlans.toArray()).map((row) => ({ ...row })))
}

export const exportStoryTrackersCsv = async () => {
  downloadCsv(`twinkle-story-tracker-${new Date().toISOString().slice(0, 10)}.csv`, (await db.storyTrackers.toArray()).map((row) => ({ ...row })))
}

export const exportAudienceInsightsCsv = async () => {
  downloadCsv(`twinkle-audience-insights-${new Date().toISOString().slice(0, 10)}.csv`, (await db.audienceInsights.toArray()).map((row) => ({ ...row })))
}

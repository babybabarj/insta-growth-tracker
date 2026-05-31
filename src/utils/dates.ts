export const todayISO = () => new Date().toISOString().slice(0, 10)

export const nowISO = () => new Date().toISOString()

export const formatDate = (value?: string) => {
  if (!value) return 'Not set'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export const getWeekRangeLabel = (startDate: string, endDate: string) => {
  if (!startDate && !endDate) return 'No date range'
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

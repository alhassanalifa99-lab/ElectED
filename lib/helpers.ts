export function exportToCSV(data: object[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify((row as any)[h] ?? '')).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function isElectionActive(startDate: string, endDate: string) {
  const now = new Date()
  return new Date(startDate) <= now && now <= new Date(endDate)
}

export function getElectionStatus(
  isActive: boolean,
  startDate: string,
  endDate: string
): 'upcoming' | 'active' | 'ended' {
  const now = new Date()
  if (now < new Date(startDate)) return 'upcoming'
  if (now > new Date(endDate)) return 'ended'
  if (isActive) return 'active'
  return 'upcoming'
}
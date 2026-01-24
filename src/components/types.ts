export interface PageMeta {
  title?: string
  status?: 'seedling' | 'budding' | 'evergreen'
  created?: string
  updated?: string
}

// Date info extracted from a page's frontmatter
export interface DateInfo {
  date: string // YYYY-MM-DD
  year: string // YYYY
  month: string // YYYY-MM
  week: string // YYYY-wNN
}

// Log page types for temporal navigation
export type LogPeriod = 'day' | 'week' | 'month' | 'year'

export interface LogPageMeta {
  period: LogPeriod
  date: string // The date string (YYYY-MM-DD, YYYY-wNN, YYYY-MM, or YYYY)
  year: string
  month?: string
  week?: string
  day?: string
}

export interface BacklinkItem {
  slug: string
  title: string
  linkText?: string // display text used in the link, if different from slug
}

export interface LinkInfo {
  slug: string
  linkText: string | null
}

export interface PageData {
  slug: string
  meta: PageMeta
  body: string
  links: LinkInfo[]
  file: string
}

export type Status = 'seedling' | 'budding' | 'evergreen'

// Refined status labels for Braun-style design
export const STATUS_LABELS: Record<Status, string> = {
  seedling: 'Seedling',
  budding: 'Budding',
  evergreen: 'Evergreen',
}

// Legacy: keeping for backwards compatibility if needed
export const STATUS_ICONS: Record<Status, string> = {
  seedling: '🌱',
  budding: '🌿',
  evergreen: '🌲',
}

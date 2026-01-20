export interface PageMeta {
  title?: string
  status?: 'seedling' | 'budding' | 'evergreen'
  created?: string
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

export const STATUS_ICONS: Record<Status, string> = {
  seedling: '🌱',
  budding: '🌿',
  evergreen: '🌲',
}

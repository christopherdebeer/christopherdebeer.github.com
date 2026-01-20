export interface PageMeta {
  title?: string
  status?: 'seedling' | 'budding' | 'evergreen'
  created?: string
}

export interface PageData {
  slug: string
  meta: PageMeta
  body: string
  links: string[]
  file: string
}

export type Status = 'seedling' | 'budding' | 'evergreen'

export const STATUS_ICONS: Record<Status, string> = {
  seedling: '🌱',
  budding: '🌿',
  evergreen: '🌲',
}

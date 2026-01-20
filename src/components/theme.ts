export const theme = {
  colors: {
    light: {
      bg: '#fffcf7',
      fg: '#2d2d2d',
      link: '#3366cc',
      broken: '#cc3366',
      muted: '#888',
    },
    dark: {
      bg: '#1a1a1a',
      fg: '#e0e0e0',
      link: '#6699ff',
      broken: '#ff6699',
      muted: '#666',
    },
  },
  fonts: {
    body: 'Georgia, serif',
  },
  sizes: {
    body: '18px',
    lineHeight: 1.6,
    maxWidth: '640px',
  },
} as const

export type Theme = typeof theme

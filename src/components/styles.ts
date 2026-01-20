import { theme } from './theme.js'

const { colors, fonts, sizes } = theme

export const globalStyles = `
:root {
  --bg: ${colors.light.bg};
  --fg: ${colors.light.fg};
  --link: ${colors.light.link};
  --broken: ${colors.light.broken};
  --muted: ${colors.light.muted};
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: ${colors.dark.bg};
    --fg: ${colors.dark.fg};
    --link: ${colors.dark.link};
    --broken: ${colors.dark.broken};
    --muted: ${colors.dark.muted};
  }
}
* { box-sizing: border-box; }
body {
  font: ${sizes.body}/${sizes.lineHeight} ${fonts.body};
  max-width: ${sizes.maxWidth};
  margin: 2rem auto;
  padding: 0 1rem;
  background: var(--bg);
  color: var(--fg);
}
a { color: var(--link); }
a.broken { color: var(--broken); border-bottom: 1px dashed; }
h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
.meta { color: var(--muted); font-size: 0.85rem; margin-bottom: 2rem; }
.meta a { color: var(--muted); margin-left: 1rem; }
.backlinks { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--muted); font-size: 0.9rem; }
.backlinks h2 { font-size: 1rem; color: var(--muted); }
.backlinks ul { padding-left: 1.2rem; }
#edit-link { display: none; }
`

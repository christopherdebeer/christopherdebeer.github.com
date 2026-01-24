import React from 'react'
import { Backlinks } from './Backlinks.js'
import { BacklinkItem, LogPageMeta, LogPeriod } from './types.js'

interface LogPageProps {
  meta: LogPageMeta
  backlinks: BacklinkItem[]
  // Notes created on this date
  created: BacklinkItem[]
  // Notes updated on this date
  updated: BacklinkItem[]
  // Child periods (e.g., days in a week, weeks in a month)
  children?: { slug: string; title: string; count: number }[]
}

const PERIOD_LABELS: Record<LogPeriod, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
}

function formatDateTitle(meta: LogPageMeta): string {
  switch (meta.period) {
    case 'day':
      return meta.date // YYYY-MM-DD
    case 'week':
      return `Week ${meta.week?.split('-w')[1]} of ${meta.year}`
    case 'month': {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
      const monthNum = parseInt(meta.month?.split('-')[1] || '1', 10) - 1
      return `${monthNames[monthNum]} ${meta.year}`
    }
    case 'year':
      return meta.year
    default:
      return meta.date
  }
}

function getParentLinks(meta: LogPageMeta): { href: string; label: string }[] {
  const links: { href: string; label: string }[] = []

  if (meta.period === 'day' && meta.week) {
    links.push({ href: `/log/${meta.week}.html`, label: `Week ${meta.week.split('-w')[1]}` })
  }
  if ((meta.period === 'day' || meta.period === 'week') && meta.month) {
    const monthNum = parseInt(meta.month.split('-')[1], 10)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    links.push({ href: `/log/${meta.month}.html`, label: monthNames[monthNum - 1] })
  }
  if (meta.period !== 'year') {
    links.push({ href: `/log/${meta.year}.html`, label: meta.year })
  }

  return links
}

export function LogPage({ meta, backlinks, created, updated, children }: LogPageProps) {
  const title = formatDateTitle(meta)
  const parentLinks = getParentLinks(meta)
  const srcPath = `docs/log/${meta.date}.md`

  const hasContent = created.length > 0 || updated.length > 0 || (children && children.length > 0)

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{`${title} — Log`}</title>
        <link rel="stylesheet" href="/assets/styles.css" />
      </head>
      <body>
        <header className="site-header">
          <a href="/" className="site-name">Garden</a>
          <span className="site-nav-sep">/</span>
          <a href="/log.html" className="site-nav-link">Log</a>
        </header>
        <main className="page log-page">
          <article>
            <header className="log-header">
              <span className="log-period">{PERIOD_LABELS[meta.period]}</span>
              <h1>{title}</h1>
              {parentLinks.length > 0 && (
                <nav className="log-nav">
                  {parentLinks.map((link, i) => (
                    <span key={link.href}>
                      {i > 0 && <span className="log-nav-sep">/</span>}
                      <a href={link.href}>{link.label}</a>
                    </span>
                  ))}
                </nav>
              )}
            </header>

            {!hasContent && (
              <p className="stub-notice">No activity recorded for this {meta.period}.</p>
            )}

            {children && children.length > 0 && (
              <section className="log-section">
                <h2>{meta.period === 'year' ? 'Months' : meta.period === 'month' ? 'Weeks' : 'Days'}</h2>
                <ul className="log-children">
                  {children.map((child) => (
                    <li key={child.slug}>
                      <a href={`/log/${child.slug}.html`}>{child.title}</a>
                      {child.count > 0 && <span className="log-count">{child.count}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {created.length > 0 && (
              <section className="log-section">
                <h2>Created</h2>
                <ul className="log-notes">
                  {created.map((note) => (
                    <li key={note.slug}>
                      <a href={`/${note.slug}.html`}>{note.title}</a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {updated.length > 0 && (
              <section className="log-section">
                <h2>Updated</h2>
                <ul className="log-notes">
                  {updated.map((note) => (
                    <li key={note.slug}>
                      <a href={`/${note.slug}.html`}>{note.title}</a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </article>

          {backlinks.length > 0 && <Backlinks links={backlinks} />}
        </main>
        <footer className="site-footer">
          <a href={`/edit.html?file=${srcPath}`}>Edit Log</a>
          <span className="footer-sep">·</span>
          <a href={`/edit.html?capture=today`}>Capture</a>
        </footer>
      </body>
    </html>
  )
}

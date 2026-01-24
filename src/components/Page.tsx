import React from 'react'
import { Backlinks } from './Backlinks.js'
import { BacklinkItem, PageMeta, STATUS_LABELS, Status } from './types.js'

interface PageProps {
  title: string
  content: string
  meta: PageMeta
  slug: string
  backlinks: BacklinkItem[]
}

export function Page({ title, content, meta, slug, backlinks }: PageProps) {
  const status = (meta.status || 'seedling') as Status
  const statusLabel = STATUS_LABELS[status]
  const srcPath = `docs/${slug}.md`

  // Don't link log pages to themselves
  const isLogPage = slug.startsWith('log/')

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="stylesheet" href="/assets/styles.css" />
      </head>
      <body>
        <header className="site-header">
          <a href="/" className="site-name">Garden</a>
        </header>
        <main className="page">
          <article>
            <h1>
              <span className={`status-indicator ${status}`}>{statusLabel}</span>
              {title}
            </h1>
            <div className="meta">
              {meta.created && (
                <span className="meta-date">
                  {isLogPage ? (
                    meta.created
                  ) : (
                    <a href={`/log/${meta.created}.html`}>{meta.created}</a>
                  )}
                </span>
              )}
              {meta.updated && meta.updated !== meta.created && (
                <span className="meta-updated">
                  {' · updated '}
                  {isLogPage ? (
                    meta.updated
                  ) : (
                    <a href={`/log/${meta.updated}.html`}>{meta.updated}</a>
                  )}
                </span>
              )}
            </div>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </article>
          <Backlinks links={backlinks} />
        </main>
        <footer className="site-footer">
          <a href={`/edit.html?file=${srcPath}`}>Edit</a>
        </footer>
      </body>
    </html>
  )
}

import React from 'react'
import { Backlinks } from './Backlinks.js'
import { BacklinkItem, PageMeta, STATUS_ICONS, Status } from './types.js'

interface PageProps {
  title: string
  content: string
  meta: PageMeta
  slug: string
  backlinks: BacklinkItem[]
}

export function Page({ title, content, meta, slug, backlinks }: PageProps) {
  const status = (meta.status || 'seedling') as Status
  const statusIcon = STATUS_ICONS[status] || ''
  const srcPath = `docs/${slug}.md`

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
        <div className="page">
          <article>
            <h1>
              {statusIcon} {title}
            </h1>
            <div className="meta">
              {meta.created || ''}
            </div>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </article>
          <Backlinks links={backlinks} />
        </div>
        <footer className="site-footer">
          <a href={`/edit.html?file=${srcPath}`}>edit</a>
        </footer>
      </body>
    </html>
  )
}

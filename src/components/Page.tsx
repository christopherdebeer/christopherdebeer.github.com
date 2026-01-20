import React from 'react'
import { Backlinks } from './Backlinks.js'
import { PageMeta, STATUS_ICONS, Status } from './types.js'

interface PageProps {
  title: string
  content: string
  meta: PageMeta
  slug: string
  backlinks: string[]
}

export function Page({ title, content, meta, slug, backlinks }: PageProps) {
  const status = (meta.status || 'seedling') as Status
  const statusIcon = STATUS_ICONS[status] || ''
  const srcPath = `src/${slug}.md`

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="stylesheet" href="/assets/styles.css" />
      </head>
      <body>
        <div className="page">
          <article>
            <h1>
              {statusIcon} {title}
            </h1>
            <div className="meta">
              {meta.created || ''}
              <a href={`/edit.html?file=${srcPath}`} id="edit-link">
                edit
              </a>
            </div>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </article>
          <Backlinks links={backlinks} />
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `if(sessionStorage.getItem('gh-token'))document.getElementById('edit-link').style.display='inline'`,
          }}
        />
      </body>
    </html>
  )
}

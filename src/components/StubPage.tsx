import React from 'react'
import { Backlinks } from './Backlinks.js'

interface DisambiguatePage {
  slug: string
  title: string
}

interface StubPageProps {
  slug: string
  backlinks: string[]
  // For disambiguation: multiple pages with same base slug
  disambiguate?: DisambiguatePage[]
}

export function StubPage({ slug, backlinks, disambiguate }: StubPageProps) {
  const title = slug.split('/').pop() || slug
  const srcPath = `docs/${slug}.md`

  // Find canonical page: prefer root-level (no '/'), otherwise first alphabetically
  const canonical = disambiguate?.length
    ? disambiguate.find((p) => !p.slug.includes('/')) ||
      [...disambiguate].sort((a, b) => a.slug.localeCompare(b.slug))[0]
    : null

  const hasDisambiguation = disambiguate && disambiguate.length > 0
  const multipleOptions = disambiguate && disambiguate.length > 1

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="stylesheet" href="/assets/styles.css" />
      </head>
      <body>
        <div className="page stub-page">
          <article>
            <h1>{title}</h1>
            <div className="meta">
              <a href={`/edit.html?file=${srcPath}`} id="edit-link">
                create this note
              </a>
            </div>

            {hasDisambiguation ? (
              <>
                <div className="disambiguate-banner">
                  {multipleOptions ? (
                    <>
                      <strong>{title}</strong> could refer to:{' '}
                      {disambiguate.map((page, i) => (
                        <span key={page.slug}>
                          {i > 0 && ', '}
                          <a href={`/${page.slug}.html`}>{page.slug}</a>
                        </span>
                      ))}
                    </>
                  ) : (
                    <>
                      Did you mean{' '}
                      <a href={`/${canonical!.slug}.html`}>{canonical!.title}</a>
                      <span className="slug-hint"> ({canonical!.slug})</span>?
                    </>
                  )}
                </div>
                <p className="stub-notice">
                  Or create <strong>{slug}</strong> as a new note at the root level.
                </p>
              </>
            ) : (
              <p className="stub-notice">This note doesn't exist yet.</p>
            )}

            {backlinks.length > 0 && (
              <p className="stub-hint">
                {backlinks.length === 1
                  ? 'One note links'
                  : `${backlinks.length} notes link`}{' '}
                here—perhaps one will grow this idea.
              </p>
            )}
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

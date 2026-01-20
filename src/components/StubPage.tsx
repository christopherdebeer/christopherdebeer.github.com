import React from 'react'
import { Backlinks } from './Backlinks.js'

interface StubPageProps {
  slug: string
  backlinks: string[]
  // For disambiguation: multiple pages with same base slug
  disambiguate?: { slug: string; title: string }[]
}

export function StubPage({ slug, backlinks, disambiguate }: StubPageProps) {
  const title = slug.split('/').pop() || slug
  const isDisambiguation = disambiguate && disambiguate.length > 0

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{isDisambiguation ? `${title} (disambiguation)` : title}</title>
        <link rel="stylesheet" href="/assets/styles.css" />
      </head>
      <body>
        <div className="page stub-page">
          <article>
            <h1>{title}</h1>
            {isDisambiguation ? (
              <>
                <p className="stub-notice">
                  This link could refer to multiple notes:
                </p>
                <ul className="disambiguate-list">
                  {disambiguate.map((page) => (
                    <li key={page.slug}>
                      <a href={`/${page.slug}.html`}>{page.title}</a>
                      <span className="slug-hint">{page.slug}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="stub-notice">
                This note doesn't exist yet.
              </p>
            )}
            {backlinks.length > 0 && (
              <p className="stub-hint">
                {backlinks.length === 1 ? 'One note links' : `${backlinks.length} notes link`} here—perhaps one will grow this idea.
              </p>
            )}
          </article>
          <Backlinks links={backlinks} />
        </div>
      </body>
    </html>
  )
}

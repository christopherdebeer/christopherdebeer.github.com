import React from 'react'
import { BacklinkItem } from './types.js'

interface BacklinksProps {
  links: BacklinkItem[]
}

export function Backlinks({ links }: BacklinksProps) {
  if (links.length === 0) return null

  return (
    <section className="backlinks">
      <h2>Linked from</h2>
      <ul>
        {links.map(({ slug, title }) => (
          <li key={slug}>
            <a href={`/${slug}.html`}>{title}</a>
            {title !== slug && <span className="slug-hint"> ({slug})</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}

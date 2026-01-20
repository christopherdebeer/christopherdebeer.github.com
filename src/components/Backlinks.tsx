import React from 'react'

interface BacklinksProps {
  links: string[]
}

export function Backlinks({ links }: BacklinksProps) {
  if (links.length === 0) return null

  return (
    <section className="backlinks">
      <h2>Linked from</h2>
      <ul>
        {links.map((slug) => (
          <li key={slug}>
            <a href={`/${slug}.html`}>{slug}</a>
          </li>
        ))}
      </ul>
    </section>
  )
}

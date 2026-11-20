import type { ReactNode } from 'react'

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string
  title: string
  description?: ReactNode
  centered?: boolean
}) {
  return (
    <div className={`section-heading ${centered ? 'text-center' : ''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  )
}

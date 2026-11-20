import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type PageHeroProps = {
  eyebrow: string
  title: string
  description?: string
  children?: ReactNode
}

export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="page-hero-image" aria-hidden="true" />
      <div className="container-site page-hero-content">
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>{title}</span>
        </div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
        {children}
      </div>
    </section>
  )
}

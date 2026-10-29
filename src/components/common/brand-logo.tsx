import { Link } from '@tanstack/react-router'
import { Gavel } from 'lucide-react'

export function BrandLogo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 rounded-md font-heading text-xl font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Gavel className="size-4" aria-hidden />
      </span>
      Stonebid
    </Link>
  )
}

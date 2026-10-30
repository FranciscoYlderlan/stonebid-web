import type { ReactNode } from 'react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type StatCardProps = {
  label: string
  value: ReactNode
  hint?: ReactNode
  'data-testid'?: string
}

/** Um número em destaque com rótulo (saldo, total, contagem). */
export function StatCard({
  label,
  value,
  hint,
  'data-testid': testId,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className="font-heading text-2xl tabular-nums"
          data-testid={testId}
        >
          {value}
        </CardTitle>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardHeader>
    </Card>
  )
}

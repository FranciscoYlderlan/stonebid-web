import { StatCard } from '@/components/common/stat-card'
import { formatCents } from '@/lib/money'

import type { Wallet } from '../types/wallet-types'

/** Total, comprometido e disponível (RF-40): disponível = total − comprometido. */
export function WalletBalance({ wallet }: { wallet: Wallet }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Disponível"
        value={formatCents(wallet.availableCents)}
        hint="Pode ser usado em novos lances."
        data-testid="wallet-available"
      />
      <StatCard
        label="Comprometido"
        value={formatCents(wallet.committedCents)}
        hint="Reservado nos lotes em que você lidera."
        data-testid="wallet-committed"
      />
      <StatCard
        label="Total"
        value={formatCents(wallet.totalCents)}
        hint="Disponível + comprometido."
        data-testid="wallet-total"
      />
    </div>
  )
}

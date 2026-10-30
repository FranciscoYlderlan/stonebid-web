import { ErrorState } from '@/components/common/error-state'
import { Skeleton } from '@/components/ui/skeleton'

import { useWallet } from '../hooks/useWallet'
import { useWalletMovements } from '../hooks/useWalletMovements'
import { DepositForm } from './deposit-form'
import { MovementsTable } from './movements-table'
import { WalletBalance } from './wallet-balance'

/** Carteira do licitante: saldos, depósito e extrato. */
export function WalletOverview() {
  const wallet = useWallet()
  const movements = useWalletMovements()

  return (
    <div className="space-y-10">
      {wallet.isPending ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : wallet.isError ? (
        <ErrorState
          title="Não foi possível carregar a carteira"
          error={wallet.error}
          onRetry={() => void wallet.refetch()}
        />
      ) : (
        <>
          <WalletBalance wallet={wallet.data} />
          <DepositForm depositLimitCents={wallet.data.depositLimitCents} />
        </>
      )}

      <section aria-labelledby="movements-heading" className="space-y-4">
        <h2
          id="movements-heading"
          className="font-heading text-xl font-semibold"
        >
          Extrato
        </h2>
        {movements.isPending ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : movements.isError ? (
          <ErrorState
            title="Não foi possível carregar o extrato"
            error={movements.error}
            onRetry={() => void movements.refetch()}
          />
        ) : (
          <MovementsTable movements={movements.data} />
        )}
      </section>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '@/components/common/page-header'
import { AccountSummary } from '@/features/auth'

export const Route = createFileRoute('/_app/account/')({
  component: () => (
    <div className="space-y-8">
      <PageHeader title="Minha conta" description="Seus dados de acesso." />
      <AccountSummary />
    </div>
  ),
})

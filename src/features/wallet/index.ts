// API pública da feature wallet: nada de fora importa arquivos internos.
export {
  movementsQueryOptions,
  walletKeys,
  walletQueryOptions,
} from './api/wallet-api'
export { WalletOverview } from './components/wallet-overview'
export type { Movement, Wallet } from './types/wallet-types'

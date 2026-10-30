// API pública da feature lots: nada de fora importa arquivos internos.
export {
  auctioneerLotsQueryOptions,
  bidHistoryQueryOptions,
  lotQueryOptions,
  lotsKeys,
  showcaseQueryOptions,
} from './api/lots-api'
export { AuctioneerPanel } from './components/auctioneer-panel'
export { BidPanel } from './components/bid-panel'
export { LotOutcome } from './components/lot-outcome'
export { LotRoom } from './components/lot-room'
export { LotStatusBadge } from './components/lot-status-badge'
export { LotsShowcase } from './components/lots-showcase'
export { LOT_STATUS_LABELS, lotSchema } from './schemas/lot-schemas'
export type { Lot, LotResult, LotStatus, LotViewer } from './types/lot-types'

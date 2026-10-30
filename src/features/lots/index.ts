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
export { LotRoom } from './components/lot-room'
export { LotsShowcase } from './components/lots-showcase'
export { LOT_STATUS_LABELS } from './schemas/lot-schemas'
export type { Lot, LotStatus } from './types/lot-types'

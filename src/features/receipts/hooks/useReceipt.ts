import { useQuery } from '@tanstack/react-query'

import { receiptQueryOptions } from '../api/receipts-api'

export function useReceipt(publicId: string) {
  return useQuery(receiptQueryOptions(publicId))
}

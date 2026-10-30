import type { Page, Request, Route } from '@playwright/test'

import { MOCK_API_URL } from './constants'

type Role = 'AUCTIONEER' | 'BIDDER'
type LotStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELED'

export type MockLot = {
  id: string
  title: string
  attributes: Record<string, string>
  imageUrl: string
  startingBidCents: number
  minIncrementCents: number
  currentBidCents: number | null
  startsAt: string
  originalEndsAt: string
  endsAt: string
  status: LotStatus
  canceledAt: string | null
}

export type MockMovement = {
  id: string
  type: 'DEPOSIT' | 'COMMIT' | 'RELEASE' | 'DEBIT' | 'CREDIT' | 'REFUND'
  amountCents: number
  lotId: string | null
  createdAt: string
}

export type CatalogItem = {
  externalId: string
  title: string
  imageUrl: string
  attributes: Record<string, string>
}

const HOUR = 60 * 60 * 1000

export const USERS: Record<
  Role,
  { id: string; name: string; email: string; role: Role }
> = {
  AUCTIONEER: {
    id: 'u-auc',
    name: 'Ana Leiloeira',
    email: 'ana@exemplo.com',
    role: 'AUCTIONEER',
  },
  BIDDER: {
    id: 'u-bid',
    name: 'Bruno Licitante',
    email: 'bruno@exemplo.com',
    role: 'BIDDER',
  },
}

export function makeLot(
  id: string,
  status: LotStatus,
  serverTime: Date,
  overrides: Partial<MockLot> = {},
): MockLot {
  const now = serverTime.getTime()
  const startsAt = {
    SCHEDULED: now + HOUR,
    LIVE: now - HOUR,
    ENDED: now - 3 * HOUR,
    CANCELED: now + HOUR,
  }[status]
  const endsAt = status === 'ENDED' ? now - HOUR : startsAt + 2 * HOUR
  return {
    id,
    title: `Lote ${id}`,
    attributes: { artist: 'Artista Teste' },
    imageUrl: `/lots/${id}/image`,
    startingBidCents: 10_000,
    minIncrementCents: 1_000,
    currentBidCents: null,
    startsAt: new Date(startsAt).toISOString(),
    originalEndsAt: new Date(endsAt).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
    status,
    canceledAt: status === 'CANCELED' ? new Date(now).toISOString() : null,
    ...overrides,
  }
}

function error(status: number, code: string, message: string) {
  return { status, json: { error: { code, message } } }
}

/**
 * API simulada em memória, no formato do contrato da stonebid-api.
 * Guarda as requisições para os testes conferirem corpo e cabeçalhos.
 */
export class MockApi {
  /** Hora do servidor; os testes usam uma bem diferente da local de propósito. */
  serverTime = new Date()
  user: (typeof USERS)[Role] | null = null
  lots: MockLot[] = []
  myLotIds = new Set<string>()
  wallet = {
    totalCents: 50_000,
    committedCents: 10_000,
    availableCents: 40_000,
    depositLimitCents: 1_000_000,
  }
  movements: MockMovement[] = []
  catalog: CatalogItem[] = []
  searchFails = false
  cancelConflict: string | null = null
  /** Atraso das respostas de depósito, para o teste de duplo clique. */
  depositDelayMs = 0
  readonly requests: Request[] = []
  private readonly depositsByKey = new Map<string, MockMovement>()

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  loginAs(role: Role) {
    this.user = USERS[role]
    return this
  }

  requestsTo(method: string, path: string) {
    return this.requests.filter(
      (request) =>
        request.method() === method && new URL(request.url()).pathname === path,
    )
  }

  async install() {
    // Nada sai para a internet: imagens externas e afins falham e caem no marcador.
    await this.page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort())
    await this.page.route(`${MOCK_API_URL}/**`, (route) => this.handle(route))
    if (this.user) {
      await this.page.addInitScript(() =>
        window.localStorage.setItem('stonebid.token', 'token-de-teste'),
      )
    }
  }

  private async handle(route: Route) {
    const request = route.request()
    // A API simulada mora em outra origem: responde o CORS como a real.
    const cors = {
      'Access-Control-Allow-Origin': request.headers()['origin'] ?? '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
        'Authorization, Content-Type, Accept, Idempotency-Key',
    }
    if (request.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers: cors })
    this.requests.push(request)
    const url = new URL(request.url())
    const reply = await this.respond(request.method(), url, request)
    if (reply.delayMs) await new Promise((r) => setTimeout(r, reply.delayMs))
    return route.fulfill({
      status: reply.status,
      headers: cors,
      contentType: 'application/json',
      body: JSON.stringify(reply.json),
    })
  }

  private async respond(
    method: string,
    url: URL,
    request: Request,
  ): Promise<{ status: number; json: unknown; delayMs?: number }> {
    const path = url.pathname
    const serverTime = this.serverTime.toISOString()
    const ok = (json: unknown, status = 200) => ({ status, json })

    if (method === 'GET' && path === '/auth/me') {
      return this.user
        ? ok({ user: this.user })
        : error(401, 'UNAUTHORIZED', 'Faça login.')
    }

    if (method === 'GET' && path === '/lots') {
      const by = (status: LotStatus) =>
        this.lots.filter((lot) => lot.status === status)
      return ok({
        serverTime,
        live: by('LIVE'),
        scheduled: by('SCHEDULED'),
        ended: by('ENDED'),
      })
    }

    const lotMatch = path.match(/^\/lots\/([^/]+)$/)
    if (method === 'GET' && lotMatch) {
      const lot = this.lots.find((item) => item.id === lotMatch[1])
      return lot
        ? ok({ serverTime, lot })
        : error(404, 'NOT_FOUND', 'Lote não encontrado.')
    }

    // Daqui para baixo, só com login e o papel certo (RF-02).
    if (!this.user) return error(401, 'UNAUTHORIZED', 'Faça login.')
    const forbidden = error(403, 'FORBIDDEN', 'Ação não permitida.')

    if (path.startsWith('/wallet') && this.user.role !== 'BIDDER')
      return forbidden
    if (
      (path === '/auctioneer/lots' ||
        path === '/items/search' ||
        (path.startsWith('/lots') && method === 'POST')) &&
      this.user.role !== 'AUCTIONEER'
    )
      return forbidden

    if (method === 'GET' && path === '/wallet') return ok(this.wallet)
    if (method === 'GET' && path === '/wallet/movements')
      return ok({ items: this.movements })

    if (method === 'POST' && path === '/wallet/deposits') {
      const key = request.headers()['idempotency-key']
      if (!key)
        return error(400, 'VALIDATION_ERROR', 'Idempotency-Key obrigatória.')
      const existing = this.depositsByKey.get(key)
      if (existing)
        return {
          status: 200,
          json: { movement: existing, wallet: this.wallet },
          delayMs: this.depositDelayMs,
        }
      const { amountCents } = request.postDataJSON() as { amountCents: number }
      if (amountCents > this.wallet.depositLimitCents)
        return error(400, 'DEPOSIT_LIMIT', 'Depósito acima do teto.')
      const movement: MockMovement = {
        id: `m-${this.movements.length + 1}`,
        type: 'DEPOSIT',
        amountCents,
        lotId: null,
        createdAt: serverTime,
      }
      this.depositsByKey.set(key, movement)
      this.movements = [movement, ...this.movements]
      this.wallet = {
        ...this.wallet,
        totalCents: this.wallet.totalCents + amountCents,
        availableCents: this.wallet.availableCents + amountCents,
      }
      return {
        status: 201,
        json: { movement, wallet: this.wallet },
        delayMs: this.depositDelayMs,
      }
    }

    if (method === 'GET' && path === '/items/search') {
      if (this.searchFails)
        return error(
          502,
          'EXTERNAL_API_UNAVAILABLE',
          'O acervo de arte está fora do ar. Tente de novo em alguns minutos.',
        )
      const q = (url.searchParams.get('q') ?? '').toLowerCase()
      return ok({
        items: this.catalog.filter((item) =>
          item.title.toLowerCase().includes(q),
        ),
        page: Number(url.searchParams.get('page') ?? 1),
      })
    }

    if (method === 'GET' && path === '/auctioneer/lots')
      return ok({
        serverTime,
        items: this.lots.filter((lot) => this.myLotIds.has(lot.id)),
      })

    if (method === 'POST' && path === '/lots') {
      const body = request.postDataJSON() as {
        externalId: string
        startingBidCents: number
        minIncrementCents: number
        startsAt: string
        endsAt: string
      }
      const item = this.catalog.find((c) => c.externalId === body.externalId)
      if (!item) return error(404, 'NOT_FOUND', 'Item não encontrado.')
      const lot = makeLot(
        `novo-${this.lots.length + 1}`,
        'SCHEDULED',
        this.serverTime,
        {
          title: item.title,
          attributes: item.attributes,
          startingBidCents: body.startingBidCents,
          minIncrementCents: body.minIncrementCents,
          startsAt: body.startsAt,
          originalEndsAt: body.endsAt,
          endsAt: body.endsAt,
        },
      )
      this.lots.push(lot)
      this.myLotIds.add(lot.id)
      return ok(lot, 201)
    }

    const cancelMatch = path.match(/^\/lots\/([^/]+)\/cancel$/)
    if (method === 'POST' && cancelMatch) {
      if (this.user.role !== 'AUCTIONEER') return forbidden
      if (this.cancelConflict)
        return error(409, 'LOT_HAS_BIDS', this.cancelConflict)
      const lot = this.lots.find((item) => item.id === cancelMatch[1])
      if (!lot) return error(404, 'NOT_FOUND', 'Lote não encontrado.')
      lot.status = 'CANCELED'
      lot.canceledAt = serverTime
      return ok(lot)
    }

    return error(404, 'NOT_FOUND', 'Recurso não encontrado.')
  }
}

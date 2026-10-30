import type { Page, Request, Route } from '@playwright/test'

import { MOCK_API_URL } from './constants'

type Role = 'AUCTIONEER' | 'BIDDER'
type LotStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELED'

/** Atributos da obra como a API devolve (`ItemAttributes` da stonebid-api). */
export type ItemAttributes = {
  artist: string | null
  date: string | null
  medium: string | null
  dimensions: string | null
  placeOfOrigin: string | null
}

export type MockLot = {
  id: string
  title: string
  attributes: ItemAttributes
  imageUrl: string
  startingBidCents: number
  minIncrementCents: number
  currentBidCents: number | null
  minNextBidCents: number
  leaderPseudonym: string | null
  startsAt: string
  originalEndsAt: string
  endsAt: string
  status: LotStatus
  canceledAt: string | null
  /** Resultado da liquidação; `null` até liquidar (contrato do I3). */
  result: 'SOLD' | 'NO_WINNER' | null
  settledAt: string | null
  /** Comprovante público; só com `result` SOLD. */
  receiptPublicId: string | null
  cancelReason: string | null
}

/** Comprovante como o `GET /receipts/:publicId` devolve (contrato do I3). */
export type MockReceipt = {
  publicId: string
  lotId: string
  title: string
  imageUrl: string
  finalAmountCents: number
  settledAt: string
  winnerPseudonym: string
  finalHash: string
  auditPath: string
}

/** Posição do licitante logado num lote, como o `GET /me/bids` devolve (contrato do I3). */
export type BidPosition = 'LEADING' | 'OUTBID' | 'WON' | 'LOST' | 'CANCELED'

export type MockMyBid = {
  lot: MockLot
  myMaxBidCents: number
  position: BidPosition
  receiptPublicId: string | null
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
  attributes: Partial<ItemAttributes>
}

/** Situação da obra na busca (RN-19), como o `CatalogItemPresenter` da stonebid-api. */
export type ItemAuction = {
  status: 'SCHEDULED' | 'LIVE' | 'SOLD'
  lotId: string
}

/** Lance gravado, como o `BidDto` da stonebid-api (contrato do I2). */
export type MockBid = {
  seq: number
  lotId: string
  amountCents: number
  pseudonym: string
  createdAt: string
}

/** Resposta crua para uma rota, por cima do comportamento normal da API simulada. */
export type MockReply = { status: number; json: unknown }

const NO_ATTRIBUTES: ItemAttributes = {
  artist: null,
  date: null,
  medium: null,
  dimensions: null,
  placeOfOrigin: null,
}

/** Senha de todo usuário da API simulada (login e cadastro). */
export const MOCK_PASSWORD = 'senha-de-teste'

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
    attributes: { ...NO_ATTRIBUTES, artist: 'Artista Teste' },
    imageUrl: `/lots/${id}/image`,
    startingBidCents: 10_000,
    minIncrementCents: 1_000,
    currentBidCents: null,
    minNextBidCents: overrides.startingBidCents ?? 10_000,
    leaderPseudonym: null,
    startsAt: new Date(startsAt).toISOString(),
    originalEndsAt: new Date(endsAt).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
    status,
    canceledAt: status === 'CANCELED' ? new Date(now).toISOString() : null,
    result: null,
    settledAt: null,
    receiptPublicId: null,
    cancelReason: null,
    ...overrides,
  }
}

function error(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return {
    status,
    json: {
      error: { code, message, ...(details === undefined ? {} : { details }) },
    },
  }
}

/** Mensagens do `ItemAlreadyAuctionedError` da stonebid-api. */
const ITEM_ALREADY_AUCTIONED_MESSAGES: Record<ItemAuction['status'], string> = {
  SCHEDULED:
    'Esta obra já tem um lote agendado. Uma obra só pode estar em um lote por vez: ' +
    'para leiloá-la em outro lote, o lote atual precisa ser cancelado.',
  LIVE: 'Esta obra já está em leilão em um lote ao vivo. Uma obra só pode estar em um lote por vez.',
  SOLD: 'Esta obra já foi vendida em leilão e não pode ser leiloada de novo.',
}

/** Centavos em reais, como o `formatCentsAsBRL` da stonebid-api. */
function brl(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(cents / 100)
    .replace(/\s/g, ' ')
}

/** Lote ENDED já liquidado com vencedor, com o comprovante (contrato do I3). */
export function makeSoldLot(
  id: string,
  serverTime: Date,
  {
    amountCents,
    winner,
    receiptPublicId,
  }: { amountCents: number; winner: string; receiptPublicId: string },
): { lot: MockLot; receipt: MockReceipt } {
  const settledAt = new Date(serverTime.getTime() - 30 * 60_000).toISOString()
  const lot = makeLot(id, 'ENDED', serverTime, {
    currentBidCents: amountCents,
    leaderPseudonym: winner,
    result: 'SOLD',
    settledAt,
    receiptPublicId,
  })
  return {
    lot,
    receipt: {
      publicId: receiptPublicId,
      lotId: id,
      title: lot.title,
      imageUrl: `/lots/${id}/image`,
      finalAmountCents: amountCents,
      settledAt,
      winnerPseudonym: winner,
      finalHash: 'a3f1'.repeat(16),
      auditPath: `/lots/${id}/audit`,
    },
  }
}

/** Mensagem do 422 do cancelamento sem motivo válido (`reason` com 3 a 280 caracteres). */
export const CANCEL_REASON_MESSAGE =
  'Informe o motivo do cancelamento, com 3 a 280 caracteres.'

/** Pseudônimo do licitante logado nos lances da API simulada. */
export const MY_PSEUDONYM = 'Licitante 7F3A'

/** Mensagens das recusas de lance (RF-70), no formato da stonebid-api. */
export const BID_MESSAGES = {
  notStarted: 'O lote ainda não começou. Os lances abrem no início do lote.',
  ended: 'O lote já foi encerrado e não aceita mais lances.',
  canceled: 'O lote foi cancelado e não aceita lances.',
  alreadyWinning: 'Você já tem o maior lance deste lote.',
  belowMinimum: (minCents: number) =>
    `O lance mínimo agora é ${brl(minCents)}.`,
  insufficientFunds: (availableCents: number) =>
    `Saldo insuficiente: você tem ${brl(availableCents)} disponível.`,
} as const

const UNAUTHORIZED = error(
  401,
  'UNAUTHORIZED',
  'É preciso entrar para acessar este recurso.',
)

/**
 * API simulada em memória, no formato real da stonebid-api (rotas, corpos, códigos de erro
 * e mensagens conferidos nos controllers). Guarda as requisições para os testes conferirem
 * corpo e cabeçalhos.
 */
export class MockApi {
  /** Hora do servidor; os testes usam uma bem diferente da local de propósito. */
  serverTime = new Date()
  user: (typeof USERS)[Role] | null = null
  /** Contas para login e cadastro; todas com a senha `MOCK_PASSWORD`. */
  accounts: (typeof USERS)[Role][] = [USERS.AUCTIONEER, USERS.BIDDER]
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
  /** Obra (`externalId`) de cada lote: guardado no banco, fora do corpo do lote, como na API. */
  readonly lotItems = new Map<string, string>()
  searchFails = false
  cancelConflict: string | null = null
  /** Comprovantes por `publicId` (`GET /receipts/:publicId`, público). */
  readonly receipts = new Map<string, MockReceipt>()
  /** Lotes com lance do licitante logado (`GET /me/bids`), mais recentes primeiro. */
  myBids: MockMyBid[] = []
  /** Soma dos CREDIT de liquidação do leiloeiro (`GET /auctioneer/lots`). */
  totalReceivedCents = 0
  /** Lances de cada lote, do mais antigo ao mais novo. */
  readonly bids = new Map<string, MockBid[]>()
  /** Lote em que o licitante logado lidera (para o `ALREADY_WINNING`). */
  readonly leading = new Set<string>()
  /** Atraso das respostas de lance, para o teste de duplo clique. */
  bidDelayMs = 0
  /** Quantos lances a API grava e depois perde a resposta (RN-18, como no depósito). */
  dropBidResponses = 0
  private readonly bidsByKey = new Map<string, MockBid>()
  /** Atraso das respostas de depósito, para o teste de duplo clique. */
  depositDelayMs = 0
  /**
   * Quantos depósitos a API grava e depois perde a resposta (conexão cai no caminho de
   * volta): o depósito existe no servidor, mas o navegador vê falha de rede (RN-18).
   */
  dropDepositResponses = 0
  readonly requests: Request[] = []
  private readonly depositsByKey = new Map<string, MockMovement>()
  private readonly overrides = new Map<string, MockReply>()

  private readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  loginAs(role: Role) {
    this.user = USERS[role]
    return this
  }

  /** Força a resposta de uma rota (ex.: corpo fora do contrato, para testar o erro genérico). */
  replyWith(method: string, path: string, reply: MockReply) {
    this.overrides.set(`${method} ${path}`, reply)
    return this
  }

  /** Põe um lote da obra no ar (RN-19): a busca passa a mostrar o selo. */
  auctionItem(externalId: string, lot: MockLot) {
    this.lots.push(lot)
    this.lotItems.set(lot.id, externalId)
    return this
  }

  /**
   * Lote que bloqueia a obra, como o `findBlockingAuctions` da API: agendado ou ao vivo =
   * em leilão; encerrado com lance = vendido. Cancelado ou encerrado sem lance libera.
   */
  private auctionOf(externalId: string): ItemAuction | null {
    for (const lot of this.lots) {
      if (this.lotItems.get(lot.id) !== externalId) continue
      if (lot.status === 'SCHEDULED' || lot.status === 'LIVE')
        return { status: lot.status, lotId: lot.id }
      if (lot.status === 'ENDED' && lot.currentBidCents !== null)
        return { status: 'SOLD', lotId: lot.id }
    }
    return null
  }

  /** Lance de outro licitante já gravado no lote (histórico, lance atual e líder). */
  addBid(lotId: string, amountCents: number, pseudonym: string) {
    const lot = this.lots.find((item) => item.id === lotId)
    if (!lot) throw new Error(`Lote ${lotId} não existe na API simulada`)
    const list = this.bids.get(lotId) ?? []
    const bid: MockBid = {
      seq: list.length + 1,
      lotId,
      amountCents,
      pseudonym,
      createdAt: new Date(
        this.serverTime.getTime() - (10 - list.length) * 60_000,
      ).toISOString(),
    }
    this.bids.set(lotId, [...list, bid])
    lot.currentBidCents = amountCents
    lot.minNextBidCents = amountCents + lot.minIncrementCents
    lot.leaderPseudonym = pseudonym
    if (pseudonym === MY_PSEUDONYM) this.leading.add(lotId)
    else this.leading.delete(lotId)
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, Idempotency-Key',
    }
    if (request.method() === 'OPTIONS')
      return route.fulfill({ status: 204, headers: cors })
    this.requests.push(request)
    const url = new URL(request.url())
    const reply = await this.respond(request.method(), url, request)
    if (reply.delayMs) await new Promise((r) => setTimeout(r, reply.delayMs))
    if (
      request.method() === 'POST' &&
      url.pathname === '/wallet/deposits' &&
      this.dropDepositResponses > 0
    ) {
      this.dropDepositResponses -= 1
      return route.abort('connectionreset')
    }
    if (
      request.method() === 'POST' &&
      /^\/lots\/[^/]+\/bids$/.test(url.pathname) &&
      reply.status < 300 &&
      this.dropBidResponses > 0
    ) {
      this.dropBidResponses -= 1
      return route.abort('connectionreset')
    }
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

    const override = this.overrides.get(`${method} ${path}`)
    if (override) return override

    if (method === 'POST' && path === '/auth/login') {
      const { email, password } = request.postDataJSON() as {
        email: string
        password: string
      }
      const user = this.accounts.find((account) => account.email === email)
      if (!user || password !== MOCK_PASSWORD)
        return error(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.')
      this.user = user
      return ok({ user, token: 'token-de-teste' })
    }

    if (method === 'POST' && path === '/auth/register') {
      const body = request.postDataJSON() as {
        name: string
        email: string
        role: Role
      }
      if (this.accounts.some((account) => account.email === body.email))
        return error(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.')
      const user = {
        id: `u-${this.accounts.length + 1}`,
        name: body.name,
        email: body.email,
        role: body.role,
      }
      this.accounts.push(user)
      this.user = user
      return ok({ user, token: 'token-de-teste' }, 201)
    }

    if (method === 'GET' && path === '/auth/me') {
      return this.user ? ok({ user: this.user }) : UNAUTHORIZED
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
        : error(404, 'LOT_NOT_FOUND', 'Lote não encontrado.')
    }

    const bidsMatch = path.match(/^\/lots\/([^/]+)\/bids$/)
    if (method === 'GET' && bidsMatch) {
      if (!this.lots.some((item) => item.id === bidsMatch[1]))
        return error(404, 'LOT_NOT_FOUND', 'Lote não encontrado.')
      // Público e sem nome nem e-mail: só pseudônimo, valor e hora, seq decrescente.
      const items = [...(this.bids.get(bidsMatch[1]!) ?? [])]
        .reverse()
        .map(({ seq, amountCents, pseudonym, createdAt }) => ({
          seq,
          amountCents,
          pseudonym,
          createdAt,
        }))
      return ok({ items })
    }

    const receiptMatch = path.match(/^\/receipts\/([^/]+)$/)
    if (method === 'GET' && receiptMatch) {
      // Público e sem dado pessoal; inexistente ou adulterado dá o mesmo 404.
      const receipt = this.receipts.get(decodeURIComponent(receiptMatch[1]!))
      return receipt
        ? ok({ receipt })
        : error(404, 'RECEIPT_NOT_FOUND', 'Comprovante não encontrado.')
    }

    // Daqui para baixo, só com login e o papel certo (RF-02).
    if (!this.user) return UNAUTHORIZED

    if (method === 'POST' && bidsMatch) {
      if (this.user.role !== 'BIDDER')
        return error(403, 'FORBIDDEN', 'Seu papel não permite esta ação.')
      return this.placeBid(bidsMatch[1]!, request)
    }
    const forbidden = error(
      403,
      'FORBIDDEN',
      'Seu papel não permite esta ação.',
    )

    if (
      (path.startsWith('/wallet') || path === '/me/bids') &&
      this.user.role !== 'BIDDER'
    )
      return forbidden
    if (
      (path === '/auctioneer/lots' ||
        path === '/items/search' ||
        (path.startsWith('/lots') && method === 'POST')) &&
      this.user.role !== 'AUCTIONEER'
    )
      return forbidden

    if (method === 'GET' && path === '/me/bids')
      return ok({ serverTime, items: this.myBids })

    if (method === 'GET' && path === '/wallet') return ok(this.wallet)
    if (method === 'GET' && path === '/wallet/movements')
      return ok({ items: this.movements })

    if (method === 'POST' && path === '/wallet/deposits') {
      const key = request.headers()['idempotency-key']
      if (!key)
        return error(
          400,
          'VALIDATION_ERROR',
          'Envie o cabeçalho Idempotency-Key (8 a 128 caracteres).',
        )
      const { amountCents } = request.postDataJSON() as { amountCents: number }
      const existing = this.depositsByKey.get(key)
      if (existing && existing.amountCents !== amountCents)
        return error(
          409,
          'IDEMPOTENCY_KEY_REUSED',
          'Esta Idempotency-Key já foi usada com outro valor. Gere uma chave nova para outro depósito.',
        )
      if (existing)
        return {
          status: 200,
          json: { movement: existing, wallet: this.wallet },
          delayMs: this.depositDelayMs,
        }
      if (amountCents > this.wallet.depositLimitCents)
        return error(
          400,
          'DEPOSIT_LIMIT_EXCEEDED',
          `O depósito máximo é de ${brl(this.wallet.depositLimitCents)} por operação.`,
        )
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
          'A API de itens (Art Institute of Chicago) não respondeu. Tente de novo em instantes.',
        )
      const q = (url.searchParams.get('q') ?? '').toLowerCase()
      const items = this.catalog
        .filter((item) => item.title.toLowerCase().includes(q))
        .map((item) => ({
          ...item,
          attributes: { ...NO_ATTRIBUTES, ...item.attributes },
          auction: this.auctionOf(item.externalId),
        }))
      return ok({
        items,
        page: Number(url.searchParams.get('page') ?? 1),
        totalPages: items.length > 0 ? 1 : 0,
      })
    }

    if (method === 'GET' && path === '/auctioneer/lots')
      return ok({
        serverTime,
        items: this.lots.filter((lot) => this.myLotIds.has(lot.id)),
        totalReceivedCents: this.totalReceivedCents,
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
      if (!item)
        return error(
          404,
          'ITEM_NOT_FOUND',
          'Item não encontrado na API de itens ou sem imagem disponível.',
        )
      const blocking = this.auctionOf(body.externalId)
      if (blocking)
        return error(
          409,
          'ITEM_ALREADY_AUCTIONED',
          ITEM_ALREADY_AUCTIONED_MESSAGES[blocking.status],
          blocking,
        )
      const lot = makeLot(
        `novo-${this.lots.length + 1}`,
        'SCHEDULED',
        this.serverTime,
        {
          title: item.title,
          attributes: { ...NO_ATTRIBUTES, ...item.attributes },
          startingBidCents: body.startingBidCents,
          minIncrementCents: body.minIncrementCents,
          startsAt: body.startsAt,
          originalEndsAt: body.endsAt,
          endsAt: body.endsAt,
        },
      )
      this.lots.push(lot)
      this.lotItems.set(lot.id, body.externalId)
      this.myLotIds.add(lot.id)
      return ok(lot, 201)
    }

    const cancelMatch = path.match(/^\/lots\/([^/]+)\/cancel$/)
    if (method === 'POST' && cancelMatch) {
      // Corpo validado antes de tudo, como o schema da rota: `reason` com trim, 3 a 280.
      const body = (request.postDataJSON() ?? {}) as { reason?: unknown }
      const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
      if (reason.length < 3 || reason.length > 280)
        return error(422, 'VALIDATION_ERROR', CANCEL_REASON_MESSAGE)
      const lot = this.lots.find((item) => item.id === cancelMatch[1])
      if (!lot) return error(404, 'LOT_NOT_FOUND', 'Lote não encontrado.')
      if (!this.myLotIds.has(lot.id))
        return error(
          403,
          'FORBIDDEN',
          'Só o leiloeiro que criou o lote pode cancelá-lo.',
        )
      if (lot.status === 'CANCELED')
        return error(409, 'LOT_NOT_CANCELABLE', 'O lote já está cancelado.')
      if (lot.status === 'ENDED')
        return error(
          409,
          'LOT_ENDED',
          'O lote já foi encerrado e não pode ser cancelado.',
        )
      // Sem lances no I1: o conflito por lance é forçado pelo teste.
      if (this.cancelConflict)
        return error(409, 'LOT_NOT_CANCELABLE', this.cancelConflict)
      lot.status = 'CANCELED'
      lot.canceledAt = serverTime
      lot.cancelReason = reason
      return ok(lot)
    }

    return error(404, 'NOT_FOUND', 'Recurso não encontrado.')
  }

  /** `POST /lots/:id/bids`, na ordem de checagem do contrato do I2 (RF-70). */
  private placeBid(
    lotId: string,
    request: Request,
  ): { status: number; json: unknown; delayMs?: number } {
    const delayMs = this.bidDelayMs
    const key = request.headers()['idempotency-key']
    if (!key)
      return error(
        400,
        'VALIDATION_ERROR',
        'Envie o cabeçalho Idempotency-Key (8 a 128 caracteres).',
      )
    const { amountCents } = request.postDataJSON() as { amountCents: number }
    const lot = this.lots.find((item) => item.id === lotId)
    if (!lot) return error(404, 'LOT_NOT_FOUND', 'Lote não encontrado.')

    const replay = this.bidsByKey.get(key)
    if (replay)
      return {
        status: 200,
        json: { bid: replay, lot, wallet: this.wallet },
        delayMs,
      }

    if (lot.status === 'SCHEDULED')
      return error(409, 'LOT_NOT_STARTED', BID_MESSAGES.notStarted)
    if (lot.status === 'ENDED')
      return error(409, 'LOT_ENDED', BID_MESSAGES.ended)
    if (lot.status === 'CANCELED')
      return error(409, 'LOT_CANCELED', BID_MESSAGES.canceled)
    if (this.leading.has(lotId))
      return error(409, 'ALREADY_WINNING', BID_MESSAGES.alreadyWinning)
    if (amountCents < lot.minNextBidCents)
      return error(
        422,
        'BID_BELOW_MINIMUM',
        BID_MESSAGES.belowMinimum(lot.minNextBidCents),
        { minAmountCents: lot.minNextBidCents },
      )
    if (amountCents > this.wallet.availableCents)
      return error(
        422,
        'INSUFFICIENT_FUNDS',
        BID_MESSAGES.insufficientFunds(this.wallet.availableCents),
        { availableCents: this.wallet.availableCents },
      )

    this.addBid(lotId, amountCents, MY_PSEUDONYM)
    const list = this.bids.get(lotId)!
    const bid = {
      ...list[list.length - 1]!,
      createdAt: this.serverTime.toISOString(),
    }
    list[list.length - 1] = bid
    this.bidsByKey.set(key, bid)
    this.wallet = {
      ...this.wallet,
      committedCents: this.wallet.committedCents + amountCents,
      availableCents: this.wallet.availableCents - amountCents,
    }
    return { status: 201, json: { bid, lot, wallet: this.wallet }, delayMs }
  }
}

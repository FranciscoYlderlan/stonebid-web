import { expect, type Page, test } from '@playwright/test'

import { makeLot, MockApi, MY_PSEUDONYM } from './support/mock-api'

const LOT = 'l-1'
const LOT_PATH = `/lots/${LOT}`
const OTHER = 'Licitante 21BC4D'
const MINUTE = 60_000

const price = (page: Page) => page.getByTestId('lot-price')
const bidButton = (page: Page) =>
  page.getByRole('button', { name: 'Dar lance' })
const lotReads = (api: MockApi) => api.requestsTo('GET', LOT_PATH).length

/** Abre a sala e espera o stream SSE conectar (snapshot recebido). */
async function openRoom(page: Page, api: MockApi, path = LOT_PATH) {
  await api.install()
  await page.goto(path)
  await expect(page.getByTestId('lot-status')).toBeVisible()
  await expect.poll(() => api.openStreams(LOT)).toBe(1)
}

function liveLot(page: Page, role?: 'BIDDER' | 'AUCTIONEER') {
  const api = new MockApi(page)
  if (role) api.loginAs(role)
  api.lots = [makeLot(LOT, 'LIVE', api.serverTime)]
  return api
}

test.describe('Sala ao vivo (RF-31)', () => {
  test('evento de lance atualiza a sala sem recarregar', async ({ page }) => {
    const api = liveLot(page)
    await openRoom(page, api)
    await expect(page.getByText('Nenhum lance ainda')).toBeVisible()
    const reads = lotReads(api)
    await page.evaluate(() => Object.assign(window, { __sameDocument: true }))

    api.addBid(LOT, 15_000, OTHER)
    await api.emit(LOT, 'bid')

    await expect(price(page)).toHaveText('R$ 150,00')
    await expect(page.getByTestId('lot-leader')).toHaveText(OTHER)
    const rows = page.getByTestId('bid-history').getByRole('listitem')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText(OTHER)
    // Mesmo documento e nenhuma leitura nova do lote: veio pelo stream.
    expect(await page.evaluate(() => '__sameDocument' in window)).toBe(true)
    expect(lotReads(api)).toBe(reads)

    // Stream público: sem token, pedindo text/event-stream.
    const stream = api.requestsTo('GET', `${LOT_PATH}/events`)[0]!
    expect(stream.headers()['accept']).toBe('text/event-stream')
    expect(stream.headers()['authorization']).toBeUndefined()
  })

  test('com o stream no ar, a sala não recarrega sozinha', async ({ page }) => {
    const api = liveLot(page)
    await openRoom(page, api)
    const reads = lotReads(api)
    await page.waitForTimeout(4_000)
    expect(lotReads(api)).toBe(reads)
  })

  test('queda do stream: recarga de 3 s até ele voltar', async ({ page }) => {
    const api = liveLot(page)
    await openRoom(page, api)

    api.streamAvailable = false
    await api.dropStreams()
    const reads = lotReads(api)
    // Lance sem evento: só a recarga traz.
    api.addBid(LOT, 15_000, OTHER)
    await expect(price(page)).toHaveText('R$ 150,00', { timeout: 8_000 })
    await expect(page.getByTestId('lot-leader')).toHaveText(OTHER)
    expect(lotReads(api)).toBeGreaterThan(reads)
    await expect
      .poll(() => lotReads(api), { timeout: 8_000 })
      .toBeGreaterThanOrEqual(reads + 2)

    // O stream volta (nova conexão da sala): a recarga para.
    api.streamAvailable = true
    await expect.poll(() => api.openStreams(LOT), { timeout: 12_000 }).toBe(1)
    const afterReconnect = lotReads(api)
    await page.waitForTimeout(4_000)
    expect(lotReads(api)).toBeLessThanOrEqual(afterReconnect + 1)
  })

  test('indicador do licitante: ganhando e superado (RF-30)', async ({
    page,
  }) => {
    const api = liveLot(page, 'BIDDER')
    api.addBid(LOT, 12_000, OTHER)
    await openRoom(page, api, `/bidding/${LOT}`)
    // Ainda sem lance dele: nada a indicar.
    await expect(page.getByTestId('viewer-position')).toHaveCount(0)

    await bidButton(page).click()
    const position = page.getByTestId('viewer-position')
    await expect(position).toHaveText('Você está ganhando')
    await expect(page.getByTestId('lot-leader')).toHaveText(MY_PSEUDONYM)

    // Outro licitante cobre pelo stream (viewer nulo no evento): o indicador vira.
    api.addBid(LOT, 15_000, OTHER)
    await api.emit(LOT, 'bid')
    await expect(position).toHaveText('Você foi superado')
    await expect(page.getByTestId('lot-leader')).toHaveText(OTHER)
  })

  test('prorrogação do anti-sniping move a contagem (RN-10)', async ({
    page,
  }) => {
    const api = liveLot(page)
    const endsAt = api.serverTime.getTime() + 30_000
    api.lots[0]!.endsAt = new Date(endsAt).toISOString()
    await openRoom(page, api)
    const countdown = page.getByTestId('lot-countdown')
    await expect(countdown).toContainText(/Termina em 00:00:[0-3]\d/)
    await expect(page.getByTestId('lot-extended')).toHaveCount(0)

    api.serverTime = new Date(api.serverTime.getTime() + 2_000)
    api.addBid(LOT, 15_000, OTHER)
    api.lots[0]!.endsAt = new Date(endsAt + 2 * MINUTE).toISOString()
    await api.emit(LOT, 'bid')

    await expect(countdown).toContainText(/Termina em 00:02:[0-2]\d/)
    await expect(page.getByTestId('lot-extended')).toHaveText(
      'Prorrogado +2 min',
    )
    // Destaque curto: some sozinho.
    await expect(page.getByTestId('lot-extended')).toHaveCount(0, {
      timeout: 10_000,
    })
  })

  test('contagem zerada trava o lance; encerrado aguarda a liquidação e mostra o vendido', async ({
    page,
  }) => {
    const api = liveLot(page, 'BIDDER')
    api.lots[0]!.endsAt = new Date(
      api.serverTime.getTime() + 3_000,
    ).toISOString()
    api.addBid(LOT, 12_000, OTHER)
    await openRoom(page, api, `/bidding/${LOT}`)
    await expect(bidButton(page)).toBeEnabled()

    await expect(bidButton(page)).toBeDisabled({ timeout: 8_000 })
    await expect(page.getByLabel('Seu lance (R$)')).toBeDisabled()
    await expect(page.getByTestId('lot-countdown')).toContainText(
      'Encerrando agora',
    )

    // O servidor encerra; a sala relê o lote na virada.
    api.serverTime = new Date()
    api.lots[0]!.status = 'ENDED'
    const outcome = page.getByTestId('lot-outcome')
    await expect(outcome).toHaveAttribute('data-outcome', 'awaiting', {
      timeout: 8_000,
    })
    await expect(outcome).toContainText('Aguardando a liquidação')

    api.settle(LOT, 'rc-123')
    await api.emit(LOT, 'settled')
    await expect(outcome).toHaveAttribute('data-outcome', 'sold')
    await expect(page.getByTestId('lot-final-amount')).toHaveText('R$ 120,00')
    await expect(page.getByTestId('lot-winner')).toHaveText(OTHER)
    await expect(
      page.getByRole('link', { name: 'Ver comprovante' }),
    ).toHaveAttribute('href', '/receipts/rc-123')
    await expect(bidButton(page)).toHaveCount(0)
    // Lote final: o stream fecha.
    await expect.poll(() => api.openStreams(LOT)).toBe(0)
  })

  test('vendido: o vencedor vê que arrematou', async ({ page }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    api.lots = [makeLot(LOT, 'ENDED', api.serverTime)]
    api.addBid(LOT, 12_000, OTHER).addBid(LOT, 13_000, MY_PSEUDONYM)
    api.settle(LOT)
    await api.install()
    await page.goto(LOT_PATH)

    await expect(page.getByTestId('lot-outcome')).toContainText(
      'Você arrematou este lote',
    )
    await expect(page.getByTestId('lot-winner')).toHaveText(MY_PSEUDONYM)
    await expect(page.getByRole('link', { name: 'Dar lance' })).toHaveCount(0)
  })

  test('sem vencedor: encerrado sem lances', async ({ page }) => {
    const api = new MockApi(page)
    api.lots = [makeLot(LOT, 'ENDED', api.serverTime)]
    api.settle(LOT)
    await api.install()
    await page.goto(LOT_PATH)

    const outcome = page.getByTestId('lot-outcome')
    await expect(outcome).toHaveAttribute('data-outcome', 'no-winner')
    await expect(outcome).toContainText('Encerrado sem vencedor')
    await expect(
      page.getByRole('link', { name: 'Ver comprovante' }),
    ).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Dar lance' })).toHaveCount(0)
  })

  test('cancelado ao vivo: a sala mostra o motivo pelo stream', async ({
    page,
  }) => {
    const api = liveLot(page)
    api.addBid(LOT, 12_000, OTHER)
    await openRoom(page, api)
    await expect(page.getByRole('link', { name: 'Dar lance' })).toBeVisible()

    api.cancelLot(LOT, 'Obra retirada pelo consignante.')
    await api.emit(LOT, 'canceled')

    const outcome = page.getByTestId('lot-outcome')
    await expect(outcome).toHaveAttribute('data-outcome', 'canceled')
    await expect(page.getByTestId('lot-cancel-reason')).toHaveText(
      'Obra retirada pelo consignante.',
    )
    await expect(page.getByTestId('lot-status')).toHaveText('Cancelado')
    await expect(page.getByRole('link', { name: 'Dar lance' })).toHaveCount(0)
    await expect.poll(() => api.openStreams(LOT)).toBe(0)
  })

  test('leiloeiro não vê "Dar lance" na sala pública', async ({ page }) => {
    const api = liveLot(page, 'AUCTIONEER')
    await openRoom(page, api)
    await expect(page.getByTestId('lot-price')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dar lance' })).toHaveCount(0)
    await expect(page.getByTestId('viewer-position')).toHaveCount(0)
  })
})

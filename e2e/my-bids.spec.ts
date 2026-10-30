import { expect, test } from '@playwright/test'

import { makeLot, makeSoldLot, MockApi, MY_PSEUDONYM } from './support/mock-api'

test.describe('Meus arremates (RF-50)', () => {
  test('lista cada posição, o maior lance e o comprovante', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    const t = api.serverTime
    const won = makeSoldLot('ganho', t, {
      amountCents: 300_000,
      winner: MY_PSEUDONYM,
      receiptPublicId: 'rcpt-ganho',
    })
    api.receipts.set(won.receipt.publicId, won.receipt)
    api.myBids = [
      {
        lot: makeLot('liderando', 'LIVE', t, { currentBidCents: 15_000 }),
        myMaxBidCents: 15_000,
        position: 'LEADING',
        receiptPublicId: null,
      },
      {
        lot: makeLot('superado', 'LIVE', t, { currentBidCents: 22_000 }),
        myMaxBidCents: 20_000,
        position: 'OUTBID',
        receiptPublicId: null,
      },
      {
        lot: won.lot,
        myMaxBidCents: 300_000,
        position: 'WON',
        receiptPublicId: 'rcpt-ganho',
      },
      {
        lot: makeLot('perdido', 'ENDED', t, {
          currentBidCents: 90_000,
          result: 'SOLD',
          receiptPublicId: 'rcpt-de-outro',
        }),
        myMaxBidCents: 80_000,
        position: 'LOST',
        receiptPublicId: null,
      },
      {
        lot: makeLot('cancelado', 'CANCELED', t, {
          currentBidCents: 12_000,
          cancelReason: 'Obra retirada',
        }),
        myMaxBidCents: 12_000,
        position: 'CANCELED',
        receiptPublicId: null,
      },
    ]
    await api.install()
    // Item no menu do licitante, na sidebar da área logada.
    await page.goto('/wallet')
    await page
      .locator('[data-slot="sidebar"]')
      .getByRole('link', { name: 'Meus arremates' })
      .click()
    await expect(page).toHaveURL(/\/my-bids$/)
    await expect(
      page.getByRole('heading', { name: 'Meus arremates', level: 1 }),
    ).toBeVisible()

    const items = page.getByTestId('my-bid')
    await expect(items).toHaveCount(5)
    const item = (id: string) => page.locator(`[data-lot-id="${id}"]`)
    for (const [id, label, max] of [
      ['liderando', 'Liderando', '150,00'],
      ['superado', 'Superado', '200,00'],
      ['ganho', 'Arrematado', '3.000,00'],
      ['perdido', 'Não arrematado', '800,00'],
      ['cancelado', 'Cancelado', '120,00'],
    ] as const) {
      await expect(item(id).getByTestId('bid-position')).toHaveText(label)
      await expect(item(id).getByTestId('my-max-bid')).toContainText(max)
    }
    await expect(item('cancelado')).toContainText(
      'Motivo do cancelamento: Obra retirada',
    )
    // Comprovante só no lote arrematado pelo licitante.
    await expect(
      page.getByRole('link', { name: 'Ver comprovante' }),
    ).toHaveCount(1)
    await item('ganho').getByRole('link', { name: 'Ver comprovante' }).click()
    await expect(page).toHaveURL(/\/receipts\/rcpt-ganho$/)
    await expect(page.getByTestId('receipt-winner')).toHaveText(MY_PSEUDONYM)
  })

  test('sem lances mostra o estado vazio', async ({ page }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    await api.install()
    await page.goto('/my-bids')
    await expect(page.getByText('Você ainda não deu lances')).toBeVisible()
  })

  test('leiloeiro não vê o item no menu nem a lista', async ({ page }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    await api.install()
    await page.goto('/my-bids')
    await expect(page.getByText('Área do licitante')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Meus arremates' }),
    ).toHaveCount(0)
    expect(api.requestsTo('GET', '/me/bids')).toHaveLength(0)
  })
})

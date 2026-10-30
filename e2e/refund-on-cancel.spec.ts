import { expect, test } from '@playwright/test'

import { makeLot, MockApi, MY_PSEUDONYM } from './support/mock-api'

const LOT = 'l-1'
const OTHER = 'Licitante 21BC4D'

test.describe('Estorno no cancelamento (OPC-2)', () => {
  test('lote com lances cancelado ao vivo: carteira e "meus lances" do líder atualizam sem recarregar', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    api.lots = [makeLot(LOT, 'LIVE', api.serverTime)]
    // O licitante logado lidera com R$ 100,00 comprometidos (total 500, disponível 400).
    api.addBid(LOT, 8_000, OTHER).addBid(LOT, 10_000, MY_PSEUDONYM)
    api.movements = [
      {
        id: 'm-1',
        type: 'COMMIT',
        amountCents: 10_000,
        lotId: LOT,
        createdAt: api.serverTime.toISOString(),
      },
    ]
    api.myBids = [
      {
        lot: api.lots[0]!,
        myMaxBidCents: 10_000,
        position: 'LEADING',
        receiptPublicId: null,
      },
    ]
    await api.install()

    // Carteira já no cache antes de ir à sala.
    await page.goto('/wallet')
    await expect(page.getByTestId('wallet-available')).toHaveText('R$ 400,00')
    await expect(page.getByTestId('wallet-committed')).toHaveText('R$ 100,00')
    await page.evaluate(() => Object.assign(window, { __sameDocument: true }))

    await page.getByRole('link', { name: 'Ver lote' }).click()
    await expect(page.getByTestId('lot-status')).toHaveText('Ao vivo')
    await expect.poll(() => api.openStreams(LOT)).toBe(1)
    const walletReads = api.requestsTo('GET', '/wallet').length

    api.cancelLot(LOT, 'Obra retirada pelo consignante.')
    await api.emit(LOT, 'canceled')
    await expect(page.getByTestId('lot-status')).toHaveText('Cancelado')

    // De volta à carteira pelo menu: o saldo vem novo, não o do cache.
    await page.getByRole('link', { name: 'Carteira' }).first().click()
    await expect(page.getByTestId('wallet-available')).toHaveText('R$ 500,00')
    await expect(page.getByTestId('wallet-committed')).toHaveText('R$ 0,00')
    await expect(page.getByTestId('wallet-total')).toHaveText('R$ 500,00')
    expect(api.requestsTo('GET', '/wallet').length).toBeGreaterThan(walletReads)
    const table = page.getByTestId('movements-table')
    const refund = table.getByRole('row').filter({ hasText: 'Estorno' })
    await expect(refund).toHaveCount(1)
    await expect(refund).toContainText('+ R$ 100,00')
    await expect(refund.getByRole('link', { name: 'Ver lote' })).toBeVisible()

    await page.getByRole('link', { name: 'Meus arremates' }).first().click()
    await expect(page.getByTestId('bid-position')).toHaveText('Cancelado')
    // Tudo no mesmo documento: nada recarregou a página.
    expect(await page.evaluate(() => '__sameDocument' in window)).toBe(true)
  })

  test('diálogo avisa quantos lances e o estorno do líder, e o cancelamento passa', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.lots = [
      makeLot('com-lances', 'LIVE', api.serverTime),
      makeLot('sem-lance', 'SCHEDULED', api.serverTime),
    ]
    for (const lot of api.lots) api.myLotIds.add(lot.id)
    api
      .addBid('com-lances', 10_000, 'Licitante A1B2C3')
      .addBid('com-lances', 12_000, OTHER)
      .addBid('com-lances', 15_000, 'Licitante A1B2C3')
    await api.install()
    await page.goto('/auctioneer')

    const card = (title: string) =>
      page.getByTestId('lot-card').filter({ hasText: title })
    const dialog = page.getByRole('alertdialog')

    // Sem lance: ninguém recebe estorno.
    await card('Lote sem-lance')
      .getByRole('button', { name: 'Cancelar', exact: true })
      .click()
    await expect(dialog.getByTestId('cancel-refund')).toHaveText(
      'Sem lances: ninguém recebe estorno.',
    )
    await dialog.getByRole('button', { name: 'Voltar' }).click()
    await expect(dialog).toBeHidden()

    // Com lances: contagem do histórico e o valor do lance atual.
    await card('Lote com-lances')
      .getByRole('button', { name: 'Cancelar', exact: true })
      .click()
    await expect(dialog.getByTestId('cancel-refund')).toHaveText(
      /^3 lances; o líder recebe estorno de R\$\s150,00\.$/,
    )
    await dialog
      .getByLabel('Motivo do cancelamento')
      .fill('Obra retirada pelo comitente')
    await dialog.getByRole('button', { name: 'Cancelar lote' }).click()
    await expect(page.getByText('Lote cancelado.')).toBeVisible()
    expect(api.requestsTo('POST', '/lots/com-lances/cancel')).toHaveLength(1)
    await expect(
      page.getByTestId('section-mine-canceled').getByTestId('lot-card'),
    ).toContainText('Lote com-lances')
  })

  test('sinalizador desligado na API: a recusa (409) aparece no diálogo', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.cancelWithBidsEnabled = false
    api.lots = [makeLot('com-lance', 'LIVE', api.serverTime)]
    api.myLotIds.add('com-lance')
    api.addBid('com-lance', 15_000, OTHER)
    await api.install()
    await page.goto('/auctioneer')

    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByTestId('cancel-refund')).toHaveText(
      /^1 lance; o líder recebe estorno de R\$\s150,00\.$/,
    )
    await dialog.getByLabel('Motivo do cancelamento').fill('Motivo válido')
    await dialog.getByRole('button', { name: 'Cancelar lote' }).click()
    await expect(dialog.getByRole('alert')).toHaveText(
      'O lote já tem lances e não pode ser cancelado.',
    )
  })

  test('auditoria do lote cancelado mostra a data e o motivo', async ({
    page,
  }) => {
    const api = new MockApi(page)
    api.lots = [makeLot(LOT, 'LIVE', api.serverTime)]
    api.addBid(LOT, 15_000, OTHER)
    api.cancelLot(LOT, 'Obra retirada pelo consignante.')
    await api.install()
    await page.goto(`/lots/${LOT}/audit`)

    await expect(page.getByTestId('lot-status')).toHaveText('Cancelado')
    await expect(page.getByTestId('lot-canceled-at')).toHaveText(
      /^\d{2}\/\d{2}\/\d{4},? \d{2}:\d{2}$/,
    )
    await expect(page.getByTestId('lot-cancel-reason')).toHaveText(
      'Obra retirada pelo consignante.',
    )
    await expect(page.getByTestId('audit-verdict')).toHaveAttribute(
      'data-verdict',
      'INTACT',
    )
  })

  test('auditoria ADULTERADO por estorno que não confere (CANCEL_MISMATCH)', async ({
    page,
  }) => {
    const api = new MockApi(page)
    api.lots = [makeLot(LOT, 'LIVE', api.serverTime)]
    api.addBid(LOT, 15_000, OTHER)
    api.cancelLot(LOT, 'Obra retirada pelo consignante.')
    api.audits.set(LOT, {
      verdict: 'TAMPERED',
      firstInconsistency: { seq: null, reason: 'CANCEL_MISMATCH' },
    })
    await api.install()
    await page.goto(`/lots/${LOT}/audit`)

    await expect(page.getByTestId('audit-verdict')).toHaveAttribute(
      'data-verdict',
      'TAMPERED',
    )
    await expect(page.getByTestId('audit-inconsistency')).toContainText(
      'Estorno do cancelamento não confere com o extrato',
    )
  })
})

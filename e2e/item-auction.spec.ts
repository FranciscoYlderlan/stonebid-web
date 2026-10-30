import { expect, test } from '@playwright/test'

import { makeLot, MockApi } from './support/mock-api'

const item = (externalId: string, title: string) => ({
  externalId,
  title,
  imageUrl: `/items/images/${externalId}/thumbnail`,
  attributes: { artist: 'Artista Teste' },
})

const AGENDADA = item('1', 'Obra Agendada')
const AO_VIVO = item('2', 'Obra Ao Vivo')
const VENDIDA = item('3', 'Obra Vendida')
const LIVRE = item('4', 'Obra Livre')
const CANCELADA = item('5', 'Obra Cancelada')
const SEM_LANCE = item('6', 'Obra Sem Lance')

test.describe('Obra única por lote (RN-19)', () => {
  test('busca: selo com link e botão desabilitado; obra livre segue normal', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.catalog = [AGENDADA, AO_VIVO, VENDIDA, LIVRE, CANCELADA, SEM_LANCE]
    api
      .auctionItem('1', makeLot('lote-agendado', 'SCHEDULED', api.serverTime))
      .auctionItem('2', makeLot('lote-vivo', 'LIVE', api.serverTime))
      .auctionItem(
        '3',
        makeLot('lote-vendido', 'ENDED', api.serverTime, {
          currentBidCents: 20_000,
        }),
      )
      .auctionItem('5', makeLot('lote-cancelado', 'CANCELED', api.serverTime))
      .auctionItem('6', makeLot('lote-sem-lance', 'ENDED', api.serverTime))
    await api.install()
    await page.goto('/auctioneer')

    await page.getByLabel('Buscar itens no acervo').fill('obra')
    const cards = page.getByTestId('catalog-item')
    await expect(cards).toHaveCount(6)

    for (const [title, label, lotId, reason] of [
      ['Obra Agendada', 'Em leilão', 'lote-agendado', 'lote agendado'],
      ['Obra Ao Vivo', 'Em leilão', 'lote-vivo', 'lote ao vivo'],
      ['Obra Vendida', 'Vendido', 'lote-vendido', 'já foi vendida'],
    ] as const) {
      const card = cards.filter({ hasText: title })
      const badge = card.getByRole('link', { name: `${label}: ver o lote` })
      await expect(badge).toHaveText(label)
      await expect(badge).toHaveAttribute('href', `/lots/${lotId}`)
      const button = card.getByRole('button', { name: 'Criar lote' })
      await expect(button).toBeDisabled()
      await expect(button).toHaveAccessibleDescription(new RegExp(reason))
    }

    // Livre: sem lote, lote cancelado ou encerrado sem lances.
    for (const title of ['Obra Livre', 'Obra Cancelada', 'Obra Sem Lance']) {
      const card = cards.filter({ hasText: title })
      await expect(card.getByTestId('item-auction')).toHaveCount(0)
      await expect(
        card.getByRole('button', { name: 'Criar lote' }),
      ).toBeEnabled()
    }

    // O selo leva ao lote.
    await cards
      .filter({ hasText: 'Obra Ao Vivo' })
      .getByRole('link', { name: 'Em leilão: ver o lote' })
      .click()
    await expect(page).toHaveURL(/\/lots\/lote-vivo$/)
  })

  test('obra criada agora aparece "Em leilão" na busca', async ({ page }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.catalog = [LIVRE]
    await api.install()
    await page.goto('/auctioneer')

    await page.getByLabel('Buscar itens no acervo').fill('obra')
    const card = page.getByTestId('catalog-item')
    await card.getByRole('button', { name: 'Criar lote' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Lance inicial (R$)').fill('100')
    await dialog.getByLabel('Incremento mínimo (R$)').fill('10')
    await dialog.getByRole('button', { name: 'Criar lote' }).click()

    await expect(page.getByText('Lote “Obra Livre” criado')).toBeVisible()
    await expect(card.getByTestId('item-auction')).toHaveText('Em leilão')
    await expect(
      card.getByRole('button', { name: 'Criar lote' }),
    ).toBeDisabled()
  })

  test('409 na corrida entre a busca e o envio: mensagem amigável com link', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.catalog = [LIVRE]
    await api.install()
    await page.goto('/auctioneer')

    await page.getByLabel('Buscar itens no acervo').fill('obra')
    const card = page.getByTestId('catalog-item')
    await card.getByRole('button', { name: 'Criar lote' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Lance inicial (R$)').fill('100')
    await dialog.getByLabel('Incremento mínimo (R$)').fill('10')

    // Outro leiloeiro cria o lote da obra antes do envio.
    api.auctionItem('4', makeLot('lote-de-outro', 'SCHEDULED', api.serverTime))
    await dialog.getByRole('button', { name: 'Criar lote' }).click()

    const alert = dialog.getByTestId('item-already-auctioned')
    await expect(alert).toContainText('Não dá para criar outro lote desta obra')
    await expect(alert).toContainText('Esta obra já tem um lote agendado.')
    // O texto é do front, não o `message` cru da API.
    await expect(alert).not.toContainText('o lote atual precisa ser cancelado')
    await expect(
      alert.getByRole('link', { name: 'Ver o lote' }),
    ).toHaveAttribute('href', '/lots/lote-de-outro')
    const submit = dialog.getByRole('button', { name: 'Criar lote' })
    await expect(submit).toBeDisabled()
    await expect(submit).toHaveAccessibleDescription(/lote agendado/)
    // A prévia do "Novo lote" ganha o selo; nenhum toast de erro.
    await expect(dialog.getByTestId('item-auction')).toHaveText('Em leilão')
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)
    expect(api.requestsTo('POST', '/lots')).toHaveLength(1)

    // Fechado o diálogo, a busca já mostra o selo.
    await page.keyboard.press('Escape')
    await expect(card.getByTestId('item-auction')).toHaveText('Em leilão')
    await expect(
      card.getByRole('button', { name: 'Criar lote' }),
    ).toBeDisabled()
  })

  test('busca sem `auction` (ausente ou null, banco fora) mostra a obra livre', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.replyWith('GET', '/items/search', {
      status: 200,
      json: {
        items: [
          { ...LIVRE, attributes: {} },
          { ...AGENDADA, attributes: {}, auction: null },
          { ...VENDIDA, attributes: {}, auction: { status: 'OUTRO' } },
        ],
        page: 1,
        totalPages: 1,
      },
    })
    await api.install()
    await page.goto('/auctioneer')

    await page.getByLabel('Buscar itens no acervo').fill('obra')
    const cards = page.getByTestId('catalog-item')
    await expect(cards).toHaveCount(3)
    await expect(page.getByTestId('item-auction')).toHaveCount(0)
    for (const button of await cards
      .getByRole('button', { name: 'Criar lote' })
      .all())
      await expect(button).toBeEnabled()
  })
})

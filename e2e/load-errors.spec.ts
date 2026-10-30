import { expect, type Page, test } from '@playwright/test'

import { makeLot, MockApi } from './support/mock-api'

/** Erro fora do contrato é tentado de novo 2 vezes (query-client) antes de aparecer. */
const LOAD_TIMEOUT = { timeout: 10_000 }
const GENERIC = 'Não foi possível carregar os dados. Tente de novo.'
/** Pedaços do texto que o zod (em inglês) põe na mensagem: nunca podem chegar à tela. */
const ZOD_TEXT =
  /ZodError|expected|invalid_type|received|"path"|"code"|undefined/i

async function expectNoZodText(page: Page) {
  await expect(page.locator('main, body').first()).not.toContainText(ZOD_TEXT)
}

test.describe('Erro de carregamento (RF-40): resposta fora do formato', () => {
  test('carteira com saldo fora do formato mostra a mensagem genérica', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    api.replyWith('GET', '/wallet', {
      status: 200,
      json: { totalCents: 'quinhentos' },
    })
    api.replyWith('GET', '/wallet/movements', { status: 200, json: {} })
    await api.install()
    await page.goto('/wallet')

    await expect(page.getByText(GENERIC).first()).toBeVisible(LOAD_TIMEOUT)
    await expectNoZodText(page)
  })

  test('vitrine fora do formato mostra a mensagem genérica', async ({
    page,
  }) => {
    const api = new MockApi(page)
    api.replyWith('GET', '/lots', { status: 200, json: { live: 'x' } })
    await api.install()
    await page.goto('/')

    await expect(page.getByText(GENERIC)).toBeVisible(LOAD_TIMEOUT)
    await expectNoZodText(page)
  })

  test('lote fora do formato mostra a mensagem genérica', async ({ page }) => {
    const api = new MockApi(page)
    api.replyWith('GET', '/lots/l-1', {
      status: 200,
      json: { lot: { id: 'l-1' } },
    })
    await api.install()
    await page.goto('/lots/l-1')

    await expect(page.getByText(GENERIC)).toBeVisible(LOAD_TIMEOUT)
    await expectNoZodText(page)
  })

  test('busca do leiloeiro fora do formato mostra a mensagem genérica', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.replyWith('GET', '/items/search', {
      status: 200,
      json: { items: [{ externalId: 1 }] },
    })
    await api.install()
    await page.goto('/auctioneer')

    await page.getByLabel('Buscar itens no acervo').fill('water')
    const alert = page.getByTestId('item-search-error')
    await expect(alert).toContainText(GENERIC, LOAD_TIMEOUT)
    await expect(alert).not.toContainText(ZOD_TEXT)
  })

  test('erro da API segue mostrando a mensagem da API', async ({ page }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.searchFails = true
    api.lots = [makeLot('meu', 'SCHEDULED', api.serverTime)]
    await api.install()
    await page.goto('/auctioneer')

    await page.getByLabel('Buscar itens no acervo').fill('water')
    await expect(page.getByTestId('item-search-error')).toContainText(
      'A API de itens (Art Institute of Chicago) não respondeu.',
    )
  })
})

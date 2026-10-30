import { expect, test } from '@playwright/test'

import { MockApi } from './support/mock-api'

test.describe('Guarda de papel', () => {
  test('visitante em /wallet vai para o login', async ({ page }) => {
    await new MockApi(page).install()
    await page.goto('/wallet')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fwallet/)
  })

  test('leiloeiro: sidebar com o painel e aviso na carteira', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    await api.install()
    await page.goto('/wallet')

    await expect(page.getByText('Leiloeiros não têm carteira')).toBeVisible()
    const sidebar = page.locator('[data-slot="sidebar"]')
    await expect(
      sidebar.getByRole('link', { name: 'Painel do leiloeiro' }),
    ).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Carteira' })).toHaveCount(0)
    expect(api.requestsTo('GET', '/wallet')).toHaveLength(0)
  })

  test('licitante: sidebar com a carteira e aviso no painel', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    await api.install()
    await page.goto('/auctioneer')

    await expect(page.getByText('Área do leiloeiro')).toBeVisible()
    const sidebar = page.locator('[data-slot="sidebar"]')
    await expect(sidebar.getByRole('link', { name: 'Carteira' })).toBeVisible()
    await expect(
      sidebar.getByRole('link', { name: 'Painel do leiloeiro' }),
    ).toHaveCount(0)
    expect(api.requestsTo('GET', '/auctioneer/lots')).toHaveLength(0)
  })
})

import { expect, test } from '@playwright/test'

import { makeLot, MockApi } from './support/mock-api'

test.describe('Atributos da obra (RN-13)', () => {
  test('a página do lote mostra a Origem que vem em placeOfOrigin', async ({
    page,
  }) => {
    const api = new MockApi(page)
    api.lots = [
      makeLot('com-origem', 'LIVE', api.serverTime, {
        attributes: {
          artist: 'Claude Monet',
          date: '1906',
          medium: null,
          dimensions: null,
          placeOfOrigin: 'França',
        },
      }),
    ]
    await api.install()
    await page.goto('/lots/com-origem')

    const about = page.locator('section', { hasText: 'Sobre o item' })
    await expect(about.getByText('Origem', { exact: true })).toBeVisible()
    await expect(about.getByText('França', { exact: true })).toBeVisible()
  })

  test('a busca do acervo mostra a Origem do item', async ({ page }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.catalog = [
      {
        externalId: '16568',
        title: 'Water Lilies',
        imageUrl: '/items/images/abc/thumbnail',
        attributes: { artist: 'Claude Monet', placeOfOrigin: 'França' },
      },
    ]
    await api.install()
    await page.goto('/auctioneer')

    await page.getByLabel('Buscar itens no acervo').fill('water')
    const result = page.getByTestId('catalog-item')
    await expect(result).toContainText('Origem')
    await expect(result).toContainText('França')
  })
})

import { expect, test } from '@playwright/test'

import { MOCK_API_URL } from './support/constants'
import { MockApi } from './support/mock-api'

const IMAGE_ID = '2d484387-2509-5e8e-2c43-22f9981972eb'
const THUMBNAIL_PATH = `/items/images/${IMAGE_ID}/thumbnail`

/** PNG 1×1 transparente: o bastante para o `<img>` carregar. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

test.describe('Miniatura da busca pela API (RF-20, RF-21)', () => {
  test('a busca e o diálogo mostram a miniatura servida pela API, sem pedir o IIIF da AIC', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.catalog = [
      {
        externalId: '16568',
        title: 'Water Lilies',
        imageUrl: THUMBNAIL_PATH,
        attributes: { artist: 'Claude Monet' },
      },
    ]
    await api.install()

    // Registrada depois do install: o Playwright tenta a rota mais recente primeiro.
    const thumbnailRequests: string[] = []
    await page.route(`${MOCK_API_URL}${THUMBNAIL_PATH}`, (route) => {
      thumbnailRequests.push(route.request().url())
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        headers: { 'cache-control': 'public, max-age=604800, immutable' },
        body: PNG_1X1,
      })
    })
    const articRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('artic.edu')) articRequests.push(request.url())
    })

    await page.goto('/auctioneer')
    await page.getByLabel('Buscar itens no acervo').fill('water')

    const card = page.getByTestId('catalog-item')
    await expect(card).toHaveCount(1)
    const image = card.getByRole('img', { name: 'Water Lilies' })
    await expect(image).toHaveAttribute(
      'src',
      `${MOCK_API_URL}${THUMBNAIL_PATH}`,
    )
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0)
    // Carregou: o marcador "sem imagem" não aparece.
    await expect(
      card.getByRole('img', { name: 'Water Lilies (sem imagem)' }),
    ).toHaveCount(0)

    await card.getByRole('button', { name: 'Criar lote' }).click()
    const preview = page
      .getByRole('dialog')
      .getByRole('img', { name: 'Water Lilies' })
    await expect(preview).toHaveAttribute(
      'src',
      `${MOCK_API_URL}${THUMBNAIL_PATH}`,
    )

    expect(thumbnailRequests.length).toBeGreaterThan(0)
    expect(articRequests).toEqual([])
  })
})

import { expect, test } from '@playwright/test'

import { makeLot, MockApi } from './support/mock-api'

const DAY = 24 * 60 * 60 * 1000

test.describe('Vitrine (RF-10)', () => {
  test('mostra ao vivo, agendados e encerrados, sem os cancelados', async ({
    page,
  }) => {
    const api = new MockApi(page)
    // Relógio do servidor 3 dias atrás do local: a contagem só fica certa se usar o serverTime.
    api.serverTime = new Date(Date.now() - 3 * DAY)
    api.lots = [
      makeLot('ao-vivo', 'LIVE', api.serverTime, { currentBidCents: 15_000 }),
      makeLot('agendado', 'SCHEDULED', api.serverTime),
      makeLot('encerrado', 'ENDED', api.serverTime),
      makeLot('cancelado', 'CANCELED', api.serverTime),
    ]
    await api.install()
    await page.goto('/')

    const live = page.getByTestId('section-live')
    const scheduled = page.getByTestId('section-scheduled')
    const ended = page.getByTestId('section-ended')

    await expect(live.getByTestId('lot-card')).toHaveCount(1)
    await expect(scheduled.getByTestId('lot-card')).toHaveCount(1)
    await expect(ended.getByTestId('lot-card')).toHaveCount(1)
    await expect(page.getByText('Lote cancelado')).toHaveCount(0)

    await expect(live).toContainText('Lance atual')
    await expect(live).toContainText('R$ 150,00')
    await expect(live.getByTestId('lot-countdown')).toContainText(
      /Termina em (00:5\d:\d\d|01:00:00)/,
    )
    await expect(scheduled).toContainText('Lance inicial')
    await expect(scheduled).toContainText('R$ 100,00')
    await expect(scheduled.getByTestId('lot-countdown')).toContainText(
      /Começa em (00:5\d:\d\d|01:00:00)/,
    )
    await expect(ended.getByTestId('lot-countdown')).toContainText(
      'Encerrado em',
    )
  })

  test('cada seção tem estado vazio próprio', async ({ page }) => {
    const api = new MockApi(page)
    await api.install()
    await page.goto('/')

    await expect(page.getByText('Nenhum lote ao vivo agora')).toBeVisible()
    await expect(page.getByText('Nenhum lote agendado')).toBeVisible()
    await expect(page.getByText('Nenhum lote encerrado ainda')).toBeVisible()
  })

  test('o card leva para a página do lote, sem login', async ({ page }) => {
    const api = new MockApi(page)
    api.lots = [makeLot('agendado', 'SCHEDULED', api.serverTime)]
    await api.install()
    await page.goto('/')

    await page.getByRole('link', { name: 'Lote agendado' }).click()
    await expect(page).toHaveURL(/\/lots\/agendado$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Lote agendado' }),
    ).toBeVisible()
    await expect(page.getByTestId('lot-status')).toHaveText('Agendado')
    await expect(page.getByText('Artista Teste')).toBeVisible()
  })
})

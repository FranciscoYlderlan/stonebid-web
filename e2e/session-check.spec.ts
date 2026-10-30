import { expect, test, type Page } from '@playwright/test'

import { MOCK_API_URL } from './support/constants'
import { MockApi } from './support/mock-api'

const SESSION_CHECK_ERROR =
  'Não foi possível confirmar sua sessão. Tente recarregar a página.'

/** As novas tentativas padrão da sessão levam uns 3 s antes do aviso. */
const ALERT_TIMEOUT = 15_000

const storedToken = (page: Page) =>
  page.evaluate(() => window.localStorage.getItem('stonebid.token'))

test.describe('Aviso de falha ao confirmar a sessão (RF-40)', () => {
  test('/auth/me com 500 mostra o aviso, segue como visitante e guarda o token', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    api.replyWith('GET', '/auth/me', {
      status: 500,
      json: {
        error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
      },
    })
    await api.install()
    await page.goto('/')

    const alert = page.getByTestId('session-check-alert')
    await expect(alert).toBeVisible({ timeout: ALERT_TIMEOUT })
    await expect(alert).toContainText(SESSION_CHECK_ERROR)
    await expect(alert).toContainText('Erro interno do servidor.')
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    expect(await storedToken(page)).toBe('token-de-teste')
  })

  test('/auth/me com corpo fora do contrato mostra o aviso com a mensagem genérica', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    api.replyWith('GET', '/auth/me', { status: 200, json: { user: 'nada' } })
    await api.install()
    await page.goto('/')

    const alert = page.getByTestId('session-check-alert')
    await expect(alert).toBeVisible({ timeout: ALERT_TIMEOUT })
    await expect(alert).toContainText(SESSION_CHECK_ERROR)
    await expect(alert).toContainText(
      'Não foi possível carregar os dados. Tente de novo.',
    )
    await expect(alert).not.toContainText('expected')
    expect(await storedToken(page)).toBe('token-de-teste')
  })

  test('/auth/me sem rede mostra o aviso e guarda o token', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    await api.install()
    // Rota registrada depois tem prioridade sobre a da API simulada.
    await page.route(`${MOCK_API_URL}/auth/me`, (route) =>
      route.abort('internetdisconnected'),
    )
    await page.goto('/')

    const alert = page.getByTestId('session-check-alert')
    await expect(alert).toBeVisible({ timeout: ALERT_TIMEOUT })
    await expect(alert).toContainText(SESSION_CHECK_ERROR)
    await expect(alert).toContainText(
      'Não foi possível conectar ao servidor. Verifique sua conexão.',
    )
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    expect(await storedToken(page)).toBe('token-de-teste')
  })

  test('/auth/me com 401 vira visitante sem aviso e apaga o token', async ({
    page,
  }) => {
    const api = new MockApi(page)
    await api.install()
    // Token salvo, mas a API simulada não tem usuário logado: responde 401.
    await page.addInitScript(() =>
      window.localStorage.setItem('stonebid.token', 'token-vencido'),
    )
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    await expect.poll(() => api.requestsTo('GET', '/auth/me')).toHaveLength(1)
    await expect(page.getByTestId('session-check-alert')).toHaveCount(0)
    await expect(page.getByText(SESSION_CHECK_ERROR)).toHaveCount(0)
    await expect.poll(() => storedToken(page)).toBeNull()
  })

  test('sessão válida não mostra o aviso', async ({ page }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    await api.install()
    await page.goto('/')

    await expect(
      page.getByRole('button', { name: 'Menu de Bruno Licitante' }),
    ).toBeVisible()
    await expect(page.getByTestId('session-check-alert')).toHaveCount(0)
  })
})

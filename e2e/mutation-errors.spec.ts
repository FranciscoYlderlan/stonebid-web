import { expect, type Page, test } from '@playwright/test'

import { makeLot, MOCK_PASSWORD, MockApi } from './support/mock-api'

const GENERIC = 'Algo deu errado. Tente de novo em instantes.'
/** Pedaços do texto que o zod põe na mensagem: nunca podem chegar ao toast. */
const ZOD_TEXT = /expected|invalid_type|"path"|"code"|depositLimitCents|token/i

/** Guarda os `console.error` da página: o erro original vai para lá, não para o toast. */
function collectConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

async function expectGenericToast(page: Page) {
  const toast = page.locator('[data-sonner-toast]')
  await expect(toast).toHaveText(GENERIC)
  await expect(toast).not.toContainText(ZOD_TEXT)
}

test.describe('Erro de mutação (RF-40): resposta fora do formato', () => {
  test('depósito sem depositLimitCents mostra a mensagem genérica', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    // Formato antigo do depósito: `wallet` sem o teto.
    api.replyWith('POST', '/wallet/deposits', {
      status: 201,
      json: {
        movement: {
          id: 'm-1',
          type: 'DEPOSIT',
          amountCents: 25_000,
          lotId: null,
          createdAt: api.serverTime.toISOString(),
        },
        wallet: {
          totalCents: 75_000,
          committedCents: 10_000,
          availableCents: 65_000,
        },
      },
    })
    const consoleErrors = collectConsoleErrors(page)
    await api.install()
    await page.goto('/wallet')

    await page.getByLabel('Valor (R$)').fill('250,00')
    await page.getByRole('button', { name: 'Depositar' }).click()

    await expectGenericToast(page)
    expect(consoleErrors.join('\n')).toMatch(/ZodError/)
  })

  test('login com resposta sem token mostra a mensagem genérica', async ({
    page,
  }) => {
    const api = new MockApi(page)
    api.replyWith('POST', '/auth/login', {
      status: 200,
      json: { user: { id: 'u-1' } },
    })
    await api.install()
    await page.goto('/login')

    await page.getByLabel('E-mail').fill('bruno@exemplo.com')
    await page.getByLabel('Senha').fill(MOCK_PASSWORD)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expectGenericToast(page)
  })

  test('cadastro com corpo inesperado mostra a mensagem genérica', async ({
    page,
  }) => {
    const api = new MockApi(page)
    api.replyWith('POST', '/auth/register', { status: 201, json: { ok: true } })
    await api.install()
    await page.goto('/register')

    await page.getByLabel('Nome').fill('Carla Nova')
    await page.getByLabel('E-mail').fill('carla@exemplo.com')
    await page.getByLabel('Senha').fill('senha-forte-123')
    await page.getByLabel('Licitante').check()
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expectGenericToast(page)
  })

  test('criar lote com resposta fora do formato mostra a mensagem genérica', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.catalog = [
      {
        externalId: '16568',
        title: 'Water Lilies',
        imageUrl: 'https://www.artic.edu/iiif/2/abc/full/843,/0/default.jpg',
        attributes: { artist: 'Claude Monet' },
      },
    ]
    api.replyWith('POST', '/lots', { status: 201, json: { id: 'novo-1' } })
    await api.install()
    await page.goto('/auctioneer')

    await page.getByLabel('Buscar itens no acervo').fill('water')
    await page
      .getByTestId('catalog-item')
      .getByRole('button', { name: 'Criar lote' })
      .click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Lance inicial (R$)').fill('150,00')
    await dialog.getByLabel('Incremento mínimo (R$)').fill('10')
    await dialog.getByRole('button', { name: 'Criar lote' }).click()

    await expectGenericToast(page)
  })

  test('cancelar com resposta fora do formato mostra a mensagem genérica', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.lots = [makeLot('meu', 'SCHEDULED', api.serverTime)]
    api.myLotIds.add('meu')
    api.replyWith('POST', '/lots/meu/cancel', {
      status: 200,
      json: { status: 'CANCELED' },
    })
    await api.install()
    await page.goto('/auctioneer')

    await page.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Cancelar lote' }).click()

    await expectGenericToast(page)
  })
})

test.describe('Erro de mutação (RF-40): erro da API', () => {
  test('login recusado mostra a mensagem da API', async ({ page }) => {
    await new MockApi(page).install()
    await page.goto('/login')

    await page.getByLabel('E-mail').fill('bruno@exemplo.com')
    await page.getByLabel('Senha').fill('senha-errada')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.locator('[data-sonner-toast]')).toHaveText(
      'E-mail ou senha inválidos.',
    )
  })

  test('cadastro com e-mail repetido mostra a mensagem da API', async ({
    page,
  }) => {
    await new MockApi(page).install()
    await page.goto('/register')

    await page.getByLabel('Nome').fill('Bruno Licitante')
    await page.getByLabel('E-mail').fill('bruno@exemplo.com')
    await page.getByLabel('Senha').fill('senha-forte-123')
    await page.getByLabel('Licitante').check()
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.locator('[data-sonner-toast]')).toHaveText(
      'Este e-mail já está cadastrado.',
    )
  })

  test('login aceito entra com o formato real da API', async ({ page }) => {
    await new MockApi(page).install()
    await page.goto('/login')

    await page.getByLabel('E-mail').fill('bruno@exemplo.com')
    await page.getByLabel('Senha').fill(MOCK_PASSWORD)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0)
  })
})

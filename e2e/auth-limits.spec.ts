import { expect, test } from '@playwright/test'

import { MockApi } from './support/mock-api'

test.describe('Limites do cadastro e do login (RF-01)', () => {
  test('nome e senha acima do limite da API são recusados antes de enviar', async ({
    page,
  }) => {
    const api = new MockApi(page)
    await api.install()
    await page.goto('/register')

    await page.getByLabel('Nome').fill('a'.repeat(121))
    await page.getByLabel('E-mail').fill('carla@exemplo.com')
    await page.getByLabel('Senha').fill('s'.repeat(129))
    await page.getByLabel('Licitante').check()
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(
      page.getByText('O nome pode ter no máximo 120 caracteres.'),
    ).toBeVisible()
    await expect(
      page.getByText('A senha pode ter no máximo 128 caracteres.'),
    ).toBeVisible()
    expect(api.requestsTo('POST', '/auth/register')).toHaveLength(0)
  })

  test('senha acima do limite no login é recusada antes de enviar', async ({
    page,
  }) => {
    const api = new MockApi(page)
    await api.install()
    await page.goto('/login')

    await page.getByLabel('E-mail').fill('bruno@exemplo.com')
    await page.getByLabel('Senha').fill('s'.repeat(129))
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(
      page.getByText('A senha pode ter no máximo 128 caracteres.'),
    ).toBeVisible()
    expect(api.requestsTo('POST', '/auth/login')).toHaveLength(0)
  })
})

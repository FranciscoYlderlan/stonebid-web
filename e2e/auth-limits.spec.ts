import { expect, test } from '@playwright/test'

import { MockApi } from './support/mock-api'

test.describe('Limites do cadastro e do login (RF-01)', () => {
  test('nome e senha param no limite da API já na digitação', async ({
    page,
  }) => {
    const api = new MockApi(page)
    await api.install()
    await page.goto('/register')

    const name = page.getByLabel('Nome')
    const password = page.getByLabel('Senha')
    await expect(name).toHaveAttribute('maxlength', '120')
    await expect(password).toHaveAttribute('maxlength', '128')

    await name.fill('a'.repeat(121))
    await page.getByLabel('E-mail').fill('carla@exemplo.com')
    await password.fill('s'.repeat(129))
    await expect(name).toHaveValue('a'.repeat(120))
    await expect(password).toHaveValue('s'.repeat(128))

    await page.getByLabel('Licitante').check()
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect
      .poll(() => api.requestsTo('POST', '/auth/register'))
      .toHaveLength(1)
    const [request] = api.requestsTo('POST', '/auth/register')
    const body = request.postDataJSON() as { name: string; password: string }
    expect(body.name).toHaveLength(120)
    expect(body.password).toHaveLength(128)
    await expect(
      page.getByText('O nome pode ter no máximo 120 caracteres.'),
    ).toHaveCount(0)
  })

  test('senha do login para no limite da API já na digitação', async ({
    page,
  }) => {
    const api = new MockApi(page)
    await api.install()
    await page.goto('/login')

    const password = page.getByLabel('Senha')
    await expect(password).toHaveAttribute('maxlength', '128')
    await page.getByLabel('E-mail').fill('bruno@exemplo.com')
    await password.fill('s'.repeat(129))
    await expect(password).toHaveValue('s'.repeat(128))

    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect
      .poll(() => api.requestsTo('POST', '/auth/login'))
      .toHaveLength(1)
    const [request] = api.requestsTo('POST', '/auth/login')
    expect(
      (request.postDataJSON() as { password: string }).password,
    ).toHaveLength(128)
    // Senha errada para a API simulada: a recusa vem do servidor, não do limite.
    await expect(page.getByText('E-mail ou senha inválidos.')).toBeVisible()
  })
})

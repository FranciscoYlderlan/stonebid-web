import { expect, test } from '@playwright/test'

import { MockApi } from './support/mock-api'

test.describe('Mensagens de validação do cadastro e do login (RF-01)', () => {
  test('cadastro vazio mostra as mensagens em português, inclusive a do papel', async ({
    page,
  }) => {
    const api = new MockApi(page)
    await api.install()
    await page.goto('/register')

    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByText('Informe seu nome.')).toBeVisible()
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
    await expect(
      page.getByText('A senha precisa de pelo menos 8 caracteres.'),
    ).toBeVisible()
    await expect(
      page
        .getByRole('group', { name: 'Como você vai usar o Stonebid?' })
        .getByRole('alert'),
    ).toHaveText('Escolha se você vai ser leiloeiro ou licitante.')
    await expect(page.getByText(/invalid|expected/i)).toHaveCount(0)
    expect(api.requestsTo('POST', '/auth/register')).toHaveLength(0)
  })

  test('cadastro sem papel avisa no campo do papel e não chama a API', async ({
    page,
  }) => {
    const api = new MockApi(page)
    await api.install()
    await page.goto('/register')

    await page.getByLabel('Nome').fill('Carla Souza')
    await page.getByLabel('E-mail').fill('carla@exemplo.com')
    await page.getByLabel('Senha').fill('senha-forte-123')
    await page.getByRole('button', { name: 'Criar conta' }).click()

    const roleGroup = page.getByRole('group', {
      name: 'Como você vai usar o Stonebid?',
    })
    await expect(roleGroup.getByRole('alert')).toHaveText(
      'Escolha se você vai ser leiloeiro ou licitante.',
    )
    await expect(page.getByText(/invalid|expected/i)).toHaveCount(0)
    expect(api.requestsTo('POST', '/auth/register')).toHaveLength(0)

    // Escolher o papel limpa o aviso e libera o envio.
    await page.getByLabel('Licitante').check()
    await expect(roleGroup.getByRole('alert')).toHaveCount(0)
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect
      .poll(() => api.requestsTo('POST', '/auth/register'))
      .toHaveLength(1)
  })

  test('login vazio mostra as mensagens em português', async ({ page }) => {
    const api = new MockApi(page)
    await api.install()
    await page.goto('/login')

    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
    await expect(page.getByText('Informe a senha.')).toBeVisible()
    await expect(page.getByText(/invalid|expected/i)).toHaveCount(0)
    expect(api.requestsTo('POST', '/auth/login')).toHaveLength(0)
  })
})

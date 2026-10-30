import { expect, test } from '@playwright/test'

import { MockApi } from './support/mock-api'

const ROLES = [
  {
    role: 'AUCTIONEER',
    label: 'Painel do leiloeiro',
    other: 'Carteira',
    url: /\/auctioneer$/,
  },
  {
    role: 'BIDDER',
    label: 'Carteira',
    other: 'Painel do leiloeiro',
    url: /\/wallet$/,
  },
] as const

test.describe('Atalho para a área do papel (RF-03)', () => {
  test('visitante não vê atalho no cabeçalho', async ({ page }) => {
    await new MockApi(page).install()
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByTestId('header-role-shortcut')).toHaveCount(0)
  })

  for (const { role, label, other, url } of ROLES) {
    test(`${role}: da vitrine, um clique no cabeçalho leva à sua área`, async ({
      page,
    }) => {
      const api = new MockApi(page).loginAs(role)
      await api.install()
      await page.goto('/')

      const header = page.locator('header')
      await expect(header.getByRole('link', { name: other })).toHaveCount(0)
      await header.getByRole('link', { name: label }).click()
      await expect(page).toHaveURL(url)
    })

    test(`${role}: da vitrine, o menu do usuário leva à sua área`, async ({
      page,
    }) => {
      const api = new MockApi(page).loginAs(role)
      await api.install()
      await page.goto('/')

      await page.getByRole('button', { name: api.user!.name }).click()
      const menu = page.getByRole('menu')
      await expect(menu.getByRole('menuitem', { name: other })).toHaveCount(0)
      await menu.getByRole('menuitem', { name: label }).click()
      await expect(page).toHaveURL(url)
    })
  }
})

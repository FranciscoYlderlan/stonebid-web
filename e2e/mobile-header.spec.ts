import { expect, test } from '@playwright/test'

import { MockApi, USERS } from './support/mock-api'

const WIDTHS = [320, 375] as const
const LONG_NAME = 'Maria Aparecida dos Santos Albuquerque de Oliveira'

const VIEWERS = [
  { who: 'visitante', role: null },
  { who: 'licitante', role: 'BIDDER', shortcut: 'Carteira' },
  { who: 'leiloeiro', role: 'AUCTIONEER', shortcut: 'Painel do leiloeiro' },
] as const

test.describe('Cabeçalho no celular (RF-03)', () => {
  for (const width of WIDTHS) {
    for (const viewer of VIEWERS) {
      test(`${viewer.who} a ${width} px: sem rolagem horizontal, com nome longo`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 700 })
        const api = new MockApi(page)
        if (viewer.role) {
          api.loginAs(viewer.role)
          api.user = { ...USERS[viewer.role], name: LONG_NAME }
        }
        await api.install()
        await page.goto('/')

        const header = page.locator('header')
        if (viewer.role) {
          // O nome some da tela, mas o menu e o atalho seguem com nome acessível.
          await expect(
            page.getByRole('button', { name: LONG_NAME }),
          ).toBeVisible()
          await expect(header.getByText(LONG_NAME)).toBeHidden()
          await expect(
            header.getByRole('link', { name: viewer.shortcut }),
          ).toBeVisible()
        } else {
          await expect(
            header.getByRole('link', { name: 'Entrar' }),
          ).toBeVisible()
          await expect(
            header.getByRole('link', { name: 'Cadastrar' }),
          ).toBeVisible()
        }

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }))
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
      })
    }
  }
})

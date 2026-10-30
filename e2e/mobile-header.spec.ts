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

// 305 px simula 320 px com barra de rolagem clássica (~15 px).
const VISITOR_WIDTHS = [305, 320] as const
const MIN_EDGE_GAP = 8
const MIN_TOUCH_TARGET = 40

test.describe('Cabeçalho do visitante com folga na borda (RF-21)', () => {
  for (const width of VISITOR_WIDTHS) {
    test(`visitante a ${width} px: último botão a ≥ ${MIN_EDGE_GAP} px da borda, alvos de ${MIN_TOUCH_TARGET} px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 700 })
      await new MockApi(page).install()
      await page.goto('/')

      const header = page.locator('header')
      const login = header.getByRole('link', { name: 'Entrar' })
      const register = header.getByRole('link', { name: 'Cadastrar' })
      await expect(login).toBeVisible()
      await expect(register).toBeVisible()

      for (const link of [login, register]) {
        const box = await link.boundingBox()
        expect(box?.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
        expect(box?.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
      }

      const { scrollWidth, clientWidth, lastRight } = await page.evaluate(
        () => {
          const controls = document.querySelectorAll('header a, header button')
          const last = controls[controls.length - 1]
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            lastRight: last?.getBoundingClientRect().right ?? Infinity,
          }
        },
      )
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
      expect(clientWidth - lastRight).toBeGreaterThanOrEqual(MIN_EDGE_GAP)
    })
  }
})

import { expect, test } from '@playwright/test'

import {
  makeLot,
  MOCK_PASSWORD,
  MockApi,
  MY_PSEUDONYM,
} from './support/mock-api'

const LOT = 'l-1'
const CARLA = {
  id: 'u-bid-2',
  name: 'Carla Licitante',
  email: 'carla@exemplo.com',
  role: 'BIDDER' as const,
}
const CARLA_PSEUDONYM = 'Licitante 21BC4D'

test.describe('Troca de sessão na sala (RF-30)', () => {
  test('logout e outro login: a sala mostra só o estado de quem está logado', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    api.accounts.push(CARLA)
    api.pseudonyms.set(CARLA.id, CARLA_PSEUDONYM)
    api.lots = [makeLot(LOT, 'LIVE', api.serverTime)]
    api.addBid(LOT, 12_000, CARLA_PSEUDONYM)
    api.addBid(LOT, 15_000, MY_PSEUDONYM)
    await api.install()

    // Bruno lidera.
    await page.goto(`/bidding/${LOT}`)
    const position = page.getByTestId('viewer-position')
    await expect(position).toHaveText('Você está ganhando')

    // Logout e volta à sala sem recarregar a página (o cache do lote é o mesmo).
    await page.getByRole('button', { name: 'Menu de Bruno Licitante' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.getByRole('link', { name: `Lote ${LOT}` }).click()
    await expect(page).toHaveURL(new RegExp(`/lots/${LOT}$`))
    await expect(page.getByTestId('lot-status')).toBeVisible()
    await expect(page.getByTestId('lot-leader')).toHaveText(MY_PSEUDONYM)
    await expect(position).toHaveCount(0)

    // Carla entra pelo "Dar lance": vê o próprio estado sem dar lance.
    await page.getByRole('link', { name: 'Dar lance' }).click()
    await page.getByLabel('E-mail').fill(CARLA.email)
    await page.getByLabel('Senha').fill(MOCK_PASSWORD)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(new RegExp(`/bidding/${LOT}$`))
    await expect(position).toHaveText('Você foi superado')

    // Evento do stream (viewer nulo) não traz de volta o viewer de outra sessão.
    await expect.poll(() => api.openStreams(LOT)).toBeGreaterThan(0)
    await api.emit(LOT, 'bid')
    await expect(position).toHaveText('Você foi superado')
    expect(api.requestsTo('POST', `/lots/${LOT}/bids`)).toHaveLength(0)
  })
})

import { expect, test } from '@playwright/test'

import { MOCK_API_URL } from './support/constants'
import { makeLot, MockApi } from './support/mock-api'

const DAY = 24 * 60 * 60 * 1000

const MONET = {
  externalId: '16568',
  title: 'Water Lilies',
  imageUrl: 'https://www.artic.edu/iiif/2/abc/full/843,/0/default.jpg',
  attributes: {
    artist: 'Claude Monet',
    date: '1906',
    medium: 'Óleo sobre tela',
  },
}

test.describe('Painel do leiloeiro (RF-20 a RF-22, RF-25)', () => {
  test('busca um item e cria um lote a partir dele', async ({ page }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.serverTime = new Date(Date.now() - 2 * DAY)
    api.catalog = [MONET]
    await api.install()
    await page.goto('/auctioneer')

    await page.getByLabel('Buscar itens no acervo').fill('water')
    const result = page.getByTestId('catalog-item')
    await expect(result).toHaveCount(1)
    await expect(result).toContainText('Water Lilies')
    await expect(result).toContainText('Claude Monet')
    expect(api.requestsTo('GET', '/items/search')).toHaveLength(1)

    await result.getByRole('button', { name: 'Criar lote' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Lance inicial (R$)').fill('150,00')
    await dialog.getByLabel('Incremento mínimo (R$)').fill('10')
    await dialog.getByRole('button', { name: 'Criar lote' }).click()

    await expect(page.getByText('Lote “Water Lilies” criado')).toBeVisible()
    await expect(dialog).toBeHidden()

    const [created] = api.requestsTo('POST', '/lots')
    const body = created!.postDataJSON()
    expect(body).toMatchObject({
      externalId: '16568',
      startingBidCents: 15_000,
      minIncrementCents: 1_000,
    })
    // Início sugerido pela hora do servidor (2 dias atrás do relógio local), não pela local.
    const startsIn = Date.parse(body.startsAt) - api.serverTime.getTime()
    expect(startsIn).toBeGreaterThan(5 * 60_000)
    expect(startsIn).toBeLessThan(11 * 60_000)
    expect(Date.parse(body.endsAt) - Date.parse(body.startsAt)).toBe(
      60 * 60_000,
    )

    await expect(
      page.getByTestId('section-mine-scheduled').getByTestId('lot-card'),
    ).toContainText('Water Lilies')
  })

  test('ao criar: botão "Criando lote…", aviso com início e "Ver lote", card novo na vista e realçado', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.catalog = [MONET]
    // Vários lotes ao vivo empurram "Agendados" para bem abaixo da busca.
    for (let i = 1; i <= 9; i++) {
      api.lots.push(makeLot(`vivo-${i}`, 'LIVE', api.serverTime))
      api.myLotIds.add(`vivo-${i}`)
    }
    await api.install()
    // Segura o POST /lots até o teste liberar, para ver o estado de envio.
    let release!: () => void
    const held = new Promise<void>((resolve) => (release = resolve))
    await page.route(`${MOCK_API_URL}/lots`, async (route) => {
      if (route.request().method() === 'POST') await held
      await route.fallback()
    })
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

    const sending = dialog.getByRole('button', { name: 'Criando lote…' })
    await expect(sending).toBeVisible()
    await expect(sending).toBeDisabled()
    release()

    const toastEl = page.locator('[data-sonner-toast]')
    await expect(toastEl).toContainText('Lote “Water Lilies” criado')
    const [created] = api.requestsTo('POST', '/lots')
    const startsAt = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(created!.postDataJSON().startsAt))
    await expect(toastEl).toContainText(`Começa em ${startsAt}.`)
    await expect(
      toastEl.getByRole('button', { name: 'Ver lote' }),
    ).toBeVisible()
    await expect(dialog).toBeHidden()

    // O card novo vem para a vista, realçado e com o foco.
    const card = page
      .getByTestId('section-mine-scheduled')
      .getByTestId('lot-card')
      .filter({ hasText: 'Water Lilies' })
    await expect(card).toBeInViewport()
    await expect(card).toHaveAttribute('data-highlighted', 'true')
    await expect(card.getByRole('link', { name: 'Water Lilies' })).toBeFocused()

    // De volta ao topo, "Ver lote" leva ao card de novo.
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(card).not.toBeInViewport()
    await toastEl.getByRole('button', { name: 'Ver lote' }).click()
    await expect(card).toBeInViewport()
    await expect(card).toHaveAttribute('data-highlighted', 'true')

    // O realce some sozinho depois de alguns segundos.
    await expect(card).not.toHaveAttribute('data-highlighted', /.*/, {
      timeout: 5_000,
    })
  })

  test('título da seção rolada não fica atrás do cabeçalho fixo', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    for (let i = 1; i <= 9; i++) {
      api.lots.push(makeLot(`vivo-${i}`, 'LIVE', api.serverTime))
      api.myLotIds.add(`vivo-${i}`)
    }
    api.lots.push(makeLot('agendado', 'SCHEDULED', api.serverTime))
    api.myLotIds.add('agendado')
    await api.install()
    await page.goto('/auctioneer')

    const heading = page.getByRole('heading', { name: /Agendados/ })
    await expect(heading).toBeVisible()
    await page
      .getByTestId('section-mine-scheduled')
      .evaluate((section) => section.scrollIntoView({ block: 'start' }))
    const header = await page.locator('header').first().boundingBox()
    const title = await heading.boundingBox()
    expect(title!.y).toBeGreaterThanOrEqual(header!.y + header!.height)
    await expect(heading).toBeInViewport()
  })

  test('valida o formulário como o servidor', async ({ page }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.catalog = [MONET]
    await api.install()
    await page.goto('/auctioneer')

    await page.getByLabel('Buscar itens no acervo').fill('water')
    await page.getByRole('button', { name: 'Criar lote' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Lance inicial (R$)').fill('0')
    await dialog.getByLabel('Incremento mínimo (R$)').fill('abc')
    const startsAt = await dialog.getByLabel('Início').inputValue()
    // Fim 1 minuto depois do início: abaixo dos 5 minutos mínimos.
    const [date, time] = startsAt.split('T') as [string, string]
    const [h, m] = time.split(':').map(Number) as [number, number]
    const total = h * 60 + m + 1
    const endsAt = `${date}T${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
    await dialog.getByLabel('Fim').fill(endsAt)
    await dialog.getByRole('button', { name: 'Criar lote' }).click()

    await expect(
      dialog.getByText('O lance inicial precisa ser maior que zero.'),
    ).toBeVisible()
    await expect(
      dialog.getByText('Informe o incremento mínimo em reais, como 150,00.'),
    ).toBeVisible()
    expect(api.requestsTo('POST', '/lots')).toHaveLength(0)

    await dialog.getByLabel('Lance inicial (R$)').fill('100')
    await dialog.getByLabel('Incremento mínimo (R$)').fill('5')
    await dialog.getByRole('button', { name: 'Criar lote' }).click()
    await expect(
      dialog.getByText(
        'O fim precisa ser pelo menos 5 minutos depois do início.',
      ),
    ).toBeVisible()
    expect(api.requestsTo('POST', '/lots')).toHaveLength(0)
  })

  test('API externa fora do ar: mensagem clara e o resto do painel segue', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.searchFails = true
    api.lots = [makeLot('meu', 'SCHEDULED', api.serverTime)]
    api.myLotIds.add('meu')
    await api.install()
    await page.goto('/auctioneer')

    await page.getByLabel('Buscar itens no acervo').fill('monet')
    const alert = page.getByTestId('item-search-error')
    await expect(alert).toContainText('A busca de itens está indisponível')
    await expect(alert).toContainText(
      'A API de itens (Art Institute of Chicago) não respondeu.',
    )

    await expect(
      page.getByRole('heading', { name: 'Meus lotes' }),
    ).toBeVisible()
    await expect(
      page.getByTestId('section-mine-scheduled').getByTestId('lot-card'),
    ).toContainText('Lote meu')
  })

  test('mostra só os próprios lotes, por estado, com cancelados', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.lots = [
      makeLot('vivo', 'LIVE', api.serverTime),
      makeLot('agendado', 'SCHEDULED', api.serverTime),
      makeLot('fim', 'ENDED', api.serverTime),
      makeLot('cancelado', 'CANCELED', api.serverTime),
      makeLot('de-outro', 'SCHEDULED', api.serverTime),
    ]
    for (const id of ['vivo', 'agendado', 'fim', 'cancelado'])
      api.myLotIds.add(id)
    await api.install()
    await page.goto('/auctioneer')

    for (const [section, title] of [
      ['mine-live', 'Lote vivo'],
      ['mine-scheduled', 'Lote agendado'],
      ['mine-ended', 'Lote fim'],
      ['mine-canceled', 'Lote cancelado'],
    ] as const) {
      const cards = page
        .getByTestId(`section-${section}`)
        .getByTestId('lot-card')
      await expect(cards).toHaveCount(1)
      await expect(cards).toContainText(title)
    }
    await expect(page.getByText('Lote de-outro')).toHaveCount(0)
    // Cancelar só onde ainda faz sentido.
    await expect(
      page
        .getByTestId('section-mine-ended')
        .getByRole('button', { name: 'Cancelar' }),
    ).toHaveCount(0)
  })

  test('cancelar pede confirmação e mostra o motivo da recusa (409)', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.lots = [makeLot('meu', 'SCHEDULED', api.serverTime)]
    api.myLotIds.add('meu')
    api.cancelConflict = 'O lote já recebeu lances e não pode ser cancelado.'
    await api.install()
    await page.goto('/auctioneer')

    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(page.getByRole('alertdialog')).toContainText(
      'Cancelar este lote?',
    )
    await page.getByRole('button', { name: 'Cancelar lote' }).click()
    await expect(
      page.getByText('O lote já recebeu lances e não pode ser cancelado.'),
    ).toBeVisible()
    expect(api.requestsTo('POST', '/lots/meu/cancel')).toHaveLength(1)

    // Sem lances: o cancelamento passa e o lote vai para Cancelados.
    api.cancelConflict = null
    await page.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('button', { name: 'Cancelar lote' }).click()
    await expect(page.getByText('Lote cancelado.')).toBeVisible()
    await expect(
      page.getByTestId('section-mine-canceled').getByTestId('lot-card'),
    ).toContainText('Lote meu')
  })
})

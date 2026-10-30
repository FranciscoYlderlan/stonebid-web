import { expect, test } from '@playwright/test'

import { MOCK_API_URL } from './support/constants'
import {
  CANCEL_REASON_MESSAGE,
  makeLot,
  makeSoldLot,
  MockApi,
} from './support/mock-api'

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

  test('Cancelar só em lote sem lances, como a regra da API', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.lots = [
      makeLot('com-lance', 'LIVE', api.serverTime),
      makeLot('sem-lance', 'LIVE', api.serverTime),
      makeLot('agendado', 'SCHEDULED', api.serverTime),
    ]
    for (const lot of api.lots) api.myLotIds.add(lot.id)
    api.addBid('com-lance', 15_000, 'Licitante 21BC4D')
    await api.install()
    await page.goto('/auctioneer')

    const card = (title: string) =>
      page.getByTestId('lot-card').filter({ hasText: title })
    const cancel = (title: string) =>
      card(title).getByRole('button', { name: 'Cancelar', exact: true })
    await expect(card('Lote com-lance')).toBeVisible()
    await expect(cancel('Lote com-lance')).toHaveCount(0)
    await expect(cancel('Lote sem-lance')).toBeVisible()
    await expect(cancel('Lote agendado')).toBeVisible()
  })

  test('cancelar pede o motivo, mostra a recusa (409) e grava o motivo', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.lots = [makeLot('meu', 'SCHEDULED', api.serverTime)]
    api.myLotIds.add('meu')
    api.cancelConflict = 'O lote já recebeu lances e não pode ser cancelado.'
    await api.install()
    await page.goto('/auctioneer')

    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toContainText('Cancelar este lote?')
    const reason = dialog.getByLabel('Motivo do cancelamento')

    // Sem motivo, ou curto demais: barrado no cliente, nada vai à API.
    await dialog.getByRole('button', { name: 'Cancelar lote' }).click()
    await expect(dialog.getByRole('alert')).toHaveText(
      'Informe o motivo do cancelamento.',
    )
    await reason.fill('  ab  ')
    await dialog.getByRole('button', { name: 'Cancelar lote' }).click()
    await expect(dialog.getByRole('alert')).toHaveText(
      'O motivo precisa ter pelo menos 3 caracteres.',
    )
    await reason.fill('x'.repeat(281))
    await dialog.getByRole('button', { name: 'Cancelar lote' }).click()
    await expect(dialog.getByRole('alert')).toHaveText(
      'O motivo pode ter no máximo 280 caracteres.',
    )
    expect(api.requestsTo('POST', '/lots/meu/cancel')).toHaveLength(0)

    // Recusa da API (409): a mensagem aparece no diálogo, que segue aberto.
    await reason.fill('Obra retirada pelo comitente')
    await dialog.getByRole('button', { name: 'Cancelar lote' }).click()
    await expect(dialog.getByRole('alert')).toHaveText(
      'O lote já recebeu lances e não pode ser cancelado.',
    )
    expect(api.requestsTo('POST', '/lots/meu/cancel')).toHaveLength(1)

    // Sem lances: o cancelamento passa com o motivo, que o card mostra.
    api.cancelConflict = null
    await dialog.getByRole('button', { name: 'Cancelar lote' }).click()
    await expect(page.getByText('Lote cancelado.')).toBeVisible()
    await expect(dialog).toBeHidden()
    const requests = api.requestsTo('POST', '/lots/meu/cancel')
    expect(requests).toHaveLength(2)
    expect(requests[1]!.postDataJSON()).toEqual({
      reason: 'Obra retirada pelo comitente',
    })
    const card = page
      .getByTestId('section-mine-canceled')
      .getByTestId('lot-card')
    await expect(card).toContainText('Lote meu')
    await expect(card.getByTestId('lot-outcome')).toHaveText(
      'Motivo: Obra retirada pelo comitente',
    )
  })

  test('mensagem de validação da API (422) aparece no diálogo', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.lots = [makeLot('meu', 'LIVE', api.serverTime)]
    api.myLotIds.add('meu')
    api.replyWith('POST', '/lots/meu/cancel', {
      status: 422,
      json: {
        error: { code: 'VALIDATION_ERROR', message: CANCEL_REASON_MESSAGE },
      },
    })
    await api.install()
    await page.goto('/auctioneer')

    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    const dialog = page.getByRole('alertdialog')
    await dialog.getByLabel('Motivo do cancelamento').fill('Motivo válido')
    await dialog.getByRole('button', { name: 'Cancelar lote' }).click()
    await expect(dialog.getByRole('alert')).toHaveText(CANCEL_REASON_MESSAGE)
  })

  test('mostra o total recebido e o resultado de cada lote encerrado', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    const sold = makeSoldLot('vendido', api.serverTime, {
      amountCents: 123_450,
      winner: 'Licitante 7F3A9C',
      receiptPublicId: 'rcpt-vendido',
    })
    api.lots = [
      sold.lot,
      makeLot('vazio', 'ENDED', api.serverTime, { result: 'NO_WINNER' }),
      makeLot('pendente', 'ENDED', api.serverTime),
      makeLot('cancelado', 'CANCELED', api.serverTime, {
        cancelReason: 'Erro no cadastro',
      }),
    ]
    for (const lot of api.lots) api.myLotIds.add(lot.id)
    api.receipts.set(sold.receipt.publicId, sold.receipt)
    api.totalReceivedCents = 123_450
    await api.install()
    await page.goto('/auctioneer')

    await expect(page.getByTestId('total-received')).toHaveText(
      /R\$\s1\.234,50/,
    )
    const outcome = (id: string) =>
      page.locator(`[data-lot-id="${id}"]`).getByTestId('lot-outcome')
    await expect(outcome('vendido')).toContainText('Arrematado por R$')
    await expect(outcome('vendido')).toContainText('1.234,50')
    await expect(outcome('vendido')).toContainText('Licitante 7F3A9C')
    await expect(outcome('vazio')).toHaveText(
      'Encerrado sem lances: não arrematado.',
    )
    await expect(outcome('pendente')).toHaveText(
      'Encerrado: aguardando a liquidação.',
    )
    await expect(outcome('cancelado')).toHaveText('Motivo: Erro no cadastro')

    // O comprovante do lote vendido abre a partir do painel.
    await outcome('vendido').getByRole('link', { name: 'Comprovante' }).click()
    await expect(page).toHaveURL(/\/receipts\/rcpt-vendido$/)
    await expect(page.getByTestId('receipt-winner')).toHaveText(
      'Licitante 7F3A9C',
    )
  })
})

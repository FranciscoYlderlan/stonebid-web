import { expect, type Page, test } from '@playwright/test'

import {
  BID_MESSAGES,
  makeLot,
  MOCK_PASSWORD,
  MockApi,
  MY_PSEUDONYM,
} from './support/mock-api'

const LOT = 'l-1'
const BIDS_PATH = `/lots/${LOT}/bids`

/** Licitante logado com o lote ao vivo e um lance de outro licitante (mínimo R$ 130,00). */
function bidderWithLiveLot(page: Page) {
  const api = new MockApi(page).loginAs('BIDDER')
  api.lots = [makeLot(LOT, 'LIVE', api.serverTime)]
  api.addBid(LOT, 12_000, 'Licitante 21BC')
  return api
}

const bidButton = (page: Page) =>
  page.getByRole('button', { name: 'Dar lance' })
const amountField = (page: Page) => page.getByLabel('Seu lance (R$)')

test.describe('Tela de lance (RF-33)', () => {
  test('lance aceito: sala, histórico e carteira atualizam', async ({
    page,
  }) => {
    const api = bidderWithLiveLot(page)
    await api.install()
    await page.goto(`/bidding/${LOT}`)

    await expect(page.getByTestId('bid-minimum')).toHaveText('R$ 130,00')
    await expect(amountField(page)).toHaveValue('130,00')
    await bidButton(page).click()

    await expect(page.getByText('Lance de R$ 130,00 registrado.')).toBeVisible()
    const posts = api.requestsTo('POST', BIDS_PATH)
    expect(posts).toHaveLength(1)
    expect(posts[0]!.postDataJSON()).toEqual({ amountCents: 13_000 })
    expect(posts[0]!.headers()['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/)

    await expect(page.getByTestId('lot-price')).toHaveText('R$ 130,00')
    await expect(page.getByTestId('lot-leader')).toHaveText(MY_PSEUDONYM)
    await expect(page.getByTestId('bid-minimum')).toHaveText('R$ 140,00')
    await expect(amountField(page)).toHaveValue('140,00')
    const rows = page.getByTestId('bid-history').getByRole('listitem')
    await expect(rows).toHaveCount(2)
    await expect(rows.first()).toContainText(MY_PSEUDONYM)
    await expect(rows.first()).toContainText('R$ 130,00')
    await expect(rows.last()).toContainText('Licitante 21BC')

    // A carteira mostra o saldo comprometido pelo lance.
    await page.getByTestId('header-role-shortcut').click()
    await expect(page.getByTestId('wallet-committed')).toHaveText('R$ 230,00')
    await expect(page.getByTestId('wallet-available')).toHaveText('R$ 270,00')
  })

  test('abaixo do mínimo: mensagem da API e o campo sugere o mínimo', async ({
    page,
  }) => {
    const api = bidderWithLiveLot(page)
    await api.install()
    await page.goto(`/bidding/${LOT}`)

    await amountField(page).fill('120,00')
    await bidButton(page).click()

    await expect(
      page.getByText(BID_MESSAGES.belowMinimum(13_000)),
    ).toBeVisible()
    await expect(amountField(page)).toHaveValue('130,00')
  })

  test('digitar no campo troca o mínimo sugerido pelo valor digitado', async ({
    page,
  }) => {
    const api = bidderWithLiveLot(page)
    await api.install()
    await page.goto(`/bidding/${LOT}`)
    const field = amountField(page)
    await expect(field).toHaveValue('130,00')

    // Clique no fim do texto, como quem quer apagar e digitar: o foco seleciona tudo.
    const box = (await field.boundingBox())!
    await field.click({ position: { x: box.width - 8, y: box.height / 2 } })
    await field.pressSequentially('150,00')
    await expect(field).toHaveValue('150,00')

    await bidButton(page).click()
    await expect(page.getByText('Lance de R$ 150,00 registrado.')).toBeVisible()
    expect(api.requestsTo('POST', BIDS_PATH)[0]!.postDataJSON()).toEqual({
      amountCents: 15_000,
    })
  })

  test('saldo insuficiente: mensagem da API', async ({ page }) => {
    const api = bidderWithLiveLot(page)
    api.wallet.availableCents = 5_000
    await api.install()
    await page.goto(`/bidding/${LOT}`)

    await bidButton(page).click()
    await expect(
      page.getByText(BID_MESSAGES.insufficientFunds(5_000)),
    ).toBeVisible()
  })

  test('já lidera: mensagem da API', async ({ page }) => {
    const api = bidderWithLiveLot(page)
    api.addBid(LOT, 13_000, MY_PSEUDONYM)
    await api.install()
    await page.goto(`/bidding/${LOT}`)

    await bidButton(page).click()
    await expect(page.getByText(BID_MESSAGES.alreadyWinning)).toBeVisible()
  })

  for (const [status, message] of [
    ['SCHEDULED', BID_MESSAGES.notStarted],
    ['ENDED', BID_MESSAGES.ended],
    ['CANCELED', BID_MESSAGES.canceled],
  ] as const) {
    test(`lote ${status} no servidor: mensagem da API e a sala recarrega`, async ({
      page,
    }) => {
      const api = bidderWithLiveLot(page)
      await api.install()
      await page.goto(`/bidding/${LOT}`)
      await expect(bidButton(page)).toBeVisible()

      // A tela ainda mostra o lote ao vivo; no servidor ele já mudou de estado.
      api.lots[0]!.status = status
      await bidButton(page).click()

      await expect(page.getByText(message)).toBeVisible()
      await expect(bidButton(page)).toHaveCount(0)
    })
  }

  for (const [status, code, message] of [
    [403, 'FORBIDDEN', 'Seu papel não permite esta ação.'],
    [409, 'LOT_ENDED', BID_MESSAGES.ended],
  ] as const) {
    test(`recusa ${code} forçada: mostra a mensagem da API`, async ({
      page,
    }) => {
      const api = bidderWithLiveLot(page)
      api.replyWith('POST', BIDS_PATH, {
        status,
        json: { error: { code, message } },
      })
      await api.install()
      await page.goto(`/bidding/${LOT}`)

      await bidButton(page).click()
      await expect(page.getByText(message)).toBeVisible()
    })
  }

  test('sessão expirada (401): mensagem da API e volta ao login', async ({
    page,
  }) => {
    const api = bidderWithLiveLot(page)
    await api.install()
    await page.goto(`/bidding/${LOT}`)
    // A sessão precisa ter sido lida antes de o servidor "esquecer" o usuário.
    await expect(bidButton(page)).toBeEnabled()

    api.replyWith('POST', BIDS_PATH, {
      status: 401,
      json: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'É preciso entrar para acessar este recurso.',
        },
      },
    })
    api.user = null
    await bidButton(page).click()

    await expect(
      page.getByText('É preciso entrar para acessar este recurso.'),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fbidding%2Fl-1/)
  })

  test('resposta fora do contrato vira a mensagem genérica', async ({
    page,
  }) => {
    const api = bidderWithLiveLot(page)
    api.replyWith('POST', BIDS_PATH, { status: 201, json: { bid: {} } })
    await api.install()
    await page.goto(`/bidding/${LOT}`)

    await bidButton(page).click()
    await expect(
      page.getByText('Algo deu errado. Tente de novo em instantes.'),
    ).toBeVisible()
  })

  test('duplo clique gera um POST só', async ({ page }) => {
    const api = bidderWithLiveLot(page)
    api.bidDelayMs = 600
    await api.install()
    await page.goto(`/bidding/${LOT}`)

    await bidButton(page).dblclick()
    await expect(page.getByText('Lance de R$ 130,00 registrado.')).toBeVisible()
    expect(api.requestsTo('POST', BIDS_PATH)).toHaveLength(1)
    expect(api.bids.get(LOT)).toHaveLength(2)
  })

  test('nova tentativa após falha de rede reusa a chave e não grava dois lances (RN-18)', async ({
    page,
  }) => {
    const api = bidderWithLiveLot(page)
    api.dropBidResponses = 1
    await api.install()
    await page.goto(`/bidding/${LOT}`)

    await bidButton(page).click()
    await expect(
      page.getByText(
        'Não foi possível conectar ao servidor. Verifique sua conexão.',
      ),
    ).toBeVisible()

    await bidButton(page).click()
    await expect(page.getByText('Lance de R$ 130,00 registrado.')).toBeVisible()

    const keys = api
      .requestsTo('POST', BIDS_PATH)
      .map((request) => request.headers()['idempotency-key'])
    expect(keys).toHaveLength(2)
    expect(keys[1]).toBe(keys[0])
    expect(api.bids.get(LOT)).toHaveLength(2)
    expect(api.wallet.committedCents).toBe(10_000 + 13_000)
  })

  test('trocar o valor depois de uma falha gera chave nova', async ({
    page,
  }) => {
    const api = bidderWithLiveLot(page)
    api.dropBidResponses = 1
    await api.install()
    await page.goto(`/bidding/${LOT}`)

    await bidButton(page).click()
    await expect(
      page.getByText(
        'Não foi possível conectar ao servidor. Verifique sua conexão.',
      ),
    ).toBeVisible()

    await amountField(page).fill('150,00')
    await bidButton(page).click()
    // A primeira tentativa foi gravada: o novo valor já é do líder.
    await expect(page.getByText(BID_MESSAGES.alreadyWinning)).toBeVisible()

    const keys = api
      .requestsTo('POST', BIDS_PATH)
      .map((request) => request.headers()['idempotency-key'])
    expect(keys).toHaveLength(2)
    expect(keys[1]).not.toBe(keys[0])
  })

  test('recusa valor ambíguo antes de enviar', async ({ page }) => {
    const api = bidderWithLiveLot(page)
    await api.install()
    await page.goto(`/bidding/${LOT}`)

    for (const value of ['1,234', '1,2,3', '0,001', '1234.56', '', '0']) {
      await amountField(page).fill(value)
      await bidButton(page).click()
      await expect(
        page.getByText(
          /Valor inválido\. Use o formato 100,00\.|Informe o valor do lance\.|O lance precisa ser maior que zero\./,
        ),
      ).toBeVisible()
    }
    expect(api.requestsTo('POST', BIDS_PATH)).toHaveLength(0)

    // "1.300,00" é um valor válido: vai para a API (que recusa por saldo).
    await amountField(page).fill('1.300,00')
    await bidButton(page).click()
    await expect(
      page.getByText(BID_MESSAGES.insufficientFunds(40_000)),
    ).toBeVisible()
    expect(api.requestsTo('POST', BIDS_PATH)[0]!.postDataJSON()).toEqual({
      amountCents: 130_000,
    })
  })
})

test.describe('Acesso à tela de lance', () => {
  test('visitante: "Dar lance" leva ao login e volta para o lance', async ({
    page,
  }) => {
    const api = new MockApi(page)
    api.lots = [makeLot(LOT, 'LIVE', api.serverTime)]
    await api.install()
    await page.goto(`/lots/${LOT}`)

    await page.getByRole('link', { name: 'Dar lance' }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fbidding%2Fl-1/)

    await page.getByLabel('E-mail').fill('bruno@exemplo.com')
    await page.getByLabel('Senha').fill(MOCK_PASSWORD)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(new RegExp(`/bidding/${LOT}$`))
    await expect(amountField(page)).toHaveValue('100,00')
    await expect(bidButton(page)).toBeVisible()
  })

  test('licitante: "Dar lance" na sala pública abre o painel', async ({
    page,
  }) => {
    const api = bidderWithLiveLot(page)
    await api.install()
    await page.goto(`/lots/${LOT}`)

    await page.getByRole('link', { name: 'Dar lance' }).click()
    await expect(page).toHaveURL(new RegExp(`/bidding/${LOT}$`))
    await expect(bidButton(page)).toBeVisible()
  })

  test('leiloeiro em /bidding vai para a sala só para ver', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    api.lots = [makeLot(LOT, 'LIVE', api.serverTime)]
    await api.install()
    await page.goto(`/bidding/${LOT}`)

    await expect(page).toHaveURL(new RegExp(`/lots/${LOT}$`))
    await expect(page.getByLabel('Seu lance (R$)')).toHaveCount(0)
    expect(api.requestsTo('POST', BIDS_PATH)).toHaveLength(0)
  })

  test('histórico público: pseudônimo, valor e hora, sem login', async ({
    page,
  }) => {
    const api = new MockApi(page)
    api.lots = [makeLot(LOT, 'LIVE', api.serverTime)]
    api.addBid(LOT, 11_000, 'Licitante 21BC')
    api.addBid(LOT, 12_000, 'Licitante 9D04')
    await api.install()
    await page.goto(`/lots/${LOT}`)

    const rows = page.getByTestId('bid-history').getByRole('listitem')
    await expect(rows).toHaveCount(2)
    await expect(rows.first()).toContainText('Licitante 9D04')
    await expect(rows.first()).toContainText('R$ 120,00')
    await expect(rows.first()).toContainText(/\d{2}:\d{2}:\d{2}/)
    await expect(page.getByTestId('lot-leader')).toHaveText('Licitante 9D04')
    expect(
      api.requestsTo('GET', BIDS_PATH)[0]!.headers()['authorization'],
    ).toBeUndefined()
  })

  test('sem lance: histórico vazio; lote encerrado não mostra "Dar lance"', async ({
    page,
  }) => {
    const api = new MockApi(page)
    api.lots = [
      makeLot(LOT, 'LIVE', api.serverTime),
      makeLot('fim', 'ENDED', api.serverTime),
    ]
    await api.install()
    await page.goto(`/lots/${LOT}`)
    await expect(page.getByText('Nenhum lance ainda')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dar lance' })).toBeVisible()

    await page.goto('/lots/fim')
    await expect(page.getByText('Nenhum lance ainda')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dar lance' })).toHaveCount(0)
  })

  for (const path of [`/lots/${LOT}`, `/bidding/${LOT}`]) {
    test(`${path} a 320 px: sem rolagem horizontal e alvos de 40 px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 700 })
      const api = bidderWithLiveLot(page)
      api.addBid(LOT, 1_234_500, 'Licitante com pseudônimo bem comprido')
      await api.install()
      await page.goto(path)

      const controls = path.startsWith('/bidding')
        ? [amountField(page), bidButton(page)]
        : [page.getByRole('link', { name: 'Dar lance' })]
      for (const control of controls) {
        const box = await control.boundingBox()
        expect(box?.height).toBeGreaterThanOrEqual(40)
      }
      await expect(page.getByTestId('bid-history')).toBeVisible()
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    })
  }
})

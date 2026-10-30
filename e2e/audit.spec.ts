import { expect, test, type Page } from '@playwright/test'

import {
  fakeHash,
  makeLot,
  makeSoldLot,
  MockApi,
  USERS,
} from './support/mock-api'

/** Lote com três lances de outros licitantes. */
function withBids(api: MockApi, id: string, status: 'LIVE' | 'ENDED') {
  api.lots = [makeLot(id, status, api.serverTime)]
  api
    .addBid(id, 10_000, 'Licitante A1B2C3')
    .addBid(id, 12_000, 'Licitante D4E5F6')
    .addBid(id, 15_000, 'Licitante A1B2C3')
}

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
}

test.describe('Auditoria pública do lote (RF-60)', () => {
  test('cadeia íntegra: selo ÍNTEGRO, histórico completo e hash copiável, sem login', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const api = new MockApi(page)
    withBids(api, 'ao-vivo', 'LIVE')
    await api.install()
    await page.goto('/lots/ao-vivo/audit')

    // Visitante: nada de login no caminho nem consulta de sessão pela página.
    await expect(page).toHaveURL(/\/lots\/ao-vivo\/audit$/)
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Lote ao-vivo',
    )
    await expect(page.getByTestId('lot-status')).toHaveText('Ao vivo')

    const verdict = page.getByTestId('audit-verdict')
    await expect(verdict).toHaveAttribute('data-verdict', 'INTACT')
    await expect(verdict).toContainText('ÍNTEGRO')
    await expect(page.getByTestId('audit-checked-at')).toHaveText(
      /Verificado em \d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}/,
    )
    await expect(page.getByText('recalculado a cada acesso')).toBeVisible()
    await expect(page.getByTestId('audit-inconsistency')).toHaveCount(0)

    // Do primeiro ao último lance, com valor, hora com segundos e hash curto.
    const rows = page.getByTestId('audit-bids').locator('tbody tr')
    await expect(rows).toHaveCount(3)
    const first = page.getByTestId('audit-bid-1')
    await expect(first).toContainText('nº 1')
    await expect(first).toContainText('Licitante A1B2C3')
    await expect(first).toContainText(/R\$\s100,00/)
    await expect(first).toContainText(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}/)
    const hash = fakeHash('ao-vivo', 1)
    await expect(first.getByTestId('audit-bid-hash')).toHaveText(
      hash.slice(0, 12),
    )
    await expect(page.getByTestId('audit-bid-3')).toContainText(/R\$\s150,00/)
    await expect(page.locator('[data-inconsistent]')).toHaveCount(0)

    await first
      .getByRole('button', { name: 'Copiar hash do lance nº 1' })
      .click()
    await expect(page.getByText('Hash copiado.')).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(hash)

    // Nenhum dado pessoal: nem nome nem e-mail de conta aparece.
    for (const user of Object.values(USERS)) {
      await expect(page.getByText(user.name)).toHaveCount(0)
      await expect(page.getByText(user.email)).toHaveCount(0)
    }
    expect(api.requestsTo('GET', '/lots/ao-vivo/audit')).toHaveLength(1)
  })

  test('cadeia adulterada: selo ADULTERADO, motivo em português e linha destacada', async ({
    page,
  }) => {
    const api = new MockApi(page)
    withBids(api, 'mexido', 'ENDED')
    api.audits.set('mexido', {
      verdict: 'TAMPERED',
      firstInconsistency: { seq: 2, reason: 'CONTENT_CHANGED' },
    })
    await api.install()
    await page.goto('/lots/mexido/audit')

    const verdict = page.getByTestId('audit-verdict')
    await expect(verdict).toHaveAttribute('data-verdict', 'TAMPERED')
    await expect(verdict).toContainText('ADULTERADO')
    const issue = page.getByTestId('audit-inconsistency')
    await expect(issue).toContainText('Lance nº 2')
    await expect(page.getByTestId('audit-inconsistency-reason')).toHaveText(
      'Conteúdo do lance editado',
    )
    await expect(page.getByTestId('audit-bid-2')).toHaveAttribute(
      'data-inconsistent',
      'true',
    )
    await expect(page.locator('[data-inconsistent]')).toHaveCount(1)
  })

  test('inconsistência fora dos lances: motivo sem número de lance', async ({
    page,
  }) => {
    const api = new MockApi(page)
    const { lot, receipt } = makeSoldLot('vendido', api.serverTime, {
      amountCents: 15_000,
      winner: 'Licitante A1B2C3',
      receiptPublicId: 'rc-vendido',
    })
    api.lots = [lot]
    api.receipts.set(receipt.publicId, receipt)
    api.audits.set('vendido', {
      verdict: 'TAMPERED',
      firstInconsistency: { seq: null, reason: 'RECEIPT_MISMATCH' },
    })
    await api.install()
    await page.goto('/lots/vendido/audit')

    // Resultado do lote, como na sala.
    await expect(page.getByTestId('lot-outcome')).toHaveAttribute(
      'data-outcome',
      'sold',
    )
    await expect(page.getByTestId('audit-inconsistency')).toContainText(
      'registro do lote',
    )
    await expect(page.getByTestId('audit-inconsistency-reason')).toHaveText(
      'Comprovante não confere com o histórico',
    )
  })

  test('lote sem lances mostra o estado vazio', async ({ page }) => {
    const api = new MockApi(page)
    api.lots = [
      makeLot('cancelado', 'CANCELED', api.serverTime, {
        cancelReason: 'Obra retirada pelo comitente.',
      }),
    ]
    await api.install()
    await page.goto('/lots/cancelado/audit')

    await expect(page.getByTestId('audit-verdict')).toContainText('ÍNTEGRO')
    await expect(page.getByTestId('lot-outcome')).toHaveAttribute(
      'data-outcome',
      'canceled',
    )
    await expect(
      page.getByText('Nenhum lance registrado', { exact: true }),
    ).toBeVisible()
    await expect(page.getByTestId('audit-bids')).toHaveCount(0)
  })

  test('lote inexistente mostra 404 amigável, sem novas tentativas', async ({
    page,
  }) => {
    const api = new MockApi(page)
    await api.install()
    await page.goto('/lots/nao-existe/audit')

    await expect(
      page.getByText('Lote não encontrado', { exact: true }),
    ).toBeVisible()
    expect(api.requestsTo('GET', '/lots/nao-existe/audit')).toHaveLength(1)
    await page.getByRole('link', { name: 'Voltar à vitrine' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('"Verificar de novo" refaz a consulta e mostra o novo veredito', async ({
    page,
  }) => {
    const api = new MockApi(page)
    withBids(api, 'ao-vivo', 'LIVE')
    await api.install()
    await page.goto('/lots/ao-vivo/audit')

    await expect(page.getByTestId('audit-verdict')).toContainText('ÍNTEGRO')
    const checkedAt = await page.getByTestId('audit-checked-at').textContent()
    expect(api.requestsTo('GET', '/lots/ao-vivo/audit')).toHaveLength(1)

    // A cadeia foi mexida depois da primeira consulta.
    api.audits.set('ao-vivo', {
      verdict: 'TAMPERED',
      firstInconsistency: { seq: 3, reason: 'HEAD_MISMATCH' },
    })
    await page.getByRole('button', { name: 'Verificar de novo' }).click()

    await expect(page.getByTestId('audit-verdict')).toContainText('ADULTERADO')
    await expect(page.getByTestId('audit-inconsistency-reason')).toHaveText(
      'Último lance apagado ou cabeça da cadeia alterada',
    )
    await expect(page.getByTestId('audit-bid-3')).toHaveAttribute(
      'data-inconsistent',
      'true',
    )
    await expect(page.getByTestId('audit-checked-at')).not.toHaveText(
      checkedAt ?? '',
    )
    expect(api.requestsTo('GET', '/lots/ao-vivo/audit')).toHaveLength(2)
  })

  test('voltar à página refaz a consulta (sem cache)', async ({ page }) => {
    const api = new MockApi(page)
    withBids(api, 'ao-vivo', 'LIVE')
    await api.install()
    await page.goto('/lots/ao-vivo/audit')
    await expect(page.getByTestId('audit-verdict')).toBeVisible()

    await page.getByRole('link', { name: 'Voltar à sala do lote' }).click()
    await expect(page).toHaveURL(/\/lots\/ao-vivo$/)
    await page.getByRole('link', { name: 'Ver auditoria' }).click()
    await expect(page).toHaveURL(/\/lots\/ao-vivo\/audit$/)
    await expect(page.getByTestId('audit-verdict')).toBeVisible()
    await expect
      .poll(() => api.requestsTo('GET', '/lots/ao-vivo/audit').length)
      .toBe(2)
  })

  test('licitante logado também abre a sala e chega à auditoria', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    withBids(api, 'ao-vivo', 'LIVE')
    await api.install()
    await page.goto('/lots/ao-vivo')

    await page.getByRole('link', { name: 'Ver auditoria' }).click()
    await expect(page).toHaveURL(/\/lots\/ao-vivo\/audit$/)
    await expect(page.getByTestId('audit-verdict')).toContainText('ÍNTEGRO')
    // O nome da conta fica só no menu da sessão, nunca no conteúdo da auditoria.
    await expect(
      page.getByRole('article').getByText(USERS.BIDDER.name),
    ).toHaveCount(0)
  })

  test('licitante na sala de lance vê "Ver auditoria" e chega à auditoria', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    withBids(api, 'ao-vivo', 'LIVE')
    await api.install()
    await page.goto('/bidding/ao-vivo')

    await expect(page).toHaveURL(/\/bidding\/ao-vivo$/)
    await expect(page.getByRole('button', { name: 'Dar lance' })).toBeVisible()
    await page.getByRole('link', { name: 'Ver auditoria' }).click()
    await expect(page).toHaveURL(/\/lots\/ao-vivo\/audit$/)
    await expect(page.getByTestId('audit-verdict')).toContainText('ÍNTEGRO')
  })

  test('sala de lance 404 não mostra Ver auditoria', async ({ page }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    await api.install()
    await page.goto('/bidding/nao-existe')

    await expect(
      page.getByText('Lote não encontrado', { exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver auditoria' })).toHaveCount(
      0,
    )
    expect(api.requestsTo('GET', '/lots/nao-existe/audit')).toHaveLength(0)
  })

  test('leiloeiro também vê "Ver auditoria" na sala carregada', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('AUCTIONEER')
    withBids(api, 'ao-vivo', 'LIVE')
    await api.install()
    await page.goto('/lots/ao-vivo')

    await page.getByRole('link', { name: 'Ver auditoria' }).click()
    await expect(page).toHaveURL(/\/lots\/ao-vivo\/audit$/)
    await expect(page.getByTestId('audit-verdict')).toContainText('ÍNTEGRO')
  })

  test('sala 404 não mostra Ver auditoria', async ({ page }) => {
    const api = new MockApi(page)
    await api.install()
    await page.goto('/lots/nao-existe')

    await expect(
      page.getByText('Lote não encontrado', { exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver auditoria' })).toHaveCount(
      0,
    )
    expect(api.requestsTo('GET', '/lots/nao-existe/audit')).toHaveLength(0)
  })

  test('o link do comprovante chega à auditoria do lote', async ({ page }) => {
    const api = new MockApi(page)
    const { lot, receipt } = makeSoldLot('vendido', api.serverTime, {
      amountCents: 250_000,
      winner: 'Licitante 7F3A9C',
      receiptPublicId: 'rc-vendido',
    })
    api.lots = [lot]
    api.receipts.set(receipt.publicId, receipt)
    await api.install()
    await page.goto(`/receipts/${receipt.publicId}`)

    await page.getByRole('link', { name: 'Ver auditoria do lote' }).click()
    await expect(page).toHaveURL(/\/lots\/vendido\/audit$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Lote vendido',
    )
    await expect(page.getByTestId('audit-verdict')).toBeVisible()
  })

  test('a 320 px a página não rola para o lado', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    const api = new MockApi(page)
    withBids(api, 'mexido', 'ENDED')
    api.audits.set('mexido', {
      verdict: 'TAMPERED',
      firstInconsistency: { seq: 2, reason: 'BROKEN_LINK' },
    })
    await api.install()
    await page.goto('/lots/mexido/audit')

    await expect(page.getByTestId('audit-bid-3')).toBeVisible()
    await expect(page.getByTestId('audit-bid-2')).toBeVisible()
    await expectNoHorizontalScroll(page)
  })
})

import { expect, test } from '@playwright/test'

import { makeSoldLot, MockApi } from './support/mock-api'

test.describe('Comprovante público (RF-51, RF-52)', () => {
  test('abre sem login, mostra o arremate e copia o link e o hash', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const api = new MockApi(page)
    const { lot, receipt } = makeSoldLot('vendido', api.serverTime, {
      amountCents: 250_000,
      winner: 'Licitante 7F3A9C',
      receiptPublicId: 'Qx9-aB_cD3eF4gH5iJ6kLw',
    })
    api.lots = [lot]
    api.receipts.set(receipt.publicId, receipt)
    await api.install()
    await page.goto(`/receipts/${receipt.publicId}`)

    // Visitante: nada de login no caminho.
    await expect(page).toHaveURL(new RegExp(`/receipts/${receipt.publicId}$`))
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Lote vendido',
    )
    await expect(page.getByTestId('receipt-amount')).toHaveText(
      /R\$\s2\.500,00/,
    )
    await expect(page.getByTestId('receipt-winner')).toHaveText(
      'Licitante 7F3A9C',
    )
    await expect(page.getByTestId('receipt-settled-at')).toHaveText(
      /\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}/,
    )
    await expect(page.getByTestId('receipt-hash')).toHaveText(receipt.finalHash)
    // Imagem pelo caminho da API, nunca pela API externa.
    await expect(page.getByRole('img', { name: 'Lote vendido' })).toHaveCount(1)
    expect(api.requestsTo('GET', `/receipts/${receipt.publicId}`)).toHaveLength(
      1,
    )
    expect(api.requestsTo('GET', '/auth/me')).toHaveLength(0)

    await expect(
      page.getByRole('link', { name: 'Ver auditoria do lote' }),
    ).toHaveAttribute('href', '/lots/vendido/audit')

    await page.getByRole('button', { name: 'Copiar link' }).click()
    await expect(page.getByText('Link do comprovante copiado.')).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      `${new URL(page.url()).origin}/receipts/${receipt.publicId}`,
    )

    await page.getByRole('button', { name: 'Copiar hash' }).click()
    await expect(page.getByText('Hash copiado.')).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      receipt.finalHash,
    )
  })

  test('publicId inexistente mostra 404 amigável em português', async ({
    page,
  }) => {
    const api = new MockApi(page)
    await api.install()
    await page.goto('/receipts/nao-existe')

    await expect(
      page.getByText('Comprovante não encontrado', { exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('Este link não corresponde a nenhum comprovante válido.', {
        exact: false,
      }),
    ).toBeVisible()
    // 404 não se repete: uma chamada só, sem novas tentativas.
    expect(api.requestsTo('GET', '/receipts/nao-existe')).toHaveLength(1)
    await page.getByRole('link', { name: 'Voltar à vitrine' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})

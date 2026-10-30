import { expect, test } from '@playwright/test'

import { MockApi } from './support/mock-api'

test.describe('Carteira (RF-40 a RF-42)', () => {
  test('mostra total, comprometido e disponível', async ({ page }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    await api.install()
    await page.goto('/wallet')

    await expect(page.getByTestId('wallet-total')).toHaveText('R$ 500,00')
    await expect(page.getByTestId('wallet-committed')).toHaveText('R$ 100,00')
    await expect(page.getByTestId('wallet-available')).toHaveText('R$ 400,00')
    await expect(page.getByText('Nenhum movimento ainda')).toBeVisible()
  })

  test('duplo clique no depósito gera uma requisição só, e saldo e extrato atualizam', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    api.depositDelayMs = 600
    await api.install()
    await page.goto('/wallet')

    await page.getByLabel('Valor (R$)').fill('250,00')
    await page.getByRole('button', { name: 'Depositar' }).dblclick()

    await expect(page.getByText('Depósito de R$ 250,00 feito.')).toBeVisible()
    const deposits = api.requestsTo('POST', '/wallet/deposits')
    expect(deposits).toHaveLength(1)
    expect(deposits[0]!.headers()['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/)
    expect(deposits[0]!.postDataJSON()).toEqual({ amountCents: 25_000 })

    await expect(page.getByTestId('wallet-available')).toHaveText('R$ 650,00')
    await expect(page.getByTestId('wallet-total')).toHaveText('R$ 750,00')
    const table = page.getByTestId('movements-table')
    await expect(table.getByRole('row')).toHaveCount(2)
    await expect(table).toContainText('Depósito')
    await expect(table).toContainText('+ R$ 250,00')
  })

  test('cada novo depósito usa uma chave nova', async ({ page }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    await api.install()
    await page.goto('/wallet')

    for (const value of ['10,00', '20,00']) {
      await page.getByLabel('Valor (R$)').fill(value)
      await page.getByRole('button', { name: 'Depositar' }).click()
      await expect(
        page.getByText(`Depósito de R$ ${value} feito.`),
      ).toBeVisible()
    }

    const keys = api
      .requestsTo('POST', '/wallet/deposits')
      .map((request) => request.headers()['idempotency-key'])
    expect(keys).toHaveLength(2)
    expect(new Set(keys).size).toBe(2)
  })

  test('valida valor e teto antes de enviar', async ({ page }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    api.wallet.depositLimitCents = 1_000_000
    await api.install()
    await page.goto('/wallet')

    const amount = page.getByLabel('Valor (R$)')
    const submit = page.getByRole('button', { name: 'Depositar' })

    await amount.fill('0')
    await submit.click()
    await expect(
      page.getByText('O depósito precisa ser maior que zero.'),
    ).toBeVisible()

    await amount.fill('20.000,00')
    await submit.click()
    await expect(
      page.getByText('O depósito máximo é R$ 10.000,00.'),
    ).toBeVisible()

    expect(api.requestsTo('POST', '/wallet/deposits')).toHaveLength(0)
  })

  test('recusa valor ambíguo e aceita o formato pt-BR', async ({ page }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    await api.install()
    await page.goto('/wallet')

    const amount = page.getByLabel('Valor (R$)')
    const submit = page.getByRole('button', { name: 'Depositar' })

    for (const value of ['1,234', '1,2,3', '0,001', '1234.56', '12.34']) {
      await amount.fill(value)
      await submit.click()
      await expect(
        page.getByText('Valor inválido. Use o formato 100,00.'),
      ).toBeVisible()
    }
    expect(api.requestsTo('POST', '/wallet/deposits')).toHaveLength(0)

    await amount.fill('1.234,56')
    await submit.click()
    await expect(page.getByText('Depósito de R$ 1.234,56 feito.')).toBeVisible()
    const deposits = api.requestsTo('POST', '/wallet/deposits')
    expect(deposits).toHaveLength(1)
    expect(deposits[0]!.postDataJSON()).toEqual({ amountCents: 123_456 })
  })

  for (const [value, cents] of [
    ['100', 10_000],
    ['100,5', 10_050],
    ['100,00', 10_000],
  ] as const) {
    test(`"${value}" deposita ${cents} centavos`, async ({ page }) => {
      const api = new MockApi(page).loginAs('BIDDER')
      await api.install()
      await page.goto('/wallet')

      await page.getByLabel('Valor (R$)').fill(value)
      await page.getByRole('button', { name: 'Depositar' }).click()
      await expect(page.getByText(/Depósito de .* feito\./)).toBeVisible()
      expect(
        api.requestsTo('POST', '/wallet/deposits')[0]!.postDataJSON(),
      ).toEqual({ amountCents: cents })
    })
  }

  test('nova tentativa após falha de rede reusa a chave e não deposita duas vezes (RN-18)', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    // O servidor grava o depósito, mas a resposta se perde no caminho.
    api.dropDepositResponses = 1
    await api.install()
    await page.goto('/wallet')

    await page.getByLabel('Valor (R$)').fill('250,00')
    const submit = page.getByRole('button', { name: 'Depositar' })
    await submit.click()
    await expect(
      page.getByText(
        'Não foi possível conectar ao servidor. Verifique sua conexão.',
      ),
    ).toBeVisible()

    await submit.click()
    await expect(page.getByText('Depósito de R$ 250,00 feito.')).toBeVisible()

    const keys = api
      .requestsTo('POST', '/wallet/deposits')
      .map((request) => request.headers()['idempotency-key'])
    expect(keys).toHaveLength(2)
    expect(keys[0]).toBe(keys[1])
    expect(api.movements).toHaveLength(1)
    await expect(page.getByTestId('wallet-total')).toHaveText('R$ 750,00')
  })

  test('mudar o valor depois de uma falha gera chave nova', async ({
    page,
  }) => {
    const api = new MockApi(page).loginAs('BIDDER')
    api.dropDepositResponses = 1
    await api.install()
    await page.goto('/wallet')

    const amount = page.getByLabel('Valor (R$)')
    const submit = page.getByRole('button', { name: 'Depositar' })
    await amount.fill('250,00')
    await submit.click()
    await expect(
      page.getByText(
        'Não foi possível conectar ao servidor. Verifique sua conexão.',
      ),
    ).toBeVisible()

    await amount.fill('300,00')
    await submit.click()
    await expect(page.getByText('Depósito de R$ 300,00 feito.')).toBeVisible()

    const keys = api
      .requestsTo('POST', '/wallet/deposits')
      .map((request) => request.headers()['idempotency-key'])
    expect(keys).toHaveLength(2)
    expect(keys[0]).not.toBe(keys[1])
  })
})

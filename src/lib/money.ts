import { z } from 'zod'

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/** Centavos inteiros → "R$ 1.234,56". Dinheiro trafega sempre em centavos. */
export function formatCents(cents: number): string {
  return brl.format(cents / 100)
}

/**
 * Texto em reais digitado pela pessoa → centavos inteiros, ou `NaN` se não for um valor.
 * Aceita "1.234,56", "1234,56", "1234.56" e "10".
 */
export function parseReaisToCents(input: string): number {
  const text = input.replace(/\s|R\$/g, '')
  if (!/^\d[\d.,]*$/.test(text)) return Number.NaN

  const lastComma = text.lastIndexOf(',')
  const lastDot = text.lastIndexOf('.')
  // O último separador seguido de 1 ou 2 dígitos é o decimal; os outros são de milhar.
  const decimalAt = Math.max(lastComma, lastDot)
  const hasDecimal = decimalAt !== -1 && text.length - decimalAt - 1 <= 2
  const integerPart = (hasDecimal ? text.slice(0, decimalAt) : text).replace(
    /[.,]/g,
    '',
  )
  const decimalPart = hasDecimal ? text.slice(decimalAt + 1) : ''
  if (integerPart === '' && decimalPart === '') return Number.NaN

  return (
    Number(integerPart || '0') * 100 + Number(decimalPart.padEnd(2, '0') || 0)
  )
}

/** Centavos → texto para preencher um campo em reais ("1234,56"). */
export function centsToReaisInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

/**
 * Valor em reais no formato pt-BR, sem ambiguidade: dígitos, "." de milhar opcional em
 * grupos de 3 e "," com 1 ou 2 casas ("100", "100,5", "1.234,56"). Recusa "1,234",
 * "1,2,3", "0,001" e "1234.56", que antes viravam outro valor sem aviso.
 */
export const BRL_AMOUNT_PATTERN = /^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/

export const INVALID_AMOUNT_MESSAGE = 'Valor inválido. Use o formato 100,00.'

/**
 * Campo em reais digitado (depósito, lance) → centavos inteiros maiores que zero. Quem usa
 * encadeia as regras próprias (teto, mínimo) com `.pipe` ou `.refine`.
 */
export function reaisAmountField(
  requiredMessage: string,
  positiveMessage: string,
) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .regex(BRL_AMOUNT_PATTERN, INVALID_AMOUNT_MESSAGE)
    .transform(parseReaisToCents)
    .pipe(z.number(INVALID_AMOUNT_MESSAGE).int().positive(positiveMessage))
}

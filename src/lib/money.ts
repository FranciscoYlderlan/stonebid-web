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

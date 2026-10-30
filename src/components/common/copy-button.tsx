import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

type CopyButtonProps = Omit<
  ComponentProps<typeof Button>,
  'onClick' | 'children' | 'value'
> & {
  /** Texto copiado, ou função que o monta na hora do clique (ex.: a URL atual). */
  text: string | (() => string)
  label: string
  /** Aviso depois de copiar. */
  successMessage?: string
}

/** Quanto tempo o ícone de "copiado" fica no botão. */
const COPIED_MS = 2000

/** Botão que copia um texto para a área de transferência, com aviso de sucesso ou falha. */
export function CopyButton({
  text: source,
  label,
  successMessage = 'Copiado.',
  variant = 'outline',
  size = 'sm',
  ...buttonProps
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    const text = typeof source === 'function' ? source() : source
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto e copie à mão.')
      return
    }
    toast.success(successMessage)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), COPIED_MS)
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => void copy()}
      {...buttonProps}
    >
      {copied ? (
        <Check data-icon="inline-start" aria-hidden />
      ) : (
        <Copy data-icon="inline-start" aria-hidden />
      )}
      {label}
    </Button>
  )
}

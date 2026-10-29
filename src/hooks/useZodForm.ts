import { useCallback, useState } from 'react'
import { z } from 'zod'

type FieldErrors<T> = Partial<Record<keyof T, string>>

/** Estado de formulário simples, validado por um schema zod no envio. */
export function useZodForm<TSchema extends z.ZodObject>(
  schema: TSchema,
  initialValues: Partial<z.input<TSchema>>,
) {
  type Values = Partial<z.input<TSchema>>
  const [values, setValues] = useState<Values>(initialValues)
  const [errors, setErrors] = useState<FieldErrors<Values>>({})

  const setValue = useCallback(
    <K extends keyof Values>(key: K, value: Values[K]) => {
      setValues((current) => ({ ...current, [key]: value }))
      setErrors((current) => ({ ...current, [key]: undefined }))
    },
    [],
  )

  /** Valida tudo; devolve os dados prontos ou `null` (e mostra os erros). */
  const validate = useCallback((): z.output<TSchema> | null => {
    const result = schema.safeParse(values)
    if (result.success) {
      setErrors({})
      return result.data
    }
    const fieldErrors = z.flattenError(result.error).fieldErrors as Record<
      string,
      string[] | undefined
    >
    setErrors(
      Object.fromEntries(
        Object.entries(fieldErrors).map(([key, messages]) => [
          key,
          messages?.[0],
        ]),
      ) as FieldErrors<Values>,
    )
    return null
  }, [schema, values])

  return { values, errors, setValue, validate }
}

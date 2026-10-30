import { ImageOff } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

type CoverImageProps = {
  src?: string | null
  alt: string
  className?: string
}

/** Imagem de capa com proporção fixa e um marcador quando falta ou não carrega. */
export function CoverImage({ src, alt, className }: CoverImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = Boolean(src) && failedSrc !== src

  return (
    <div
      className={cn(
        'relative aspect-4/3 w-full overflow-hidden bg-muted',
        className,
      )}
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={alt}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        <div
          role="img"
          aria-label={`${alt} (sem imagem)`}
          className="flex size-full items-center justify-center text-muted-foreground"
        >
          <ImageOff className="size-8" aria-hidden />
        </div>
      )}
    </div>
  )
}

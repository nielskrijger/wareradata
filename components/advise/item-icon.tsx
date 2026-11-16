import Image from 'next/image'

import { humanizeItem } from '@/components/factories/format'
import { cn } from '@/lib/utils'
import { itemIconUrl } from '@/lib/warera/urls'

export function ItemIcon({ code, small }: { code: string, small?: boolean }) {
  return (
    <Image
      src={itemIconUrl(code)}
      alt={humanizeItem(code)}
      title={humanizeItem(code)}
      width={20}
      height={20}
      className={cn('inline-block shrink-0 object-contain', small ? 'size-4 align-[-0.2em]' : 'size-5')}
      unoptimized
    />
  )
}

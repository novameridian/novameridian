import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground/80 border-input bg-card flex field-sizing-content min-h-24 w-full rounded-[10px] border px-3.5 py-2.5 text-base shadow-xs transition-[color,border-color,box-shadow] duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'hover:border-foreground/25 focus-visible:border-ring focus-visible:ring-ring/25 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }

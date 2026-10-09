import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Nova Meridian button system
 *  default  – primary action (navy in light mode, teal in dark mode)
 *  brand    – teal accent action, used for hero / conversion moments
 *  outline  – quiet secondary, hairline border
 *  secondary / ghost / link / destructive
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold tracking-[-0.005em] transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out select-none disabled:pointer-events-none disabled:opacity-45 aria-busy:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-0 active:translate-y-px aria-invalid:ring-destructive/25 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_1px_0_rgb(255_255_255/0.08)_inset,0_1px_2px_rgb(7_17_31/0.18)] hover:bg-primary/90 hover:shadow-[0_6px_16px_-6px_rgb(7_17_31/0.45)] dark:hover:shadow-[0_6px_20px_-6px_rgb(25_211_197/0.5)]',
        brand:
          'bg-brand text-brand-foreground shadow-[0_1px_0_rgb(255_255_255/0.35)_inset] hover:brightness-105 hover:shadow-[0_8px_22px_-8px_rgb(25_211_197/0.75)]',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30',
        outline:
          'border border-input bg-transparent text-foreground hover:bg-accent hover:border-foreground/20',
        secondary:
          'bg-secondary text-secondary-foreground border border-transparent hover:bg-accent hover:border-border',
        ghost:
          'text-foreground/80 hover:bg-accent hover:text-foreground',
        link: 'text-brand-ink underline-offset-4 hover:underline rounded-sm',
      },
      size: {
        default: 'h-10 px-4 has-[>svg]:px-3.5',
        sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px] has-[>svg]:px-2.5',
        lg: 'h-11 px-5 text-[15px] has-[>svg]:px-4',
        icon: 'size-10 rounded-[10px]',
        'icon-sm': 'size-8 rounded-lg',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Shows an inline spinner and blocks interaction. */
    loading?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={asChild ? undefined : disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }

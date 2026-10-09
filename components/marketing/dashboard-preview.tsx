import { ArrowDownToLine, ArrowUpFromLine, Eye } from "lucide-react"
import { LogoMark } from "@/components/brand/logo"

/**
 * Structural preview of the signed-in dashboard. It shows layout and labels only;
 * no balances or performance figures are depicted.
 */
export function DashboardPreview() {
  return (
    <div
      role="img"
      aria-label="Illustration of the Nova Meridian dashboard showing a wallet summary, quick actions and plan list"
      className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg"
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3">
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <div className="ml-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <LogoMark className="size-4" /> Dashboard
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:p-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-5">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-brand/15 blur-3xl" />
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Wallet balance</p>
            <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xs font-semibold text-muted-foreground">ETB</span>
            <span className="h-7 w-36 rounded-md bg-foreground/10" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <span className="flex items-center justify-center gap-2 rounded-[10px] bg-primary py-2.5 text-xs font-semibold text-primary-foreground">
              <ArrowDownToLine className="size-3.5" aria-hidden="true" /> Deposit
            </span>
            <span className="flex items-center justify-center gap-2 rounded-[10px] border border-input py-2.5 text-xs font-semibold">
              <ArrowUpFromLine className="size-3.5" aria-hidden="true" /> Withdraw
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["Deposited", "Withdrawn", "Earned"].map((l, i) => (
            <div key={l} className="rounded-xl border border-border bg-background p-3">
              <p className="text-[11px] text-muted-foreground">{l}</p>
              <span className={`mt-2 block h-3.5 w-3/4 rounded ${i === 2 ? "bg-brand/50" : "bg-foreground/10"}`} />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs font-medium text-muted-foreground">Active plans</p>
          <svg viewBox="0 0 400 90" className="mt-3 h-20 w-full" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="dp-area" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#19D3C5" stopOpacity=".28" />
                <stop offset="1" stopColor="#19D3C5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 70 C60 66 90 52 140 48 S230 40 270 26 S350 12 400 6 V90 H0Z" fill="url(#dp-area)" />
            <path d="M0 70 C60 66 90 52 140 48 S230 40 270 26 S350 12 400 6" stroke="#19D3C5" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}

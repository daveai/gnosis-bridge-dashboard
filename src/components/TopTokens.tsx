import { formatUsd, formatNumber, canonicalTokenSymbol, assetClassColor } from '@/lib/format'
import { useTopTokens } from '@/hooks/queryHooks'
import { SectionHeader } from './SectionHeader'
import { Unavailable, EmptyLine } from './Unavailable'

interface TokenRow {
  symbol: string
  inflow: number
  outflow: number
  net: number
  transfers: number
}

interface Props {
  since?: string
  excludeBridge?: string
}

function aggregateByToken(
  rows: { tokenSymbol: string | null; amountUsd: string | null; direction: string }[],
): TokenRow[] {
  const m = new Map<string, TokenRow>()
  for (const tx of rows) {
    const sym = canonicalTokenSymbol(tx.tokenSymbol)
    const e = m.get(sym) || { symbol: sym, inflow: 0, outflow: 0, net: 0, transfers: 0 }
    const usd = parseFloat(tx.amountUsd || '0')
    if (tx.direction === 'inflow') e.inflow += usd
    else e.outflow += usd
    e.net = e.inflow - e.outflow
    e.transfers++
    m.set(sym, e)
  }
  return Array.from(m.values())
    .sort((a, b) => b.transfers - a.transfers)
    .slice(0, 10)
}

export function TopTokens({ since, excludeBridge }: Props) {
  const { data, isError } = useTopTokens({ since, excludeBridge })

  let tokens: TokenRow[] = []

  if (data?.kind === 'period') {
    tokens = aggregateByToken(data.transfers)
  } else if (data?.kind === 'all-time') {
    const merged = new Map<string, TokenRow>()
    for (const t of data.tokens) {
      if (!t.symbol) continue
      const sym = canonicalTokenSymbol(t.symbol)
      const inflow = parseFloat(t.inflowVolumeUsd) || 0
      const outflow = parseFloat(t.outflowVolumeUsd) || 0
      const e = merged.get(sym) || { symbol: sym, inflow: 0, outflow: 0, net: 0, transfers: 0 }
      e.inflow += inflow
      e.outflow += outflow
      e.net = e.inflow - e.outflow
      e.transfers += t.transferCount
      merged.set(sym, e)
    }
    tokens = Array.from(merged.values())
      .sort((a, b) => b.transfers - a.transfers)
      .slice(0, 10)
  }

  const maxAbsNet = tokens.reduce((m, t) => Math.max(m, Math.abs(t.net)), 0) || 1
  const totalAbsNet = tokens.reduce((s, t) => s + Math.abs(t.net), 0) || 1

  return (
    <section>
      <SectionHeader eyebrow="Token Mix" />
      <div className="overflow-x-auto">
        {isError ? (
          <Unavailable />
        ) : !data ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-7 border-b border-border/40" />
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <EmptyLine />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-[10px] uppercase tracking-[0.08em] border-b border-border">
                <th className="text-left pb-3">Token</th>
                <th className="text-right pb-3">Net flow</th>
                <th className="pb-3 w-[36%]">Share of net flow</th>
                <th className="text-right pb-3">Tx</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => {
                const sharePct = (Math.abs(t.net) / totalAbsNet) * 100
                const barPct = (Math.abs(t.net) / maxAbsNet) * 100
                const positive = t.net >= 0
                return (
                  <tr key={t.symbol} className="border-b border-border/50">
                    <td className="py-2.5">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-sm"
                          style={{ backgroundColor: assetClassColor(t.symbol) }}
                        />
                        {t.symbol}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 text-right num ${positive ? 'text-petrol-light' : 'text-coral'}`}
                    >
                      {positive ? '+' : ''}
                      {formatUsd(t.net)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-sm overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${barPct}%`,
                              backgroundColor: positive
                                ? 'var(--color-inflow)'
                                : 'var(--color-outflow)',
                            }}
                          />
                        </div>
                        <span className="num text-[11px] text-muted-foreground w-[42px] text-right">
                          {sharePct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right num text-muted-foreground">
                      {formatNumber(t.transfers)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}


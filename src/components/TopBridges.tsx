import { formatUsd, formatNumber, bridgeDisplayName } from '@/lib/format'
import { type BridgeDailyStats, type BridgeSummary } from '@/lib/types'
import { useTopBridges } from '@/hooks/queryHooks'
import { SectionHeader } from './SectionHeader'
import { InlineHideOmniToggle } from './PeriodSelector'
import { Unavailable } from './Unavailable'

interface Props {
  since?: string
  excludeBridge?: string
}

function aggregate(daily: BridgeDailyStats[]): BridgeSummary[] {
  const m = new Map<string, BridgeSummary>()
  for (const d of daily) {
    const e = m.get(d.bridge) || {
      bridge: d.bridge,
      inflowUsd: 0,
      outflowUsd: 0,
      totalUsd: 0,
      netUsd: 0,
      inflowCount: 0,
      outflowCount: 0,
      avgTicketUsd: 0,
      medianTicketUsd: null,
    }
    e.inflowUsd += parseFloat(d.inflowVolumeUsd) || 0
    e.outflowUsd += parseFloat(d.outflowVolumeUsd) || 0
    e.inflowCount += d.inflowCount
    e.outflowCount += d.outflowCount
    e.totalUsd = e.inflowUsd + e.outflowUsd
    e.netUsd = e.inflowUsd - e.outflowUsd
    m.set(d.bridge, e)
  }
  // Volume desc — leading column should also be the sort key. Bridges with
  // zero volume but non-zero tx count (e.g. CCIP OffRamp count-only) sort to
  // the bottom by transfer count.
  return Array.from(m.values()).sort((a, b) => {
    if (b.totalUsd !== a.totalUsd) return b.totalUsd - a.totalUsd
    return b.inflowCount + b.outflowCount - (a.inflowCount + a.outflowCount)
  })
}

export function TopBridges({ since, excludeBridge }: Props) {
  const { data, isError } = useTopBridges({ since, excludeBridge })

  if (isError) {
    return (
      <section>
        <SectionHeader eyebrow="Bridges">
          <InlineHideOmniToggle />
        </SectionHeader>
        <Unavailable />
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <SectionHeader eyebrow="Bridges">
          <InlineHideOmniToggle />
        </SectionHeader>
        <div className="bg-muted/40 h-72 animate-pulse rounded-sm" />
      </section>
    )
  }

  const bridges = aggregate(data.daily)
  const totalVolume = bridges.reduce((s, b) => s + b.totalUsd, 0) || 1

  return (
    <section>
      <SectionHeader eyebrow="Bridges">
        <InlineHideOmniToggle />
      </SectionHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-[10px] uppercase tracking-[0.08em] border-b border-border">
              <th className="text-left pb-3">Bridge</th>
              <th className="text-right pb-3">Volume</th>
              <th className="pb-3 w-[28%]">Share</th>
              <th className="text-right pb-3">Net flow</th>
              <th className="text-right pb-3">Transfers</th>
            </tr>
          </thead>
          <tbody>
            {bridges.map((b) => {
              const sharePct = (b.totalUsd / totalVolume) * 100
              const countOnly = b.totalUsd === 0 && b.inflowCount + b.outflowCount > 0
              return (
                <tr key={b.bridge} className="border-b border-border/50">
                  <td className="py-2.5">
                    {bridgeDisplayName(b.bridge)}
                    {countOnly ? (
                      <span className="ml-2 text-[10px] text-muted-foreground">count only</span>
                    ) : null}
                  </td>
                  <td className="py-2.5 text-right num">
                    {countOnly ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      formatUsd(b.totalUsd)
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {countOnly ? null : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-border rounded-sm overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.max(sharePct, 0.3)}%`,
                              backgroundColor: 'var(--color-petrol-light)',
                            }}
                          />
                        </div>
                        <span className="num text-[11px] text-muted-foreground w-[42px] text-right">
                          {sharePct.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td
                    className={`py-2.5 text-right num ${
                      countOnly
                        ? 'text-muted-foreground'
                        : b.netUsd >= 0
                          ? 'text-petrol-light'
                          : 'text-coral'
                    }`}
                  >
                    {countOnly ? '—' : `${b.netUsd >= 0 ? '+' : ''}${formatUsd(b.netUsd)}`}
                  </td>
                  <td className="py-2.5 text-right num text-muted-foreground">
                    {formatNumber(b.inflowCount + b.outflowCount)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

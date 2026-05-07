import { formatUsd, formatNumber, bridgeDisplayName, median } from '@/lib/format'
import { type BridgeDailyStats, type BridgeSummary } from '@/lib/types'
import { useTopBridges } from '@/hooks/queryHooks'
import { BridgeDivergingBar } from './charts/BridgeDivergingBar'
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
    const cnt = e.inflowCount + e.outflowCount
    e.avgTicketUsd = cnt > 0 ? e.totalUsd / cnt : 0
    m.set(d.bridge, e)
  }
  return Array.from(m.values()).sort((a, b) => Math.abs(b.netUsd) - Math.abs(a.netUsd))
}

export function TopBridges({ since, excludeBridge }: Props) {
  const { data, isError } = useTopBridges({ since, excludeBridge })

  if (isError) {
    return (
      <section>
        <SectionHeader eyebrow="Bridge Activity">
          <InlineHideOmniToggle />
        </SectionHeader>
        <Unavailable />
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <SectionHeader eyebrow="Bridge Activity">
          <InlineHideOmniToggle />
        </SectionHeader>
        <div className="bg-muted/40 h-72 animate-pulse rounded-sm" />
      </section>
    )
  }

  const bridges = aggregate(data.daily)

  for (const b of bridges) {
    const rows = data.samples[b.bridge] ?? []
    const sizes = rows.map((r) => parseFloat(r.amountUsd || '0')).filter((n) => n > 0)
    b.medianTicketUsd = median(sizes)
  }

  return (
    <section>
      <SectionHeader eyebrow="Bridge Activity">
        <InlineHideOmniToggle />
      </SectionHeader>
      <div className="grid lg:grid-cols-2 gap-8">
        <BridgeDivergingBar data={bridges} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-[10px] uppercase tracking-[0.08em] border-b border-border">
                <th className="text-left pb-3">Bridge</th>
                <th className="text-right pb-3">Volume</th>
                <th className="text-right pb-3">Net flow</th>
                <th className="text-right pb-3">Median ticket</th>
                <th className="text-right pb-3">Tx count</th>
              </tr>
            </thead>
            <tbody>
              {bridges.map((b) => (
                <tr key={b.bridge} className="border-b border-border/50">
                  <td className="py-2.5">{bridgeDisplayName(b.bridge)}</td>
                  <td className="py-2.5 text-right num text-muted-foreground">
                    {formatUsd(b.totalUsd)}
                  </td>
                  <td
                    className={`py-2.5 text-right num ${b.netUsd >= 0 ? 'text-petrol-light' : 'text-coral'}`}
                  >
                    {b.netUsd >= 0 ? '+' : ''}
                    {formatUsd(b.netUsd)}
                  </td>
                  <td className="py-2.5 text-right num text-muted-foreground">
                    {b.medianTicketUsd != null ? formatUsd(b.medianTicketUsd) : '—'}
                  </td>
                  <td className="py-2.5 text-right num text-muted-foreground">
                    {formatNumber(b.inflowCount + b.outflowCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

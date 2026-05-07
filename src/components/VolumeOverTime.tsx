import { formatUsd, bridgeDisplayName } from '@/lib/format'
import { ALL_BRIDGES, type BridgeDailyStats } from '@/lib/types'
import { useDailyVolume } from '@/hooks/queryHooks'
import { SmallMultipleSpark, TotalsStrip } from './charts/SmallMultipleSpark'
import { SectionHeader } from './SectionHeader'
import { InlineHideOmniToggle } from './PeriodSelector'
import { Unavailable } from './Unavailable'

interface Props {
  since?: string
  excludeBridge?: string
}

interface BridgeSeries {
  bridge: string
  total: number
  series: { date: string; inflow: number; outflow: number }[]
}

function buildSeries(rows: BridgeDailyStats[]): BridgeSeries[] {
  const dates = Array.from(new Set(rows.map((r) => r.date))).sort()
  const byBridge = new Map<string, Map<string, { inflow: number; outflow: number }>>()
  for (const r of rows) {
    let m = byBridge.get(r.bridge)
    if (!m) {
      m = new Map()
      byBridge.set(r.bridge, m)
    }
    const e = m.get(r.date) || { inflow: 0, outflow: 0 }
    e.inflow += parseFloat(r.inflowVolumeUsd) || 0
    e.outflow += parseFloat(r.outflowVolumeUsd) || 0
    m.set(r.date, e)
  }
  const out: BridgeSeries[] = []
  for (const [bridge, days] of byBridge.entries()) {
    let total = 0
    const series = dates.map((d) => {
      const e = days.get(d) || { inflow: 0, outflow: 0 }
      total += e.inflow + e.outflow
      return { date: d, ...e }
    })
    out.push({ bridge, total, series })
  }
  return out
}

export function VolumeOverTime({ since, excludeBridge }: Props) {
  const { data, isError } = useDailyVolume({ since, excludeBridge })

  if (isError) {
    return (
      <section>
        <SectionHeader eyebrow="Daily volume">
          <InlineHideOmniToggle />
        </SectionHeader>
        <Unavailable />
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <SectionHeader eyebrow="Daily volume">
          <InlineHideOmniToggle />
        </SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-[100px] bg-muted/40 animate-pulse rounded-sm" />
          ))}
        </div>
      </section>
    )
  }

  const series = buildSeries(data)
  const seriesByBridge = new Map(series.map((s) => [s.bridge, s]))

  const ordered = ALL_BRIDGES.filter((b) => b !== excludeBridge).map(
    (b) => seriesByBridge.get(b) || { bridge: b, total: 0, series: [] },
  )

  const totalsMap = new Map<string, { inflow: number; outflow: number }>()
  for (const r of data) {
    const e = totalsMap.get(r.date) || { inflow: 0, outflow: 0 }
    e.inflow += parseFloat(r.inflowVolumeUsd) || 0
    e.outflow += parseFloat(r.outflowVolumeUsd) || 0
    totalsMap.set(r.date, e)
  }
  const totalsRows = Array.from(totalsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))

  let globalYMax = 0
  for (const s of ordered) {
    for (const d of s.series) globalYMax = Math.max(globalYMax, d.inflow, d.outflow)
  }
  globalYMax = globalYMax || 1

  return (
    <section>
      <SectionHeader eyebrow="Daily volume">
        <InlineHideOmniToggle />
      </SectionHeader>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-2">
          Daily totals
        </p>
        <TotalsStrip data={totalsRows} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
        {ordered.map((s) => (
          <div key={s.bridge} style={{ minHeight: 100 }}>
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-xs text-foreground truncate pr-2">{bridgeDisplayName(s.bridge)}</p>
              <p className="text-[11px] num text-muted-foreground">{formatUsd(s.total)}</p>
            </div>
            <SmallMultipleSpark data={s.series} yMax={globalYMax} />
          </div>
        ))}
      </div>
    </section>
  )
}

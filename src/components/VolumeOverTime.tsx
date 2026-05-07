import { useState } from 'react'
import { formatUsd, bridgeDisplayName } from '@/lib/format'
import { ALL_BRIDGES, type BridgeDailyStats } from '@/lib/types'
import { useDailyVolume } from '@/hooks/queryHooks'
import { SmallMultipleSpark, TotalsStrip } from './charts/SmallMultipleSpark'
import { SectionHeader } from './SectionHeader'
import { Unavailable } from './Unavailable'

const VISIBLE_LIMIT = 8

interface Props {
  since?: string
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

export function VolumeOverTime({ since }: Props) {
  const { data, isError } = useDailyVolume({ since })
  const [showAll, setShowAll] = useState(false)

  if (isError) {
    return (
      <section>
        <SectionHeader eyebrow="Volume Over Time" />
        <Unavailable />
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <SectionHeader eyebrow="Volume Over Time" />
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

  const ordered = ALL_BRIDGES.map(
    (b) => seriesByBridge.get(b) || { bridge: b, total: 0, series: [] },
  ).sort((a, b) => b.total - a.total)

  const visible = showAll ? ordered : ordered.slice(0, VISIBLE_LIMIT)
  const hiddenCount = ordered.length - VISIBLE_LIMIT

  let totalInflow = 0
  let totalOutflow = 0
  const totalsMap = new Map<string, { inflow: number; outflow: number }>()
  for (const r of data) {
    const e = totalsMap.get(r.date) || { inflow: 0, outflow: 0 }
    const i = parseFloat(r.inflowVolumeUsd) || 0
    const o = parseFloat(r.outflowVolumeUsd) || 0
    e.inflow += i
    e.outflow += o
    totalInflow += i
    totalOutflow += o
    totalsMap.set(r.date, e)
  }
  const totalsRows = Array.from(totalsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))

  return (
    <section>
      <SectionHeader eyebrow="Volume Over Time" />
      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-sm"
            style={{ backgroundColor: 'var(--color-inflow)' }}
          />
          Inflow <span className="num text-foreground">{formatUsd(totalInflow)}</span>
        </span>
        <span className="flex items-center gap-2">
          Outflow <span className="num text-foreground">{formatUsd(totalOutflow)}</span>
          <span
            className="inline-block w-2 h-2 rounded-sm"
            style={{ backgroundColor: 'var(--color-muted-foreground)', opacity: 0.7 }}
          />
        </span>
      </div>
      <div className="mb-6">
        <TotalsStrip data={totalsRows} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
        {visible.map((s) => {
          let cellMax = 0
          for (const d of s.series) cellMax = Math.max(cellMax, d.inflow, d.outflow)
          cellMax = cellMax || 1
          return (
            <div key={s.bridge} style={{ minHeight: 100 }}>
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-xs text-foreground truncate pr-2">{bridgeDisplayName(s.bridge)}</p>
                <p className="text-[11px] num text-muted-foreground">{formatUsd(s.total)}</p>
              </div>
              <SmallMultipleSpark data={s.series} yMax={cellMax} />
              <p className="text-[9px] num text-muted-foreground mt-1">
                peak {formatUsd(cellMax)}
              </p>
            </div>
          )
        })}
      </div>
      {hiddenCount > 0 ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
          >
            {showAll ? 'Show fewer ▴' : `+ ${hiddenCount} more ▾`}
          </button>
        </div>
      ) : null}
    </section>
  )
}

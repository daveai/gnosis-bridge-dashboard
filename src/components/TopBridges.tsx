import { useMemo, useState } from 'react'
import {
  formatUsd,
  formatNumber,
  formatPercent,
  bridgeDisplayName,
  median,
  isoDateNDaysAgo,
} from '@/lib/format'
import { type BridgeDailyStats, type BridgeSummary, type Period } from '@/lib/types'
import { useTopBridges } from '@/hooks/queryHooks'
import { SectionHeader } from './SectionHeader'
import { Unavailable } from './Unavailable'

interface Props {
  since?: string
  period: Period
}

const LOW_VOLUME_THRESHOLD = 50_000

interface BridgeRow extends BridgeSummary {
  wowPct: number | null
}

function aggregate(
  daily: BridgeDailyStats[],
  samples: Record<string, { amountUsd: string | null }[]>,
  wowEnabled: boolean,
): BridgeRow[] {
  const m = new Map<string, BridgeSummary & { recent7: number; prior7: number }>()
  // Recent 7-day window: [today-6 ... today]. Prior: [today-13 ... today-7].
  const today = isoDateNDaysAgo(0)
  const recentCutoff = isoDateNDaysAgo(6)
  const priorCutoff = isoDateNDaysAgo(13)

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
      recent7: 0,
      prior7: 0,
    }
    const inflow = parseFloat(d.inflowVolumeUsd) || 0
    const outflow = parseFloat(d.outflowVolumeUsd) || 0
    e.inflowUsd += inflow
    e.outflowUsd += outflow
    e.inflowCount += d.inflowCount
    e.outflowCount += d.outflowCount
    e.totalUsd = e.inflowUsd + e.outflowUsd
    e.netUsd = e.inflowUsd - e.outflowUsd
    if (wowEnabled) {
      const dayVol = inflow + outflow
      if (d.date >= recentCutoff && d.date <= today) {
        e.recent7 += dayVol
      } else if (d.date >= priorCutoff && d.date < recentCutoff) {
        e.prior7 += dayVol
      }
    }
    m.set(d.bridge, e)
  }

  const out: BridgeRow[] = []
  for (const v of m.values()) {
    const sizes = (samples[v.bridge] ?? [])
      .map((s) => parseFloat(s.amountUsd || '0'))
      .filter((n) => n > 0)
    const wowPct = wowEnabled && v.prior7 > 0 ? ((v.recent7 - v.prior7) / v.prior7) * 100 : null
    const { recent7: _r, prior7: _p, ...summary } = v
    out.push({ ...summary, medianTicketUsd: median(sizes), wowPct })
  }
  return out.sort((a, b) => {
    if (b.totalUsd !== a.totalUsd) return b.totalUsd - a.totalUsd
    return b.inflowCount + b.outflowCount - (a.inflowCount + a.outflowCount)
  })
}

export function TopBridges({ since, period }: Props) {
  const { data, isError } = useTopBridges({ since })
  const [showInactive, setShowInactive] = useState(false)

  const wowEnabled = period === '30d' || period === 'all'
  const bridges = useMemo(
    () => (data ? aggregate(data.daily, data.samples, wowEnabled) : []),
    [data, wowEnabled],
  )
  const totalVolume = bridges.reduce((s, b) => s + b.totalUsd, 0) || 1

  if (isError) {
    return (
      <section>
        <SectionHeader eyebrow="Bridges" />
        <Unavailable />
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <SectionHeader eyebrow="Bridges" />
        <div className="bg-muted/40 h-72 animate-pulse rounded-sm" />
      </section>
    )
  }

  const active = bridges.filter((b) => b.totalUsd >= LOW_VOLUME_THRESHOLD)
  const inactive = bridges.filter((b) => b.totalUsd < LOW_VOLUME_THRESHOLD)
  const visible = showInactive ? bridges : active
  const colSpan = wowEnabled ? 7 : 6

  return (
    <section>
      <SectionHeader eyebrow="Bridges" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-[10px] uppercase tracking-[0.08em] border-b border-border">
              <th className="text-left pb-3">Bridge</th>
              <th className="text-right pb-3">Volume</th>
              <th className="pb-3 w-[24%]">Share</th>
              <th className="text-right pb-3 hidden md:table-cell">Median</th>
              {wowEnabled ? <th className="text-right pb-3 hidden md:table-cell">WoW%</th> : null}
              <th className="text-right pb-3 hidden sm:table-cell">Net flow</th>
              <th className="text-right pb-3">Tx</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((b) => {
              const sharePct = (b.totalUsd / totalVolume) * 100
              const wowColor =
                b.wowPct == null ? 'text-muted-foreground' : b.wowPct >= 0 ? 'text-petrol-light' : 'text-coral'
              return (
                <tr key={b.bridge} className="border-b border-border/50">
                  <td className="py-2.5">{bridgeDisplayName(b.bridge)}</td>
                  <td className="py-2.5 text-right num font-mono">{formatUsd(b.totalUsd)}</td>
                  <td className="py-2.5 px-3">
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
                      <span className="num font-mono text-[11px] text-muted-foreground w-[42px] text-right">
                        {sharePct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right num font-mono text-muted-foreground hidden md:table-cell">
                    {b.medianTicketUsd != null ? formatUsd(b.medianTicketUsd) : '—'}
                  </td>
                  {wowEnabled ? (
                    <td className={`py-2.5 text-right num font-mono hidden md:table-cell ${wowColor}`}>
                      {b.wowPct == null
                        ? '—'
                        : `${b.wowPct >= 0 ? '+' : ''}${formatPercent(b.wowPct, 0)}`}
                    </td>
                  ) : null}
                  <td
                    className={`py-2.5 text-right num font-mono hidden sm:table-cell ${
                      b.netUsd >= 0 ? 'text-foreground' : 'text-coral'
                    }`}
                  >
                    {b.netUsd >= 0 ? '+' : ''}
                    {formatUsd(b.netUsd)}
                  </td>
                  <td className="py-2.5 text-right num font-mono text-muted-foreground">
                    {formatNumber(b.inflowCount + b.outflowCount)}
                  </td>
                </tr>
              )
            })}
            {!showInactive && inactive.length > 0 ? (
              <tr>
                <td colSpan={colSpan} className="py-2.5 text-left">
                  <button
                    type="button"
                    onClick={() => setShowInactive(true)}
                    className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
                  >
                    Show inactive ({inactive.length}) ▾
                  </button>
                </td>
              </tr>
            ) : null}
            {showInactive && inactive.length > 0 ? (
              <tr>
                <td colSpan={colSpan} className="py-2.5 text-left">
                  <button
                    type="button"
                    onClick={() => setShowInactive(false)}
                    className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
                  >
                    Hide inactive ▴
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

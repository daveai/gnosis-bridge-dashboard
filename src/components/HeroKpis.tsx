import { useMemo } from 'react'
import { formatUsd, formatNumber, isoDateNDaysAgo, median, formatSignedUsd } from '@/lib/format'
import { TOTAL_CONFIGURED_BRIDGES, COVERAGE_START, type Period } from '@/lib/types'
import { useHero, useGlobalSample } from '@/hooks/queryHooks'
import { Sparkline } from './charts/Sparkline'
import { Unavailable } from './Unavailable'

interface Props {
  since?: string
  period: Period
}

function HeroSkeleton() {
  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 bg-muted/40 h-40 animate-pulse rounded-sm" />
      <div className="lg:col-span-2 grid grid-cols-2 gap-x-8 gap-y-6">
        <div className="bg-muted/40 h-12 animate-pulse rounded-sm" />
        <div className="bg-muted/40 h-12 animate-pulse rounded-sm" />
        <div className="bg-muted/40 h-12 animate-pulse rounded-sm" />
        <div className="bg-muted/40 h-12 animate-pulse rounded-sm" />
      </div>
    </div>
  )
}

export function HeroKpis({ since, period }: Props) {
  const sparkSince = useMemo(() => {
    if (period === '7d') return isoDateNDaysAgo(7)
    if (period === '30d') return isoDateNDaysAgo(30)
    return COVERAGE_START
  }, [period])
  const { data, isLoading, isError } = useHero({ since, sparkSince })
  const { data: sample } = useGlobalSample({ since })

  if (isLoading) return <HeroSkeleton />
  if (isError || !data) return <Unavailable height="h-40" />

  let inflow = 0
  let outflow = 0
  let transfers = 0
  const activeBridges = new Set<string>()
  for (const d of data.daily) {
    const i = parseFloat(d.inflowVolumeUsd) || 0
    const o = parseFloat(d.outflowVolumeUsd) || 0
    inflow += i
    outflow += o
    transfers += d.inflowCount + d.outflowCount
    if (i > 0 || o > 0 || d.inflowCount > 0 || d.outflowCount > 0) {
      activeBridges.add(d.bridge)
    }
  }
  const net = inflow - outflow
  const totalVolume = inflow + outflow

  const sparkPoints: { date: string; value: number }[] = []
  const map = new Map<string, number>()
  for (const d of data.spark) {
    const v = (parseFloat(d.inflowVolumeUsd) || 0) - (parseFloat(d.outflowVolumeUsd) || 0)
    map.set(d.date, (map.get(d.date) || 0) + v)
  }
  const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  for (const [date, v] of sorted) sparkPoints.push({ date, value: v })

  const sizes = (sample ?? []).map((t) => parseFloat(t.amountUsd || '0')).filter((n) => n > 0)
  const medianTicket = median(sizes)

  const netColor = net >= 0 ? 'text-petrol-light' : 'text-coral'

  return (
    <section className="grid lg:grid-cols-5 gap-8 lg:gap-12 pt-2 pb-6">
      <div className="lg:col-span-3 flex flex-col">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Net Flow
        </p>
        <p className={`mt-1 text-[2.75rem] sm:text-5xl font-mono leading-none num ${netColor}`}>
          {formatSignedUsd(net)}
        </p>
        <p className="text-muted-foreground text-sm mt-3">
          <span className="num">{formatUsd(inflow)}</span> in /{' '}
          <span className="num">{formatUsd(outflow)}</span> out
        </p>
        <div className="mt-4 -mx-1">
          <Sparkline data={sparkPoints} color="var(--color-petrol-light)" height={48} />
        </div>
      </div>

      <div className="lg:col-span-2 grid grid-cols-2 gap-x-8 gap-y-6">
        <Metric label="Total Volume" value={formatUsd(totalVolume)} />
        <Metric
          label="Active Bridges"
          value={`${activeBridges.size} / ${TOTAL_CONFIGURED_BRIDGES}`}
        />
        <Metric label="Transfers" value={formatNumber(transfers)} />
        <Metric
          label="Median Ticket"
          value={medianTicket != null ? formatUsd(medianTicket) : '—'}
        />
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <span className="font-mono text-[1.5rem] leading-none num text-foreground">{value}</span>
    </div>
  )
}

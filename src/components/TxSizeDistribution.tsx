import { bridgeDisplayName, formatUsd, median } from '@/lib/format'
import { ALL_BRIDGES } from '@/lib/types'
import { useTxSizes } from '@/hooks/queryHooks'
import { TxSizeHistogram } from './charts/TxSizeHistogram'
import { SectionHeader } from './SectionHeader'
import { Unavailable } from './Unavailable'

interface Props {
  since?: string
}

const BIN_COUNT = 12
const HARD_FLOOR = 0
const HARD_CEIL = 7

function pickRange(allSizes: number[]): { logMin: number; logMax: number } {
  const positive = allSizes.filter((n) => n > 0).sort((a, b) => a - b)
  if (positive.length === 0) return { logMin: HARD_FLOOR, logMax: HARD_CEIL }
  const p01 = positive[Math.floor(positive.length * 0.005)] ?? positive[0] ?? 1
  const p99 =
    positive[Math.min(positive.length - 1, Math.floor(positive.length * 0.995))] ??
    positive[positive.length - 1] ??
    1
  const logMin = Math.max(HARD_FLOOR, Math.floor(Math.log10(p01)))
  const logMax = Math.min(HARD_CEIL, Math.ceil(Math.log10(p99)))
  if (logMax - logMin < 2) return { logMin, logMax: Math.min(HARD_CEIL, logMin + 2) }
  return { logMin, logMax }
}

function binSizes(sizes: number[], logMin: number, logMax: number) {
  const span = logMax - logMin
  const bins = Array.from({ length: BIN_COUNT }, (_, i) => {
    const lower = Math.pow(10, logMin + (i / BIN_COUNT) * span)
    const upper = Math.pow(10, logMin + ((i + 1) / BIN_COUNT) * span)
    return { bin: String(i), count: 0, lower, upper }
  })
  for (const s of sizes) {
    if (s <= 0) continue
    const log = Math.log10(s)
    const idx = Math.min(
      BIN_COUNT - 1,
      Math.max(0, Math.floor(((log - logMin) / span) * BIN_COUNT)),
    )
    const bin = bins[idx]
    if (bin) bin.count += 1
  }
  return bins
}

function formatAxis(logValue: number): string {
  const v = Math.pow(10, logValue)
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

export function TxSizeDistribution({ since }: Props) {
  const { data, isError } = useTxSizes({ since })

  if (isError) {
    return (
      <section>
        <SectionHeader eyebrow="Ticket Distribution" />
        <Unavailable />
      </section>
    )
  }

  if (!data) {
    return (
      <section>
        <SectionHeader eyebrow="Ticket Distribution" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-[100px] bg-muted/40 animate-pulse rounded-sm" />
          ))}
        </div>
      </section>
    )
  }

  const allSizes: number[] = []
  const perBridge = ALL_BRIDGES.map((b) => {
    const rows = data.perBridge[b] ?? []
    const sizes = rows.map((r) => parseFloat(r.amountUsd || '0')).filter((n: number) => n > 0)
    allSizes.push(...sizes)
    return { bridge: b, sizes, total: sizes.reduce((s: number, n: number) => s + n, 0) }
  })

  const { logMin, logMax } = pickRange(allSizes)
  const span = logMax - logMin
  const globalMedian = median(allSizes)
  const globalMedianLog =
    globalMedian != null && globalMedian > 0
      ? Math.floor(((Math.log10(globalMedian) - logMin) / span) * BIN_COUNT)
      : null

  return (
    <section>
      <SectionHeader eyebrow="Ticket Distribution">
        {globalMedian != null ? (
          <span className="text-[11px] text-muted-foreground">
            Global median <span className="num text-foreground">{formatUsd(globalMedian)}</span>
          </span>
        ) : null}
      </SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
        {perBridge.map((b) => {
          const bins = binSizes(b.sizes, logMin, logMax)
          return (
            <div key={b.bridge} style={{ minHeight: 100 }}>
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-xs text-foreground truncate pr-2">
                  {bridgeDisplayName(b.bridge)}
                </p>
                <p className="text-[11px] num text-muted-foreground">{b.sizes.length}</p>
              </div>
              <TxSizeHistogram bins={bins} globalMedianLog={globalMedianLog} />
              <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                <span>{formatAxis(logMin)}</span>
                <span>{formatAxis(logMax)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

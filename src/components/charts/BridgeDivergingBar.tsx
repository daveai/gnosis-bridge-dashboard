import { formatUsd, bridgeDisplayName } from '@/lib/format'

interface Row {
  bridge: string
  inflowUsd: number
  outflowUsd: number
  netUsd: number
}

interface Props {
  data: Row[]
}

// Per-row scaling: each bar fills its own row to its own max so smaller bridges
// stay visible next to a dominant Omnibridge. Direction is encoded by side and
// colour, so cross-bar magnitude comparison is intentionally not possible here
// — the table next to it carries the absolute values.
export function BridgeDivergingBar({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        No bridge activity in this period
      </div>
    )
  }

  const rowH = 28

  return (
    <div className="w-full">
      <div className="space-y-1">
        {data.map((row) => {
          const rowMax = Math.max(row.inflowUsd, row.outflowUsd, 1)
          const inflowPct = (row.inflowUsd / rowMax) * 100
          const outflowPct = (row.outflowUsd / rowMax) * 100
          return (
            <div key={row.bridge} className="flex items-center" style={{ height: rowH }}>
              <div className="w-[120px] flex-shrink-0 text-xs text-foreground truncate pr-3">
                {bridgeDisplayName(row.bridge)}
              </div>
              <div className="flex-1 relative flex items-center" style={{ height: rowH }}>
                <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                <div className="w-1/2 h-full flex items-center justify-end pr-px">
                  <div
                    title={`Outflow ${formatUsd(row.outflowUsd)}`}
                    style={{
                      width: `${outflowPct}%`,
                      minWidth: row.outflowUsd > 0 ? 2 : 0,
                      backgroundColor: 'var(--color-outflow)',
                    }}
                    className="h-4 rounded-l-sm"
                  />
                </div>
                <div className="w-1/2 h-full flex items-center pl-px">
                  <div
                    title={`Inflow ${formatUsd(row.inflowUsd)}`}
                    style={{
                      width: `${inflowPct}%`,
                      minWidth: row.inflowUsd > 0 ? 2 : 0,
                      backgroundColor: 'var(--color-inflow)',
                    }}
                    className="h-4 rounded-r-sm"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex text-[10px] uppercase tracking-[0.08em] text-muted-foreground mt-3">
        <div className="w-[120px] flex-shrink-0" />
        <div className="flex-1 flex justify-between">
          <span>← Outflow</span>
          <span>Inflow →</span>
        </div>
      </div>
    </div>
  )
}

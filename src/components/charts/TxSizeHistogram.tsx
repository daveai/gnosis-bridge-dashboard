import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'
import { formatUsd } from '@/lib/format'

interface Bin {
  bin: string
  count: number
  lower: number
  upper: number
}

interface Props {
  bins: Bin[]
  globalMedianLog: number | null
}

interface TipPayload {
  payload?: Bin
}

function HistogramTooltip({ active, payload }: { active?: boolean; payload?: TipPayload[] }) {
  if (!active || !payload?.length) return null
  const b = payload[0]?.payload
  if (!b) return null
  return (
    <div className="bg-surface-raised border border-border rounded-sm px-2.5 py-1.5 text-[11px]">
      <p className="num text-foreground">
        {formatUsd(b.lower)} – {formatUsd(b.upper)}
      </p>
      <p className="num text-muted-foreground">
        {b.count} {b.count === 1 ? 'transfer' : 'transfers'}
      </p>
    </div>
  )
}

export function TxSizeHistogram({ bins, globalMedianLog }: Props) {
  if (bins.length === 0 || bins.every((b) => b.count === 0)) {
    return (
      <div className="h-[64px] flex items-center justify-center text-text-muted text-[11px]">
        No flow
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={64}>
      <BarChart data={bins} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="bin" hide />
        <YAxis hide />
        <Tooltip
          content={<HistogramTooltip />}
          cursor={{ fill: 'var(--color-foreground)', fillOpacity: 0.06 }}
        />
        {globalMedianLog != null ? (
          <ReferenceLine
            x={Math.round(globalMedianLog)}
            stroke="var(--color-foreground)"
            strokeOpacity={0.35}
            strokeDasharray="2 2"
          />
        ) : null}
        <Bar
          dataKey="count"
          fill="var(--color-petrol-light)"
          radius={[1, 1, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

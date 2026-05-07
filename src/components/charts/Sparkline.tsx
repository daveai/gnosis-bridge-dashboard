import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { formatSignedUsd } from '@/lib/format'

interface SparkPoint {
  date?: string
  value: number
}

interface Props {
  data: SparkPoint[]
  color?: string
  height?: number
}

interface TipPayload {
  payload?: SparkPoint
}

function SparkTooltip({ active, payload }: { active?: boolean; payload?: TipPayload[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="bg-surface-raised border border-border rounded-sm px-2.5 py-1.5 text-[11px] space-y-0.5">
      {p.date ? <p className="text-muted-foreground">{p.date}</p> : null}
      <p className="num text-foreground">{formatSignedUsd(p.value)}</p>
    </div>
  )
}

export function Sparkline({ data, color = 'var(--color-petrol-light)', height = 48 }: Props) {
  if (data.length === 0) {
    return <div className="h-12" />
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Tooltip
          content={<SparkTooltip />}
          cursor={{ stroke: 'var(--color-foreground)', strokeOpacity: 0.15 }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1}
          dot={false}
          isAnimationActive={false}
          fill="none"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface DualProps {
  inflow: number[]
  outflow: number[]
  height?: number
}

export function DualSparkline({ inflow, outflow, height = 48 }: DualProps) {
  const len = Math.max(inflow.length, outflow.length)
  if (len === 0) {
    return (
      <div className="h-12 flex items-center justify-center text-text-muted text-xs">No flow</div>
    )
  }
  const data = Array.from({ length: len }, (_, i) => ({
    inflow: inflow[i] ?? 0,
    outflow: outflow[i] ?? 0,
  }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
        <YAxis hide domain={[0, 'dataMax']} />
        <Line
          type="monotone"
          dataKey="inflow"
          stroke="var(--color-inflow)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="outflow"
          stroke="var(--color-outflow)"
          strokeWidth={1.25}
          strokeDasharray="2 2"
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

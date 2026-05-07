import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import { formatUsd } from '@/lib/format'

interface DayPoint {
  date?: string
  inflow: number
  outflow: number
}

interface TipPayload {
  payload?: DayPoint
}

function FlowTooltip({ active, payload }: { active?: boolean; payload?: TipPayload[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="bg-surface-raised border border-border rounded-sm px-2.5 py-1.5 text-[11px] space-y-0.5">
      {p.date ? <p className="text-muted-foreground">{p.date}</p> : null}
      <p>
        <span className="text-muted-foreground">Inflow </span>
        <span className="num text-foreground">{formatUsd(p.inflow)}</span>
      </p>
      <p>
        <span className="text-muted-foreground">Outflow </span>
        <span className="num text-foreground">{formatUsd(p.outflow)}</span>
      </p>
    </div>
  )
}

interface Props {
  data: DayPoint[]
  yMax: number
}

export function SmallMultipleSpark({ data, yMax }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-[64px] flex items-center justify-center text-text-muted text-[11px]">
        No flow
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={64}>
      <LineChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <YAxis hide domain={[0, yMax]} />
        <Tooltip
          content={<FlowTooltip />}
          cursor={{ stroke: 'var(--color-foreground)', strokeOpacity: 0.15 }}
        />
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
          stroke="var(--color-muted-foreground)"
          strokeWidth={1.25}
          strokeOpacity={0.7}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface TotalsProps {
  data: { date: string; inflow: number; outflow: number }[]
}

export function TotalsStrip({ data }: TotalsProps) {
  if (data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <YAxis hide domain={[0, 'dataMax']} />
        <Tooltip
          content={<FlowTooltip />}
          cursor={{ stroke: 'var(--color-foreground)', strokeOpacity: 0.15 }}
        />
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
          stroke="var(--color-muted-foreground)"
          strokeWidth={1.25}
          strokeOpacity={0.7}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

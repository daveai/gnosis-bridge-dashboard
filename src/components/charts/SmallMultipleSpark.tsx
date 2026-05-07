import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'

interface Props {
  data: { inflow: number; outflow: number }[]
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

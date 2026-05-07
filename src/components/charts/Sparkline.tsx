"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

interface Props {
  data: { value: number }[];
  color?: string;
  height?: number;
}

export function Sparkline({ data, color = "var(--color-petrol-light)", height = 48 }: Props) {
  if (data.length === 0) {
    return <div className="h-12" />;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface DualProps {
  inflow: number[];
  outflow: number[];
  height?: number;
}

export function DualSparkline({ inflow, outflow, height = 48 }: DualProps) {
  const len = Math.max(inflow.length, outflow.length);
  if (len === 0) {
    return <div className="h-12 flex items-center justify-center text-text-muted text-xs">No flow</div>;
  }
  const data = Array.from({ length: len }, (_, i) => ({
    inflow: inflow[i] ?? 0,
    outflow: outflow[i] ?? 0,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
        <YAxis hide domain={[0, "dataMax"]} />
        <Line type="monotone" dataKey="inflow" stroke="var(--color-inflow)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="outflow" stroke="var(--color-outflow)" strokeWidth={1.25} strokeDasharray="2 2" dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

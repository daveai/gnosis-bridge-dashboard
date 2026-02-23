"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { DailyVolume } from "@/lib/types";
import { formatUsd } from "@/lib/format";

interface Props {
  data: DailyVolume[];
}

export function VolumeAreaChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ left: 10, right: 10 }}>
        <defs>
          <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#105F7C" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#105F7C" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF8566" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#FF8566" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fill: "#888892", fontSize: 11 }}
          tickFormatter={(d) => {
            const [, m, day] = d.split("-");
            return `${m}/${day}`;
          }}
        />
        <YAxis tick={{ fill: "#888892", fontSize: 11 }} tickFormatter={(v) => formatUsd(v)} />
        <Tooltip
          formatter={(value: number | undefined) => formatUsd(value ?? 0)}
          contentStyle={{ background: "#161619", border: "1px solid #222228", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#FAFAFA" }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="inflowUsd" name="Inflow" stroke="#105F7C" fill="url(#inflowGrad)" strokeWidth={2} />
        <Area type="monotone" dataKey="outflowUsd" name="Outflow" stroke="#FF8566" fill="url(#outflowGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

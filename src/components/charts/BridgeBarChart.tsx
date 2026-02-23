"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { BridgeSummary } from "@/lib/types";
import { bridgeDisplayName, formatUsd } from "@/lib/format";

interface Props {
  data: BridgeSummary[];
}

export function BridgeBarChart({ data }: Props) {
  const chartData = data.map((b) => ({
    name: bridgeDisplayName(b.bridge),
    Inflow: b.inflowUsd,
    Outflow: b.outflowUsd,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <XAxis type="number" tickFormatter={(v) => formatUsd(v)} tick={{ fill: "#888892", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fill: "#FAFAFA", fontSize: 11 }} width={120} />
        <Tooltip
          formatter={(value: number | undefined) => formatUsd(value ?? 0)}
          contentStyle={{ background: "#161619", border: "1px solid #222228", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#FAFAFA" }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Inflow" fill="#105F7C" radius={[0, 2, 2, 0]} />
        <Bar dataKey="Outflow" fill="#FF8566" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

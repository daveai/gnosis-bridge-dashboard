"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from "recharts";

interface Props {
  bins: { bin: string; count: number; lower: number; upper: number }[];
  globalMedianLog: number | null;
}

export function TxSizeHistogram({ bins, globalMedianLog }: Props) {
  if (bins.length === 0 || bins.every((b) => b.count === 0)) {
    return (
      <div className="h-[64px] flex items-center justify-center text-text-muted text-[11px]">
        No flow
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={64}>
      <BarChart data={bins} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="bin" hide />
        <YAxis hide />
        {globalMedianLog != null ? (
          <ReferenceLine x={Math.round(globalMedianLog)} stroke="#FAFAFA" strokeOpacity={0.35} strokeDasharray="2 2" />
        ) : null}
        <Bar dataKey="count" fill="#105F7C" radius={[1, 1, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

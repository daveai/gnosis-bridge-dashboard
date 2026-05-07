"use client";

import { formatUsd, bridgeDisplayName } from "@/lib/format";

interface Row {
  bridge: string;
  inflowUsd: number;
  outflowUsd: number;
  netUsd: number;
}

interface Props {
  data: Row[];
}

export function BridgeDivergingBar({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-text-muted text-sm">
        No bridge activity in this period
      </div>
    );
  }

  const max = Math.max(
    ...data.map((d) => Math.max(d.inflowUsd, d.outflowUsd)),
    1,
  );

  const rowH = 28;

  return (
    <div className="w-full">
      <div className="flex text-[10px] uppercase tracking-[0.12em] text-text-muted mb-2">
        <div className="w-[120px] flex-shrink-0" />
        <div className="flex-1 flex justify-between">
          <span>Outflow</span>
          <span className="text-center flex-1">0</span>
          <span>Inflow</span>
        </div>
      </div>
      <div className="space-y-1">
        {data.map((row) => {
          const inflowPct = (row.inflowUsd / max) * 50;
          const outflowPct = (row.outflowUsd / max) * 50;
          return (
            <div
              key={row.bridge}
              className="flex items-center"
              style={{ height: rowH }}
            >
              <div className="w-[120px] flex-shrink-0 text-xs text-text-primary truncate pr-3">
                {bridgeDisplayName(row.bridge)}
              </div>
              <div className="flex-1 relative flex items-center" style={{ height: rowH }}>
                <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                <div className="w-1/2 h-full flex items-center justify-end pr-px">
                  <div
                    title={`Outflow ${formatUsd(row.outflowUsd)}`}
                    style={{ width: `${outflowPct * 2}%`, backgroundColor: "var(--color-outflow)" }}
                    className="h-4 rounded-l-sm"
                  />
                </div>
                <div className="w-1/2 h-full flex items-center pl-px">
                  <div
                    title={`Inflow ${formatUsd(row.inflowUsd)}`}
                    style={{ width: `${inflowPct * 2}%`, backgroundColor: "var(--color-inflow)" }}
                    className="h-4 rounded-r-sm"
                  />
                </div>
              </div>
              <div className="w-[80px] flex-shrink-0 pl-3 text-right text-xs num text-text-secondary">
                {row.netUsd >= 0 ? "+" : ""}
                {formatUsd(row.netUsd)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

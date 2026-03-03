"use client";

import { useMemo } from "react";
import { useGql } from "@/lib/useGql";
import { formatUsd, formatNumber, bridgeDisplayName } from "@/lib/format";
import type { BridgeDailyStats, BridgeSummary } from "@/lib/types";
import { BridgeBarChart } from "./charts/BridgeBarChart";

interface Response {
  BridgeDailyStats: BridgeDailyStats[];
}

interface Props {
  since?: string;
  excludeBridge?: string;
}

function Loading() {
  return <div className="bg-surface-card border border-border rounded-lg p-5 h-48 animate-pulse" />;
}

function aggregateBridges(dailyStats: BridgeDailyStats[]): BridgeSummary[] {
  const map = new Map<string, BridgeSummary>();
  for (const day of dailyStats) {
    const existing = map.get(day.bridge) || { bridge: day.bridge, inflowUsd: 0, outflowUsd: 0, totalUsd: 0, inflowCount: 0, outflowCount: 0 };
    existing.inflowUsd += parseFloat(day.inflowVolumeUsd);
    existing.outflowUsd += parseFloat(day.outflowVolumeUsd);
    existing.totalUsd = existing.inflowUsd + existing.outflowUsd;
    existing.inflowCount += day.inflowCount;
    existing.outflowCount += day.outflowCount;
    map.set(day.bridge, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.totalUsd - a.totalUsd);
}

export function TopBridges({ since, excludeBridge }: Props) {
  const conditions: string[] = [];
  if (since) conditions.push(`date: { _gte: "${since}" }`);
  if (excludeBridge) conditions.push(`bridge: { _neq: "${excludeBridge}" }`);
  const filter = conditions.length ? `(where: { ${conditions.join(", ")} })` : "";

  const { data, loading } = useGql<Response>(
    `{ BridgeDailyStats${filter} { bridge inflowVolumeUsd outflowVolumeUsd inflowCount outflowCount } }`
  );

  const bridges = useMemo(() => data ? aggregateBridges(data.BridgeDailyStats) : [], [data]);

  if (loading) return <Loading />;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Top Bridges by Volume</h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface-card border border-border rounded-lg p-5">
          <BridgeBarChart data={bridges.slice(0, 8)} />
        </div>
        <div className="bg-surface-card border border-border rounded-lg p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wide border-b border-border">
                <th className="text-left pb-3">Bridge</th>
                <th className="text-right pb-3">Inflow</th>
                <th className="text-right pb-3">Outflow</th>
                <th className="text-right pb-3">Total</th>
                <th className="text-right pb-3">Txns</th>
              </tr>
            </thead>
            <tbody>
              {bridges.map((b) => (
                <tr key={b.bridge} className="border-b border-border/50">
                  <td className="py-2.5 font-medium">{bridgeDisplayName(b.bridge)}</td>
                  <td className="py-2.5 text-right font-mono text-inflow">{formatUsd(b.inflowUsd)}</td>
                  <td className="py-2.5 text-right font-mono text-outflow">{formatUsd(b.outflowUsd)}</td>
                  <td className="py-2.5 text-right font-mono">{formatUsd(b.totalUsd)}</td>
                  <td className="py-2.5 text-right font-mono text-text-secondary">{formatNumber(b.inflowCount + b.outflowCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

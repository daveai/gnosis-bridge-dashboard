import { gql } from "@/lib/graphql";
import type { BridgeDailyStats, DailyVolume } from "@/lib/types";
import { VolumeAreaChart } from "./charts/VolumeAreaChart";

interface Response {
  BridgeDailyStats: BridgeDailyStats[];
}

interface Props {
  since?: string;
  excludeBridge?: string;
}

function aggregateDaily(stats: BridgeDailyStats[]): DailyVolume[] {
  const map = new Map<string, DailyVolume>();

  for (const day of stats) {
    const existing = map.get(day.date) || { date: day.date, inflowUsd: 0, outflowUsd: 0 };
    existing.inflowUsd += parseFloat(day.inflowVolumeUsd);
    existing.outflowUsd += parseFloat(day.outflowVolumeUsd);
    map.set(day.date, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function VolumeOverTime({ since, excludeBridge }: Props) {
  const conditions: string[] = [];
  if (since) conditions.push(`date: { _gte: "${since}" }`);
  if (excludeBridge) conditions.push(`bridge: { _neq: "${excludeBridge}" }`);
  const where = conditions.length ? `where: { ${conditions.join(", ")} }, ` : "";

  const data = await gql<Response>(`{
    BridgeDailyStats(${where}order_by: { date: asc }) {
      date
      inflowVolumeUsd
      outflowVolumeUsd
    }
  }`);

  const daily = aggregateDaily(data.BridgeDailyStats);

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Volume Over Time</h2>
      <div className="bg-surface-card border border-border rounded-lg p-5">
        <VolumeAreaChart data={daily} />
      </div>
    </section>
  );
}

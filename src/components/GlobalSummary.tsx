import { gql } from "@/lib/graphql";
import { formatUsd, formatNumber } from "@/lib/format";
import type { GlobalStats, BridgeDailyStats } from "@/lib/types";

interface StatsResponse {
  GlobalStats: GlobalStats[];
}

interface DailyResponse {
  BridgeDailyStats: BridgeDailyStats[];
}

interface Props {
  since?: string;
  excludeBridge?: string;
}

async function fetchGlobal() {
  const data = await gql<StatsResponse>(`{
    GlobalStats(where: { id: { _eq: "global" } }) {
      totalInflowUsd
      totalOutflowUsd
      totalTransfers
    }
  }`);
  const stats = data.GlobalStats[0];
  if (!stats) return null;
  return {
    inflow: parseFloat(stats.totalInflowUsd),
    outflow: parseFloat(stats.totalOutflowUsd),
    transfers: stats.totalTransfers,
  };
}

async function fetchFromDaily(since?: string, excludeBridge?: string) {
  const conditions: string[] = [];
  if (since) conditions.push(`date: { _gte: "${since}" }`);
  if (excludeBridge) conditions.push(`bridge: { _neq: "${excludeBridge}" }`);
  const where = `(where: { ${conditions.join(", ")} })`;

  const data = await gql<DailyResponse>(`{
    BridgeDailyStats${where} {
      inflowVolumeUsd
      outflowVolumeUsd
      inflowCount
      outflowCount
    }
  }`);
  let inflow = 0;
  let outflow = 0;
  let transfers = 0;
  for (const day of data.BridgeDailyStats) {
    inflow += parseFloat(day.inflowVolumeUsd);
    outflow += parseFloat(day.outflowVolumeUsd);
    transfers += day.inflowCount + day.outflowCount;
  }
  return { inflow, outflow, transfers };
}

export async function GlobalSummary({ since, excludeBridge }: Props) {
  const needsDaily = since || excludeBridge;
  const stats = needsDaily ? await fetchFromDaily(since, excludeBridge) : await fetchGlobal();
  if (!stats) return null;

  const { inflow, outflow, transfers } = stats;
  const netFlow = inflow - outflow;

  const items = [
    { label: "Total Inflow", value: formatUsd(inflow), sub: "to Gnosis" },
    { label: "Total Outflow", value: formatUsd(outflow), sub: "from Gnosis" },
    { label: "Net Flow", value: `${netFlow > 0 ? "+" : ""}${formatUsd(netFlow)}`, sub: netFlow >= 0 ? "net inflow" : "net outflow" },
    { label: "Transfers", value: formatNumber(transfers), sub: since ? `since ${since}` : "total" },
  ];

  return (
    <section>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.label} className="bg-surface-card border border-border rounded-lg p-5">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-1">{item.label}</p>
            <p className="text-2xl font-bold font-mono">{item.value}</p>
            <p className="text-text-secondary text-xs mt-1">{item.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

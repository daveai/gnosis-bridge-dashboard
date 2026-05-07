import { safeGql } from "@/lib/graphql";
import {
  formatUsd,
  formatNumber,
  isoDateNDaysAgo,
  median,
  formatSignedUsd,
} from "@/lib/format";
import { TOTAL_CONFIGURED_BRIDGES } from "@/lib/types";
import type { BridgeDailyStats } from "@/lib/types";
import { Sparkline } from "./charts/Sparkline";
import { Unavailable } from "./Unavailable";

interface DailyResp {
  BridgeDailyStats: BridgeDailyStats[];
}

interface SampleResp {
  BridgeTransfer: { amountUsd: string | null }[];
}

interface Props {
  since?: string;
}

export async function HeroKpis({ since }: Props) {
  const cond: string[] = [];
  if (since) cond.push(`date: { _gte: "${since}" }`);
  const where = cond.length ? `(where: { ${cond.join(", ")} })` : "";

  const sparkSince = isoDateNDaysAgo(30);

  const dailyP = safeGql<DailyResp>(`{
    BridgeDailyStats${where} {
      bridge
      date
      inflowVolumeUsd
      outflowVolumeUsd
      inflowCount
      outflowCount
    }
  }`);

  const sparkP = safeGql<DailyResp>(`{
    BridgeDailyStats(where: { date: { _gte: "${sparkSince}" } }, order_by: { date: asc }) {
      date
      inflowVolumeUsd
      outflowVolumeUsd
    }
  }`);

  const tsCondParts: string[] = [`amountUsd: { _is_null: false }`];
  if (since) {
    const sinceTs = Math.floor(new Date(since).getTime() / 1000).toString();
    tsCondParts.push(`timestamp: { _gte: "${sinceTs}" }`);
  }
  const sampleP = safeGql<SampleResp>(`{
    BridgeTransfer(where: { ${tsCondParts.join(", ")} }, limit: 2000) {
      amountUsd
    }
  }`);

  const [daily, spark, sample] = await Promise.all([dailyP, sparkP, sampleP]);

  if (!daily.ok) {
    return <Unavailable height="h-40" />;
  }

  let inflow = 0;
  let outflow = 0;
  let transfers = 0;
  const activeBridges = new Set<string>();
  for (const d of daily.data.BridgeDailyStats) {
    const i = parseFloat(d.inflowVolumeUsd) || 0;
    const o = parseFloat(d.outflowVolumeUsd) || 0;
    inflow += i;
    outflow += o;
    transfers += d.inflowCount + d.outflowCount;
    if (i > 0 || o > 0 || d.inflowCount > 0 || d.outflowCount > 0) {
      activeBridges.add(d.bridge);
    }
  }
  const net = inflow - outflow;
  const totalVolume = inflow + outflow;

  const sparkPoints: { value: number }[] = [];
  if (spark.ok) {
    const map = new Map<string, number>();
    for (const d of spark.data.BridgeDailyStats) {
      const v = (parseFloat(d.inflowVolumeUsd) || 0) - (parseFloat(d.outflowVolumeUsd) || 0);
      map.set(d.date, (map.get(d.date) || 0) + v);
    }
    const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    for (const [, v] of sorted) sparkPoints.push({ value: v });
  }

  let medianTicket: number | null = null;
  if (sample.ok) {
    const sizes = sample.data.BridgeTransfer
      .map((t) => parseFloat(t.amountUsd || "0"))
      .filter((n) => n > 0);
    medianTicket = median(sizes);
  }

  const netColor = net >= 0 ? "text-petrol-light" : "text-coral";

  return (
    <section className="grid lg:grid-cols-5 gap-8 lg:gap-12 pt-2 pb-6">
      <div className="lg:col-span-3 flex flex-col">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Net Flow
        </p>
        <p className={`mt-1 text-[2.75rem] sm:text-5xl font-mono leading-none num ${netColor}`}>
          {formatSignedUsd(net)}
        </p>
        <p className="text-muted-foreground text-sm mt-3">
          <span className="num">{formatUsd(inflow)}</span> in /{" "}
          <span className="num">{formatUsd(outflow)}</span> out
        </p>
        <div className="mt-4 -mx-1">
          <Sparkline
            data={sparkPoints}
            color={net >= 0 ? "var(--color-inflow)" : "var(--color-outflow)"}
            height={48}
          />
        </div>
        <p className="text-muted-foreground text-[11px] mt-1">30-day net flow</p>
      </div>

      <div className="lg:col-span-2 grid grid-cols-2 gap-x-8 gap-y-6">
        <Metric label="Total Volume" value={formatUsd(totalVolume)} />
        <Metric
          label="Active Bridges"
          value={`${activeBridges.size} / ${TOTAL_CONFIGURED_BRIDGES}`}
        />
        <Metric label="Transfers" value={formatNumber(transfers)} />
        <Metric
          label="Median Ticket"
          value={medianTicket != null ? formatUsd(medianTicket) : "—"}
        />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <span className="font-mono text-[1.5rem] leading-none num text-foreground">
        {value}
      </span>
    </div>
  );
}

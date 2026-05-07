import { safeGql } from "@/lib/graphql";
import { formatUsd, bridgeDisplayName } from "@/lib/format";
import { ALL_BRIDGES, type BridgeDailyStats } from "@/lib/types";
import { SmallMultipleSpark, TotalsStrip } from "./charts/SmallMultipleSpark";
import { SectionHeader } from "./SectionHeader";
import { InlineHideOmniToggle } from "./PeriodSelector";
import { Unavailable } from "./Unavailable";

interface Resp {
  BridgeDailyStats: BridgeDailyStats[];
}

interface Props {
  since?: string;
  excludeBridge?: string;
}

interface BridgeSeries {
  bridge: string;
  total: number;
  series: { date: string; inflow: number; outflow: number }[];
}

function buildSeries(rows: BridgeDailyStats[]): BridgeSeries[] {
  const dates = Array.from(new Set(rows.map((r) => r.date))).sort();
  const byBridge = new Map<string, Map<string, { inflow: number; outflow: number }>>();
  for (const r of rows) {
    let m = byBridge.get(r.bridge);
    if (!m) {
      m = new Map();
      byBridge.set(r.bridge, m);
    }
    const e = m.get(r.date) || { inflow: 0, outflow: 0 };
    e.inflow += parseFloat(r.inflowVolumeUsd) || 0;
    e.outflow += parseFloat(r.outflowVolumeUsd) || 0;
    m.set(r.date, e);
  }
  const out: BridgeSeries[] = [];
  for (const [bridge, days] of byBridge.entries()) {
    let total = 0;
    const series = dates.map((d) => {
      const e = days.get(d) || { inflow: 0, outflow: 0 };
      total += e.inflow + e.outflow;
      return { date: d, ...e };
    });
    out.push({ bridge, total, series });
  }
  return out;
}

export async function VolumeOverTime({ since, excludeBridge }: Props) {
  const cond: string[] = [];
  if (since) cond.push(`date: { _gte: "${since}" }`);
  if (excludeBridge) cond.push(`bridge: { _neq: "${excludeBridge}" }`);
  const where = cond.length ? `where: { ${cond.join(", ")} }, ` : "";

  const result = await safeGql<Resp>(`{
    BridgeDailyStats(${where}order_by: { date: asc }) {
      bridge
      date
      inflowVolumeUsd
      outflowVolumeUsd
    }
  }`);

  if (!result.ok) {
    return (
      <section>
        <SectionHeader eyebrow="Daily volume">
          <InlineHideOmniToggle />
        </SectionHeader>
        <Unavailable />
      </section>
    );
  }

  const series = buildSeries(result.data.BridgeDailyStats);
  const seriesByBridge = new Map(series.map((s) => [s.bridge, s]));

  const ordered = ALL_BRIDGES
    .filter((b) => b !== excludeBridge)
    .map((b) => seriesByBridge.get(b) || { bridge: b, total: 0, series: [] });

  const totalsMap = new Map<string, { inflow: number; outflow: number }>();
  for (const r of result.data.BridgeDailyStats) {
    const e = totalsMap.get(r.date) || { inflow: 0, outflow: 0 };
    e.inflow += parseFloat(r.inflowVolumeUsd) || 0;
    e.outflow += parseFloat(r.outflowVolumeUsd) || 0;
    totalsMap.set(r.date, e);
  }
  const totalsRows = Array.from(totalsMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // Single global yMax keeps every cell on the same scale so cross-bridge
  // comparison is honest; per-row scaling silently broke that.
  let globalYMax = 0;
  for (const s of ordered) {
    for (const d of s.series) globalYMax = Math.max(globalYMax, d.inflow, d.outflow);
  }
  globalYMax = globalYMax || 1;

  return (
    <section>
      <SectionHeader eyebrow="Daily volume">
        <InlineHideOmniToggle />
      </SectionHeader>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-2">
          Daily totals
        </p>
        <TotalsStrip data={totalsRows} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
        {ordered.map((s) => (
          <div key={s.bridge} style={{ minHeight: 100 }}>
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-xs text-foreground truncate pr-2">
                {bridgeDisplayName(s.bridge)}
              </p>
              <p className="text-[11px] num text-muted-foreground">
                {formatUsd(s.total)}
              </p>
            </div>
            <SmallMultipleSpark data={s.series} yMax={globalYMax} />
          </div>
        ))}
      </div>
    </section>
  );
}

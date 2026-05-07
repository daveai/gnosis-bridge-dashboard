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
        <SectionHeader eyebrow="Volume by bridge">
          <InlineHideOmniToggle />
        </SectionHeader>
        <div className="bg-surface-card border border-border rounded-lg p-5">
          <Unavailable />
        </div>
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

  const cols = 4;
  const rows = Math.ceil(ordered.length / cols);
  const rowYMax: number[] = [];
  for (let r = 0; r < rows; r++) {
    const slice = ordered.slice(r * cols, (r + 1) * cols);
    let max = 0;
    for (const s of slice) {
      for (const d of s.series) {
        max = Math.max(max, d.inflow, d.outflow);
      }
    }
    rowYMax[r] = max || 1;
  }

  return (
    <section>
      <SectionHeader eyebrow="Volume by bridge">
        <InlineHideOmniToggle />
      </SectionHeader>
      <div className="bg-surface-card border border-border rounded-lg p-5 mb-3">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted">
            Daily totals
          </p>
          <p className="text-[11px] text-text-muted flex gap-3">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-px" style={{ backgroundColor: "#105F7C", borderTop: "2px solid #105F7C" }} />
              Inflow
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-px" style={{ backgroundColor: "#FF8566", borderTop: "2px solid #FF8566" }} />
              Outflow
            </span>
          </p>
        </div>
        <TotalsStrip data={totalsRows} />
      </div>
      <div className="bg-surface-card border border-border rounded-lg p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ordered.map((s, idx) => {
            const rowIdx = Math.floor(idx / cols);
            const yMax = rowYMax[rowIdx];
            return (
              <div
                key={s.bridge}
                className="border border-border rounded-md p-3 hover:bg-surface-raised transition-colors"
                style={{ minHeight: 120 }}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-[11px] text-text-primary truncate pr-2">
                    {bridgeDisplayName(s.bridge)}
                  </p>
                  <p className="text-[11px] num text-text-muted">
                    {formatUsd(s.total)}
                  </p>
                </div>
                <SmallMultipleSpark data={s.series} yMax={yMax} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { safeGql } from "@/lib/graphql";
import {
  formatUsd,
  formatNumber,
  bridgeDisplayName,
  median,
} from "@/lib/format";
import {
  ALL_BRIDGES,
  BRIDGE_FOOTNOTES,
  type BridgeDailyStats,
  type BridgeSummary,
} from "@/lib/types";
import { BridgeDivergingBar } from "./charts/BridgeDivergingBar";
import { SectionHeader } from "./SectionHeader";
import { InlineHideOmniToggle } from "./PeriodSelector";
import { Unavailable } from "./Unavailable";

interface DailyResp {
  BridgeDailyStats: BridgeDailyStats[];
}

interface SampleResp {
  [alias: string]: { amountUsd: string | null }[];
}

interface Props {
  since?: string;
  excludeBridge?: string;
}

function aggregate(daily: BridgeDailyStats[]): BridgeSummary[] {
  const m = new Map<string, BridgeSummary>();
  for (const d of daily) {
    const e = m.get(d.bridge) || {
      bridge: d.bridge,
      inflowUsd: 0,
      outflowUsd: 0,
      totalUsd: 0,
      netUsd: 0,
      inflowCount: 0,
      outflowCount: 0,
      avgTicketUsd: 0,
      medianTicketUsd: null,
    };
    e.inflowUsd += parseFloat(d.inflowVolumeUsd) || 0;
    e.outflowUsd += parseFloat(d.outflowVolumeUsd) || 0;
    e.inflowCount += d.inflowCount;
    e.outflowCount += d.outflowCount;
    e.totalUsd = e.inflowUsd + e.outflowUsd;
    e.netUsd = e.inflowUsd - e.outflowUsd;
    const cnt = e.inflowCount + e.outflowCount;
    e.avgTicketUsd = cnt > 0 ? e.totalUsd / cnt : 0;
    m.set(d.bridge, e);
  }
  return Array.from(m.values()).sort(
    (a, b) => Math.abs(b.netUsd) - Math.abs(a.netUsd),
  );
}

export async function TopBridges({ since, excludeBridge }: Props) {
  const cond: string[] = [];
  if (since) cond.push(`date: { _gte: "${since}" }`);
  if (excludeBridge) cond.push(`bridge: { _neq: "${excludeBridge}" }`);
  const where = cond.length ? `(where: { ${cond.join(", ")} })` : "";

  const dailyP = safeGql<DailyResp>(`{
    BridgeDailyStats${where} {
      bridge
      inflowVolumeUsd
      outflowVolumeUsd
      inflowCount
      outflowCount
    }
  }`);

  const tsCond: string[] = [`amountUsd: { _is_null: false }`];
  if (since) {
    const sinceTs = Math.floor(new Date(since).getTime() / 1000).toString();
    tsCond.push(`timestamp: { _gte: "${sinceTs}" }`);
  }
  const aliasParts = ALL_BRIDGES.filter((b) => b !== excludeBridge).map(
    (b, i) =>
      `b${i}: BridgeTransfer(where: { ${tsCond.join(", ")}, bridge: { _eq: "${b}" } }, limit: 1000) { amountUsd }`,
  );
  const sampleQuery = `{ ${aliasParts.join("\n")} }`;
  const sampleP = safeGql<SampleResp>(sampleQuery);

  const [daily, sample] = await Promise.all([dailyP, sampleP]);

  if (!daily.ok) {
    return (
      <section>
        <SectionHeader eyebrow="Bridges by net flow">
          <InlineHideOmniToggle />
        </SectionHeader>
        <Unavailable />
      </section>
    );
  }

  const bridges = aggregate(daily.data.BridgeDailyStats);

  const medians = new Map<string, number | null>();
  if (sample.ok) {
    ALL_BRIDGES.filter((b) => b !== excludeBridge).forEach((b, i) => {
      const rows = sample.data[`b${i}`] || [];
      const sizes = rows
        .map((r) => parseFloat(r.amountUsd || "0"))
        .filter((n) => n > 0);
      medians.set(b, median(sizes));
    });
  }

  for (const b of bridges) {
    b.medianTicketUsd = medians.get(b.bridge) ?? null;
  }

  return (
    <section>
      <SectionHeader eyebrow="Bridges by net flow">
        <InlineHideOmniToggle />
      </SectionHeader>
      <div className="grid lg:grid-cols-2 gap-8">
        <BridgeDivergingBar data={bridges} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-[10px] uppercase tracking-[0.08em] border-b border-border">
                <th className="text-left pb-3">Bridge</th>
                <th className="text-right pb-3">Net flow</th>
                <th className="text-right pb-3">Median ticket</th>
                <th className="text-right pb-3">Tx count</th>
              </tr>
            </thead>
            <tbody>
              {bridges.map((b) => {
                const footnote = BRIDGE_FOOTNOTES[b.bridge];
                return (
                  <tr key={b.bridge} className="border-b border-border/50">
                    <td className="py-2.5">
                      <div>{bridgeDisplayName(b.bridge)}</div>
                      {footnote ? (
                        <div className="text-[10px] italic text-muted-foreground mt-0.5">
                          {footnote}
                        </div>
                      ) : null}
                    </td>
                    <td
                      className={`py-2.5 text-right num ${b.netUsd >= 0 ? "text-petrol-light" : "text-coral"}`}
                    >
                      {b.netUsd >= 0 ? "+" : ""}
                      {formatUsd(b.netUsd)}
                    </td>
                    <td className="py-2.5 text-right num text-muted-foreground">
                      {b.medianTicketUsd != null ? formatUsd(b.medianTicketUsd) : "—"}
                    </td>
                    <td className="py-2.5 text-right num text-muted-foreground">
                      {formatNumber(b.inflowCount + b.outflowCount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

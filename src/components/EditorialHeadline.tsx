import { safeGql } from "@/lib/graphql";
import { formatUsd, periodEditorialPrefix } from "@/lib/format";
import { bridgeDisplayName } from "@/lib/format";
import type { BridgeDailyStats } from "@/lib/types";

interface Response {
  BridgeDailyStats: BridgeDailyStats[];
}

interface Props {
  since?: string;
  period: "7d" | "30d" | "all";
}

export async function EditorialHeadline({ since, period }: Props) {
  const cond: string[] = [];
  if (since) cond.push(`date: { _gte: "${since}" }`);
  const where = cond.length ? `(where: { ${cond.join(", ")} })` : "";

  const result = await safeGql<Response>(`{
    BridgeDailyStats${where} {
      bridge
      inflowVolumeUsd
      outflowVolumeUsd
      inflowCount
      outflowCount
    }
  }`);

  if (!result.ok) return null;

  const bridges = new Map<
    string,
    { inflow: number; outflow: number; count: number }
  >();
  let inflow = 0;
  let outflow = 0;
  let transfers = 0;
  for (const d of result.data.BridgeDailyStats) {
    const i = parseFloat(d.inflowVolumeUsd) || 0;
    const o = parseFloat(d.outflowVolumeUsd) || 0;
    inflow += i;
    outflow += o;
    transfers += d.inflowCount + d.outflowCount;
    const b = bridges.get(d.bridge) || { inflow: 0, outflow: 0, count: 0 };
    b.inflow += i;
    b.outflow += o;
    b.count += d.inflowCount + d.outflowCount;
    bridges.set(d.bridge, b);
  }

  const totalTwoWay = inflow + outflow;
  if (totalTwoWay === 0 && transfers === 0) return null;

  const ranked = Array.from(bridges.entries())
    .map(([k, v]) => ({ bridge: k, total: v.inflow + v.outflow }))
    .sort((a, b) => b.total - a.total);
  const top = ranked[0];
  const topShare = top && totalTwoWay > 0 ? (top.total / totalTwoWay) * 100 : 0;

  const net = inflow - outflow;
  const direction = net >= 0 ? "net inflow" : "net outflow";
  const prefix = periodEditorialPrefix(period);
  const netLabel = formatUsd(Math.abs(net));
  const txLabel = transfers.toLocaleString("en-US");

  return (
    <p className="text-xl text-text-primary font-medium leading-snug">
      {prefix}: {direction} of <span className="num">{netLabel}</span> on{" "}
      <span className="num">{txLabel}</span> transfers.
      {top ? (
        <>
          {" "}
          {bridgeDisplayName(top.bridge)} drove{" "}
          <span className="num">{topShare.toFixed(0)}%</span> of two-way volume.
        </>
      ) : null}
    </p>
  );
}

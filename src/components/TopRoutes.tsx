import { safeGql } from "@/lib/graphql";
import { formatUsd, formatNumber, bridgeDisplayName } from "@/lib/format";
import { SectionHeader } from "./SectionHeader";
import { Unavailable, EmptyLine } from "./Unavailable";

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  56: "BNB Chain",
  100: "Gnosis",
  137: "Polygon",
  250: "Fantom",
  324: "zkSync Era",
  8453: "Base",
  42161: "Arbitrum One",
  42220: "Celo",
  43114: "Avalanche",
  59144: "Linea",
  534352: "Scroll",
  7565164: "Solana",
  100000014: "Sonic",
  100000017: "Abstract",
  100000019: "Cronos",
  100000022: "HyperEVM",
  100000026: "Tron",
  100000030: "Monad",
};

interface DailyResp {
  ChainPairDailyStats: {
    bridge: string;
    sourceChainId: number;
    destChainId: number;
    volumeUsd: string;
    transferCount: number;
  }[];
}

interface FallbackResp {
  BridgeTransfer: {
    bridge: string;
    sourceChainId: number;
    destChainId: number;
    amountUsd: string | null;
  }[];
}

interface RouteRow {
  key: string;
  source: string;
  dest: string;
  volume: number;
  transfers: number;
  topBridge: string;
  topBridgeVolume: number;
}

interface Props {
  since?: string;
  excludeBridge?: string;
}

function chainName(id: number): string {
  return CHAIN_NAMES[id] || `Chain ${id}`;
}

export async function TopRoutes({ since, excludeBridge }: Props) {
  const cond: string[] = [];
  if (since) cond.push(`date: { _gte: "${since}" }`);
  if (excludeBridge) cond.push(`bridge: { _neq: "${excludeBridge}" }`);
  const where = cond.length ? `(where: { ${cond.join(", ")} })` : "";

  const dailyR = await safeGql<DailyResp>(`{
    ChainPairDailyStats${where} {
      bridge
      sourceChainId
      destChainId
      volumeUsd
      transferCount
    }
  }`);

  let rows: RouteRow[] = [];
  let unavailable = false;

  if (dailyR.ok && dailyR.data.ChainPairDailyStats?.length) {
    const map = new Map<string, RouteRow & { byBridge: Map<string, number> }>();
    for (const d of dailyR.data.ChainPairDailyStats) {
      if (!d.sourceChainId || !d.destChainId) continue;
      const key = `${d.sourceChainId}-${d.destChainId}`;
      const e = map.get(key) || {
        key,
        source: chainName(d.sourceChainId),
        dest: chainName(d.destChainId),
        volume: 0,
        transfers: 0,
        topBridge: d.bridge,
        topBridgeVolume: 0,
        byBridge: new Map<string, number>(),
      };
      const v = parseFloat(d.volumeUsd) || 0;
      e.volume += v;
      e.transfers += d.transferCount;
      e.byBridge.set(d.bridge, (e.byBridge.get(d.bridge) || 0) + v);
      map.set(key, e);
    }
    for (const r of map.values()) {
      let top = r.topBridge;
      let topV = 0;
      for (const [b, v] of r.byBridge.entries()) {
        if (v > topV) {
          top = b;
          topV = v;
        }
      }
      r.topBridge = top;
      r.topBridgeVolume = topV;
    }
    rows = Array.from(map.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
      .map(({ byBridge: _bb, ...rest }) => rest);
  } else {
    const tsCond: string[] = [];
    if (since) {
      const sinceTs = Math.floor(new Date(since).getTime() / 1000).toString();
      tsCond.push(`timestamp: { _gte: "${sinceTs}" }`);
    }
    if (excludeBridge) tsCond.push(`bridge: { _neq: "${excludeBridge}" }`);
    const tsWhere = tsCond.length ? `where: { ${tsCond.join(", ")} }, ` : "";
    const r = await safeGql<FallbackResp>(`{
      BridgeTransfer(${tsWhere}limit: 5000) {
        bridge
        sourceChainId
        destChainId
        amountUsd
      }
    }`);
    if (!r.ok) {
      unavailable = true;
    } else {
      const map = new Map<string, RouteRow & { byBridge: Map<string, number> }>();
      for (const d of r.data.BridgeTransfer) {
        if (!d.sourceChainId || !d.destChainId) continue;
        const key = `${d.sourceChainId}-${d.destChainId}`;
        const e = map.get(key) || {
          key,
          source: chainName(d.sourceChainId),
          dest: chainName(d.destChainId),
          volume: 0,
          transfers: 0,
          topBridge: d.bridge,
          topBridgeVolume: 0,
          byBridge: new Map<string, number>(),
        };
        const v = parseFloat(d.amountUsd || "0");
        e.volume += v;
        e.transfers += 1;
        e.byBridge.set(d.bridge, (e.byBridge.get(d.bridge) || 0) + v);
        map.set(key, e);
      }
      for (const r2 of map.values()) {
        let top = r2.topBridge;
        let topV = 0;
        for (const [b, v] of r2.byBridge.entries()) {
          if (v > topV) {
            top = b;
            topV = v;
          }
        }
        r2.topBridge = top;
        r2.topBridgeVolume = topV;
      }
      rows = Array.from(map.values())
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10)
        .map(({ byBridge: _bb, ...rest }) => rest);
    }
  }

  return (
    <section>
      <SectionHeader eyebrow="Top routes" />
      <div className="bg-surface-card border border-border rounded-lg p-5 overflow-x-auto">
        {unavailable ? (
          <Unavailable />
        ) : rows.length === 0 ? (
          <EmptyLine />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-[10px] uppercase tracking-[0.12em] border-b border-border">
                <th className="text-left pb-3 font-medium">Route</th>
                <th className="text-right pb-3 font-medium">Volume</th>
                <th className="text-right pb-3 font-medium">Tx</th>
                <th className="text-right pb-3 font-medium">Top bridge</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-border/50">
                  <td className="py-2.5">
                    <span className="font-medium">{r.source}</span>
                    <span className="text-text-muted mx-2">{"→"}</span>
                    <span className="font-medium">{r.dest}</span>
                  </td>
                  <td className="py-2.5 text-right num">{formatUsd(r.volume)}</td>
                  <td className="py-2.5 text-right num text-text-secondary">{formatNumber(r.transfers)}</td>
                  <td className="py-2.5 text-right text-text-secondary">{bridgeDisplayName(r.topBridge)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

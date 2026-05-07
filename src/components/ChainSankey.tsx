import { safeGql } from "@/lib/graphql";
import type { ChainPairStats } from "@/lib/types";
import { FlowSankey } from "./charts/FlowSankey";
import { SectionHeader } from "./SectionHeader";
import { InlineHideOmniToggle } from "./PeriodSelector";
import { Unavailable, EmptyLine } from "./Unavailable";

const GNOSIS_CHAIN_ID = 100;

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

interface AllTimeResponse {
  ChainPairStats: ChainPairStats[];
}

interface TransferRow {
  direction: string;
  sourceChainId: number;
  destChainId: number;
  amountUsd: string | null;
}

interface TransferResponse {
  BridgeTransfer: TransferRow[];
}

interface ChainFlow {
  chainName: string;
  volume: number;
  count: number;
}

interface Props {
  since?: string;
  excludeBridge?: string;
}

function aggregateFlows(transfers: TransferRow[]) {
  const inflowMap = new Map<number, { volume: number; count: number }>();
  const outflowMap = new Map<number, { volume: number; count: number }>();

  for (const tx of transfers) {
    const usd = parseFloat(tx.amountUsd || "0");
    if (tx.direction === "inflow") {
      const e = inflowMap.get(tx.sourceChainId) || { volume: 0, count: 0 };
      e.volume += usd;
      e.count++;
      inflowMap.set(tx.sourceChainId, e);
    } else {
      const e = outflowMap.get(tx.destChainId) || { volume: 0, count: 0 };
      e.volume += usd;
      e.count++;
      outflowMap.set(tx.destChainId, e);
    }
  }

  const toFlows = (map: Map<number, { volume: number; count: number }>): ChainFlow[] =>
    Array.from(map.entries())
      .filter(([id]) => id !== GNOSIS_CHAIN_ID && id !== 0 && CHAIN_NAMES[id] != null)
      .map(([id, data]) => ({
        chainName: CHAIN_NAMES[id],
        ...data,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6);

  return { inflows: toFlows(inflowMap), outflows: toFlows(outflowMap) };
}

export async function ChainSankey({ since, excludeBridge }: Props) {
  let inflows: ChainFlow[] = [];
  let outflows: ChainFlow[] = [];
  let unavailable = false;

  if (since || excludeBridge) {
    const cond: string[] = [];
    if (since) {
      const sinceTs = Math.floor(new Date(since).getTime() / 1000).toString();
      cond.push(`timestamp: { _gte: "${sinceTs}" }`);
    }
    if (excludeBridge) cond.push(`bridge: { _neq: "${excludeBridge}" }`);
    const where = `where: { ${cond.join(", ")} }`;

    const r = await safeGql<TransferResponse>(`{
      BridgeTransfer(${where}, limit: 5000) {
        direction
        sourceChainId
        destChainId
        amountUsd
      }
    }`);
    if (!r.ok) unavailable = true;
    else ({ inflows, outflows } = aggregateFlows(r.data.BridgeTransfer));
  } else {
    const r = await safeGql<AllTimeResponse>(`{
      ChainPairStats {
        sourceChainId
        destChainId
        sourceChainName
        destChainName
        totalVolumeUsd
        transferCount
      }
    }`);
    if (!r.ok) {
      unavailable = true;
    } else {
      const inflowMap = new Map<number, ChainFlow>();
      const outflowMap = new Map<number, ChainFlow>();
      for (const cp of r.data.ChainPairStats) {
        if (cp.destChainId === GNOSIS_CHAIN_ID && cp.sourceChainId !== GNOSIS_CHAIN_ID && CHAIN_NAMES[cp.sourceChainId]) {
          const e = inflowMap.get(cp.sourceChainId) || {
            chainName: CHAIN_NAMES[cp.sourceChainId],
            volume: 0,
            count: 0,
          };
          e.volume += parseFloat(cp.totalVolumeUsd) || 0;
          e.count += cp.transferCount;
          inflowMap.set(cp.sourceChainId, e);
        }
        if (cp.sourceChainId === GNOSIS_CHAIN_ID && cp.destChainId !== GNOSIS_CHAIN_ID && CHAIN_NAMES[cp.destChainId]) {
          const e = outflowMap.get(cp.destChainId) || {
            chainName: CHAIN_NAMES[cp.destChainId],
            volume: 0,
            count: 0,
          };
          e.volume += parseFloat(cp.totalVolumeUsd) || 0;
          e.count += cp.transferCount;
          outflowMap.set(cp.destChainId, e);
        }
      }
      inflows = Array.from(inflowMap.values()).sort((a, b) => b.volume - a.volume).slice(0, 6);
      outflows = Array.from(outflowMap.values()).sort((a, b) => b.volume - a.volume).slice(0, 6);
    }
  }

  const empty = !unavailable && inflows.length === 0 && outflows.length === 0;

  return (
    <section>
      <SectionHeader eyebrow="Source and destination chains">
        <InlineHideOmniToggle />
      </SectionHeader>
      <div>
        {unavailable ? (
          <Unavailable />
        ) : empty ? (
          <EmptyLine message="No chain flow data" />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[900px] flex justify-center">
              <FlowSankey inflows={inflows} outflows={outflows} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

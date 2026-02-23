import { gql } from "@/lib/graphql";
import { formatUsd, formatNumber } from "@/lib/format";
import type { ChainPairStats, BridgeTransfer } from "@/lib/types";

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

interface PeriodTransfer {
  sourceChainId: number;
  destChainId: number;
  amountUsd: string | null;
}

interface PeriodResponse {
  BridgeTransfer: PeriodTransfer[];
}

interface FlowRow {
  id: string;
  sourceName: string;
  destName: string;
  volume: number;
  transfers: number;
}

interface Props {
  since?: string;
  excludeBridge?: string;
}

function aggregateTransfersByRoute(transfers: PeriodTransfer[]): FlowRow[] {
  const map = new Map<string, FlowRow>();
  for (const tx of transfers) {
    if (tx.sourceChainId === 0 || tx.destChainId === 0) continue;
    const key = `${tx.sourceChainId}-${tx.destChainId}`;
    const existing = map.get(key) || {
      id: key,
      sourceName: CHAIN_NAMES[tx.sourceChainId] || `Chain ${tx.sourceChainId}`,
      destName: CHAIN_NAMES[tx.destChainId] || `Chain ${tx.destChainId}`,
      volume: 0,
      transfers: 0,
    };
    existing.volume += parseFloat(tx.amountUsd || "0");
    existing.transfers++;
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.volume - a.volume).slice(0, 15);
}

export async function ChainFlows({ since, excludeBridge }: Props) {
  let rows: FlowRow[];

  if (since || excludeBridge) {
    const conditions: string[] = [];
    if (since) {
      const sinceTs = Math.floor(new Date(since).getTime() / 1000).toString();
      conditions.push(`timestamp: { _gte: "${sinceTs}" }`);
    }
    if (excludeBridge) conditions.push(`bridge: { _neq: "${excludeBridge}" }`);
    const where = `where: { ${conditions.join(", ")} }`;

    const data = await gql<PeriodResponse>(`{
      BridgeTransfer(${where}) {
        sourceChainId
        destChainId
        amountUsd
      }
    }`);
    rows = aggregateTransfersByRoute(data.BridgeTransfer);
  } else {
    const data = await gql<AllTimeResponse>(`{
      ChainPairStats(where: { sourceChainId: { _neq: 0 }, destChainId: { _neq: 0 } }, order_by: { totalVolumeUsd: desc }, limit: 15) {
        id
        sourceChainName
        destChainName
        totalVolumeUsd
        transferCount
      }
    }`);
    rows = data.ChainPairStats.map((cp) => ({
      id: cp.id,
      sourceName: cp.sourceChainName || "Unknown",
      destName: cp.destChainName || "Unknown",
      volume: parseFloat(cp.totalVolumeUsd),
      transfers: cp.transferCount,
    }));
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Chain Flows</h2>
      <div className="bg-surface-card border border-border rounded-lg p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wide border-b border-border">
              <th className="text-left pb-3">Route</th>
              <th className="text-right pb-3">Volume</th>
              <th className="text-right pb-3">Txns</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="py-2.5">
                  <span className="font-medium">{r.sourceName}</span>
                  <span className="text-text-muted mx-2">{"\u2192"}</span>
                  <span className="font-medium">{r.destName}</span>
                </td>
                <td className="py-2.5 text-right font-mono">{formatUsd(r.volume)}</td>
                <td className="py-2.5 text-right font-mono text-text-secondary">{formatNumber(r.transfers)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

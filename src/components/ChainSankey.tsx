"use client";

import { useMemo } from "react";
import { useGql } from "@/lib/useGql";
import type { ChainPairStats } from "@/lib/types";
import { FlowSankey } from "./charts/FlowSankey";

const GNOSIS_CHAIN_ID = 100;

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum", 10: "Optimism", 56: "BNB Chain", 100: "Gnosis", 137: "Polygon",
  250: "Fantom", 324: "zkSync Era", 8453: "Base", 42161: "Arbitrum One", 42220: "Celo",
  43114: "Avalanche", 59144: "Linea", 534352: "Scroll", 7565164: "Solana",
  100000014: "Sonic", 100000017: "Abstract", 100000019: "Cronos", 100000022: "HyperEVM",
  100000026: "Tron", 100000030: "Monad",
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

function Loading() {
  return <div className="bg-surface-card border border-border rounded-lg p-5 h-48 animate-pulse" />;
}

function aggregateFlows(transfers: TransferRow[]) {
  const inflowMap = new Map<number, { volume: number; count: number }>();
  const outflowMap = new Map<number, { volume: number; count: number }>();

  for (const tx of transfers) {
    const usd = parseFloat(tx.amountUsd || "0");
    if (tx.direction === "inflow") {
      const existing = inflowMap.get(tx.sourceChainId) || { volume: 0, count: 0 };
      existing.volume += usd;
      existing.count++;
      inflowMap.set(tx.sourceChainId, existing);
    } else {
      const existing = outflowMap.get(tx.destChainId) || { volume: 0, count: 0 };
      existing.volume += usd;
      existing.count++;
      outflowMap.set(tx.destChainId, existing);
    }
  }

  const toFlows = (map: Map<number, { volume: number; count: number }>): ChainFlow[] =>
    Array.from(map.entries())
      .filter(([id]) => id !== GNOSIS_CHAIN_ID && id !== 0 && CHAIN_NAMES[id] != null)
      .map(([id, data]) => ({ chainName: CHAIN_NAMES[id], ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6);

  return { inflows: toFlows(inflowMap), outflows: toFlows(outflowMap) };
}

export function ChainSankey({ since, excludeBridge }: Props) {
  const needsPeriod = since || excludeBridge;

  const conditions: string[] = [];
  if (since) {
    const sinceTs = Math.floor(new Date(since).getTime() / 1000).toString();
    conditions.push(`timestamp: { _gte: "${sinceTs}" }`);
  }
  if (excludeBridge) conditions.push(`bridge: { _neq: "${excludeBridge}" }`);
  const where = `where: { ${conditions.join(", ")} }`;

  const periodQuery = `{ BridgeTransfer(${where}) { direction sourceChainId destChainId amountUsd } }`;
  const allTimeQuery = `{ ChainPairStats { sourceChainId destChainId sourceChainName destChainName totalVolumeUsd transferCount } }`;

  const { data, loading } = useGql<AllTimeResponse & TransferResponse>(needsPeriod ? periodQuery : allTimeQuery);

  const { inflows, outflows } = useMemo(() => {
    if (!data) return { inflows: [], outflows: [] };
    if (needsPeriod) return aggregateFlows(data.BridgeTransfer);

    const inflowMap = new Map<number, ChainFlow>();
    const outflowMap = new Map<number, ChainFlow>();

    for (const cp of data.ChainPairStats) {
      if (cp.destChainId === GNOSIS_CHAIN_ID && cp.sourceChainId !== GNOSIS_CHAIN_ID && CHAIN_NAMES[cp.sourceChainId]) {
        const existing = inflowMap.get(cp.sourceChainId) || { chainName: CHAIN_NAMES[cp.sourceChainId], volume: 0, count: 0 };
        existing.volume += parseFloat(cp.totalVolumeUsd);
        existing.count += cp.transferCount;
        inflowMap.set(cp.sourceChainId, existing);
      }
      if (cp.sourceChainId === GNOSIS_CHAIN_ID && cp.destChainId !== GNOSIS_CHAIN_ID && CHAIN_NAMES[cp.destChainId]) {
        const existing = outflowMap.get(cp.destChainId) || { chainName: CHAIN_NAMES[cp.destChainId], volume: 0, count: 0 };
        existing.volume += parseFloat(cp.totalVolumeUsd);
        existing.count += cp.transferCount;
        outflowMap.set(cp.destChainId, existing);
      }
    }

    return {
      inflows: Array.from(inflowMap.values()).sort((a, b) => b.volume - a.volume).slice(0, 6),
      outflows: Array.from(outflowMap.values()).sort((a, b) => b.volume - a.volume).slice(0, 6),
    };
  }, [data, needsPeriod]);

  if (loading) return <Loading />;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Chain Flows</h2>
      <div className="bg-surface-card border border-border rounded-lg p-5 overflow-x-auto flex justify-center">
        <FlowSankey inflows={inflows} outflows={outflows} />
      </div>
    </section>
  );
}

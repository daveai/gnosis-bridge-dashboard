"use client";

import { useMemo } from "react";
import { useGql } from "@/lib/useGql";
import { formatUsd, formatNumber } from "@/lib/format";
import type { TokenStats, BridgeTransfer } from "@/lib/types";

interface AllTimeResponse {
  TokenStats: TokenStats[];
}

interface PeriodResponse {
  BridgeTransfer: Pick<BridgeTransfer, "tokenSymbol" | "amountUsd" | "direction">[];
}

interface TokenRow {
  symbol: string;
  inflow: number;
  outflow: number;
  net: number;
  transfers: number;
}

interface Props {
  since?: string;
  excludeBridge?: string;
}

function Loading() {
  return <div className="bg-surface-card border border-border rounded-lg p-5 h-48 animate-pulse" />;
}

function aggregateTransfersByToken(transfers: PeriodResponse["BridgeTransfer"]): TokenRow[] {
  const map = new Map<string, TokenRow>();
  for (const tx of transfers) {
    const sym = tx.tokenSymbol || "Unknown";
    const existing = map.get(sym) || { symbol: sym, inflow: 0, outflow: 0, net: 0, transfers: 0 };
    const usd = parseFloat(tx.amountUsd || "0");
    if (tx.direction === "inflow") existing.inflow += usd;
    else existing.outflow += usd;
    existing.net = existing.inflow - existing.outflow;
    existing.transfers++;
    map.set(sym, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.transfers - a.transfers).slice(0, 15);
}

export function TopTokens({ since, excludeBridge }: Props) {
  const needsPeriod = since || excludeBridge;

  const conditions: string[] = [];
  if (since) {
    const sinceTs = Math.floor(new Date(since).getTime() / 1000).toString();
    conditions.push(`timestamp: { _gte: "${sinceTs}" }`);
  }
  if (excludeBridge) conditions.push(`bridge: { _neq: "${excludeBridge}" }`);
  const where = `where: { ${conditions.join(", ")} }`;

  const periodQuery = `{ BridgeTransfer(${where}) { tokenSymbol amountUsd direction } }`;
  const allTimeQuery = `{ TokenStats(where: { symbol: { _is_null: false } }, order_by: { transferCount: desc }, limit: 15) { id symbol inflowVolumeUsd outflowVolumeUsd transferCount } }`;

  const { data, loading } = useGql<AllTimeResponse & PeriodResponse>(needsPeriod ? periodQuery : allTimeQuery);

  const tokens = useMemo(() => {
    if (!data) return [];
    if (needsPeriod) return aggregateTransfersByToken(data.BridgeTransfer);
    return data.TokenStats.filter((t) => t.symbol).map((t) => {
      const inflow = parseFloat(t.inflowVolumeUsd);
      const outflow = parseFloat(t.outflowVolumeUsd);
      return { symbol: t.symbol!, inflow, outflow, net: inflow - outflow, transfers: t.transferCount };
    });
  }, [data, needsPeriod]);

  if (loading) return <Loading />;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Top Tokens</h2>
      <div className="bg-surface-card border border-border rounded-lg p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wide border-b border-border">
              <th className="text-left pb-3">Token</th>
              <th className="text-right pb-3">Inflow</th>
              <th className="text-right pb-3">Outflow</th>
              <th className="text-right pb-3">Net</th>
              <th className="text-right pb-3">Txns</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t) => (
              <tr key={t.symbol} className="border-b border-border/50">
                <td className="py-2.5 font-medium">{t.symbol}</td>
                <td className="py-2.5 text-right font-mono text-inflow">{formatUsd(t.inflow)}</td>
                <td className="py-2.5 text-right font-mono text-outflow">{formatUsd(t.outflow)}</td>
                <td className={`py-2.5 text-right font-mono ${t.net >= 0 ? "text-inflow" : "text-outflow"}`}>
                  {t.net >= 0 ? "+" : ""}{formatUsd(t.net)}
                </td>
                <td className="py-2.5 text-right font-mono text-text-secondary">{formatNumber(t.transfers)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

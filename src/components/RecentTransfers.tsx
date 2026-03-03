"use client";

import { useGql } from "@/lib/useGql";
import { formatUsd, formatDate, bridgeDisplayName, shortenTxHash } from "@/lib/format";
import type { BridgeTransfer } from "@/lib/types";

interface Response {
  BridgeTransfer: BridgeTransfer[];
}

function Loading() {
  return <div className="bg-surface-card border border-border rounded-lg p-5 h-48 animate-pulse" />;
}

export function RecentTransfers() {
  const { data, loading } = useGql<Response>(
    `{ BridgeTransfer(order_by: { timestamp: desc }, limit: 20) { id bridge direction tokenSymbol amountUsd timestamp txHash } }`
  );

  if (loading || !data) return <Loading />;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Recent Transfers</h2>
      <div className="bg-surface-card border border-border rounded-lg p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted text-xs uppercase tracking-wide border-b border-border">
              <th className="text-left pb-3">Bridge</th>
              <th className="text-left pb-3">Direction</th>
              <th className="text-left pb-3">Token</th>
              <th className="text-right pb-3">USD Value</th>
              <th className="text-right pb-3">Time</th>
              <th className="text-right pb-3">Tx</th>
            </tr>
          </thead>
          <tbody>
            {data.BridgeTransfer.map((tx) => (
              <tr key={tx.id} className="border-b border-border/50">
                <td className="py-2.5 font-medium">{bridgeDisplayName(tx.bridge)}</td>
                <td className="py-2.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    tx.direction === "inflow"
                      ? "bg-inflow/20 text-inflow"
                      : "bg-outflow/20 text-outflow"
                  }`}>
                    {tx.direction === "inflow" ? "IN" : "OUT"}
                  </span>
                </td>
                <td className="py-2.5 font-mono">{tx.tokenSymbol || "?"}</td>
                <td className="py-2.5 text-right font-mono">{formatUsd(tx.amountUsd)}</td>
                <td className="py-2.5 text-right text-text-secondary">{formatDate(tx.timestamp)}</td>
                <td className="py-2.5 text-right">
                  <a
                    href={`https://gnosisscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-petrol-light hover:text-coral transition-colors"
                  >
                    {shortenTxHash(tx.txHash)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

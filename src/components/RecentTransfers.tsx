import { safeGql } from "@/lib/graphql";
import { formatUsd, formatDate, bridgeDisplayName, shortenTxHash } from "@/lib/format";
import type { BridgeTransfer } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { Unavailable, EmptyLine } from "./Unavailable";

interface Response {
  BridgeTransfer: BridgeTransfer[];
}

export async function RecentTransfers() {
  const result = await safeGql<Response>(`{
    BridgeTransfer(order_by: { timestamp: desc }, limit: 10) {
      id
      bridge
      direction
      tokenSymbol
      amountUsd
      timestamp
      txHash
    }
  }`);

  return (
    <section>
      <SectionHeader eyebrow="Recent transfers">
        <a href="#" className="text-[11px] text-text-muted hover:text-text-primary transition-colors">
          View all
        </a>
      </SectionHeader>
      <div className="bg-surface-card border border-border rounded-lg p-5 overflow-x-auto">
        {!result.ok ? (
          <Unavailable />
        ) : result.data.BridgeTransfer.length === 0 ? (
          <EmptyLine />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-[10px] uppercase tracking-[0.12em] border-b border-border">
                <th className="text-left pb-3 font-medium">Bridge</th>
                <th className="text-left pb-3 font-medium">Direction</th>
                <th className="text-left pb-3 font-medium">Token</th>
                <th className="text-right pb-3 font-medium">USD</th>
                <th className="text-right pb-3 font-medium">Time</th>
                <th className="text-right pb-3 font-medium">Tx</th>
              </tr>
            </thead>
            <tbody>
              {result.data.BridgeTransfer.map((tx) => {
                const inflow = tx.direction === "inflow";
                return (
                  <tr key={tx.id} className="border-b border-border/50">
                    <td className="py-2.5 font-medium">{bridgeDisplayName(tx.bridge)}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs ${inflow ? "text-petrol-light" : "text-coral"}`}>
                        <span aria-hidden>{inflow ? "↓" : "↑"}</span>
                        <span className="text-text-secondary">{inflow ? "Inflow" : "Outflow"}</span>
                      </span>
                    </td>
                    <td className="py-2.5 font-mono">{tx.tokenSymbol || "?"}</td>
                    <td className="py-2.5 text-right num">{formatUsd(tx.amountUsd)}</td>
                    <td className="py-2.5 text-right text-text-secondary">{formatDate(tx.timestamp)}</td>
                    <td className="py-2.5 text-right">
                      <a
                        href={`https://gnosisscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-petrol-light hover:text-text-primary transition-colors"
                      >
                        {shortenTxHash(tx.txHash)}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

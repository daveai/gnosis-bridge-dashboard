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
      <SectionHeader eyebrow="Latest transfers" />
      <div className="overflow-x-auto">
        {!result.ok ? (
          <Unavailable />
        ) : result.data.BridgeTransfer.length === 0 ? (
          <EmptyLine />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-[10px] uppercase tracking-[0.08em] border-b border-border">
                <th className="text-left pb-3">Bridge</th>
                <th className="text-left pb-3">Direction</th>
                <th className="text-left pb-3">Token</th>
                <th className="text-right pb-3">USD</th>
                <th className="text-right pb-3">Time</th>
                <th className="text-right pb-3">Tx</th>
              </tr>
            </thead>
            <tbody>
              {result.data.BridgeTransfer.map((tx) => {
                const inflow = tx.direction === "inflow";
                return (
                  <tr key={tx.id} className="border-b border-border/50">
                    <td className="py-2.5">{bridgeDisplayName(tx.bridge)}</td>
                    <td className={`py-2.5 ${inflow ? "text-petrol-light" : "text-coral"}`}>
                      {inflow ? "Inflow" : "Outflow"}
                    </td>
                    <td className="py-2.5 font-mono">{tx.tokenSymbol || "?"}</td>
                    <td className="py-2.5 text-right num">{formatUsd(tx.amountUsd)}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{formatDate(tx.timestamp)}</td>
                    <td className="py-2.5 text-right">
                      <a
                        href={`https://gnosisscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-petrol-light hover:underline underline-offset-2"
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

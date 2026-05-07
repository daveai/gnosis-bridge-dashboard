import { formatUsd, formatDate, bridgeDisplayName, shortenTxHash, assetClassColor } from '@/lib/format'
import { useRecentTransfers } from '@/hooks/queryHooks'
import { SectionHeader } from './SectionHeader'
import { Unavailable, EmptyLine } from './Unavailable'

export function RecentTransfers() {
  const { data, isError } = useRecentTransfers()

  return (
    <section>
      <SectionHeader eyebrow="Recent Transfers" />
      <div className="overflow-x-auto">
        {isError ? (
          <Unavailable />
        ) : !data ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-7 border-b border-border/40" />
            ))}
          </div>
        ) : data.length === 0 ? (
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
              {data.map((tx) => {
                const inflow = tx.direction === 'inflow'
                return (
                  <tr key={tx.id} className="border-b border-border/50">
                    <td className="py-2.5">{bridgeDisplayName(tx.bridge)}</td>
                    <td className={`py-2.5 ${inflow ? 'text-petrol-light' : 'text-coral'}`}>
                      {inflow ? 'Inflow' : 'Outflow'}
                    </td>
                    <td className="py-2.5">
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-sm"
                          style={{ backgroundColor: assetClassColor(tx.tokenSymbol) }}
                        />
                        <span className="font-mono">{tx.tokenSymbol || '?'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-right num">{formatUsd(tx.amountUsd)}</td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {formatDate(tx.timestamp)}
                    </td>
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
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

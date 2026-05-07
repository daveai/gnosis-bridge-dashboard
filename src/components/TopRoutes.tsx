import { formatUsd, formatNumber, bridgeDisplayName } from '@/lib/format'
import { useTopRoutes } from '@/hooks/queryHooks'
import { SectionHeader } from './SectionHeader'
import { Unavailable, EmptyLine } from './Unavailable'

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  10: 'Optimism',
  56: 'BNB Chain',
  100: 'Gnosis',
  137: 'Polygon',
  250: 'Fantom',
  324: 'zkSync Era',
  8453: 'Base',
  42161: 'Arbitrum One',
  42220: 'Celo',
  43114: 'Avalanche',
  59144: 'Linea',
  534352: 'Scroll',
  7565164: 'Solana',
  100000014: 'Sonic',
  100000017: 'Abstract',
  100000019: 'Cronos',
  100000022: 'HyperEVM',
  100000026: 'Tron',
  100000030: 'Monad',
}

interface RouteRow {
  key: string
  source: string
  dest: string
  volume: number
  transfers: number
  topBridge: string
  topBridgeVolume: number
}

interface Props {
  since?: string
  excludeBridge?: string
}

function chainName(id: number): string {
  return CHAIN_NAMES[id] || `Chain ${id}`
}

export function TopRoutes({ since, excludeBridge }: Props) {
  const { data, isError } = useTopRoutes({ since, excludeBridge })

  let rows: RouteRow[] = []

  if (data?.kind === 'daily') {
    const map = new Map<string, RouteRow & { byBridge: Map<string, number> }>()
    for (const d of data.rows) {
      if (!d.sourceChainId || !d.destChainId) continue
      const key = `${d.sourceChainId}-${d.destChainId}`
      const e = map.get(key) || {
        key,
        source: chainName(d.sourceChainId),
        dest: chainName(d.destChainId),
        volume: 0,
        transfers: 0,
        topBridge: d.bridge,
        topBridgeVolume: 0,
        byBridge: new Map<string, number>(),
      }
      const v = parseFloat(d.volumeUsd) || 0
      e.volume += v
      e.transfers += d.transferCount
      e.byBridge.set(d.bridge, (e.byBridge.get(d.bridge) || 0) + v)
      map.set(key, e)
    }
    for (const r of map.values()) {
      let top = r.topBridge
      let topV = 0
      for (const [b, v] of r.byBridge.entries()) {
        if (v > topV) {
          top = b
          topV = v
        }
      }
      r.topBridge = top
      r.topBridgeVolume = topV
    }
    rows = Array.from(map.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
      .map(({ byBridge: _bb, ...rest }) => rest)
  } else if (data?.kind === 'fallback') {
    const map = new Map<string, RouteRow & { byBridge: Map<string, number> }>()
    for (const d of data.transfers) {
      if (!d.sourceChainId || !d.destChainId) continue
      const key = `${d.sourceChainId}-${d.destChainId}`
      const e = map.get(key) || {
        key,
        source: chainName(d.sourceChainId),
        dest: chainName(d.destChainId),
        volume: 0,
        transfers: 0,
        topBridge: d.bridge,
        topBridgeVolume: 0,
        byBridge: new Map<string, number>(),
      }
      const v = parseFloat(d.amountUsd || '0')
      e.volume += v
      e.transfers += 1
      e.byBridge.set(d.bridge, (e.byBridge.get(d.bridge) || 0) + v)
      map.set(key, e)
    }
    for (const r2 of map.values()) {
      let top = r2.topBridge
      let topV = 0
      for (const [b, v] of r2.byBridge.entries()) {
        if (v > topV) {
          top = b
          topV = v
        }
      }
      r2.topBridge = top
      r2.topBridgeVolume = topV
    }
    rows = Array.from(map.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
      .map(({ byBridge: _bb, ...rest }) => rest)
  }

  return (
    <section>
      <SectionHeader eyebrow="Routes" />
      <div className="overflow-x-auto">
        {isError ? (
          <Unavailable />
        ) : !data ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-7 border-b border-border/40" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyLine />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-[10px] uppercase tracking-[0.08em] border-b border-border">
                <th className="text-left pb-3">Route</th>
                <th className="text-right pb-3">Volume</th>
                <th className="text-right pb-3">Tx</th>
                <th className="text-left pb-3">Top bridge</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-border/50">
                  <td className="py-2.5">
                    <span>{r.source}</span>
                    <span className="text-muted-foreground mx-2">{'→'}</span>
                    <span>{r.dest}</span>
                  </td>
                  <td className="py-2.5 text-right num">{formatUsd(r.volume)}</td>
                  <td className="py-2.5 text-right num text-muted-foreground">
                    {formatNumber(r.transfers)}
                  </td>
                  <td className="py-2.5 text-left text-muted-foreground">
                    {bridgeDisplayName(r.topBridge)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

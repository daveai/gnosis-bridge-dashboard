import { useChainPairDaily } from '@/hooks/queryHooks'
import { CHAIN_NAMES } from '@/lib/chains'
import { FlowSankey } from './charts/FlowSankey'
import { SectionHeader } from './SectionHeader'
import { Unavailable, EmptyLine } from './Unavailable'

const GNOSIS_CHAIN_ID = 100

interface ChainFlow {
  chainName: string
  volume: number
  count: number
}

interface Props {
  since?: string
}

export function ChainSankey({ since }: Props) {
  const { data, isError } = useChainPairDaily({ since })

  let inflows: ChainFlow[] = []
  let outflows: ChainFlow[] = []

  if (data) {
    const inflowMap = new Map<number, ChainFlow>()
    const outflowMap = new Map<number, ChainFlow>()
    for (const cp of data.rows) {
      if (
        cp.destChainId === GNOSIS_CHAIN_ID &&
        cp.sourceChainId !== GNOSIS_CHAIN_ID &&
        CHAIN_NAMES[cp.sourceChainId]
      ) {
        const e = inflowMap.get(cp.sourceChainId) || {
          chainName: CHAIN_NAMES[cp.sourceChainId] as string,
          volume: 0,
          count: 0,
        }
        e.volume += parseFloat(cp.volumeUsd) || 0
        e.count += cp.transferCount
        inflowMap.set(cp.sourceChainId, e)
      }
      if (
        cp.sourceChainId === GNOSIS_CHAIN_ID &&
        cp.destChainId !== GNOSIS_CHAIN_ID &&
        CHAIN_NAMES[cp.destChainId]
      ) {
        const e = outflowMap.get(cp.destChainId) || {
          chainName: CHAIN_NAMES[cp.destChainId] as string,
          volume: 0,
          count: 0,
        }
        e.volume += parseFloat(cp.volumeUsd) || 0
        e.count += cp.transferCount
        outflowMap.set(cp.destChainId, e)
      }
    }
    inflows = Array.from(inflowMap.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6)
    outflows = Array.from(outflowMap.values())
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6)
  }

  const empty = data && inflows.length === 0 && outflows.length === 0

  return (
    <section>
      <SectionHeader eyebrow="Chain Routing" />
      <div>
        {isError ? (
          <Unavailable />
        ) : !data ? (
          <div className="bg-muted/40 h-72 animate-pulse rounded-sm" />
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
  )
}

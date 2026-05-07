import { formatUsd, bridgeDisplayName } from '@/lib/format'
import { useEditorialHeadline } from '@/hooks/queryHooks'

interface Props {
  since?: string
  period: '7d' | '30d' | 'all'
}

export function EditorialHeadline({ since }: Props) {
  const { data } = useEditorialHeadline({ since })

  if (!data) return null

  const bridges = new Map<string, { inflow: number; outflow: number; count: number }>()
  let inflow = 0
  let outflow = 0
  let transfers = 0
  for (const d of data) {
    const i = parseFloat(d.inflowVolumeUsd) || 0
    const o = parseFloat(d.outflowVolumeUsd) || 0
    inflow += i
    outflow += o
    transfers += d.inflowCount + d.outflowCount
    const b = bridges.get(d.bridge) || { inflow: 0, outflow: 0, count: 0 }
    b.inflow += i
    b.outflow += o
    b.count += d.inflowCount + d.outflowCount
    bridges.set(d.bridge, b)
  }

  const totalTwoWay = inflow + outflow
  if (totalTwoWay === 0 && transfers === 0) return null

  const ranked = Array.from(bridges.entries())
    .map(([k, v]) => ({ bridge: k, total: v.inflow + v.outflow }))
    .sort((a, b) => b.total - a.total)
  const top = ranked[0]
  const topShare = top && totalTwoWay > 0 ? (top.total / totalTwoWay) * 100 : 0

  const net = inflow - outflow
  const direction = net >= 0 ? 'Net inflow' : 'Net outflow'
  const netLabel = formatUsd(Math.abs(net))
  const txLabel = transfers.toLocaleString('en-US')

  return (
    <p className="text-xl text-foreground leading-snug">
      {direction} of <span className="num">{netLabel}</span> across{' '}
      <span className="num">{txLabel}</span> transfers.
      {top ? (
        <>
          {' '}
          {bridgeDisplayName(top.bridge)} accounted for{' '}
          <span className="num">{topShare.toFixed(0)}%</span> of two-way volume.
        </>
      ) : null}
    </p>
  )
}

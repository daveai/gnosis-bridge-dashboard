import { formatUsd, bridgeDisplayName, periodEditorialPrefix } from '@/lib/format'
import { useEditorialHeadline } from '@/hooks/queryHooks'

interface Props {
  since?: string
  period: '7d' | '30d' | 'all'
}

export function EditorialHeadline({ since, period }: Props) {
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
  const netSign = net >= 0 ? '+' : '−'
  const netLabel = formatUsd(Math.abs(net))
  const volumeLabel = formatUsd(totalTwoWay)
  const txLabel = transfers.toLocaleString('en-US')

  return (
    <p className="text-xl text-foreground leading-snug">
      <span className="text-muted-foreground">{periodEditorialPrefix(period)}:</span>{' '}
      <span className="num">{volumeLabel}</span>{' '}
      <span className="text-muted-foreground">moved across</span>{' '}
      <span className="num">{txLabel}</span>{' '}
      <span className="text-muted-foreground">transfers, net</span>{' '}
      <span className="num">{netSign}{netLabel}</span>{' '}
      <span className="text-muted-foreground">to Gnosis.</span>
      {top ? (
        <>
          {' '}
          {bridgeDisplayName(top.bridge)}{' '}
          <span className="text-muted-foreground">carried</span>{' '}
          <span className="num">{topShare.toFixed(0)}%</span>{' '}
          <span className="text-muted-foreground">of two-way volume.</span>
        </>
      ) : null}
    </p>
  )
}

import { useQuery } from '@tanstack/react-query'
import { gqlFetch } from '@/lib/graphql'
import {
  ALL_BRIDGES,
  type BridgeDailyStats,
  type BridgeTransfer,
  type ChainPairStats,
  type TokenStats,
} from '@/lib/types'

interface SectionParams {
  since?: string
  excludeBridge?: string
}

interface BridgeDailyResp {
  BridgeDailyStats: BridgeDailyStats[]
}

interface BridgeTransferSampleResp {
  BridgeTransfer: { amountUsd: string | null }[]
}

interface AliasedSampleResp {
  [alias: string]: { amountUsd: string | null }[]
}

interface ChainPairStatsResp {
  ChainPairStats: ChainPairStats[]
}

interface ChainPairTransferRow {
  direction: string
  sourceChainId: number
  destChainId: number
  amountUsd: string | null
}

interface ChainPairTransferResp {
  BridgeTransfer: ChainPairTransferRow[]
}

interface TokenStatsResp {
  TokenStats: TokenStats[]
}

interface PeriodTokenResp {
  BridgeTransfer: {
    tokenSymbol: string | null
    amountUsd: string | null
    direction: string
  }[]
}

interface ChainPairDailyResp {
  ChainPairDailyStats: {
    bridge: string
    sourceChainId: number
    destChainId: number
    volumeUsd: string
    transferCount: number
  }[]
}

interface RouteFallbackResp {
  BridgeTransfer: {
    bridge: string
    sourceChainId: number
    destChainId: number
    amountUsd: string | null
  }[]
}

interface RecentTransfersResp {
  BridgeTransfer: BridgeTransfer[]
}

interface IndexerHeadResp {
  BridgeTransfer: { timestamp: string }[]
}

function dailyWhere(params: SectionParams): string {
  const cond: string[] = []
  if (params.since) cond.push(`date: { _gte: "${params.since}" }`)
  if (params.excludeBridge) cond.push(`bridge: { _neq: "${params.excludeBridge}" }`)
  return cond.length ? `(where: { ${cond.join(', ')} })` : ''
}

function timestampCond(params: SectionParams, requireAmount: boolean): string[] {
  const cond: string[] = []
  if (requireAmount) cond.push('amountUsd: { _is_null: false }')
  if (params.since) {
    const sinceTs = Math.floor(new Date(params.since).getTime() / 1000).toString()
    cond.push(`timestamp: { _gte: "${sinceTs}" }`)
  }
  if (params.excludeBridge) cond.push(`bridge: { _neq: "${params.excludeBridge}" }`)
  return cond
}

export interface HeroData {
  daily: BridgeDailyStats[]
  spark: BridgeDailyStats[]
  sample: { amountUsd: string | null }[]
  sparkSince: string
}

export function useHero(params: { since?: string; sparkSince: string }) {
  return useQuery<HeroData>({
    queryKey: ['hero', params],
    queryFn: async ({ signal }) => {
      const where = dailyWhere({ since: params.since })

      const dailyP = gqlFetch<BridgeDailyResp>(
        `{
          BridgeDailyStats${where} {
            bridge
            date
            inflowVolumeUsd
            outflowVolumeUsd
            inflowCount
            outflowCount
          }
        }`,
        undefined,
        signal,
      )

      const sparkP = gqlFetch<BridgeDailyResp>(
        `{
          BridgeDailyStats(where: { date: { _gte: "${params.sparkSince}" } }, order_by: { date: asc }) {
            date
            inflowVolumeUsd
            outflowVolumeUsd
          }
        }`,
        undefined,
        signal,
      )

      const tsCond = timestampCond({ since: params.since }, true)
      const sampleP = gqlFetch<BridgeTransferSampleResp>(
        `{
          BridgeTransfer(where: { ${tsCond.join(', ')} }, limit: 2000) {
            amountUsd
          }
        }`,
        undefined,
        signal,
      )

      const [daily, spark, sample] = await Promise.all([dailyP, sparkP, sampleP])
      return {
        daily: daily.BridgeDailyStats,
        spark: spark.BridgeDailyStats,
        sample: sample.BridgeTransfer,
        sparkSince: params.sparkSince,
      }
    },
  })
}

export function useEditorialHeadline(params: SectionParams) {
  return useQuery<BridgeDailyStats[]>({
    queryKey: ['editorial-headline', params],
    queryFn: async ({ signal }) => {
      const where = dailyWhere({ since: params.since })
      const r = await gqlFetch<BridgeDailyResp>(
        `{
          BridgeDailyStats${where} {
            bridge
            inflowVolumeUsd
            outflowVolumeUsd
            inflowCount
            outflowCount
          }
        }`,
        undefined,
        signal,
      )
      return r.BridgeDailyStats
    },
  })
}

export interface TopBridgesData {
  daily: BridgeDailyStats[]
  samples: Record<string, { amountUsd: string | null }[]>
}

export function useTopBridges(params: SectionParams) {
  return useQuery<TopBridgesData>({
    queryKey: ['top-bridges', params],
    queryFn: async ({ signal }) => {
      const where = dailyWhere(params)
      const dailyP = gqlFetch<BridgeDailyResp>(
        `{
          BridgeDailyStats${where} {
            bridge
            inflowVolumeUsd
            outflowVolumeUsd
            inflowCount
            outflowCount
          }
        }`,
        undefined,
        signal,
      )

      const tsCond = timestampCond(params, true)
      const bridges = ALL_BRIDGES.filter((b) => b !== params.excludeBridge)
      const aliasParts = bridges.map(
        (b, i) =>
          `b${i}: BridgeTransfer(where: { ${tsCond.join(', ')}, bridge: { _eq: "${b}" } }, limit: 1000) { amountUsd }`,
      )
      const sampleP = gqlFetch<AliasedSampleResp>(`{ ${aliasParts.join('\n')} }`, undefined, signal)

      const [daily, sample] = await Promise.all([dailyP, sampleP])
      const samples: Record<string, { amountUsd: string | null }[]> = {}
      bridges.forEach((b, i) => {
        samples[b] = sample[`b${i}`] ?? []
      })
      return { daily: daily.BridgeDailyStats, samples }
    },
  })
}

export function useDailyVolume(params: SectionParams) {
  return useQuery<BridgeDailyStats[]>({
    queryKey: ['daily-volume', params],
    queryFn: async ({ signal }) => {
      const cond: string[] = []
      if (params.since) cond.push(`date: { _gte: "${params.since}" }`)
      if (params.excludeBridge) cond.push(`bridge: { _neq: "${params.excludeBridge}" }`)
      const where = cond.length ? `where: { ${cond.join(', ')} }, ` : ''
      const r = await gqlFetch<BridgeDailyResp>(
        `{
          BridgeDailyStats(${where}order_by: { date: asc }) {
            bridge
            date
            inflowVolumeUsd
            outflowVolumeUsd
          }
        }`,
        undefined,
        signal,
      )
      return r.BridgeDailyStats
    },
  })
}

export interface TxSizesData {
  perBridge: Record<string, { amountUsd: string | null }[]>
}

export function useTxSizes(params: SectionParams) {
  return useQuery<TxSizesData>({
    queryKey: ['tx-sizes', params],
    queryFn: async ({ signal }) => {
      const tsCond = timestampCond(params, true)
      const bridges = ALL_BRIDGES.filter((b) => b !== params.excludeBridge)
      const aliasParts = bridges.map(
        (b, i) =>
          `b${i}: BridgeTransfer(where: { ${tsCond.join(', ')}, bridge: { _eq: "${b}" } }, limit: 1000) { amountUsd }`,
      )
      const r = await gqlFetch<AliasedSampleResp>(`{ ${aliasParts.join('\n')} }`, undefined, signal)
      const perBridge: Record<string, { amountUsd: string | null }[]> = {}
      bridges.forEach((b, i) => {
        perBridge[b] = r[`b${i}`] ?? []
      })
      return { perBridge }
    },
  })
}

export type ChainSankeyData =
  | { kind: 'period'; transfers: ChainPairTransferRow[] }
  | { kind: 'all-time'; pairs: ChainPairStats[] }

export function useChainSankey(params: SectionParams) {
  return useQuery<ChainSankeyData>({
    queryKey: ['chain-sankey', params],
    queryFn: async ({ signal }) => {
      if (params.since || params.excludeBridge) {
        const cond: string[] = []
        if (params.since) {
          const sinceTs = Math.floor(new Date(params.since).getTime() / 1000).toString()
          cond.push(`timestamp: { _gte: "${sinceTs}" }`)
        }
        if (params.excludeBridge) cond.push(`bridge: { _neq: "${params.excludeBridge}" }`)
        const where = `where: { ${cond.join(', ')} }`
        const r = await gqlFetch<ChainPairTransferResp>(
          `{
            BridgeTransfer(${where}, limit: 5000) {
              direction
              sourceChainId
              destChainId
              amountUsd
            }
          }`,
          undefined,
          signal,
        )
        return { kind: 'period', transfers: r.BridgeTransfer }
      }
      const r = await gqlFetch<ChainPairStatsResp>(
        `{
          ChainPairStats {
            sourceChainId
            destChainId
            sourceChainName
            destChainName
            totalVolumeUsd
            transferCount
          }
        }`,
        undefined,
        signal,
      )
      return { kind: 'all-time', pairs: r.ChainPairStats }
    },
  })
}

export type TopTokensData =
  | { kind: 'period'; transfers: PeriodTokenResp['BridgeTransfer'] }
  | { kind: 'all-time'; tokens: TokenStats[] }

export function useTopTokens(params: SectionParams) {
  return useQuery<TopTokensData>({
    queryKey: ['top-tokens', params],
    queryFn: async ({ signal }) => {
      if (params.since || params.excludeBridge) {
        const cond: string[] = []
        if (params.since) {
          const sinceTs = Math.floor(new Date(params.since).getTime() / 1000).toString()
          cond.push(`timestamp: { _gte: "${sinceTs}" }`)
        }
        if (params.excludeBridge) cond.push(`bridge: { _neq: "${params.excludeBridge}" }`)
        const where = `where: { ${cond.join(', ')} }`
        const r = await gqlFetch<PeriodTokenResp>(
          `{
            BridgeTransfer(${where}, limit: 5000) {
              tokenSymbol
              amountUsd
              direction
            }
          }`,
          undefined,
          signal,
        )
        return { kind: 'period', transfers: r.BridgeTransfer }
      }
      const r = await gqlFetch<TokenStatsResp>(
        `{
          TokenStats(where: { symbol: { _is_null: false } }, order_by: { transferCount: desc }, limit: 10) {
            id
            symbol
            inflowVolumeUsd
            outflowVolumeUsd
            transferCount
          }
        }`,
        undefined,
        signal,
      )
      return { kind: 'all-time', tokens: r.TokenStats }
    },
  })
}

export type TopRoutesData =
  | { kind: 'daily'; rows: ChainPairDailyResp['ChainPairDailyStats'] }
  | { kind: 'fallback'; transfers: RouteFallbackResp['BridgeTransfer'] }

export function useTopRoutes(params: SectionParams) {
  return useQuery<TopRoutesData>({
    queryKey: ['top-routes', params],
    queryFn: async ({ signal }) => {
      const where = dailyWhere(params)
      const dailyR = await gqlFetch<ChainPairDailyResp>(
        `{
          ChainPairDailyStats${where} {
            bridge
            sourceChainId
            destChainId
            volumeUsd
            transferCount
          }
        }`,
        undefined,
        signal,
      )
      if (dailyR.ChainPairDailyStats?.length) {
        return { kind: 'daily', rows: dailyR.ChainPairDailyStats }
      }
      const tsCond: string[] = []
      if (params.since) {
        const sinceTs = Math.floor(new Date(params.since).getTime() / 1000).toString()
        tsCond.push(`timestamp: { _gte: "${sinceTs}" }`)
      }
      if (params.excludeBridge) tsCond.push(`bridge: { _neq: "${params.excludeBridge}" }`)
      const tsWhere = tsCond.length ? `where: { ${tsCond.join(', ')} }, ` : ''
      const r = await gqlFetch<RouteFallbackResp>(
        `{
          BridgeTransfer(${tsWhere}limit: 5000) {
            bridge
            sourceChainId
            destChainId
            amountUsd
          }
        }`,
        undefined,
        signal,
      )
      return { kind: 'fallback', transfers: r.BridgeTransfer }
    },
  })
}

export function useRecentTransfers() {
  return useQuery<BridgeTransfer[]>({
    queryKey: ['recent-transfers'],
    queryFn: async ({ signal }) => {
      const r = await gqlFetch<RecentTransfersResp>(
        `{
          BridgeTransfer(order_by: { timestamp: desc }, limit: 10) {
            id
            bridge
            direction
            tokenSymbol
            amountUsd
            timestamp
            txHash
          }
        }`,
        undefined,
        signal,
      )
      return r.BridgeTransfer
    },
  })
}

export function useIndexerHead() {
  return useQuery<{ timestamp: string } | null>({
    queryKey: ['indexer-head'],
    queryFn: async ({ signal }) => {
      const r = await gqlFetch<IndexerHeadResp>(
        `{ BridgeTransfer(order_by: { timestamp: desc }, limit: 1) { timestamp } }`,
        undefined,
        signal,
      )
      return r.BridgeTransfer[0] ?? null
    },
    refetchInterval: 5_000,
    staleTime: 5_000,
  })
}

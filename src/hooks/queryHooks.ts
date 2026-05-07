import { useQuery } from '@tanstack/react-query'
import { gqlFetch } from '@/lib/graphql'
import {
  ALL_BRIDGES,
  type BridgeDailyStats,
  type BridgeTransfer,
} from '@/lib/types'

interface SectionParams {
  since?: string
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

export interface ChainPairDailyRow {
  bridge: string
  date: string
  sourceChainId: number
  destChainId: number
  volumeUsd: string
  transferCount: number
}

interface ChainPairDailyResp {
  ChainPairDailyStats: ChainPairDailyRow[]
}

export interface BridgeTokenDailyRow {
  bridge: string
  date: string
  tokenSymbol: string | null
  inflowVolumeUsd: string
  outflowVolumeUsd: string
  transferCount: number
}

interface BridgeTokenDailyResp {
  BridgeTokenDailyStats: BridgeTokenDailyRow[]
}

interface RecentTransfersResp {
  BridgeTransfer: BridgeTransfer[]
}

interface IndexerHeadResp {
  BridgeTransfer: { timestamp: string }[]
}

function dailyWhere(params: SectionParams, opts?: { orderBy?: string }): string {
  const args: string[] = []
  const cond: string[] = []
  if (params.since) cond.push(`date: { _gte: "${params.since}" }`)
  if (cond.length) args.push(`where: { ${cond.join(', ')} }`)
  if (opts?.orderBy) args.push(`order_by: { ${opts.orderBy} }`)
  return args.length ? `(${args.join(', ')})` : ''
}

function timestampCond(params: SectionParams, requireAmount: boolean): string[] {
  const cond: string[] = []
  if (requireAmount) cond.push('amountUsd: { _is_null: false }')
  if (params.since) {
    const sinceTs = Math.floor(new Date(params.since).getTime() / 1000).toString()
    cond.push(`timestamp: { _gte: "${sinceTs}" }`)
  }
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
      const where = dailyWhere(params, { orderBy: 'date: asc' })
      const r = await gqlFetch<BridgeDailyResp>(
        `{
          BridgeDailyStats${where} {
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

export interface ChainPairDailyData {
  rows: ChainPairDailyRow[]
}

export function useChainPairDaily(params: SectionParams) {
  return useQuery<ChainPairDailyData>({
    queryKey: ['chain-pair-daily', params],
    queryFn: async ({ signal }) => {
      const where = dailyWhere(params)
      const r = await gqlFetch<ChainPairDailyResp>(
        `{
          ChainPairDailyStats${where} {
            bridge
            date
            sourceChainId
            destChainId
            volumeUsd
            transferCount
          }
        }`,
        undefined,
        signal,
      )
      return { rows: r.ChainPairDailyStats }
    },
  })
}

export interface TopTokensData {
  rows: BridgeTokenDailyRow[]
}

export function useTopTokens(params: SectionParams) {
  return useQuery<TopTokensData>({
    queryKey: ['top-tokens', params],
    queryFn: async ({ signal }) => {
      const where = dailyWhere(params)
      const r = await gqlFetch<BridgeTokenDailyResp>(
        `{
          BridgeTokenDailyStats${where} {
            bridge
            date
            tokenSymbol
            inflowVolumeUsd
            outflowVolumeUsd
            transferCount
          }
        }`,
        undefined,
        signal,
      )
      return { rows: r.BridgeTokenDailyStats }
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

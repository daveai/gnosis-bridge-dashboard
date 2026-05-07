export interface GlobalStats {
  id: string
  totalInflowUsd: string
  totalOutflowUsd: string
  totalTransfers: number
  lastUpdated: string
}

export interface BridgeDailyStats {
  id: string
  bridge: string
  date: string
  inflowCount: number
  outflowCount: number
  inflowVolumeUsd: string
  outflowVolumeUsd: string
  uniqueUsers: number
  avgInflowUsd?: string | null
  avgOutflowUsd?: string | null
  minTxSizeUsd?: string | null
  maxTxSizeUsd?: string | null
}

export interface BridgeTokenDailyStats {
  id: string
  bridge: string
  date: string
  token: string
  tokenSymbol: string | null
  inflowVolumeUsd: string
  outflowVolumeUsd: string
  transferCount: number
}

export interface ChainPairDailyStats {
  id: string
  bridge: string
  date: string
  sourceChainId: number
  destChainId: number
  volumeUsd: string
  transferCount: number
}

export interface TokenStats {
  id: string
  symbol: string | null
  inflowVolumeUsd: string
  outflowVolumeUsd: string
  transferCount: number
}

export interface ChainPairStats {
  id: string
  sourceChainId: number
  destChainId: number
  sourceChainName: string | null
  destChainName: string | null
  totalVolumeUsd: string
  transferCount: number
}

export interface BridgeTransfer {
  id: string
  bridge: string
  direction: string
  tokenSymbol: string | null
  amountUsd: string | null
  timestamp: string
  txHash: string
  sourceChainId?: number
  destChainId?: number
}

export interface BridgeSummary {
  bridge: string
  inflowUsd: number
  outflowUsd: number
  totalUsd: number
  netUsd: number
  inflowCount: number
  outflowCount: number
  avgTicketUsd: number
  medianTicketUsd: number | null
}

export interface DailyVolume {
  date: string
  inflowUsd: number
  outflowUsd: number
}

export interface BridgeDailySeries {
  bridge: string
  total: number
  series: DailyVolume[]
}

export const ALL_BRIDGES = [
  'xdai',
  'omnibridge',
  'debridge',
  'squid',
  'stargate-eth',
  'stargate-usdc',
  'symbiosis',
  'relay',
  'bungee-v2',
  'rhino-fi',
  'gaszip',
  'ccip',
  'near-intents',
] as const

export const TOTAL_CONFIGURED_BRIDGES = 12

export const BRIDGE_FOOTNOTES: Record<string, string> = {}

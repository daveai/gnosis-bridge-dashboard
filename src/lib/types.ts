export interface GlobalStats {
  id: string;
  totalInflowUsd: string;
  totalOutflowUsd: string;
  totalTransfers: number;
  lastUpdated: string;
}

export interface BridgeDailyStats {
  id: string;
  bridge: string;
  date: string;
  inflowCount: number;
  outflowCount: number;
  inflowVolumeUsd: string;
  outflowVolumeUsd: string;
  uniqueUsers: number;
}

export interface TokenStats {
  id: string;
  symbol: string | null;
  inflowVolumeUsd: string;
  outflowVolumeUsd: string;
  transferCount: number;
}

export interface ChainPairStats {
  id: string;
  sourceChainId: number;
  destChainId: number;
  sourceChainName: string | null;
  destChainName: string | null;
  totalVolumeUsd: string;
  transferCount: number;
}

export interface BridgeTransfer {
  id: string;
  bridge: string;
  direction: string;
  tokenSymbol: string | null;
  amountUsd: string | null;
  timestamp: string;
  txHash: string;
}

export interface BridgeSummary {
  bridge: string;
  inflowUsd: number;
  outflowUsd: number;
  totalUsd: number;
  inflowCount: number;
  outflowCount: number;
}

export interface DailyVolume {
  date: string;
  inflowUsd: number;
  outflowUsd: number;
}

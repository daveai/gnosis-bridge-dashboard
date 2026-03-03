import {
  globalStats,
  bridgeDailyStats,
  tokenStats,
  chainPairStats,
  recentTransfers,
} from "./mock-data";

export async function gql<T>(query: string): Promise<T> {
  // Parse the query to figure out which entity is being requested and return mock data
  const result: Record<string, unknown> = {};

  if (query.includes("GlobalStats")) {
    result.GlobalStats = globalStats;
  }

  if (query.includes("BridgeDailyStats")) {
    let filtered = bridgeDailyStats;

    const dateMatch = query.match(/date:\s*\{\s*_gte:\s*"([^"]+)"/);
    if (dateMatch) filtered = filtered.filter((d) => d.date >= dateMatch[1]);

    const bridgeNeq = query.match(/bridge:\s*\{\s*_neq:\s*"([^"]+)"/);
    if (bridgeNeq) filtered = filtered.filter((d) => d.bridge !== bridgeNeq[1]);

    if (query.includes("order_by") && query.includes("date: asc")) {
      filtered = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
    }

    result.BridgeDailyStats = filtered;
  }

  if (query.includes("TokenStats")) {
    result.TokenStats = tokenStats;
  }

  if (query.includes("ChainPairStats")) {
    let filtered = chainPairStats;

    if (query.includes("sourceChainId: { _neq: 0 }")) {
      filtered = filtered.filter((c) => c.sourceChainId !== 0 && c.destChainId !== 0);
    }

    if (query.includes("order_by") && query.includes("totalVolumeUsd: desc")) {
      filtered = [...filtered].sort((a, b) => parseFloat(b.totalVolumeUsd) - parseFloat(a.totalVolumeUsd));
    }

    const limitMatch = query.match(/limit:\s*(\d+)/);
    if (limitMatch) filtered = filtered.slice(0, parseInt(limitMatch[1]));

    result.ChainPairStats = filtered;
  }

  if (query.includes("BridgeTransfer")) {
    let filtered = [...recentTransfers];

    const tsMatch = query.match(/timestamp:\s*\{\s*_gte:\s*"([^"]+)"/);
    if (tsMatch) filtered = filtered.filter((t) => parseInt(t.timestamp) >= parseInt(tsMatch[1]));

    const bridgeNeq = query.match(/bridge:\s*\{\s*_neq:\s*"([^"]+)"/);
    if (bridgeNeq) filtered = filtered.filter((t) => t.bridge !== bridgeNeq[1]);

    if (query.includes("order_by") && query.includes("timestamp: desc")) {
      filtered.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    }

    const limitMatch = query.match(/limit:\s*(\d+)/);
    if (limitMatch) filtered = filtered.slice(0, parseInt(limitMatch[1]));

    result.BridgeTransfer = filtered;
  }

  return result as T;
}

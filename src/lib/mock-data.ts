import type { GlobalStats, BridgeDailyStats, TokenStats, ChainPairStats, BridgeTransfer } from "./types";

const bridges = ["omnibridge", "xdai", "debridge", "hop-eth", "hop-dai", "hop-usdc", "squid", "relay", "symbiosis", "stargate-usdc"] as const;

function dateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// Seeded pseudo-random for deterministic data
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const rand = seeded(42);

const dates = dateRange(90);

export const bridgeDailyStats: BridgeDailyStats[] = dates.flatMap((date) =>
  bridges.map((bridge) => {
    const scale = bridge === "omnibridge" ? 8 : bridge === "xdai" ? 5 : bridge === "debridge" ? 3 : bridge === "relay" ? 2.5 : 1;
    const inflowUsd = rand() * 400000 * scale + 10000 * scale;
    const outflowUsd = rand() * 350000 * scale + 8000 * scale;
    const inflowCount = Math.floor(rand() * 40 * scale + 5);
    const outflowCount = Math.floor(rand() * 35 * scale + 3);
    return {
      id: `${bridge}-${date}`,
      bridge,
      date,
      inflowCount,
      outflowCount,
      inflowVolumeUsd: inflowUsd.toFixed(2),
      outflowVolumeUsd: outflowUsd.toFixed(2),
      uniqueUsers: Math.floor(rand() * 20 * scale + 2),
    };
  })
);

const totalInflow = bridgeDailyStats.reduce((s, d) => s + parseFloat(d.inflowVolumeUsd), 0);
const totalOutflow = bridgeDailyStats.reduce((s, d) => s + parseFloat(d.outflowVolumeUsd), 0);
const totalTransfers = bridgeDailyStats.reduce((s, d) => s + d.inflowCount + d.outflowCount, 0);

export const globalStats: GlobalStats[] = [{
  id: "global",
  totalInflowUsd: totalInflow.toFixed(2),
  totalOutflowUsd: totalOutflow.toFixed(2),
  totalTransfers,
  lastUpdated: new Date().toISOString(),
}];

export const tokenStats: TokenStats[] = [
  { id: "wxdai", symbol: "WXDAI", inflowVolumeUsd: "18240000", outflowVolumeUsd: "15890000", transferCount: 4280 },
  { id: "weth", symbol: "WETH", inflowVolumeUsd: "31200000", outflowVolumeUsd: "28500000", transferCount: 3150 },
  { id: "gno", symbol: "GNO", inflowVolumeUsd: "12800000", outflowVolumeUsd: "9400000", transferCount: 2890 },
  { id: "usdc", symbol: "USDC", inflowVolumeUsd: "22100000", outflowVolumeUsd: "20300000", transferCount: 2640 },
  { id: "usdt", symbol: "USDT", inflowVolumeUsd: "8900000", outflowVolumeUsd: "7200000", transferCount: 1520 },
  { id: "dai", symbol: "DAI", inflowVolumeUsd: "6700000", outflowVolumeUsd: "5100000", transferCount: 1340 },
  { id: "wbtc", symbol: "WBTC", inflowVolumeUsd: "9800000", outflowVolumeUsd: "8600000", transferCount: 890 },
  { id: "cow", symbol: "COW", inflowVolumeUsd: "3200000", outflowVolumeUsd: "2100000", transferCount: 720 },
  { id: "safe", symbol: "SAFE", inflowVolumeUsd: "2400000", outflowVolumeUsd: "1800000", transferCount: 580 },
  { id: "eure", symbol: "EURe", inflowVolumeUsd: "4100000", outflowVolumeUsd: "3500000", transferCount: 460 },
  { id: "sDAI", symbol: "sDAI", inflowVolumeUsd: "5600000", outflowVolumeUsd: "4200000", transferCount: 390 },
  { id: "link", symbol: "LINK", inflowVolumeUsd: "1800000", outflowVolumeUsd: "1500000", transferCount: 310 },
];

export const chainPairStats: ChainPairStats[] = [
  { id: "1-100", sourceChainId: 1, destChainId: 100, sourceChainName: "Ethereum", destChainName: "Gnosis", totalVolumeUsd: "68400000", transferCount: 8920 },
  { id: "100-1", sourceChainId: 100, destChainId: 1, sourceChainName: "Gnosis", destChainName: "Ethereum", totalVolumeUsd: "54200000", transferCount: 7340 },
  { id: "42161-100", sourceChainId: 42161, destChainId: 100, sourceChainName: "Arbitrum One", destChainName: "Gnosis", totalVolumeUsd: "12800000", transferCount: 2150 },
  { id: "100-42161", sourceChainId: 100, destChainId: 42161, sourceChainName: "Gnosis", destChainName: "Arbitrum One", totalVolumeUsd: "9600000", transferCount: 1820 },
  { id: "8453-100", sourceChainId: 8453, destChainId: 100, sourceChainName: "Base", destChainName: "Gnosis", totalVolumeUsd: "8200000", transferCount: 1640 },
  { id: "100-8453", sourceChainId: 100, destChainId: 8453, sourceChainName: "Gnosis", destChainName: "Base", totalVolumeUsd: "6900000", transferCount: 1380 },
  { id: "137-100", sourceChainId: 137, destChainId: 100, sourceChainName: "Polygon", destChainName: "Gnosis", totalVolumeUsd: "5400000", transferCount: 980 },
  { id: "100-137", sourceChainId: 100, destChainId: 137, sourceChainName: "Gnosis", destChainName: "Polygon", totalVolumeUsd: "4100000", transferCount: 820 },
  { id: "10-100", sourceChainId: 10, destChainId: 100, sourceChainName: "Optimism", destChainName: "Gnosis", totalVolumeUsd: "3800000", transferCount: 640 },
  { id: "100-10", sourceChainId: 100, destChainId: 10, sourceChainName: "Gnosis", destChainName: "Optimism", totalVolumeUsd: "3200000", transferCount: 540 },
  { id: "56-100", sourceChainId: 56, destChainId: 100, sourceChainName: "BNB Chain", destChainName: "Gnosis", totalVolumeUsd: "2100000", transferCount: 380 },
  { id: "100-56", sourceChainId: 100, destChainId: 56, sourceChainName: "Gnosis", destChainName: "BNB Chain", totalVolumeUsd: "1600000", transferCount: 290 },
  { id: "7565164-100", sourceChainId: 7565164, destChainId: 100, sourceChainName: "Solana", destChainName: "Gnosis", totalVolumeUsd: "1400000", transferCount: 210 },
  { id: "100-7565164", sourceChainId: 100, destChainId: 7565164, sourceChainName: "Gnosis", destChainName: "Solana", totalVolumeUsd: "980000", transferCount: 160 },
];

const now = Math.floor(Date.now() / 1000);

export const recentTransfers: BridgeTransfer[] = Array.from({ length: 20 }, (_, i) => {
  const bridge = bridges[Math.floor(rand() * bridges.length)];
  const direction = rand() > 0.45 ? "inflow" : "outflow";
  const tokens = ["WETH", "WXDAI", "GNO", "USDC", "USDT", "DAI", "COW", "SAFE", "WBTC", "EURe"];
  const token = tokens[Math.floor(rand() * tokens.length)];
  const usd = (rand() * 50000 + 100).toFixed(2);
  const hash = "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(rand() * 16)]).join("");
  return {
    id: `tx-${i}`,
    bridge,
    direction,
    tokenSymbol: token,
    amountUsd: usd,
    timestamp: (now - i * 420 - Math.floor(rand() * 300)).toString(),
    txHash: hash,
  };
});

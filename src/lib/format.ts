export function formatUsd(value: string | number | null | undefined): string {
  if (value == null) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatUsdFull(value: string | number | null | undefined): string {
  if (value == null) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatDate(timestamp: string): string {
  const ts = parseInt(timestamp);
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function bridgeDisplayName(bridge: string): string {
  const names: Record<string, string> = {
    "xdai": "xDAI Bridge",
    "omnibridge": "Omnibridge",
    "hop-eth": "Hop (ETH)",
    "hop-dai": "Hop (DAI)",
    "hop-usdc": "Hop (USDC)",
    "hop-usdt": "Hop (USDT)",
    "debridge": "deBridge",
    "squid": "Squid/Axelar",
    "stargate-eth": "Stargate (ETH)",
    "stargate-usdc": "Stargate (USDC)",
    "symbiosis": "Symbiosis",
    "relay": "Relay",
  };
  return names[bridge] || bridge;
}

export function shortenTxHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

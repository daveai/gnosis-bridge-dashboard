export function formatUsd(value: string | number | null | undefined): string {
  if (value == null) return '$0'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '$0'
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`
  return `${sign}$${abs.toFixed(2)}`
}

export function formatSignedUsd(value: number): string {
  if (value > 0) return `+${formatUsd(value)}`
  return formatUsd(value)
}

export function formatUsdFull(value: string | number | null | undefined): string {
  if (value == null) return '$0.00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '$0.00'
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function formatDate(timestamp: string): string {
  const ts = parseInt(timestamp)
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(timestamp: string | number): string {
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  const now = Date.now() / 1000
  const diff = Math.max(0, now - ts)
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function bridgeDisplayName(bridge: string): string {
  const names: Record<string, string> = {
    xdai: 'xDAI Bridge',
    omnibridge: 'Omnibridge',
    debridge: 'deBridge',
    squid: 'Squid',
    'stargate-eth': 'Stargate (ETH)',
    'stargate-usdc': 'Stargate (USDC)',
    symbiosis: 'Symbiosis',
    relay: 'Relay',
    'bungee-v2': 'Bungee V2',
    'rhino-fi': 'rhino.fi',
    gaszip: 'GasZip',
    'near-intents': 'NEAR Intents',
  }
  return names[bridge] || bridge
}

// Treat 1:1 fungible representations of the same underlying asset as one row
// in cross-token aggregations: USDC and USDC.e via the Gnosis transmuter, and
// xDAI / wxDAI / DAI / USDS as the same Maker/Sky stablecoin pre- and post-
// migration on either chain.
export function canonicalTokenSymbol(symbol: string | null | undefined): string {
  if (!symbol) return 'Unknown'
  const s = symbol.toUpperCase()
  if (s === 'USDC.E') return 'USDC'
  if (s === 'XDAI' || s === 'WXDAI' || s === 'USDS') return 'DAI'
  return symbol
}

export function assetClassColor(symbol: string | null | undefined): string {
  if (!symbol) return 'var(--color-asset-other)'
  const s = symbol.toUpperCase()
  if (['USDC', 'USDC.E', 'USDT', 'DAI', 'SDAI', 'EURE', 'GBPE', 'USDS', 'WXDAI', 'XDAI'].includes(s)) {
    return 'var(--color-asset-stable)'
  }
  if (s === 'GNO') return 'var(--color-asset-gno)'
  if (['WETH', 'ETH', 'WSTETH'].includes(s)) return 'var(--color-asset-eth)'
  if (['WBTC', 'BTC'].includes(s)) return 'var(--color-asset-btc)'
  return 'var(--color-asset-other)'
}

export function shortenTxHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    const a = sorted[mid - 1] ?? 0
    const b = sorted[mid] ?? 0
    return (a + b) / 2
  }
  return sorted[mid] ?? 0
}

export function isoDateNDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().split('T')[0] ?? ''
}

export function periodLabel(period: '7d' | '30d' | 'all'): string {
  if (period === '7d') return '7 days'
  if (period === '30d') return '30 days'
  return 'since coverage start'
}


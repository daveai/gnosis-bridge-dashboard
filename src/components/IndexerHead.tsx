import { formatRelativeTime } from '@/lib/format'
import { useIndexerHead } from '@/hooks/queryHooks'

export function IndexerHead() {
  const { data, isLoading } = useIndexerHead()

  if (isLoading) return <span className="text-muted-foreground text-xs">…</span>
  if (!data) {
    return <span className="text-text-muted text-xs">No data</span>
  }
  const ts = parseInt(data.timestamp)
  const ageMin = (Date.now() / 1000 - ts) / 60
  const stale = ageMin > 30
  const text = `Updated ${formatRelativeTime(ts)}`
  return <span className={`text-xs ${stale ? 'text-coral' : 'text-text-muted'}`}>{text}</span>
}

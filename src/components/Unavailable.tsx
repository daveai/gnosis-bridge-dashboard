interface Props {
  lastSync?: string
  height?: string
}

export function Unavailable({ lastSync, height = 'h-32' }: Props) {
  const dev = import.meta.env.DEV
  return (
    <div className={`flex flex-col items-center justify-center ${height} text-text-muted text-sm`}>
      <p>
        Data is being refreshed — check back shortly
        {lastSync ? `. Last sync ${lastSync}.` : '.'}
      </p>
      {dev ? <p className="text-xs mt-1">Start the indexer and refresh.</p> : null}
    </div>
  )
}

export function EmptyLine({ message = 'No data' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-text-muted text-sm">{message}</div>
  )
}

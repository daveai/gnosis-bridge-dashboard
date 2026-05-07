import { useSearchParams } from 'react-router-dom'

const periods = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: 'all', label: 'All' },
] as const

export function PeriodSelector() {
  const [searchParams, setSearchParams] = useSearchParams()
  const current = searchParams.get('period') || 'all'

  function navigate(period: string) {
    const next = new URLSearchParams(searchParams)
    if (period === 'all') next.delete('period')
    else next.set('period', period)
    setSearchParams(next)
  }

  return (
    <div className="flex gap-0.5 bg-surface-card border border-border rounded-lg p-0.5">
      {periods.map((p) => (
        <button
          type="button"
          key={p.value}
          onClick={() => navigate(p.value)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            current === p.value
              ? 'bg-petrol-light text-white'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

interface InlineHideOmniProps {
  paramName?: string
}

export function InlineHideOmniToggle({ paramName = 'hideOmni' }: InlineHideOmniProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const active = searchParams.get(paramName) === '1'

  function toggle() {
    const next = new URLSearchParams(searchParams)
    if (active) next.delete(paramName)
    else next.set(paramName, '1')
    setSearchParams(next, { preventScrollReset: true })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
        active
          ? 'border-petrol-light text-text-primary'
          : 'border-border text-text-muted hover:text-text-primary'
      }`}
    >
      Excl. Omnibridge
    </button>
  )
}

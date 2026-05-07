import { useSearchParams } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { HeroKpis } from '@/components/HeroKpis'
import { Wordmark } from '@/components/Wordmark'
import { EditorialHeadline } from '@/components/EditorialHeadline'
import { TopBridges } from '@/components/TopBridges'
import { VolumeOverTime } from '@/components/VolumeOverTime'
import { TxSizeDistribution } from '@/components/TxSizeDistribution'
import { TopTokens } from '@/components/TopTokens'
import { TopRoutes } from '@/components/TopRoutes'
import { ChainSankey } from '@/components/ChainSankey'
import { RecentTransfers } from '@/components/RecentTransfers'
import { MethodologyFooter } from '@/components/MethodologyFooter'
import { PeriodSelector } from '@/components/PeriodSelector'
import { IndexerHead } from '@/components/IndexerHead'
import { isoDateNDaysAgo } from '@/lib/format'

type Period = '7d' | '30d' | 'all'

function computeSince(period: Period): string | undefined {
  if (period === 'all') return undefined
  const days = period === '7d' ? 7 : 30
  return isoDateNDaysAgo(days)
}

export function BridgesReport() {
  const [searchParams] = useSearchParams()
  const periodParam = searchParams.get('period')
  const period = (['7d', '30d', 'all'].includes(periodParam ?? '') ? periodParam : 'all') as Period
  const since = computeSince(period)
  const excludeBridge = searchParams.get('hideOmni') === '1' ? 'omnibridge' : undefined

  return (
    <div className="min-h-screen">
      <header className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Wordmark className="h-[22px] w-auto text-foreground" />
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-foreground text-sm">Gnosis Bridges</span>
        </div>
        <div className="flex items-center gap-4">
          <IndexerHead />
          <PeriodSelector />
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pb-12 space-y-12">
        <ErrorBoundary>
          <EditorialHeadline since={since} period={period} />
        </ErrorBoundary>

        <ErrorBoundary>
          <HeroKpis since={since} period={period} />
        </ErrorBoundary>

        <ErrorBoundary>
          <TopBridges since={since} period={period} excludeBridge={excludeBridge} />
        </ErrorBoundary>

        <ErrorBoundary>
          <VolumeOverTime since={since} excludeBridge={excludeBridge} />
        </ErrorBoundary>

        <ErrorBoundary>
          <TxSizeDistribution since={since} excludeBridge={excludeBridge} />
        </ErrorBoundary>

        <ErrorBoundary>
          <ChainSankey since={since} excludeBridge={excludeBridge} />
        </ErrorBoundary>

        <div className="grid lg:grid-cols-2 gap-6">
          <ErrorBoundary>
            <TopTokens since={since} excludeBridge={excludeBridge} />
          </ErrorBoundary>
          <ErrorBoundary>
            <TopRoutes since={since} excludeBridge={excludeBridge} />
          </ErrorBoundary>
        </div>

        <ErrorBoundary>
          <RecentTransfers />
        </ErrorBoundary>

        <MethodologyFooter />
      </main>
    </div>
  )
}

import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HeroKpis } from "@/components/HeroKpis";
import { Wordmark } from "@/components/Wordmark";
import { EditorialHeadline } from "@/components/EditorialHeadline";
import { TopBridges } from "@/components/TopBridges";
import { VolumeOverTime } from "@/components/VolumeOverTime";
import { TxSizeDistribution } from "@/components/TxSizeDistribution";
import { TopTokens } from "@/components/TopTokens";
import { TopRoutes } from "@/components/TopRoutes";
import { ChainSankey } from "@/components/ChainSankey";
import { RecentTransfers } from "@/components/RecentTransfers";
import { MethodologyFooter } from "@/components/MethodologyFooter";
import { PeriodSelector } from "@/components/PeriodSelector";
import { IndexerHead } from "@/components/IndexerHead";
import { isoDateNDaysAgo } from "@/lib/format";

type Period = "7d" | "30d" | "all";

function computeSince(period: Period): string | undefined {
  if (period === "all") return undefined;
  const days = period === "7d" ? 7 : 30;
  return isoDateNDaysAgo(days);
}

function PanelSkeleton({ height = "h-48" }: { height?: string }) {
  return <div className={`bg-muted/40 ${height} animate-pulse rounded-sm`} />;
}

function HeroSkeleton() {
  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 bg-muted/40 h-40 animate-pulse rounded-sm" />
      <div className="lg:col-span-2 grid grid-cols-2 gap-x-8 gap-y-6">
        <div className="bg-muted/40 h-12 animate-pulse rounded-sm" />
        <div className="bg-muted/40 h-12 animate-pulse rounded-sm" />
        <div className="bg-muted/40 h-12 animate-pulse rounded-sm" />
        <div className="bg-muted/40 h-12 animate-pulse rounded-sm" />
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="h-[100px] bg-muted/40 animate-pulse rounded-sm" />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-7 border-b border-border/40" />
      ))}
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; hideOmni?: string }>;
}) {
  const params = await searchParams;
  const period = (["7d", "30d", "all"].includes(params.period!) ? params.period : "all") as Period;
  const since = computeSince(period);
  const excludeBridge = params.hideOmni === "1" ? "omnibridge" : undefined;

  return (
    <div className="min-h-screen">
      <header className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Wordmark className="h-[22px] w-auto text-foreground" />
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-foreground text-sm">Gnosis Bridges</span>
        </div>
        <div className="flex items-center gap-4">
          <Suspense fallback={<span className="text-muted-foreground text-xs">…</span>}>
            <IndexerHead />
          </Suspense>
          <PeriodSelector />
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pb-12 space-y-12">
        <ErrorBoundary>
          <Suspense fallback={<div className="h-7" />}>
            <EditorialHeadline since={since} period={period} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<HeroSkeleton />}>
            <HeroKpis since={since} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<PanelSkeleton height="h-72" />}>
            <TopBridges since={since} excludeBridge={excludeBridge} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<GridSkeleton />}>
            <VolumeOverTime since={since} excludeBridge={excludeBridge} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<GridSkeleton />}>
            <TxSizeDistribution since={since} excludeBridge={excludeBridge} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<PanelSkeleton height="h-72" />}>
            <ChainSankey since={since} excludeBridge={excludeBridge} />
          </Suspense>
        </ErrorBoundary>

        <div className="grid lg:grid-cols-2 gap-6">
          <ErrorBoundary>
            <Suspense fallback={<TableSkeleton />}>
              <TopTokens since={since} excludeBridge={excludeBridge} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary>
            <Suspense fallback={<TableSkeleton />}>
              <TopRoutes since={since} excludeBridge={excludeBridge} />
            </Suspense>
          </ErrorBoundary>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<TableSkeleton />}>
            <RecentTransfers />
          </Suspense>
        </ErrorBoundary>

        <MethodologyFooter />
      </main>
    </div>
  );
}

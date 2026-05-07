import Image from "next/image";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HeroKpis } from "@/components/HeroKpis";
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
  return <div className={`bg-surface-card border border-border rounded-lg ${height}`} />;
}

function HeroSkeleton() {
  return (
    <div className="grid lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 bg-surface-card border border-border rounded-lg h-48" />
      <div className="lg:col-span-2 grid grid-cols-2 gap-4">
        <div className="bg-surface-card border border-border rounded-lg h-[92px]" />
        <div className="bg-surface-card border border-border rounded-lg h-[92px]" />
        <div className="bg-surface-card border border-border rounded-lg h-[92px]" />
        <div className="bg-surface-card border border-border rounded-lg h-[92px]" />
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="bg-surface-card border border-border rounded-lg p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border border-border rounded-md h-[120px]" />
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-surface-card border border-border rounded-lg p-5">
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-7 border-b border-border/40" />
        ))}
      </div>
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
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/logos/noca-wordmark-white.svg"
            alt="Noca"
            width={80}
            height={22}
            priority
          />
          <span className="text-text-muted text-sm">/</span>
          <span className="text-text-secondary text-sm font-medium">Gnosis Bridges</span>
        </div>
        <div className="flex items-center gap-4">
          <Suspense fallback={<span className="text-text-muted text-xs">…</span>}>
            <IndexerHead />
          </Suspense>
          <PeriodSelector />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
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

        <footer className="text-center text-text-muted text-xs pt-4 pb-8">
          Gnosis Chain Bridge Analytics — Powered by Envio
        </footer>
      </main>
    </div>
  );
}

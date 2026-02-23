import Image from "next/image";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalSummary } from "@/components/GlobalSummary";
import { TopBridges } from "@/components/TopBridges";
import { VolumeOverTime } from "@/components/VolumeOverTime";
import { TopTokens } from "@/components/TopTokens";
import { ChainFlows } from "@/components/ChainFlows";
import { ChainSankey } from "@/components/ChainSankey";
import { RecentTransfers } from "@/components/RecentTransfers";
import { PeriodSelector } from "@/components/PeriodSelector";

function SectionSkeleton() {
  return <div className="bg-surface-card border border-border rounded-lg p-5 h-48 animate-pulse" />;
}

type Period = "7d" | "30d" | "all";

function computeSince(period: Period): string | undefined {
  if (period === "all") return undefined;
  const days = period === "7d" ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
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
          <PeriodSelector />
          <span className="text-text-muted text-xs font-mono">Live</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <GlobalSummary since={since} excludeBridge={excludeBridge} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <TopBridges since={since} excludeBridge={excludeBridge} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <VolumeOverTime since={since} excludeBridge={excludeBridge} />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <ChainSankey since={since} excludeBridge={excludeBridge} />
          </Suspense>
        </ErrorBoundary>

        <div className="grid lg:grid-cols-2 gap-6">
          <ErrorBoundary>
            <Suspense fallback={<SectionSkeleton />}>
              <TopTokens since={since} excludeBridge={excludeBridge} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary>
            <Suspense fallback={<SectionSkeleton />}>
              <ChainFlows since={since} excludeBridge={excludeBridge} />
            </Suspense>
          </ErrorBoundary>
        </div>

        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <RecentTransfers />
          </Suspense>
        </ErrorBoundary>

        <footer className="text-center text-text-muted text-xs py-8 border-t border-border">
          Gnosis Chain Bridge Analytics — Powered by Envio
        </footer>
      </main>
    </div>
  );
}

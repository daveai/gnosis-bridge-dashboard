"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
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

type Period = "7d" | "30d" | "all";

function computeSince(period: Period): string | undefined {
  if (period === "all") return undefined;
  const days = period === "7d" ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function SectionSkeleton() {
  return <div className="bg-surface-card border border-border rounded-lg p-5 h-48 animate-pulse" />;
}

function Dashboard() {
  const searchParams = useSearchParams();
  const periodParam = searchParams.get("period") || "all";
  const period = (["7d", "30d", "all"].includes(periodParam) ? periodParam : "all") as Period;
  const since = computeSince(period);
  const excludeBridge = searchParams.get("hideOmni") === "1" ? "omnibridge" : undefined;

  return (
    <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <ErrorBoundary>
        <GlobalSummary since={since} excludeBridge={excludeBridge} />
      </ErrorBoundary>

      <ErrorBoundary>
        <TopBridges since={since} excludeBridge={excludeBridge} />
      </ErrorBoundary>

      <ErrorBoundary>
        <VolumeOverTime since={since} excludeBridge={excludeBridge} />
      </ErrorBoundary>

      <ErrorBoundary>
        <ChainSankey since={since} excludeBridge={excludeBridge} />
      </ErrorBoundary>

      <div className="grid lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <TopTokens since={since} excludeBridge={excludeBridge} />
        </ErrorBoundary>
        <ErrorBoundary>
          <ChainFlows since={since} excludeBridge={excludeBridge} />
        </ErrorBoundary>
      </div>

      <ErrorBoundary>
        <RecentTransfers />
      </ErrorBoundary>

      <footer className="text-center text-text-muted text-xs py-8 border-t border-border">
        Gnosis Chain Bridge Analytics — Powered by Envio
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/gnosis-bridge-dashboard/logos/noca-wordmark-white.svg"
            alt="Noca"
            width={80}
            height={22}
            priority
          />
          <span className="text-text-muted text-sm">/</span>
          <span className="text-text-secondary text-sm font-medium">Gnosis Bridges</span>
        </div>
        <div className="flex items-center gap-4">
          <Suspense>
            <PeriodSelector />
          </Suspense>
          <span className="text-text-muted text-xs font-mono">Live</span>
        </div>
      </header>

      <Suspense fallback={<SectionSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

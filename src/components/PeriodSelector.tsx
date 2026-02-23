"use client";

import { useSearchParams, useRouter } from "next/navigation";

const periods = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "all", label: "All" },
] as const;

export function PeriodSelector() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = searchParams.get("period") || "all";
  const hideOmni = searchParams.get("hideOmni") === "1";

  function navigate(period: string, hide: boolean) {
    const params = new URLSearchParams();
    if (period !== "all") params.set("period", period);
    if (hide) params.set("hideOmni", "1");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "/");
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate(current, !hideOmni)}
        className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
          hideOmni
            ? "bg-surface-card border-petrol-light text-text-primary"
            : "border-border text-text-muted hover:text-text-primary"
        }`}
      >
        Excl. Omnibridge
      </button>
      <div className="flex gap-0.5 bg-surface-card border border-border rounded-lg p-0.5">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => navigate(p.value, hideOmni)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              current === p.value
                ? "bg-petrol-light text-white"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

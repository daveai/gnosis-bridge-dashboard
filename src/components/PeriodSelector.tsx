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

  function navigate(period: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (period === "all") params.delete("period");
    else params.set("period", period);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "/");
  }

  return (
    <div className="flex gap-0.5 bg-surface-card border border-border rounded-lg p-0.5">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => navigate(p.value)}
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
  );
}

interface InlineHideOmniProps {
  paramName?: string;
}

export function InlineHideOmniToggle({ paramName = "hideOmni" }: InlineHideOmniProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const active = searchParams.get(paramName) === "1";

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (active) params.delete(paramName);
    else params.set(paramName, "1");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "/", { scroll: false });
  }

  return (
    <button
      onClick={toggle}
      className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
        active
          ? "border-petrol-light text-text-primary"
          : "border-border text-text-muted hover:text-text-primary"
      }`}
    >
      Excl. Omnibridge
    </button>
  );
}

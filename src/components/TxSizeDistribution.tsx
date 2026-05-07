import { safeGql } from "@/lib/graphql";
import { bridgeDisplayName, formatUsd, median } from "@/lib/format";
import { ALL_BRIDGES } from "@/lib/types";
import { TxSizeHistogram } from "./charts/TxSizeHistogram";
import { SectionHeader } from "./SectionHeader";
import { Unavailable } from "./Unavailable";

interface SampleResp {
  [alias: string]: { amountUsd: string | null }[];
}

interface Props {
  since?: string;
  excludeBridge?: string;
}

const BIN_COUNT = 12;
const LOG_MIN = 0;
const LOG_MAX = 7;

function binSizes(sizes: number[]) {
  const bins = Array.from({ length: BIN_COUNT }, (_, i) => {
    const lower = Math.pow(10, LOG_MIN + (i / BIN_COUNT) * (LOG_MAX - LOG_MIN));
    const upper = Math.pow(10, LOG_MIN + ((i + 1) / BIN_COUNT) * (LOG_MAX - LOG_MIN));
    return { bin: String(i), count: 0, lower, upper };
  });
  for (const s of sizes) {
    if (s <= 0) continue;
    const log = Math.log10(s);
    const idx = Math.min(
      BIN_COUNT - 1,
      Math.max(0, Math.floor(((log - LOG_MIN) / (LOG_MAX - LOG_MIN)) * BIN_COUNT)),
    );
    bins[idx].count += 1;
  }
  return bins;
}

export async function TxSizeDistribution({ since, excludeBridge }: Props) {
  const tsCond: string[] = [`amountUsd: { _is_null: false }`];
  if (since) {
    const sinceTs = Math.floor(new Date(since).getTime() / 1000).toString();
    tsCond.push(`timestamp: { _gte: "${sinceTs}" }`);
  }
  const bridges = ALL_BRIDGES.filter((b) => b !== excludeBridge);
  const aliasParts = bridges.map(
    (b, i) =>
      `b${i}: BridgeTransfer(where: { ${tsCond.join(", ")}, bridge: { _eq: "${b}" } }, limit: 1000) { amountUsd }`,
  );
  const result = await safeGql<SampleResp>(`{ ${aliasParts.join("\n")} }`);

  if (!result.ok) {
    return (
      <section>
        <SectionHeader eyebrow="Transaction size distribution" />
        <div className="bg-surface-card border border-border rounded-lg p-5">
          <Unavailable />
        </div>
      </section>
    );
  }

  const allSizes: number[] = [];
  const perBridge = bridges.map((b, i) => {
    const rows = result.data[`b${i}`] || [];
    const sizes = rows
      .map((r) => parseFloat(r.amountUsd || "0"))
      .filter((n) => n > 0);
    allSizes.push(...sizes);
    return { bridge: b, sizes, total: sizes.reduce((s, n) => s + n, 0) };
  });

  const globalMedian = median(allSizes);
  const globalMedianLog = globalMedian != null && globalMedian > 0
    ? Math.floor(((Math.log10(globalMedian) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * BIN_COUNT)
    : null;

  return (
    <section>
      <SectionHeader eyebrow="Transaction size distribution">
        {globalMedian != null ? (
          <span className="text-[11px] text-text-muted">
            Global median <span className="num text-text-secondary">{formatUsd(globalMedian)}</span>
          </span>
        ) : null}
      </SectionHeader>
      <div className="bg-surface-card border border-border rounded-lg p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {perBridge.map((b) => {
            const bins = binSizes(b.sizes);
            return (
              <div
                key={b.bridge}
                className="border border-border rounded-md p-3"
                style={{ minHeight: 120 }}
              >
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-[11px] text-text-primary truncate pr-2">
                    {bridgeDisplayName(b.bridge)}
                  </p>
                  <p className="text-[11px] num text-text-muted">
                    {b.sizes.length}
                  </p>
                </div>
                <TxSizeHistogram bins={bins} globalMedianLog={globalMedianLog} />
                <div className="flex justify-between text-[9px] text-text-muted mt-1">
                  <span>$1</span>
                  <span>$10M</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

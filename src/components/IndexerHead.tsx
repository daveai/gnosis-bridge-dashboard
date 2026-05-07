import { safeGql } from "@/lib/graphql";
import { formatRelativeTime } from "@/lib/format";

interface Response {
  BridgeTransfer: { timestamp: string }[];
}

export async function IndexerHead() {
  const result = await safeGql<Response>(
    `{ BridgeTransfer(order_by: { timestamp: desc }, limit: 1) { timestamp } }`,
  );
  if (!result.ok || !result.data.BridgeTransfer.length) {
    return <span className="text-text-muted text-xs">No data</span>;
  }
  const ts = parseInt(result.data.BridgeTransfer[0].timestamp);
  const ageMin = (Date.now() / 1000 - ts) / 60;
  const stale = ageMin > 30;
  const text = `Updated ${formatRelativeTime(ts)}`;
  return (
    <span className={`text-xs ${stale ? "text-coral" : "text-text-muted"}`}>{text}</span>
  );
}

"use client";

import { Sankey, Tooltip, Layer, Rectangle } from "recharts";
import { formatUsd } from "@/lib/format";

interface ChainFlow {
  chainName: string;
  volume: number;
  count: number;
}

interface Props {
  inflows: ChainFlow[];
  outflows: ChainFlow[];
}

const INFLOW_COLOR = "rgba(16, 95, 124, 0.55)";
const OUTFLOW_COLOR = "rgba(255, 133, 102, 0.55)";
const NODE_COLOR = "#2a2a32";
const GNOSIS_COLOR = "#105F7C";

function CustomNode({ x, y, width, height, payload, chartWidth }: any) {
  const isGnosis = payload.name === "Gnosis";
  const isLeft = x < chartWidth / 2 - 50;

  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isGnosis ? GNOSIS_COLOR : NODE_COLOR}
        radius={[3, 3, 3, 3]}
      />
      <text
        x={isGnosis ? x + width / 2 : isLeft ? x - 8 : x + width + 8}
        y={y + height / 2}
        textAnchor={isGnosis ? "middle" : isLeft ? "end" : "start"}
        dominantBaseline="central"
        fill="#FAFAFA"
        fontSize={12}
        fontWeight={isGnosis ? 600 : 400}
        fontFamily="Switzer, Inter, system-ui, sans-serif"
      >
        {payload.name}
      </text>
    </Layer>
  );
}

function CustomLink({
  sourceX,
  sourceY,
  sourceControlX,
  targetX,
  targetY,
  targetControlX,
  linkWidth,
  payload,
}: any) {
  const isInflow = payload.target.name === "Gnosis";
  const color = isInflow ? INFLOW_COLOR : OUTFLOW_COLOR;

  return (
    <Layer>
      <path
        d={`
          M${sourceX},${sourceY + linkWidth / 2}
          C${sourceControlX},${sourceY + linkWidth / 2}
           ${targetControlX},${targetY + linkWidth / 2}
           ${targetX},${targetY + linkWidth / 2}
          L${targetX},${targetY - linkWidth / 2}
          C${targetControlX},${targetY - linkWidth / 2}
           ${sourceControlX},${sourceY - linkWidth / 2}
           ${sourceX},${sourceY - linkWidth / 2}
          Z
        `}
        fill={color}
        strokeWidth={0}
      />
    </Layer>
  );
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload?.payload;
  if (!data) return null;
  const sourceName = data.source?.name ?? "";
  const targetName = data.target?.name ?? "";
  const value = data.value ?? 0;
  return (
    <div className="bg-surface-raised border border-border rounded-lg px-3 py-2 text-xs">
      <p className="text-text-primary font-medium">
        {sourceName} → {targetName}
      </p>
      <p className="text-text-secondary font-mono mt-0.5">{formatUsd(value)}</p>
    </div>
  );
}

export function FlowSankey({ inflows, outflows }: Props) {
  if (inflows.length === 0 && outflows.length === 0) {
    return <p className="text-text-muted text-sm text-center py-8">No chain flow data</p>;
  }

  const totalInflow = inflows.reduce((s, f) => s + f.volume, 0);
  const totalOutflow = outflows.reduce((s, f) => s + f.volume, 0);

  const inflowNodes = inflows.map((f) => ({ name: f.chainName }));
  const gnosisIdx = inflowNodes.length;
  const outflowNodes = outflows.map((f) => ({ name: f.chainName }));

  const nodes = [...inflowNodes, { name: "Gnosis" }, ...outflowNodes];
  const links = [
    ...inflows.map((f, i) => ({ source: i, target: gnosisIdx, value: f.volume })),
    ...outflows.map((f, i) => ({ source: gnosisIdx, target: gnosisIdx + 1 + i, value: f.volume })),
  ];

  const chartWidth = 900;
  const maxNodes = Math.max(inflows.length, outflows.length);
  const chartHeight = Math.max(280, maxNodes * 52 + 40);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-[900px] px-[130px] mb-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: INFLOW_COLOR }} />
          <span className="text-xs text-text-muted">
            Inflows <span className="font-mono">{formatUsd(totalInflow)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            Outflows <span className="font-mono">{formatUsd(totalOutflow)}</span>
          </span>
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: OUTFLOW_COLOR }} />
        </div>
      </div>

      <Sankey
        width={chartWidth}
        height={chartHeight}
        data={{ nodes, links }}
        nodeWidth={10}
        nodePadding={20}
        margin={{ top: 4, right: 130, bottom: 4, left: 130 }}
        link={<CustomLink />}
        node={<CustomNode chartWidth={chartWidth} />}
        iterations={64}
      >
        <Tooltip content={<CustomTooltip />} />
      </Sankey>
    </div>
  );
}

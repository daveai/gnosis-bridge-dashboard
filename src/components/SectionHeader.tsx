import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  children?: ReactNode;
}

export function SectionHeader({ eyebrow, children }: Props) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="section-eyebrow">{eyebrow}</h2>
      {children ? <div className="flex items-center gap-3">{children}</div> : null}
    </div>
  );
}

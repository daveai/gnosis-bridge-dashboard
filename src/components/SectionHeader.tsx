import type { ReactNode } from 'react'

interface Props {
  eyebrow: string
  children?: ReactNode
}

export function SectionHeader({ eyebrow, children }: Props) {
  return (
    <>
      <div className="flex items-start justify-between gap-4 pb-2">
        <h2 className="section-eyebrow">{eyebrow}</h2>
        {children ? <div className="shrink-0 flex items-center gap-3">{children}</div> : null}
      </div>
      <hr className="section-rule" />
    </>
  )
}

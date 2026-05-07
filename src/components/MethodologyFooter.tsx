export function MethodologyFooter() {
  return (
    <section className="border-t border-border pt-8 space-y-4">
      <p className="text-muted-foreground text-xs leading-relaxed max-w-4xl">
        <span className="text-foreground">Methodology.</span> Twelve bridges
        indexed directly on Gnosis Chain (ID 100). Aggregators such as Socket
        and LI.FI route through these bridges and are not counted separately.
        Intent-based bridges — Relay, Bungee V2, NEAR Intents, deBridge DLN —
        record both legs of a Gnosis-touching transfer, which inflates transfer
        counts above unique end-user flows but reflects on-chain activity
        faithfully. USDC and USDC.e are aggregated as a single token, as they
        are 1:1 transmutable on Gnosis. USD values are priced at transfer time.
        Median ticket is the 50th-percentile transfer size, period-scoped.
      </p>
      <p className="text-muted-foreground text-xs leading-relaxed max-w-4xl">
        Bungee, Bungee V2, and Socket are NOCA counterparties; their inclusion
        follows the same on-chain methodology applied to all bridges. Data
        sourced from on-chain records. This dashboard is for informational
        purposes only and does not constitute investment advice.
      </p>
    </section>
  )
}

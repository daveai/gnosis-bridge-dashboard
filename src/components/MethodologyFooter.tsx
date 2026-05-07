export function MethodologyFooter() {
  return (
    <section className="border-t border-border pt-8">
      <p className="text-muted-foreground text-xs leading-relaxed max-w-4xl">
        <span className="text-foreground">Methodology.</span> Thirteen bridges indexed directly on
        Gnosis Chain (chain ID 100). Aggregators such as Socket and LI.FI are not counted separately
        — they route through the bridges already listed. Relay, Bungee V2, NEAR Intents, and
        deBridge DLN are intent-based: each transfer with both legs touching Gnosis is recorded
        twice, which reflects on-chain activity faithfully but raises transfer counts above unique
        end-user flows. USDC and USDC.e are aggregated as a single token because they are 1:1
        transmutable on Gnosis. USD values are priced at transfer time. Median ticket is the
        50th-percentile transfer size, period-scoped.
      </p>
    </section>
  )
}

export function MethodologyFooter() {
  return (
    <section className="border-t border-border pt-8">
      <p className="text-text-muted text-xs leading-relaxed max-w-4xl">
        <span className="text-text-secondary">Methodology.</span> Coverage starts 1 January 2026.
        We index 13 bridges directly on Gnosis Chain (chain ID 100). Aggregators (Socket, LI.FI)
        are excluded — they route through the bridges already counted, and including them would
        double-count volume. Intent-based bridges (Relay, Bungee V2, NEAR Intents, deBridge DLN)
        record both legs of a transfer when both touch Gnosis; this is faithful to what hits the
        chain, but inflates tx counts versus end-user activity. USD values use historical price
        at transfer time. Avg ticket = volume / count, period-scoped.
      </p>
    </section>
  );
}

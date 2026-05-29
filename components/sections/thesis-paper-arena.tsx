export default function ThesisPaper() {
  return (
    <section className="s thesis" id="thesis">
      <div className="thesis-grid">
        <div className="thesis-statement">
          <span className="label">Thesis</span>
          <h2 className="thesis-headline display reveal" data-d="100">
            Whoever controls the high ground controls the future. Today, that
            ground is moving to <em>orbit</em>.
          </h2>
        </div>
        <div className="thesis-argument">
          <p className="thesis-argument__lead reveal" data-d="100">
            Two hundred years ago, whoever controlled the seas controlled trade,
            power, and the future. Fifty years ago, the same was true of
            airspace. The US spent roughly <em>$2 trillion</em> on air dominance
            because the alternative was losing.
          </p>
          <p className="reveal" data-d="200">
            That same physics now applies on the ground. Cheap robotic swarms
            across air, sea, and land can saturate any defense built around
            expensive missiles, and almost nobody has noticed.
          </p>
          <p className="reveal" data-d="300">
            Europe needs dominance in this final frontier. We are building the{" "}
            <em>space arsenal</em>: autonomous, directed-energy defense priced
            per intercept in cents, not millions.
          </p>
        </div>
      </div>
    </section>
  );
}

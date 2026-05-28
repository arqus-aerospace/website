const DOMAINS = [
  {
    idx: "i.",
    title: "Critical infrastructure",
    desc: "Airports, harbours, nuclear plants, electricity grids. Persistent overwatch where downtime is measured in lives, not minutes.",
    tag: "Ground",
    d: "100",
  },
  {
    idx: "ii.",
    title: "Terrestrial platforms",
    desc: "Manned and unmanned vehicles, tanks, UGVs, service fleets. Plug-and-protect for anything that moves on land.",
    tag: "Mobile",
    d: "150",
  },
  {
    idx: "iii.",
    title: "Seaborne platforms",
    desc: "Ships, sea drones, oil platforms, critical waterways. A close-in layer against swarming hostile UAS and USVs.",
    tag: "Maritime",
    d: "200",
  },
  {
    idx: "iv.",
    title: "Space defense",
    desc: "Dazzle hostile satellites, safeguard constellations, divert threats. A mutual defense shell across an orbital plane.",
    tag: "Orbital",
    d: "250",
    italic: true,
  },
];

export default function Domains() {
  return (
    <section className="s domains" id="domains">
      <header className="s-head">
        <div>
          <span className="label">Domains</span>
          <div className="num">03 / From ground to space</div>
        </div>
        <h2 className="s-headline display">
          Protecting our most valuable infrastructure.
        </h2>
      </header>

      <div className="domain-rows">
        {DOMAINS.map((d) => (
          <div key={d.idx} className="domain reveal" data-d={d.d}>
            <div className="idx">{d.idx}</div>
            <div className="title display">
              {d.italic ? <em>{d.title}</em> : d.title}
            </div>
            <div className="desc">{d.desc}</div>
            <div className="tag">
              {d.tag}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

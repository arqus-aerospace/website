const TEAM = [
  {
    initials: "M.",
    role: "Chief executive",
    first: "Marnix",
    last: "Meersman",
    bio: "Managed R&D for ESA's Galileo and IRIS² defense constellations. Co-built the world's fastest H₂ race car.",
    creds: "TU Delft · Harvard Entrepreneurship",
    linkedin: "https://www.linkedin.com/in/marnixmeersman/?locale=en",
  },
  {
    initials: "A.",
    role: "Chief operating",
    first: "Anton",
    last: "Liegert",
    bio: "Five years across the space industry in Germany, England, and Japan. Built ESA's internal incubator from zero.",
    creds: "TU Dresden · ESB Business School",
    linkedin: "https://www.linkedin.com/in/antonliegert/",
  },
  {
    initials: "S.",
    role: "Chief technology",
    first: "Stijn",
    last: "Lafontaine",
    bio: "Built autonomous defense boats, drones, and offshore robotic systems. Autonomy, swarms, physical AI.",
    creds: "TU Delft · Robotics Engineer",
    linkedin: "https://www.linkedin.com/in/stlafontaine/",
  },
];

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      width="14"
      height="14"
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.37 4.28 5.46v6.28zM5.34 7.43c-1.14 0-2.07-.93-2.07-2.07 0-1.14.93-2.07 2.07-2.07 1.14 0 2.07.93 2.07 2.07 0 1.14-.93 2.07-2.07 2.07zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

export default function Careers() {
  return (
    <section className="careers-compact" id="team">
      <div className="careers-compact__head">
        <span className="label">Team &amp; Careers</span>
        <p className="careers-compact__lede">
          We are hiring across autonomy, optics, power electronics, and field
          ops. If you want to build the space arsenal with us,{" "}
          <a href="mailto:careers@arqusaerospace.com">
            careers@arqusaerospace.com
          </a>
          .
        </p>
      </div>

      <ul className="careers-compact__people">
        {TEAM.map((p) => (
          <li key={p.last} className="careers-compact__person">
            <div className="careers-compact__initials">{p.initials}</div>
            <div className="careers-compact__meta">
              <div className="role">{p.role}</div>
              <div className="name display">
                {p.first} <em>{p.last}</em>
              </div>
            </div>
            <a
              className="li-link"
              href={p.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${p.first} ${p.last} on LinkedIn`}
            >
              <LinkedInIcon />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// The backers: a strip of their logos drifting slowly left to right in the
// lower right corner of the opening screen, each linking to its site. All are
// shown in white to match the page: dark marks are inverted, white ones left
// as they are. (Atlantic, Prototype and Tholus came on dark boxes, and Bayern
// Innovativ and NVIDIA in colour on white; those were cut out into transparent
// white PNGs.) `h` evens out their visual weight, since some sit in a lot of
// space.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type Backer = {
  name: string;
  src: string;
  fx: "invert" | "none";
  h: number;
  /** Their site; left out where we have none yet. */
  href?: string;
};

const BACKERS: Backer[] = [
  { name: "ESA Business Incubation Centre Bavaria", src: "esa-bic.avif", fx: "invert", h: 84, href: "https://www.esa-bic.de/" },
  { name: "EXIST, Federal Ministry for Economic Affairs and Energy", src: "exist-bmwe.avif", fx: "invert", h: 96, href: "https://www.exist.de/" },
  { name: "Bayern Innovativ", src: "bayern-innovativ.png", fx: "none", h: 54, href: "https://www.bayern-innovativ.de/" },
  { name: "NVIDIA Inception Program", src: "nvidia-inception.png", fx: "none", h: 50, href: "https://www.nvidia.com/en-us/startups/" },
  { name: "UnternehmerTUM", src: "unternehmertum.avif", fx: "invert", h: 76, href: "https://www.unternehmertum.de/" },
  { name: "TUM Venture Labs Aerospace", src: "tum-venture-labs-aerospace.png", fx: "invert", h: 48, href: "https://www.tum-venture-labs.de/" },
  { name: "Tholus Capital", src: "tholus.png", fx: "none", h: 20, href: "https://www.tholuscapital.com/" },
  { name: "P3A", src: "p3a.png", fx: "invert", h: 40, href: "https://www.p3a.com/" },
  { name: "Atlantic", src: "atlantic.png", fx: "none", h: 46, href: "https://atlantic.vc/" },
  // TODO: link once we have Prototype's site
  { name: "Prototype", src: "prototype.png", fx: "none", h: 26 },
  { name: "EUDIS Hackathon", src: "eudis-hackathon.avif", fx: "none", h: 84, href: "https://eudis-hackathon.eu/" },
];

function Row({ copy = false }: { copy?: boolean }) {
  return (
    <ul className="arq-backers__row" aria-hidden={copy || undefined}>
      {BACKERS.map((b) => {
        const img = (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${BASE}/assets/backers/${b.src}`} alt={copy ? "" : b.name} style={{ height: b.h }} />
        );
        return (
          <li key={b.src} className="arq-backers__logo" data-fx={b.fx}>
            {b.href ? (
              // the copy is only there for the loop: keep it out of the tab order
              <a href={b.href} target="_blank" rel="noopener noreferrer" tabIndex={copy ? -1 : undefined}>
                {img}
              </a>
            ) : (
              img
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function Backers({ className = "" }: { className?: string }) {
  return (
    <div className={`arq-backers ${className}`}>
      <span className="arq-backers__kicker">Backed by</span>
      {/* the row twice, so the loop never shows a seam */}
      <div className="arq-backers__track">
        <div className="arq-backers__lane">
          <Row />
          <Row copy />
        </div>
      </div>
    </div>
  );
}

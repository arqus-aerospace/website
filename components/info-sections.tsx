// Opportunities and News: what follows the threats. The roles are placeholder;
// the news is real, collected into lib/news/news.json by scripts/update-news.mjs
// (`npm run news`, and before every build).

import news from "@/lib/news/news.json";

type NewsItem = { url: string; title: string; source: string; author?: string; date: string; summary: string; image: string };
const NEWS = news.items as NewsItem[];
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** Saved pictures are site paths; anything else is shown as given. */
const imageSrc = (src: string) => (src.startsWith("/") ? BASE + src : src);

const ROLES = [
  { title: "Orbital Dynamics Engineer", team: "Space Domain Awareness", place: "Munich · On-site" },
  { title: "GNC Engineer", team: "Spacecraft", place: "Munich · On-site" },
  { title: "Business Development, Defence", team: "Commercial", place: "Munich / Brussels" },
];

/** "2 Sep 2026", or nothing if the source gave no date. */
const shortDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";

function Head({ id, kicker, title, italic }: { id: string; kicker: string; title: string; italic: string }) {
  return (
    <div className="arq-section__head">
      <span className="arq-section__kicker">{kicker}</span>
      <h2 className="arq-section__title" id={id}>
        {title} <em>{italic}</em>
      </h2>
    </div>
  );
}

export function Opportunities() {
  return (
    <section id="opportunities" className="arq-section" aria-labelledby="opportunities-title">
      <Head id="opportunities-title" kicker="Opportunities" title="Open" italic="roles." />
      <ul className="arq-tiles">
        {ROLES.map((r) => (
          <li key={r.title} className="arq-tile">
            <span className="arq-tile__meta">{r.team}</span>
            <span className="arq-tile__title">{r.title}</span>
            <span className="arq-tile__foot">{r.place}</span>
            <a className="arq-tile__link" href={`mailto:contact@arqusaerospace.com?subject=${encodeURIComponent(r.title)}`}>
              Apply →
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One row of news cards. The copy that closes the loop is hidden from readers and the tab order. */
function NewsRow({ copy = false }: { copy?: boolean }) {
  return (
    <ul className="arq-news__row" aria-hidden={copy || undefined}>
      {NEWS.map((n) => (
        <li key={n.url} className="arq-tile arq-tile--link arq-tile--small">
          <a href={n.url} target="_blank" rel="noopener noreferrer" className="arq-tile__cover" tabIndex={copy ? -1 : undefined}>
            {n.image && (
              <span className="arq-tile__image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc(n.image)} alt="" loading="lazy" />
              </span>
            )}
            <span className="arq-tile__body">
              <span className="arq-tile__meta">
                {[shortDate(n.date), n.source, n.author].filter(Boolean).join(" · ")}
              </span>
              <span className="arq-tile__title">{n.title}</span>
              {n.summary && <span className="arq-tile__summary">{n.summary}</span>}
              <span className="arq-tile__foot">Read on {n.source} →</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function News() {
  return (
    <section id="news" className="arq-section" aria-labelledby="news-title">
      <Head id="news-title" kicker="News" title="From the" italic="watch floor." />
      <p className="arq-section__lede">
        {NEWS.length
          ? "What is being written about Arqus, newest first. Each card opens the original."
          : "Coverage of Arqus will appear here as it is published."}
      </p>
      {NEWS.length > 0 && (
        // the cards drift left to right, the row twice over so the loop never shows a seam
        <div className="arq-news__track">
          <div className="arq-news__lane">
            <NewsRow />
            <NewsRow copy />
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function WordsPullUp({
  text,
  baseDelay = 0,
}: {
  text: string;
  baseDelay?: number;
}) {
  const words = text.split(" ");
  return (
    <span className="arq-pull">
      {words.map((w, i) => {
        const isLast = i === words.length - 1;
        return (
          <span
            key={i}
            className="arq-pull__mask"
            style={{ marginRight: isLast ? 0 : "0.22em" }}
          >
            <span
              className="arq-pull__word"
              style={{ animationDelay: `${baseDelay + i * 0.08}s` }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export default function Hero({ onBriefing }: { onBriefing: () => void }) {
  return (
    <section className="arq-hero">
      <div className="arq-hero__frame">
        <video
          className="arq-hero__photo"
          src={`${BASE}/assets/hero-pan.mp4`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="arq-hero__noise" aria-hidden="true" />
        <div className="arq-hero__scrim" aria-hidden="true" />

        <nav className="arq-navlinks" aria-label="Sections">
          <a className="arq-navlinks__link" href="#thesis">Thesis</a>
          <a className="arq-navlinks__link" href="#suite">Suite</a>
          <a className="arq-navlinks__link" href="#domains">Domains</a>
          <a className="arq-navlinks__link" href="#team">Team</a>
        </nav>

        <a
          href="mailto:contact@arqusaerospace.com"
          className="arq-mark"
          aria-label="Arqus Aerospace"
        >
          Arqus
        </a>

        <div className="arq-hero__bottom">
          <div className="arq-hero__grid">
            <h1 className="arq-hero__title">
              <WordsPullUp text="Building the" baseDelay={0.15} />
              <br />
              <span className="arq-hero__title-row">
                <WordsPullUp text="space" baseDelay={0.35} />{" "}
                <span className="arq-pull__mask">
                  <span
                    className="arq-pull__word arq-hero__title-italic"
                    style={{ animationDelay: "0.45s" }}
                  >
                    arsenal.
                  </span>
                </span>
              </span>
            </h1>

            <div className="arq-hero__aside">
              <p className="arq-hero__lede arq-anim-delay-4">
                A European aerospace company. Based in Munich.
                For briefings, reach out at{" "}
                <a href="mailto:contact@arqusaerospace.com">
                  contact@arqusaerospace.com
                </a>
                .
              </p>

              <button
                className="arq-joinbtn arq-anim-delay-5"
                onClick={onBriefing}
                type="button"
              >
                Join us
                <span className="arq-joinbtn__dot">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scramble from "./scramble";
import { scrollToId } from "./smooth-scroll";
import { ease, folder, holePolygon, lerpPts, span, type Pt } from "./chamfer";
import { SHELLS, periodMin, satId, shellCount, SHELL_BY_ID, type ShellId } from "./orbits";
import { mixPresets, setPreset, setUi, useUi } from "./store";
import { NAV } from "./frame";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const still = (n: "a" | "b" | "c") => `${BASE}/study/stills/limb-${n}.jpg`;
const TOTAL = SHELLS.reduce((a, s) => a + shellCount(s), 0);

function useGsap(scope: React.RefObject<HTMLElement | null>, fn: () => void) {
  useLayoutEffect(() => {
    const ctx = gsap.context(fn, scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function Cap({ children, className = "" }: { children: string; className?: string }) {
  return <Scramble className={`st-cap ${className}`} text={children} />;
}

function Card({
  src,
  className = "",
  speed,
  children,
}: {
  src?: string;
  className?: string;
  speed?: number;
  children?: ReactNode;
}) {
  return (
    <figure className={`st-card ${className}`} data-speed={speed}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" />
      )}
      {children}
    </figure>
  );
}

/** Parallax for every [data-speed] element inside the current gsap context. */
function parallax() {
  gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
    const s = Number(el.dataset.speed);
    gsap.fromTo(
      el,
      { yPercent: -s * 50 },
      {
        yPercent: s * 50,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  });
}

// ---------------------------------------------------------------------------
// 1 · Landing — globe + split title
// ---------------------------------------------------------------------------

export function Landing() {
  const root = useRef<HTMLElement>(null);
  useGsap(root, () => {
    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom top",
      onUpdate: (s) => mixPresets("landing", "landingOut", s.progress),
      onEnterBack: () => mixPresets("landing", "landingOut", 1),
    });
    gsap.from(".st-landing__line > span", {
      yPercent: 105,
      duration: 1.4,
      ease: "expo.out",
      stagger: 0.12,
      delay: 0.25,
    });
    gsap.from(".st-landing__desc, .st-landing__meta", {
      opacity: 0,
      y: 12,
      duration: 1,
      delay: 0.9,
      stagger: 0.1,
    });
    gsap.to(".st-landing__line", {
      yPercent: -40,
      opacity: 0,
      stagger: 0.06,
      ease: "none",
      scrollTrigger: { trigger: root.current, start: "top top", end: "55% top", scrub: true },
    });
    gsap.to(".st-landing__desc, .st-landing__meta", {
      opacity: 0,
      ease: "none",
      scrollTrigger: { trigger: root.current, start: "5% top", end: "30% top", scrub: true },
    });
  });

  return (
    <section ref={root} className="st-landing" data-frame="dark" data-canvas data-nav="landing">
      <div className="st-sticky">
        <div className="st-landing__desc">
          <Cap>• 000 — Arqus Aerospace</Cap>
          <p>
            A European aerospace company, based in Munich. Europe needs dominance in this final
            frontier.
          </p>
        </div>
        <h1 className="st-landing__title" aria-label="Building the space arsenal">
          <span className="st-landing__line st-landing__line--1" aria-hidden="true">
            <span>Building</span>
          </span>
          <span className="st-landing__line st-landing__line--2" aria-hidden="true">
            <span>The space</span>
          </span>
          <span className="st-landing__line st-landing__line--3" aria-hidden="true">
            <span>
              Arsenal<i className="st-landing__dot" />
            </span>
          </span>
        </h1>
        <div className="st-landing__meta">
          <Cap>{`${TOTAL.toLocaleString("en-US")} objects in view`}</Cap>
          <span className="st-cap st-cap--dim">Scroll to descend ↓</span>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2 · Intro — white editorial grid
// ---------------------------------------------------------------------------

export function Intro() {
  const root = useRef<HTMLElement>(null);
  useGsap(root, () => {
    parallax();
    gsap.from(".st-intro .st-h1 > span > span", {
      yPercent: 105,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: ".st-intro .st-h1", start: "top 80%" },
    });
  });
  return (
    <section ref={root} id="intro" className="st-sheet" data-frame="light" data-nav="intro">
      <div className="st-grid st-intro">
        <div className="st-intro__main">
          <header className="st-intro__head">
            <Cap>• 001</Cap>
            <h2 className="st-h1">
              <span><span>The high ground</span></span>
              <span><span>is moving to orbit.</span></span>
            </h2>
          </header>
          <div className="st-intro__body">
            <Card src={still("a")} className="st-intro__c1" speed={-0.25} />
            <Card src={still("c")} className="st-intro__c2" speed={0.2}>
              <figcaption>
                <Cap>• Limb / 550 km</Cap>
              </figcaption>
            </Card>
            <p className="st-intro__note">Seas. Then airspace. Now orbit.</p>
          </div>
        </div>
        <aside className="st-intro__side">
          <Card src={still("b")} className="st-card--tall" speed={0.1} />
        </aside>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3 · Story — full-bleed footage, words lit by scroll
// ---------------------------------------------------------------------------

const STORY =
  "Two hundred years ago, whoever controlled the seas controlled trade, power, and the future. Fifty years ago, the same was true of airspace. Today, that high ground is moving to orbit.";

export function Story() {
  const root = useRef<HTMLElement>(null);
  useGsap(root, () => {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: true },
    });
    tl.to(".st-story__w", { opacity: 1, stagger: 0.1, ease: "none", duration: 0.4 }, 0);
    tl.to(".st-story__coda", { opacity: 1, y: 0, duration: 0.6, ease: "none" });
    gsap.fromTo(
      ".st-story__media",
      { scale: 1.25 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom bottom", scrub: true },
      },
    );
  });
  return (
    <section ref={root} id="story" className="st-story" data-frame="dark" data-nav="intro">
      <div className="st-sticky">
        <video
          className="st-story__media"
          src={`${BASE}/assets/hero-pan.mp4`}
          poster={still("b")}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="st-story__scrim" />
        <div className="st-story__text">
          <Cap>• 002</Cap>
          <p className="st-story__p" aria-label={STORY}>
            {STORY.split(" ").map((w, i) => (
              <span key={i} className="st-story__w" aria-hidden="true">
                {w}{" "}
              </span>
            ))}
          </p>
          <p className="st-story__coda">And almost nobody has noticed.</p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4 · Regimes — vertical word, orbit diagram, altitude index
// ---------------------------------------------------------------------------

const ORBIT_R = (alt: number) => 64 + 92 * Math.log10(1 + alt / 100);
// Label angle per shell, spread so the close LEO rings don't collide.
const LABEL_A = [-0.35, -1.25, 0.55, -0.6, -1.05];

function OrbitDiagram() {
  return (
    <svg className="st-diagram" viewBox="0 0 640 760" role="img" aria-label="Orbital regimes from low Earth orbit to geostationary">
      <defs>
        <radialGradient id="st-earth" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#3a6ea8" />
          <stop offset="1" stopColor="#0b1424" />
        </radialGradient>
      </defs>
      {SHELLS.map((s, i) => {
        const r = ORBIT_R(s.altKm);
        const dur = 4 + Math.sqrt(periodMin(s)) * 1.6;
        return (
          <g key={s.id}>
            <circle cx="320" cy="380" r={r} fill="none" stroke="rgba(225,224,204,.22)" strokeDasharray={i % 2 ? "2 6" : "none"} />
            <g className="st-diagram__spin" style={{ animationDuration: `${dur}s`, transformOrigin: "320px 380px" }}>
              <circle cx={320 + r} cy="380" r={i > 2 ? 6 : 4.5} fill={s.color} />
            </g>
            <text
              x={320 + (r + 10) * Math.cos(LABEL_A[i])}
              y={380 + (r + 10) * Math.sin(LABEL_A[i])}
              className="st-diagram__label"
              textAnchor={Math.cos(LABEL_A[i]) < 0 ? "end" : "start"}
            >
              {s.regime} {s.altKm.toLocaleString("en-US")}
            </text>
          </g>
        );
      })}
      <circle cx="320" cy="380" r="64" fill="url(#st-earth)" />
      <circle cx="320" cy="380" r="64" fill="none" stroke="rgba(160,200,255,.5)" />
    </svg>
  );
}

export function Regimes() {
  const root = useRef<HTMLElement>(null);
  useGsap(root, () => {
    parallax();
    gsap.from(".st-regimes__word", {
      yPercent: 20,
      opacity: 0,
      duration: 1.2,
      ease: "expo.out",
      scrollTrigger: { trigger: root.current, start: "top 70%" },
    });
    gsap.from(".st-index li", {
      opacity: 0,
      x: -10,
      stagger: 0.06,
      duration: 0.6,
      scrollTrigger: { trigger: ".st-index", start: "top 85%" },
    });
  });
  return (
    <section ref={root} id="regimes" className="st-sheet" data-frame="light" data-nav="regimes">
      <div className="st-grid st-regimes">
        <div className="st-regimes__wordcol" aria-hidden="true">
          <span className="st-regimes__word">Orbit</span>
        </div>
        <div className="st-regimes__center">
          <Card className="st-card--dark st-regimes__card" speed={-0.06}>
            <OrbitDiagram />
            <figcaption>
              <Cap>• Not to scale — log altitude</Cap>
            </figcaption>
          </Card>
        </div>
        <div className="st-regimes__side">
          <div className="st-regimes__index">
            <Cap>• 003 Altitude index</Cap>
            <ol className="st-index">
              {SHELLS.map((s) => (
                <li key={s.id}>
                  <span className="st-dot" style={{ background: s.color }} />
                  <span className="st-index__reg">{s.regime}</span>
                  <span className="st-index__alt">{s.altKm.toLocaleString("en-US")} km</span>
                  <span className="st-index__per">{periodMin(s).toFixed(0)} min</span>
                </li>
              ))}
            </ol>
            <p className="st-small">
              From a 95-minute lap at 550 km to a full sidereal day at 35,786 km, where a satellite
              holds still over one point on the equator.
            </p>
          </div>
          <Card src={still("c")} className="st-regimes__small" speed={0.15}>
            <figcaption>
              <Cap>• Terminator pass</Cap>
            </figcaption>
          </Card>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5 · Shells — solid colour band with a fanned deck
// ---------------------------------------------------------------------------

function MiniOrbit({ inc, color }: { inc: number; color: string }) {
  const ry = Math.max(4, 46 * Math.cos((inc * Math.PI) / 180));
  return (
    <svg viewBox="0 0 120 120" className="st-mini" aria-hidden="true">
      <circle cx="60" cy="60" r="18" fill="#0b1424" stroke="rgba(160,200,255,.6)" />
      <ellipse cx="60" cy="60" rx="46" ry={ry} fill="none" stroke={color} strokeWidth="1.5" transform="rotate(-24 60 60)" />
      <circle cx={60 + 46 * Math.cos(-0.4)} cy={60 + ry * Math.sin(-0.4)} r="4" fill={color} transform="rotate(-24 60 60)" />
    </svg>
  );
}

function soloShell(id: ShellId) {
  const enabled = Object.fromEntries(SHELLS.map((s) => [s.id, s.id === id])) as Record<ShellId, boolean>;
  setUi({ enabled, selected: null });
  scrollToId("explorer", window.innerHeight * 1.05);
}

export function Shells() {
  const root = useRef<HTMLElement>(null);
  useGsap(root, () => {
    gsap.from(".st-shellcard", {
      y: 120,
      opacity: 0,
      stagger: 0.07,
      duration: 1,
      ease: "expo.out",
      scrollTrigger: { trigger: ".st-deck__fan", start: "top 85%" },
    });
  });
  return (
    <section ref={root} id="shells" className="st-sheet st-sheet--orange" data-frame="light" data-nav="regimes">
      <div className="st-grid st-deck">
        <header className="st-deck__head">
          <Cap>• 004</Cap>
          <h2 className="st-h1">
            Five shells.
            <br />
            {TOTAL.toLocaleString("en-US")} satellites.
          </h2>
        </header>
        <div className="st-deck__desc">
          <Cap>• Constellation set</Cap>
          <p>
            Each shell is a Walker-delta pattern: altitude, inclination, plane count and phasing.
            Pick one to fly the explorer straight to it — or scroll on to see them all at once.
          </p>
        </div>
        <div className="st-deck__fan">
          <span className="st-deck__tick st-deck__tick--top" aria-hidden="true">▼</span>
          {SHELLS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="st-shellcard"
              style={{ ["--i" as string]: i - 2 }}
              onClick={() => soloShell(s.id)}
              aria-label={`Explore ${s.label}`}
            >
              <span className="st-shellcard__top">
                <span className="st-cap">• {s.regime}</span>
                <span className="st-cap">{String(i + 1).padStart(2, "0")}</span>
              </span>
              <MiniOrbit inc={s.incDeg} color={s.color} />
              <span className="st-shellcard__name">{s.label}</span>
              <span className="st-shellcard__stats">
                <span>{s.altKm.toLocaleString("en-US")} km</span>
                <span>{s.incDeg.toFixed(1)}°</span>
                <span>
                  {s.planes}×{s.perPlane}
                </span>
              </span>
            </button>
          ))}
          <span className="st-deck__tick st-deck__tick--bot" aria-hidden="true">▲</span>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6 · Explorer — mask opens onto the live, interactive constellation
// ---------------------------------------------------------------------------

function cardHole(w: number, h: number, scale: number): Pt[] {
  const cw = Math.min(w * 0.3, 440) * scale;
  const ch = Math.min(h * 0.46, 520) * scale;
  const L = (w - cw) / 2;
  const T = (h - ch) / 2;
  return folder(L, T, L + cw, T + ch, 26 * scale, 0.38);
}
function fullHole(w: number, h: number): Pt[] {
  const m = Math.max(w, h) * 0.18;
  return folder(-m, -m, w + m, h + m, 80, 0.38);
}

function setMask(el: HTMLElement | null, t: number) {
  if (!el) return;
  if (t >= 0.999) {
    el.style.visibility = "hidden";
    return;
  }
  el.style.visibility = "visible";
  const w = window.innerWidth;
  const h = window.innerHeight;
  const hole = t <= 0 ? cardHole(w, h, 0.0001) : lerpPts(cardHole(w, h, Math.min(1, t * 4)), fullHole(w, h), ease(span(t, 0.2, 1)));
  el.style.clipPath = holePolygon(w, h, hole);
}

const WARPS = [1, 120, 600, 2400];

function ExplorerHud() {
  const enabled = useUi((s) => s.enabled);
  const warp = useUi((s) => s.timeScale);
  const selected = useUi((s) => s.selected);
  const active = SHELLS.filter((s) => enabled[s.id]).reduce((a, s) => a + shellCount(s), 0);
  const sel = selected ? SHELL_BY_ID[selected.shell] : null;

  return (
    <div className="st-hud">
      <div className="st-hud__tl">
        <Cap>• 005 Constellation explorer</Cap>
      </div>
      <div className="st-hud__left">
        <h2 className="st-h1 st-h1--light">
          Explore
          <br />
          the shells.
        </h2>
        <p>
          Every point is a satellite on a circular orbit, propagated from its elements at the warp
          you choose. Drag to rotate, hover to inspect, click to pin.
        </p>
        <div className="st-warp" role="group" aria-label="Time warp">
          {WARPS.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={warp === w}
              onClick={() => setUi({ timeScale: w })}
            >
              {w}×
            </button>
          ))}
        </div>
      </div>
      <div className="st-hud__panel">
        <div className="st-hud__panelhead">
          <span className="st-cap">Shells</span>
          <button
            type="button"
            className="st-link"
            onClick={() =>
              setUi({ enabled: { leo: true, polar: true, sso: true, meo: true, geo: true } })
            }
          >
            All
          </button>
        </div>
        <ul>
          {SHELLS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="st-toggle"
                aria-pressed={enabled[s.id]}
                onClick={() => setUi((u) => ({ enabled: { ...u.enabled, [s.id]: !u.enabled[s.id] } }))}
              >
                <span className="st-dot" style={{ background: s.color }} />
                <span className="st-toggle__name">{s.label}</span>
                <span className="st-toggle__meta">
                  {s.regime} · {shellCount(s).toLocaleString("en-US")}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="st-hud__total">
          <span className="st-cap">In view</span>
          <span className="st-hud__num">{active.toLocaleString("en-US")}</span>
        </div>
        {sel && selected && (
          <div className="st-hud__sel">
            <span className="st-cap">Pinned</span>
            <span className="st-hud__selid">
              <span className="st-dot" style={{ background: sel.color }} />
              {satId(sel, selected.index)}
            </span>
            <button type="button" className="st-link" onClick={() => setUi({ selected: null })}>
              Unpin
            </button>
          </div>
        )}
      </div>
      <div className="st-hud__bottom">
        <span className="st-cap">Drag to rotate · Hover to inspect · Click to pin</span>
      </div>
    </div>
  );
}

export function Explorer() {
  const root = useRef<HTMLElement>(null);
  const mask = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);

  useGsap(root, () => {
    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      onEnter: () => setPreset("explorer"),
      onEnterBack: () => setPreset("explorer"),
      onUpdate: (s) => {
        const p = s.progress;
        setMask(mask.current, span(p, 0, 0.32));
        const live = p > 0.24 && p < 0.985;
        setUi({ interactive: live });
        if (hud.current) hud.current.style.opacity = String(Math.min(span(p, 0.2, 0.32), 1 - span(p, 0.93, 0.99)));
      },
      onRefresh: (s) => setMask(mask.current, span(s.progress, 0, 0.32)),
      onLeave: () => setUi({ interactive: false, hovered: null }),
      onLeaveBack: () => {
        setMask(mask.current, 0);
        setUi({ interactive: false, hovered: null });
      },
    });
    // Until the section pins, its mask covers the canvas completely.
    setMask(mask.current, 0);
  });

  return (
    <section ref={root} id="explorer" className="st-explorer" data-frame="dark" data-canvas data-nav="explorer">
      <div className="st-sticky">
        <div ref={mask} className="st-mask st-mask--orange" />
        <div ref={hud} className="st-hud-wrap" style={{ opacity: 0 }}>
          <ExplorerHud />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 7 · Domains — three camera chapters joined by shutter wipes
// ---------------------------------------------------------------------------

const CHAPTERS = [
  {
    word: "Links",
    line: "Optical links stitch fifteen hundred satellites into a single network.",
    win: [0.06, 0.28] as const,
  },
  {
    word: "Persistence",
    line: "From 35,786 km, one satellite keeps over 40% of the planet's surface in view.",
    win: [0.4, 0.58] as const,
  },
  {
    word: "Coverage",
    line: "Polar orbits cross every latitude as the Earth turns beneath them.",
    win: [0.7, 0.88] as const,
  },
];

export function Domains() {
  const root = useRef<HTMLElement>(null);
  const mask = useRef<HTMLDivElement>(null);
  const chapters = useRef<(HTMLDivElement | null)[]>([]);
  const wipes = useRef<(HTMLDivElement | null)[]>([]);

  useGsap(root, () => {
    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => {
        const p = s.progress;
        if (p < 0.34) mixPresets("explorer", "links", span(p, 0, 0.14));
        else if (p < 0.64) mixPresets("links", "persistence", span(p, 0.3, 0.38));
        else mixPresets("persistence", "coverage", span(p, 0.6, 0.68));

        CHAPTERS.forEach((c, i) => {
          const el = chapters.current[i];
          if (!el) return;
          const [a, b] = c.win;
          const o = Math.min(span(p, a - 0.04, a + 0.03), 1 - span(p, b - 0.03, b + 0.03));
          el.style.opacity = String(o);
          el.style.transform = `translateY(${(1 - o) * 24}px)`;
        });

        [0.33, 0.63].forEach((b, i) => {
          const el = wipes.current[i];
          if (!el) return;
          const t = span(p, b - 0.035, b + 0.035);
          el.style.transform = `translateY(${110 - t * 260}vh)`;
        });

        // Close down onto the next white sheet.
        const c = span(p, 0.9, 1);
        const el = mask.current;
        if (el) {
          if (c <= 0) el.style.visibility = "hidden";
          else {
            el.style.visibility = "visible";
            const w = window.innerWidth;
            const h = window.innerHeight;
            const hole =
              c < 0.7
                ? lerpPts(fullHole(w, h), cardHole(w, h, 1), ease(span(c, 0, 0.7)))
                : cardHole(w, h, Math.max(0.0001, 1 - ease(span(c, 0.7, 1))));
            el.style.clipPath = holePolygon(w, h, hole);
          }
        }
      },
    });
  });

  return (
    <section ref={root} id="domains" className="st-domains" data-frame="dark" data-canvas data-nav="domains">
      <div className="st-sticky">
        {CHAPTERS.map((c, i) => (
          <div
            key={c.word}
            className="st-chapter"
            ref={(el) => {
              chapters.current[i] = el;
            }}
            style={{ opacity: 0 }}
          >
            <span className="st-chapter__word" aria-hidden="true">
              {c.word}
            </span>
            <div className="st-chapter__cap">
              <span className="st-cap">
                {String(i + 1).padStart(3, "0")} <i className="st-dot st-dot--inline" /> {c.word}
              </span>
              <p>{c.line}</p>
            </div>
          </div>
        ))}
        {[0, 1].map((i) => (
          <div
            key={i}
            className="st-wipe"
            ref={(el) => {
              wipes.current[i] = el;
            }}
          />
        ))}
        <div ref={mask} className="st-mask" style={{ visibility: "hidden" }} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 8 · Arsenal — giant word, collage, CTA
// ---------------------------------------------------------------------------

export function Arsenal() {
  const root = useRef<HTMLElement>(null);
  useGsap(root, () => {
    parallax();
    gsap.from(".st-giant > span", {
      yPercent: 100,
      duration: 1.3,
      ease: "expo.out",
      stagger: 0.04,
      scrollTrigger: { trigger: ".st-giant", start: "top 80%" },
    });
  });
  return (
    <section ref={root} id="arsenal" className="st-sheet" data-frame="light" data-nav="arsenal">
      <div className="st-grid st-arsenal">
        <h2 className="st-giant" aria-label="Arsenal">
          {"ARSENAL".split("").map((ch, i) => (
            <span key={i} aria-hidden="true">
              {ch}
            </span>
          ))}
        </h2>
        <div className="st-arsenal__collage">
          <Card src={still("b")} className="st-arsenal__c1" speed={-0.12}>
            <figcaption>
              <Cap>• The high ground</Cap>
            </figcaption>
          </Card>
          <Card className="st-card--ink st-arsenal__c2" speed={0.18}>
            <span className="st-cap">• Thesis</span>
            <p>Europe needs dominance in this final frontier.</p>
          </Card>
          <Card src={still("a")} className="st-arsenal__c3" speed={0.06} />
        </div>
        <div className="st-arsenal__foot">
          <Cap>• 006 Join us</Cap>
          <p>We&rsquo;re building the space arsenal. Request a briefing to hear what comes next.</p>
          <div className="st-arsenal__actions">
            <button type="button" className="st-btn" onClick={() => setUi({ briefing: true })}>
              <Scramble text="REQUEST A BRIEFING" />
              <span aria-hidden="true">→</span>
            </button>
            <Link className="st-btn st-btn--ghost" href="/thesis">
              <Scramble text="READ THE THESIS" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 9 · Footer
// ---------------------------------------------------------------------------

export function Footer() {
  const nav = useUi((s) => s.nav);
  return (
    <footer className="st-footer" data-frame="dark" data-nav="arsenal">
      <div className="st-footer__grid">
        <div>
          <Cap>{"// Uplink established"}</Cap>
          <span className="st-cap st-cap--dim">{`${TOTAL.toLocaleString("en-US")} objects modelled`}</span>
        </div>
        <ul className="st-footer__nav">
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                className={nav === n.id ? "is-active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId(n.id);
                }}
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <div>
          <span className="st-cap st-cap--dim">Contact us at</span>
          <a className="st-cap" href="mailto:contact@arqusaerospace.com">
            contact@arqusaerospace.com
          </a>
        </div>
        <div>
          <span className="st-cap st-cap--dim">Munich, DE</span>
          <span className="st-cap">48.1351° N · 11.5820° E</span>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="st-footer__mark"
        src={`${BASE}/assets/arqus-wordmark-white-cropped.png`}
        alt="Arqus"
      />
      <div className="st-footer__legal">
        <Link href="/thesis" className="st-cap">
          Thesis
        </Link>
        <a href="mailto:contact@arqusaerospace.com" className="st-cap">
          Contact
        </a>
        <span className="st-cap">© 2026 Arqus Aerospace</span>
      </div>
    </footer>
  );
}

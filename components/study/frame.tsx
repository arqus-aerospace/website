"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Scramble from "./scramble";
import { scrollToId } from "./smooth-scroll";
import { setUi, useUi } from "./store";

export const NAV = [
  { id: "intro", label: "Thesis" },
  { id: "regimes", label: "Orbits" },
  { id: "explorer", label: "Explorer" },
  { id: "domains", label: "Domains" },
  { id: "arsenal", label: "Join" },
];

function Crosshair() {
  return (
    <svg width="22" height="44" viewBox="0 0 22 44" fill="none" aria-hidden="true">
      <path d="M11 0 V44 M0 22 H22" stroke="currentColor" strokeWidth="1" />
      <path d="M11 13 L13.5 22 L11 31 L8.5 22 Z" fill="currentColor" />
    </svg>
  );
}

export default function Frame() {
  const theme = useUi((s) => s.frame);
  const nav = useUi((s) => s.nav);
  const menu = useUi((s) => s.menu);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => bar.current?.style.setProperty("--p", self.progress.toFixed(4)),
    });
    return () => st.kill();
  }, []);

  const go = (id: string) => {
    setUi({ menu: false });
    scrollToId(id);
  };

  return (
    <>
      <div className="st-frame" data-theme={theme}>
        <div className="st-frame__rail">
          <button
            type="button"
            className="st-burger"
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            onClick={() => setUi({ menu: !menu })}
          >
            <span />
            <span />
          </button>
          <div className="st-frame__cross">
            <Crosshair />
          </div>
          <span className="st-frame__dots" aria-hidden="true">
            •••
          </span>
        </div>
        <div className="st-frame__bar">
          <div className="st-frame__progress" ref={bar} />
          <nav className="st-frame__nav" aria-label="Sections">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className={nav === n.id ? "is-active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  go(n.id);
                }}
              >
                <Scramble text={n.label.toUpperCase()} />
              </a>
            ))}
          </nav>
          <button type="button" className="st-tab" onClick={() => setUi({ briefing: true })}>
            <Scramble text="REQUEST BRIEFING" />
          </button>
        </div>
      </div>

      <div className={`st-menu ${menu ? "is-open" : ""}`} aria-hidden={!menu}>
        <div className="st-menu__inner">
          <span className="st-cap">• Index</span>
          <ul>
            {NAV.map((n, i) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  tabIndex={menu ? 0 : -1}
                  onClick={(e) => {
                    e.preventDefault();
                    go(n.id);
                  }}
                >
                  <span className="st-menu__num">{String(i + 1).padStart(3, "0")}</span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="st-menu__mail" href="mailto:contact@arqusaerospace.com" tabIndex={menu ? 0 : -1}>
            contact@arqusaerospace.com
          </a>
        </div>
      </div>
    </>
  );
}

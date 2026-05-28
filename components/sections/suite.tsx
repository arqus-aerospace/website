"use client";

import { useEffect, useRef } from "react";

const DRONES = [
  { y: 18, size: 72, dur: 2.6, delay: 0.05, endX: -22 },
  { y: 30, size: 46, dur: 3.1, delay: 0.35, endX: -42 },
  { y: 14, size: 36, dur: 3.4, delay: 0.55, endX: -68 },
  { y: 42, size: 62, dur: 2.9, delay: 0.7, endX: -30 },
  { y: 22, size: 54, dur: 3.0, delay: 0.95, endX: -55 },
  { y: 50, size: 40, dur: 3.3, delay: 1.2, endX: -72 },
  { y: 34, size: 32, dur: 3.5, delay: 1.45, endX: -85 },
  { y: 46, size: 50, dur: 3.1, delay: 1.7, endX: -45 },
  { y: 26, size: 28, dur: 3.6, delay: 1.95, endX: -92 },
];

function Drone({
  y,
  size,
  dur,
  delay,
  endX,
}: (typeof DRONES)[number]) {
  return (
    <svg
      className="drone"
      viewBox="0 0 100 60"
      style={
        {
          "--y": `${y}%`,
          "--size": `${size}px`,
          "--dur": `${dur}s`,
          "--delay": `${delay}s`,
          "--end-x": `${endX}vw`,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <g fill="currentColor">
        <circle cx="14" cy="14" r="9" />
        <circle cx="86" cy="14" r="9" />
        <circle cx="14" cy="46" r="9" />
        <circle cx="86" cy="46" r="9" />
        <rect x="38" y="22" width="24" height="16" rx="2" />
        <path
          d="M22 18 L40 26 M78 18 L60 26 M22 42 L40 34 M78 42 L60 34"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
      </g>
    </svg>
  );
}

export default function Suite() {
  const stageRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // drone fly-in on scroll into view (and respawn after autorun completes)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            stage.classList.add("drones-on");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.25 },
    );
    observerRef.current = io;
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  // reveal-on-scroll for the suite cards
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(
      ".suite .reveal:not(.in)",
    );
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -4% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // click-to-fire feedback on cards
  const onCardClick = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    card.classList.remove("firing");
    void card.offsetWidth;
    card.classList.add("firing");
    window.setTimeout(() => card.classList.remove("firing"), 450);
  };

  return (
    <section className="suite" id="suite">
      <div ref={stageRef} className="suite-drones" aria-hidden="true">
        <div className="suite-skyline">
          <svg viewBox="0 0 1440 220" preserveAspectRatio="none">
            <g fill="#06080b">
              <rect x="0" y="120" width="60" height="100" />
              <rect x="55" y="90" width="40" height="130" />
              <rect x="100" y="140" width="80" height="80" />
              <rect x="180" y="70" width="46" height="150" />
              <rect x="222" y="110" width="64" height="110" />
              <rect x="290" y="50" width="36" height="170" />
              <rect x="326" y="100" width="74" height="120" />
              <rect x="400" y="80" width="50" height="140" />
              <rect x="450" y="120" width="90" height="100" />
              <rect x="540" y="60" width="44" height="160" />
              <rect x="584" y="100" width="80" height="120" />
              <rect x="664" y="40" width="36" height="180" />
              <rect x="700" y="90" width="70" height="130" />
              <rect x="770" y="120" width="64" height="100" />
              <rect x="834" y="70" width="50" height="150" />
              <rect x="884" y="100" width="76" height="120" />
              <rect x="960" y="60" width="44" height="160" />
              <rect x="1004" y="110" width="80" height="110" />
              <rect x="1084" y="80" width="48" height="140" />
              <rect x="1132" y="120" width="72" height="100" />
              <rect x="1204" y="60" width="40" height="160" />
              <rect x="1244" y="110" width="80" height="110" />
              <rect x="1324" y="90" width="50" height="130" />
              <rect x="1374" y="130" width="66" height="90" />
            </g>
            <g fill="#0a0d12">
              <rect x="40" y="160" width="120" height="60" />
              <rect x="240" y="170" width="160" height="50" />
              <rect x="500" y="150" width="220" height="70" />
              <rect x="820" y="160" width="180" height="60" />
              <rect x="1100" y="170" width="240" height="50" />
            </g>
          </svg>
        </div>
        <div className="suite-haze" />

        {DRONES.map((d, i) => (
          <Drone key={i} {...d} />
        ))}

        <div className="suite-intro">
          <div className="suite-top-row">
            <span>Page 03</span>
            <span>May 2026</span>
          </div>
          <div className="suite-headrow">
            <p className="suite-lead">
              Protecting our most valuable infrastructure: from ground to space.
              Autonomous, real-time operations.
            </p>
            <h2 className="suite-title">
              The Arqus
              <br />
              Suite
            </h2>
          </div>
        </div>
      </div>

      <div className="suite-grid">
        <article
          className="suite-card reveal"
          data-d="100"
          onClick={onCardClick}
        >
          <div className="card-art">
            <svg
              viewBox="0 0 200 150"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="infraSky" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#1c2128" />
                  <stop offset="1" stopColor="#080a0d" />
                </linearGradient>
              </defs>
              <rect width="200" height="150" fill="url(#infraSky)" />
              <rect y="115" width="200" height="35" fill="#0a0c0f" />
              <rect x="0" y="100" width="40" height="15" fill="#11141a" />
              <rect x="50" y="105" width="60" height="10" fill="#11141a" />
              <rect x="120" y="98" width="50" height="17" fill="#11141a" />
              <rect x="170" y="108" width="30" height="7" fill="#11141a" />
              <g className="vehicle">
                <rect x="92" y="60" width="6" height="55" fill="#1f242c" />
                <rect x="86" y="58" width="18" height="6" fill="#262b34" />
              </g>
              <line
                className="laser"
                x1="95"
                y1="60"
                x2="160"
                y2="14"
                stroke="#F07427"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle
                className="laser-tip"
                cx="160"
                cy="14"
                r="2.5"
                fill="#F07427"
              />
              <circle
                className="laser-flash"
                cx="160"
                cy="14"
                r="0"
                fill="#ffd6b0"
              />
            </svg>
          </div>
          <h3>Critical Infrastructure</h3>
          <p>Electricity grids, nuclear power plants, airports, harbours.</p>
        </article>

        <article
          className="suite-card reveal"
          data-d="200"
          onClick={onCardClick}
        >
          <div className="card-art">
            <svg
              viewBox="0 0 200 150"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="terrSky" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#1c2128" />
                  <stop offset="1" stopColor="#080a0d" />
                </linearGradient>
              </defs>
              <rect width="200" height="150" fill="url(#terrSky)" />
              <rect y="120" width="200" height="30" fill="#0a0c0f" />
              <g className="vehicle" transform="translate(60,84)">
                <rect
                  x="0"
                  y="20"
                  width="80"
                  height="20"
                  rx="2"
                  fill="#1a1e25"
                />
                <rect x="6" y="14" width="50" height="10" fill="#222731" />
                <rect x="56" y="8" width="14" height="16" fill="#1a1e25" />
                <rect x="60" y="2" width="3" height="10" fill="#262b34" />
                <circle cx="14" cy="42" r="6" fill="#0a0c0f" />
                <circle cx="34" cy="42" r="6" fill="#0a0c0f" />
                <circle cx="62" cy="42" r="6" fill="#0a0c0f" />
              </g>
              <line
                className="laser"
                x1="124"
                y1="88"
                x2="180"
                y2="20"
                stroke="#F07427"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle
                className="laser-tip"
                cx="180"
                cy="20"
                r="2.5"
                fill="#F07427"
              />
              <circle
                className="laser-flash"
                cx="180"
                cy="20"
                r="0"
                fill="#ffd6b0"
              />
            </svg>
          </div>
          <h3>Terrestrial Platforms</h3>
          <p>
            Manned or unmanned vehicles, tanks, UGVs, service vehicles.
          </p>
        </article>

        <article
          className="suite-card reveal"
          data-d="300"
          onClick={onCardClick}
        >
          <div className="card-art">
            <svg
              viewBox="0 0 200 150"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="seaSky" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#1c2128" />
                  <stop offset="1" stopColor="#080a0d" />
                </linearGradient>
              </defs>
              <rect width="200" height="150" fill="url(#seaSky)" />
              <rect y="100" width="200" height="50" fill="#0c1014" />
              <g stroke="#161b21" strokeWidth="0.6">
                <line x1="0" y1="112" x2="200" y2="112" />
                <line x1="0" y1="124" x2="200" y2="124" />
                <line x1="0" y1="136" x2="200" y2="136" />
              </g>
              <g className="vehicle" transform="translate(50,76)">
                <path d="M0 22 L100 22 L92 32 L8 32 Z" fill="#1a1e25" />
                <rect x="22" y="10" width="50" height="12" fill="#222731" />
                <rect x="36" y="2" width="22" height="10" fill="#1a1e25" />
                <rect x="42" y="-4" width="3" height="8" fill="#262b34" />
              </g>
              <line
                className="laser"
                x1="100"
                y1="76"
                x2="172"
                y2="14"
                stroke="#F07427"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle
                className="laser-tip"
                cx="172"
                cy="14"
                r="2.5"
                fill="#F07427"
              />
              <circle
                className="laser-flash"
                cx="172"
                cy="14"
                r="0"
                fill="#ffd6b0"
              />
            </svg>
          </div>
          <h3>Seaborn Platforms</h3>
          <p>Ships, sea drones, oil platforms, and critical waterways.</p>
        </article>

        <article
          className="suite-card reveal"
          data-d="400"
          onClick={onCardClick}
        >
          <div className="card-art">
            <svg
              viewBox="0 0 200 150"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="space" cx="50%" cy="50%" r="70%">
                  <stop offset="0" stopColor="#0a1530" />
                  <stop offset="1" stopColor="#02040a" />
                </radialGradient>
              </defs>
              <rect width="200" height="150" fill="url(#space)" />
              <g fill="#fff" opacity="0.55">
                <circle cx="20" cy="22" r="0.8" />
                <circle cx="55" cy="14" r="0.6" />
                <circle cx="120" cy="28" r="0.8" />
                <circle cx="160" cy="40" r="0.6" />
                <circle cx="180" cy="20" r="0.7" />
                <circle cx="38" cy="60" r="0.5" />
                <circle cx="92" cy="48" r="0.7" />
              </g>
              <path
                d="M -40 200 A 240 240 0 0 1 240 200 Z"
                fill="#0e1620"
                stroke="#1b2838"
                strokeWidth="0.8"
              />
              <g
                className="vehicle"
                transform="translate(118,58) rotate(15)"
              >
                <rect
                  x="-6"
                  y="-8"
                  width="12"
                  height="16"
                  fill="#1a1e25"
                  stroke="#2a2f38"
                  strokeWidth="0.6"
                />
                <rect
                  x="-22"
                  y="-4"
                  width="14"
                  height="8"
                  fill="#0e1530"
                  stroke="#1a2540"
                />
                <rect
                  x="8"
                  y="-4"
                  width="14"
                  height="8"
                  fill="#0e1530"
                  stroke="#1a2540"
                />
              </g>
              <line
                className="laser"
                x1="124"
                y1="62"
                x2="44"
                y2="20"
                stroke="#F07427"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle
                className="laser-tip"
                cx="44"
                cy="20"
                r="2.5"
                fill="#F07427"
              />
              <circle
                className="laser-flash"
                cx="44"
                cy="20"
                r="0"
                fill="#ffd6b0"
              />
            </svg>
          </div>
          <h3>Space Defence</h3>
          <p>
            Dazzle hostile satellites, safeguard constellations, divert threats.
          </p>
        </article>
      </div>

      <div className="suite-foot-meta">
        <span>EUDIS Business Accelerator</span>
        <span>Arqus</span>
      </div>
    </section>
  );
}

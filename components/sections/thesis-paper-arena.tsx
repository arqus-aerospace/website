"use client";

import { useEffect, useRef, useState } from "react";

type Drone = {
  el: HTMLDivElement;
  w: number;
  h: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dead: boolean;
};

const DRONE_SVG =
  '<svg viewBox="0 0 100 60" aria-hidden="true">' +
  '<g fill="currentColor">' +
  '<circle cx="14" cy="14" r="9"/>' +
  '<circle cx="86" cy="14" r="9"/>' +
  '<circle cx="14" cy="46" r="9"/>' +
  '<circle cx="86" cy="46" r="9"/>' +
  '<rect x="38" y="22" width="24" height="16" rx="2"/>' +
  '<path d="M22 18 L40 26 M78 18 L60 26 M22 42 L40 34 M78 42 L60 34" stroke="currentColor" stroke-width="3" fill="none"/>' +
  "</g></svg>";

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function ThesisPaperArena() {
  const arenaRef = useRef<HTMLDivElement>(null);
  const towerRef = useRef<HTMLDivElement>(null);
  const turretRef = useRef<SVGGElement>(null);
  const dronesRef = useRef<Drone[]>([]);
  const modeRef = useRef<"manual" | "auto">("manual");
  const autoTimerRef = useRef<number | null>(null);

  const [score, setScore] = useState(0);
  const [mode, setMode] = useState<"manual" | "auto">("manual");

  // keep ref in sync so RAF + handlers see the latest mode without re-binding
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const arena = arenaRef.current;
    const tower = towerRef.current;
    const turret = turretRef.current;
    if (!arena || !tower || !turret) return;

    function arenaSize() {
      const r = arena!.getBoundingClientRect();
      return { w: r.width, h: r.height, top: 6, bottom: r.height * 0.72 };
    }

    function paintDrone(dr: Drone) {
      dr.el.style.transform = `translate(${dr.x}px, ${dr.y}px)`;
    }

    function spawnDrone(): Drone {
      const el = document.createElement("div");
      el.className = "arena-drone";
      el.innerHTML = DRONE_SVG;
      const w = rand(16, 30);
      el.style.setProperty("--w", w + "px");
      const { w: aw, top, bottom } = arenaSize();
      const dr: Drone = {
        el,
        w,
        h: w * 0.6,
        x: rand(10, Math.max(20, aw - w - 10)),
        y: rand(top + 10, Math.max(top + 20, bottom * 0.7)),
        vx: (Math.random() < 0.5 ? -1 : 1) * rand(20, 55),
        vy: (Math.random() < 0.5 ? -1 : 1) * rand(10, 28),
        dead: false,
      };
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        destroyDrone(dr);
      });
      arena!.appendChild(el);
      paintDrone(dr);
      dronesRef.current.push(dr);
      return dr;
    }

    function destroyDrone(dr: Drone) {
      if (dr.dead) return;
      dr.dead = true;
      dr.vx = 0;
      dr.vy = 0;

      const arenaRect = arena!.getBoundingClientRect();
      const towerRect = tower!.getBoundingClientRect();
      const ox = towerRect.left + towerRect.width / 2 - arenaRect.left;
      const oy = towerRect.top + towerRect.height * 0.42 - arenaRect.top;
      const tx = dr.x + dr.w / 2;
      const ty = dr.y + dr.h / 2;

      const dx = tx - ox;
      const dy = ty - oy;
      const dist = Math.hypot(dx, dy);
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

      turret!.style.transform = `rotate(${angleDeg + 90}deg)`;

      const laser = document.createElement("div");
      laser.className = "arena-laser fire";
      laser.style.left = ox + "px";
      laser.style.top = oy + "px";
      laser.style.width = dist + "px";
      laser.style.transform = `rotate(${angleDeg}deg)`;
      arena!.appendChild(laser);
      laser.addEventListener("animationend", () => laser.remove());

      const flash = document.createElement("div");
      flash.className = "arena-flash pop";
      flash.style.left = tx + "px";
      flash.style.top = ty + "px";
      arena!.appendChild(flash);
      flash.addEventListener("animationend", () => flash.remove());

      window.setTimeout(() => {
        dr.el.classList.add("destroyed");
        setScore((s) => s + 1);
        window.setTimeout(() => {
          const i = dronesRef.current.indexOf(dr);
          if (i !== -1) dronesRef.current.splice(i, 1);
          dr.el.remove();
          spawnDrone();
        }, 700);
      }, 120);
    }

    // initial swarm
    for (let i = 0; i < 26; i++) spawnDrone();

    // RAF physics
    let lastT = performance.now();
    let rafId = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const { w: aw, top, bottom } = arenaSize();
      for (const dr of dronesRef.current) {
        if (dr.dead) continue;
        dr.x += dr.vx * dt;
        dr.y += dr.vy * dt;
        if (dr.x <= 0) {
          dr.x = 0;
          dr.vx = Math.abs(dr.vx);
        }
        if (dr.x + dr.w >= aw) {
          dr.x = aw - dr.w;
          dr.vx = -Math.abs(dr.vx);
        }
        if (dr.y <= top) {
          dr.y = top;
          dr.vy = Math.abs(dr.vy);
        }
        if (dr.y >= bottom) {
          dr.y = bottom;
          dr.vy = -Math.abs(dr.vy);
        }
        paintDrone(dr);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // turret tracks the cursor in manual mode
    const onMove = (e: MouseEvent) => {
      if (modeRef.current !== "manual") return;
      const ar = arena!.getBoundingClientRect();
      const tr = tower!.getBoundingClientRect();
      const ox = tr.left + tr.width / 2 - ar.left;
      const oy = tr.top + tr.height * 0.42 - ar.top;
      const tx = e.clientX - ar.left;
      const ty = e.clientY - ar.top;
      const angleDeg = (Math.atan2(ty - oy, tx - ox) * 180) / Math.PI;
      turret!.style.transform = `rotate(${angleDeg + 90}deg)`;
    };
    arena.addEventListener("mousemove", onMove);

    // expose destroyDrone for the mode-toggle effect via a custom event
    const onAutoFire = () => {
      const alive = dronesRef.current.filter((d) => !d.dead);
      if (!alive.length) return;
      destroyDrone(alive[Math.floor(Math.random() * alive.length)]);
    };
    arena.addEventListener("arena-auto-fire", onAutoFire);

    return () => {
      cancelAnimationFrame(rafId);
      arena.removeEventListener("mousemove", onMove);
      arena.removeEventListener("arena-auto-fire", onAutoFire);
      for (const dr of dronesRef.current) dr.el.remove();
      dronesRef.current = [];
    };
  }, []);

  // Mode toggle: start/stop autonomous interval
  useEffect(() => {
    const arena = arenaRef.current;
    if (!arena) return;
    if (autoTimerRef.current) {
      window.clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    arena.classList.toggle("auto-mode", mode === "auto");
    if (mode === "auto") {
      arena.dispatchEvent(new Event("arena-auto-fire"));
      autoTimerRef.current = window.setInterval(() => {
        arena.dispatchEvent(new Event("arena-auto-fire"));
      }, 600);
    }
    return () => {
      if (autoTimerRef.current) {
        window.clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [mode]);

  return (
    <section className="s thesis" id="thesis">
      <div className="thesis-layout">
        <article className="thesis-paper reveal" data-d="100">
          <h3>Our Thesis</h3>
          <p>
            Two hundred years ago, whoever controlled the seas controlled trade,
            power, and the future. Fifty years ago, the same was true of
            airspace. The US spent roughly <em>$2 trillion</em> on air dominance
            because the alternative was losing.
          </p>
          <p>
            Today, that high ground is moving to <em>orbit</em>, and almost
            nobody has noticed. The same physics now apply on the ground: cheap
            robotic swarms across air, sea, and land can saturate any defense
            built around expensive missiles.
          </p>
          <p>
            Europe needs dominance in this final frontier. We are building the{" "}
            <em>space arsenal</em>: autonomous, directed-energy defense priced
            per intercept in cents, not millions.
          </p>
        </article>

        <div
          ref={arenaRef}
          className="thesis-arena"
          aria-label="Click drones to destroy them with the Arqus laser tower"
        >
          <div className="arena-stars" />
          <div className="arena-ground" />

          <div className="arena-hud">
            <span />
            <span className="score">
              Intercepts: <span>{score}</span>
            </span>
          </div>

          <div
            className="arena-modes"
            role="group"
            aria-label="Engagement mode"
          >
            <button
              className={`arena-mode${mode === "manual" ? " is-active" : ""}`}
              onClick={() => setMode("manual")}
              type="button"
            >
              Manual
            </button>
            <button
              className={`arena-mode${mode === "auto" ? " is-active" : ""}`}
              onClick={() => setMode("auto")}
              type="button"
            >
              Autonomous
            </button>
          </div>

          <div ref={towerRef} className="arena-tower">
            <svg viewBox="0 0 80 160" preserveAspectRatio="xMidYEnd meet">
              <rect x="22" y="140" width="36" height="14" fill="#1a1e25" />
              <rect x="14" y="152" width="52" height="6" fill="#0e1117" />
              <rect x="36" y="70" width="8" height="80" fill="#1a1e25" />
              <rect x="30" y="130" width="20" height="8" fill="#262b34" />
              <g ref={turretRef} className="turret">
                <rect
                  x="22"
                  y="56"
                  width="36"
                  height="22"
                  rx="3"
                  fill="#22272f"
                  stroke="#3a4150"
                  strokeWidth="0.8"
                />
                <rect x="24" y="60" width="32" height="6" fill="#0f1218" />
                <rect x="36" y="38" width="8" height="22" fill="#2a303a" />
                <rect
                  x="34"
                  y="34"
                  width="12"
                  height="6"
                  rx="1.5"
                  fill="#3a4150"
                />
                <circle cx="40" cy="34" r="2.4" fill="#F07427" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

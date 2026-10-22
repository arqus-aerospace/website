"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEPLOY_FROM, DEPLOY_SHARE, OrbitTheatre, SHIELD_SIZE } from "@/components/ui/orbit-theatre";
import { SCENES } from "@/lib/orbits/scenes";
import { useStepScroll } from "@/components/use-step-scroll";
import Backers from "@/components/backers";
import DockingLogo from "@/components/docking-logo";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const LOGO = `${BASE}/assets/arqus-wordmark-white-cropped.png`;
const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

/**
 * The top of the page: one 3D stage pinned to the screen while four panels,
 * a screen each, scroll over it. Each scroll gesture moves exactly one step
 * (see useStepScroll), so there is nothing in between.
 *
 *   1  the statement, over a wide shot of the Earth;
 *   2  the threats: the camera flies to the first, the arrows (or arrow keys)
 *      step through the rest;
 *   3  the close-up: the camera closes in on one of our craft round the
 *      current target, until the dot is a spacecraft;
 *   4  the shield: back out, very far, while our constellation lights up
 *      around the whole Earth.
 *
 * Landing on 3 or 4 plays its move; leaving plays it back. Past them the
 * stage lets go.
 *
 * `stealth` keeps only panel 1: no steps, no cue, the stage never moves on.
 */
export default function Hero({ stealth = false }: { stealth?: boolean }) {
  const [idx, setIdx] = useState(0);
  const [inThreats, setInThreats] = useState(false);
  const [keysOn, setKeysOn] = useState(false);
  const threatsRef = useRef<HTMLElement | null>(null);
  const yearRef = useRef<HTMLSpanElement | null>(null);
  const monthRef = useRef<HTMLSpanElement | null>(null);
  const countRef = useRef<HTMLSpanElement | null>(null);
  const drive = useRef<{ zoom: number; shield: number; year?: number; count?: number }>({ zoom: 0, shield: 0 });
  // four steps on the stage, and a fifth to land on whatever follows it
  useStepScroll(stealth ? 0 : 4);
  const sc = SCENES[idx];

  // Which step we are on, from the scroll: the page snaps a screen at a
  // time, so the nearest whole screen is the step. 0 statement, 1 threats,
  // 2 close-up, 3 shield; beyond that the stage has let go.
  useEffect(() => {
    if (stealth) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const step = Math.round(window.scrollY / window.innerHeight);
      setInThreats(step >= 1);
      setKeysOn(step === 1);
      drive.current.zoom = step >= 2 ? 1 : 0;
      drive.current.shield = step >= 3 ? 1 : 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [stealth]);

  // the year and the count follow the rollout as the theatre plays it
  useEffect(() => {
    let raf = 0;
    let shownYear = -1;
    let shownMonth = -1;
    let shownCount = -1;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const at = drive.current.year ?? DEPLOY_FROM;
      const year = Math.floor(at);
      const month = Math.min(11, Math.floor((at - year) * 12));
      const count = drive.current.count ?? 0;
      if (year !== shownYear && yearRef.current) {
        shownYear = year;
        yearRef.current.textContent = String(year);
      }
      if (month !== shownMonth && monthRef.current) {
        shownMonth = month;
        monthRef.current.textContent = MONTHS[month];
      }
      if (count !== shownCount && countRef.current) {
        shownCount = count;
        countRef.current.textContent = pad(count, 3);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ?track=N opens on that threat
  useEffect(() => {
    if (stealth) return;
    const asked = Number(new URLSearchParams(window.location.search).get("track"));
    if (asked >= 1 && asked <= SCENES.length) {
      setIdx(asked - 1);
      threatsRef.current?.scrollIntoView();
    }
  }, [stealth]);

  const go = useCallback((d: number) => {
    setIdx((i) => (i + d + SCENES.length) % SCENES.length);
  }, []);

  // arrow keys, while the threats panel is the one on screen
  useEffect(() => {
    if (!keysOn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keysOn, go]);

  return (
    <div className="arq-stagewrap" id="top">
      <div className="arq-hero arq-stage">
        <div className="arq-hero__frame">
          <OrbitTheatre
            className="absolute inset-0"
            textureBase={`${BASE}/assets/earth`}
            stage={inThreats ? idx : -1}
            drive={drive}
          />
          <div className="arq-hero__veil" aria-hidden="true" />
        </div>
      </div>

      {/* 1 — the statement */}
      <section className="arq-panel" aria-label="Arqus Aerospace">
        <div className="arq-hero__bottom arq-hero__copy">
          <DockingLogo src={LOGO} dock={!stealth} />
          <h1 className="arq-hero__slogan">
            <WordsPullUp text="Europe's guardian" baseDelay={0.35} />
            <br />
            <span className="arq-pull__mask">
              <span
                className="arq-pull__word arq-hero__title-italic"
                style={{ animationDelay: "0.55s" }}
              >
                in orbit.
              </span>
            </span>
          </h1>
          {stealth ? null : (
            <p className="arq-hero__statement">
              Space is no longer a safe haven. Satellites now shadow, stalk and grapple one another in
              orbit. Arqus gives Europe the eyes to see it first, so it can be met calmly and early,
              before anything escalates. (Placeholder.)
            </p>
          )}
        </div>
        <Backers />
        {stealth ? null : (
          <span className="arq-hero__cue" aria-hidden="true">
            Scroll
          </span>
        )}
      </section>

      {stealth ? null : (
        <>
          {/* 2 — the threats, one scenario at a time */}
          <section id="threats" ref={threatsRef} className="arq-panel arq-threats" aria-label="Threats">
            <div className="arq-hero__bottom arq-hero__copy">
              <span className="arq-threats__kicker">
                The threat · {pad(idx + 1)} / {pad(SCENES.length)}
              </span>
              <div key={idx} className="arq-threats__body" aria-live="polite">
                <h2 className="arq-threats__title">{sc.trend}</h2>
                <p className="arq-threats__story">{sc.story}</p>
              </div>
              <div className="arq-threats__controls">
                <button type="button" className="arq-threats__arrow" onClick={() => go(-1)} aria-label="Previous threat">
                  ←
                </button>
                <ol className="arq-threats__ticks">
                  {SCENES.map((s, i) => (
                    <li key={s.name}>
                      <button
                        type="button"
                        aria-label={`${s.trend}: ${s.name}`}
                        aria-current={i === idx ? "true" : undefined}
                        onClick={() => setIdx(i)}
                        style={{ "--tick": s.color } as React.CSSProperties}
                      />
                    </li>
                  ))}
                </ol>
                <button type="button" className="arq-threats__arrow" onClick={() => go(1)} aria-label="Next threat">
                  →
                </button>
              </div>
              <p className="arq-threats__note">Placeholder copy · threat readings are illustrative</p>
            </div>
          </section>

          {/* 3 — the close-up on one of ours */}
          <section id="sentinel" className="arq-panel" aria-label="Our spacecraft">
            <div className="arq-hero__bottom arq-hero__copy">
              <span className="arq-threats__kicker">Arqus · Sentinel</span>
              <h2 className="arq-threats__title">Up close.</h2>
              <p className="arq-threats__story">
                Placeholder. Every light you saw circling the target is one of ours: a sentinel that
                holds station beside what it watches, sees what it does, and tells you before it
                matters.
              </p>
              <p className="arq-threats__note">Stand-in model · our spacecraft is not shown</p>
            </div>
          </section>

          {/* 4 — the shield */}
          <section id="shield" className="arq-panel" aria-label="The constellation">
            {/* the rollout clock, top right, where the card sits for the threats */}
            <div className="arq-shield__clock" aria-hidden="true">
              <span className="arq-shield__kicker">
                Deployment · {DEPLOY_FROM}–{DEPLOY_FROM + DEPLOY_SHARE.length - 1}
              </span>
              <span className="arq-shield__date">
                <span ref={monthRef} className="arq-shield__month">Jan</span>
                <span ref={yearRef} className="arq-shield__year">{DEPLOY_FROM}</span>
              </span>
              <span className="arq-shield__count">
                <span ref={countRef}>000</span> / {SHIELD_SIZE} in orbit
              </span>
            </div>
            <div className="arq-hero__bottom arq-hero__copy">
              <span className="arq-threats__kicker">The constellation</span>
              <h2 className="arq-threats__title">
                A shield, <br />
                not a satellite.
              </h2>
              <p className="arq-threats__story">
                Placeholder. One sentinel watches one target. A constellation of them, in every
                orbit from low Earth to geostationary, watches all of it, all of the time.
              </p>
              <p className="arq-threats__note">Placeholder copy · rollout and constellation are illustrative</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

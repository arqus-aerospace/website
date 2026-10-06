"use client";

import { useEffect, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BriefingModal from "@/components/briefing-modal";
import SmoothScroll from "./smooth-scroll";
import Frame from "./frame";
import { Arsenal, Domains, Explorer, Footer, Intro, Landing, Regimes, Shells, Story } from "./sections";
import { setUi, useUi, type UiState } from "./store";

const Scene = dynamic(() => import("./scene"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

function useGlobalTriggers() {
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      document.querySelectorAll<HTMLElement>("[data-frame]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 24px",
          end: "bottom 24px",
          onToggle: (s) => s.isActive && setUi({ frame: el.dataset.frame as UiState["frame"] }),
        });
      });
      document.querySelectorAll<HTMLElement>("[data-nav]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (s) => s.isActive && setUi({ nav: el.dataset.nav ?? "" }),
        });
      });
      const live = new Set<Element>();
      document.querySelectorAll<HTMLElement>("[data-canvas]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          onToggle: (s) => {
            if (s.isActive) live.add(el);
            else live.delete(el);
            setUi({ canvasVisible: live.size > 0 });
          },
        });
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);
}

export default function Experience() {
  const briefing = useUi((s) => s.briefing);
  const menu = useUi((s) => s.menu);
  useGlobalTriggers();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUi({ menu: false, briefing: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={`st-root ${menu ? "is-menu" : ""}`}>
      <SmoothScroll />
      <Scene />
      <Frame />
      <main className="st-main">
        <Landing />
        <Intro />
        <Story />
        <Regimes />
        <Shells />
        <Explorer />
        <Domains />
        <Arsenal />
      </main>
      <Footer />
      <div className="st-portrait">
        <p>Rotate your device to portrait for the full experience.</p>
      </div>
      {briefing && <BriefingModal onClose={() => setUi({ briefing: false })} />}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/hero";
import BriefingModal from "@/components/briefing-modal";
import ThesisPaperArena from "@/components/sections/thesis-paper-arena";
import Suite from "@/components/sections/suite";
import Domains from "@/components/sections/domains";
import Careers from "@/components/sections/careers";
import Partners from "@/components/sections/partners";
import CtaFooter from "@/components/sections/cta-footer";

export default function Home() {
  const [modal, setModal] = useState(false);

  // Global reveal-on-scroll observer for .reveal elements across all sections
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal:not(.in)");
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
    // Fallback: anything already in view at mount
    requestAnimationFrame(() => {
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
      });
    });
    return () => io.disconnect();
  }, []);

  return (
    <main>
      <Hero onBriefing={() => setModal(true)} />
      <ThesisPaperArena />
      <Suite />
      <Domains />
      <Partners />
      <Careers />
      <CtaFooter />
      {modal && <BriefingModal onClose={() => setModal(false)} />}
    </main>
  );
}

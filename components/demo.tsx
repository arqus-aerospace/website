"use client";

import { useState } from "react";
import Hero from "@/components/ui/animated-shader-hero";
import WhitepaperModal from "@/components/ui/whitepaper-modal";
import HiringModal from "@/components/ui/hiring-modal";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const HeroDemo: React.FC = () => {
  const [whitepaperOpen, setWhitepaperOpen] = useState(false);
  const [hiringOpen, setHiringOpen] = useState(false);

  return (
    <>
      <Hero
        nav={{
          logo: "Arqus Aerospace",
          logoSrc: `${BASE}/logo/top_left_logo_and_comapny_name.png`,
          ctaText: "We're Hiring",
          onCtaClick: () => setHiringOpen(true),
        }}
        trustBadge={{
          text: "Scalable Air and Space Defence for the Western Warfighting Domain"
        }}
        headline={{
          line1: "The next conflict",
          line2: "begins overhead."
        }}
        subtitle=""
        button={{
          text: "Request a Briefing",
          onClick: () => { window.open("https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ15tGIByLIjJQvaJTQ8l5uMUn7D4lfSh2552_4GjIYMZJzJICFthQB0coAckWtaOGm48eX4OGLa", "_blank"); }
        }}
        secondButton={{
          text: "Request our Whitepaper",
          onClick: () => setWhitepaperOpen(true)
        }}
        scrollIndicator={false}
        backedBy={{
          text: "Backed by",
          logos: [
            {
              src: `${BASE}/logo/tum_venture_labs_logo.png`,
              alt: "TUM Venture Labs",
              height: 67,
              href: "https://www.tum-venture-labs.de/",
            },
            {
              src: `${BASE}/logo/esa_logo.png`,
              alt: "ESA BIC Bavaria",
              height: 77,
              href: "https://esa.int",
            },
          ]
        }}
      />
      <WhitepaperModal isOpen={whitepaperOpen} onClose={() => setWhitepaperOpen(false)} />
      <HiringModal isOpen={hiringOpen} onClose={() => setHiringOpen(false)} />
    </>
  );
};

export default HeroDemo;

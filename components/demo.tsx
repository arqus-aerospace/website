"use client";

import { useState } from "react";
import Hero from "@/components/ui/animated-shader-hero";
import WhitepaperModal from "@/components/ui/whitepaper-modal";

const HeroDemo: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Hero
        nav={{
          logo: "Arqus Aerospace",
          logoSrc: "/logo/top_left_logo_and_comapny_name.png",
          ctaText: "We're Hiring",
          onCtaClick: () => { window.open("mailto:marnix@arqusaerospace.com"); }
        }}
        trustBadge={{
          text: "Non-kinetic · Rapid-deployable · Air & Space Defence · Munich, Germany · Sovereign European Warfighting Domain"
        }}
        headline={{
          line1: "The next conflict",
          line2: "begins overhead."
        }}
        subtitle="Critical infrastructure is moving to orbit faster than defense can follow. Arqus closes that gap."
        button={{
          text: "Request a Briefing",
          onClick: () => { window.open("mailto:marnix@arqusaerospace.com"); }
        }}
        secondButton={{
          text: "Request our Whitepaper",
          onClick: () => setModalOpen(true)
        }}
        scrollIndicator={false}
        backedBy={{
          text: "Backed by",
          logos: [
            { src: "/logo/tum_venture_labs_logo.png", alt: "TUM Venture Labs", height: 67 },
            { src: "/logo/esa_logo.png", alt: "ESA", height: 77 },
          ]
        }}
      />
      <WhitepaperModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default HeroDemo;

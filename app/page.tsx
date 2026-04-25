"use client";

import { useState } from "react";
import Hero from "@/components/hero";
import BriefingModal from "@/components/briefing-modal";

export default function Home() {
  const [modal, setModal] = useState(false);

  return (
    <main>
      <Hero onBriefing={() => setModal(true)} />
      {modal && <BriefingModal onClose={() => setModal(false)} />}
    </main>
  );
}

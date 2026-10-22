"use client";

import HalftoneWordmarkFooter, { type FooterColumn } from "@/components/ui/halftone-wordmark-footer";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// The address and phone number are placeholders until the real ones are in.
const COLUMNS: FooterColumn[] = [
  {
    title: "Company",
    links: [
      { label: "Thesis", href: `${BASE}/thesis` },
      { label: "Study", href: `${BASE}/study` },
      { label: "Careers", href: "mailto:contact@arqusaerospace.com?subject=Careers" },
    ],
  },
  {
    title: "Office",
    links: [
      { label: "Arqus Aerospace GmbH" },
      { label: "Musterstraße 1" },
      { label: "80331 Munich, Germany" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "contact@arqusaerospace.com", href: "mailto:contact@arqusaerospace.com" },
      { label: "+49 89 0000 0000", href: "tel:+498900000000" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <HalftoneWordmarkFooter
      wordmark="Arqus"
      wordmarkSrc={`${BASE}/assets/arqus-wordmark-white-cropped.png`}
      label="Arqus Aerospace"
      meta="©2026 · Munich"
      columns={COLUMNS}
      palette={{ background: "#000000", ink: "#E1E0CC", warm: "#F07427" }}
      monoFamily="var(--font-sans)"
      crop={0.14}
      grain={0.8}
      height="clamp(440px, 52vw, 720px)"
      satellites={3}
    />
  );
}

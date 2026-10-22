"use client";

import DitherSweepNavbar from "@/components/ui/dither-sweep-navbar";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// The bar over the stealth pages: the wordmark, the open roles (a page of
// their own, out of search) and Contact, which runs down to the footer.
export default function StealthNav() {
  return (
    <DitherSweepNavbar
      className="arq-dsn"
      brand="Arqus Aerospace"
      logoHref={`${BASE}/`}
      // eslint-disable-next-line @next/next/no-img-element
      logo={<img src={`${BASE}/assets/arqus-wordmark-white-cropped.png`} alt="" />}
      items={[{ label: "Open roles", href: `${BASE}/roles` }]}
      cta={{ label: "Contact", href: "#contact" }}
      ink="#E1E0CC"
      paper="#000000"
      rule="rgba(225,224,204,0.18)"
      accent="#F07427"
    />
  );
}

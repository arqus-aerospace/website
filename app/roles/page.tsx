import type { Metadata } from "next";
import StealthNav from "@/components/stealth-nav";
import { Opportunities } from "@/components/info-sections";
import SiteFooter from "@/components/site-footer";

// The open roles on their own, for the stealth site's nav. Kept out of search.
export const metadata: Metadata = {
  title: "Open roles",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
};

export default function Roles() {
  return (
    <main className="arq-roles">
      <StealthNav />
      <Opportunities />
      <SiteFooter stealth />
      {/* film grain over the whole page */}
      <div className="arq-grain" aria-hidden="true" />
    </main>
  );
}

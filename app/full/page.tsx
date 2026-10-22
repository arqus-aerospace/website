import type { Metadata } from "next";
import Hero from "@/components/hero";
import SiteNav from "@/components/site-nav";
import { News, Opportunities } from "@/components/info-sections";
import SiteFooter from "@/components/site-footer";

// The whole site, kept off the stealth front page. Reached only through the
// hidden dot in its footer, and kept out of search.
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
};

export default function Full() {
  return (
    <main>
      <SiteNav />
      <Hero />
      <Opportunities />
      <News />
      <SiteFooter />
      {/* film grain over the whole page */}
      <div className="arq-grain" aria-hidden="true" />
    </main>
  );
}

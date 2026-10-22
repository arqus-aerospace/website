import Hero from "@/components/hero";
import SiteNav from "@/components/site-nav";
import { News, Opportunities } from "@/components/info-sections";
import SiteFooter from "@/components/site-footer";

export default function Home() {
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

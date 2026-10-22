import Hero from "@/components/hero";
import SiteFooter from "@/components/site-footer";

// Stealth: only the opening screen and a bare footer. The full site lives at
// /full, behind the hidden dot in the footer's bottom-right corner.
export default function Home() {
  return (
    <main>
      <Hero stealth />
      <SiteFooter stealth />
      {/* film grain over the whole page */}
      <div className="arq-grain" aria-hidden="true" />
    </main>
  );
}

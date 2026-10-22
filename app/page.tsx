import Hero from "@/components/hero";
import StealthNav from "@/components/stealth-nav";
import SiteFooter from "@/components/site-footer";

// Stealth: only the opening screen, the bar (open roles, contact) and a bare
// footer. The full site lives at /full, behind the hidden dot in the footer's
// bottom-right corner.
export default function Home() {
  return (
    <main>
      <StealthNav />
      <Hero stealth />
      <SiteFooter stealth />
      {/* film grain over the whole page */}
      <div className="arq-grain" aria-hidden="true" />
    </main>
  );
}

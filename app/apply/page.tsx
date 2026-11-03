import type { Metadata } from "next";
import Link from "next/link";
import StealthNav from "@/components/stealth-nav";
import SiteFooter from "@/components/site-footer";
import ApplyForm from "@/components/apply-form";

// For the people the postings do not cover. The same form the postings use,
// with the CRM's catch-all discipline sent quietly: nobody is asked to file
// themselves under a heading, they say what they are after in their answers.
export const metadata: Metadata = {
  title: "Unsolicited application",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
};

export default function Apply() {
  return (
    <main className="arq-roles">
      <StealthNav />
      <section className="arq-section" aria-labelledby="apply-title">
        <div className="arq-section__head">
          <span className="arq-section__kicker">Opportunities</span>
          <h1 className="arq-section__title" id="apply-title">
            Unsolicited <em>application.</em>
          </h1>
        </div>
        <p className="arq-section__lede">
          We hire ahead of what we post. If the mission is yours but none of the{" "}
          <Link href="/roles">open roles</Link> is, write to us anyway. Tell us which part of the system pulls at
          you — optics, structures, avionics, thermal, software — and what you have already built and
          made work. Send your CV and anything that shows it: photos, code, drawings, a thesis. We read every
          application ourselves.
        </p>
        {/* The postings spell this out in their details; an unsolicited
            application has no details to read, so it is said here. */}
        <p className="arq-section__require">
          <u>You must have NATO member state citizenship.</u>
        </p>
        <ApplyForm email="contact@arqusaerospace.com" area="Something else" />
      </section>
      <SiteFooter stealth />
      {/* film grain over the whole page */}
      <div className="arq-grain" aria-hidden="true" />
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StealthNav from "@/components/stealth-nav";
import SiteFooter from "@/components/site-footer";
import JobDescription from "@/components/job-description";
import { postedRole, postedRoles, roleTitle } from "@/lib/roles/roles";

type Params = { params: Promise<{ slug: string }> };

// The site is a static export, so every posting is written out at build time
// and nothing else is reachable. Roles that apply elsewhere have no slug and
// so get no page here.
export const dynamicParams = false;

export function generateStaticParams() {
  return postedRoles().map((role) => ({ slug: role.slug }));
}

/** Kept out of search, like the roles page it hangs off. */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const role = postedRole(slug);
  return {
    title: role ? roleTitle(role) : "Open roles",
    description: role?.description.subtitle,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    alternates: { canonical: null },
  };
}

export default async function RolePage({ params }: Params) {
  const { slug } = await params;
  const role = postedRole(slug);
  if (!role) notFound();

  return (
    <main className="arq-jd">
      <StealthNav />
      <JobDescription role={role} />
      <SiteFooter stealth />
      {/* film grain over the whole page */}
      <div className="arq-grain" aria-hidden="true" />
    </main>
  );
}

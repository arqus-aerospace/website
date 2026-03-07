import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 pb-6 pt-16 lg:pb-8 lg:pt-24">
      <div className="px-4 lg:px-8">
        <div className="md:flex md:items-start md:justify-between">
          <Link href="/" className="flex items-center gap-x-2" aria-label="Arqus Aerospace">
            <Image
              src={`${BASE}/logo/top_left_logo_and_comapny_name.png`}
              alt="Arqus Aerospace"
              height={40}
              width={200}
              className="h-10 w-auto object-contain"
            />
          </Link>
          <ul className="flex list-none mt-6 md:mt-0 space-x-3">
            <li>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white border-0"
                asChild
              >
                <a href="mailto:contact@arqusaerospace.com" aria-label="Email">
                  <Mail className="h-5 w-5" />
                </a>
              </Button>
            </li>
          </ul>
        </div>

        <div className="border-t border-white/10 mt-6 pt-6 md:mt-4 md:pt-8 lg:grid lg:grid-cols-10">
          <nav className="lg:mt-0 lg:col-[4/11]">
            <ul className="list-none flex flex-wrap -my-1 -mx-2 lg:justify-end">
              {[
                { href: "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ15tGIByLIjJQvaJTQ8l5uMUn7D4lfSh2552_4GjIYMZJzJICFthQB0coAckWtaOGm48eX4OGLa", label: "Request a Briefing" },
                { href: "mailto:contact@arqusaerospace.com", label: "Contact" },
              ].map((link, i) => (
                <li key={i} className="my-1 mx-2 shrink-0">
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-sm text-white/70 underline-offset-4 hover:underline hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-6 lg:mt-0 lg:col-[4/11]">
            <ul className="list-none flex flex-wrap -my-1 -mx-3 lg:justify-end">
              {[
                { href: "mailto:contact@arqusaerospace.com", label: "Privacy" },
                { href: "mailto:contact@arqusaerospace.com", label: "Legal Notice" },
              ].map((link, i) => (
                <li key={i} className="my-1 mx-3 shrink-0">
                  <a
                    href={link.href}
                    className="text-sm text-white/40 underline-offset-4 hover:underline hover:text-white/70 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 text-sm leading-6 text-white/40 whitespace-nowrap lg:mt-0 lg:row-[1/3] lg:col-[1/4]">
            <div>© {new Date().getFullYear()} Arqus Aerospace</div>
            <div>Maria-Merian-Straße · 85521 Ottobrunn, Germany</div>
            <div className="mt-2 flex items-center gap-2">
              <img src={`${BASE}/flags/illustration-german-flag_53876-27101.avif`} alt="Germany" title="Germany" className="h-4 w-auto rounded-sm opacity-70" />
              <img src={`${BASE}/flags/Flag_of_the_Netherlands.svg.png`} alt="Netherlands" title="Netherlands" className="h-4 w-auto rounded-sm opacity-70" />
<img src={`${BASE}/flags/Flag_of_Europe.svg.png`} alt="European Union" title="European Union" className="h-4 w-auto rounded-sm opacity-70" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

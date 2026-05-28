import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thesis",
  description:
    "Two hundred years ago, whoever controlled the seas controlled trade, power, and the future. Today, that high ground is moving to orbit.",
};

export default function ThesisPage() {
  return (
    <main className="arq-thesis-page">
      <div className="arq-thesis-page__inner">
        <Link className="arq-thesis-page__back" href="/">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Back
        </Link>

        <div className="arq-thesis-page__eyebrow">Our thesis</div>
        <h1>
          Building the
          <br />
          space <em>arsenal.</em>
        </h1>

        <p className="arq-lead">
          Two hundred years ago, whoever controlled the seas controlled trade,
          power, and the future. Fifty years ago, the same was true of airspace,
          and the US spent roughly $2 trillion on air dominance because the
          alternative was losing. Today, that high ground is moving to orbit.
          And almost nobody has noticed.
        </p>

        <p className="arq-lead">
          Europe needs dominance in this final frontier. We&rsquo;re building
          the space arsenal.
        </p>

        <div className="arq-thesis-page__cta">
          <a className="arq-joinbtn" href="mailto:contact@arqusaerospace.com">
            Get in touch
            <span className="arq-joinbtn__dot">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </a>
        </div>

        <div className="arq-thesis-page__sig">
          <span>Arqus Aerospace · Munich · Europe</span>
          <span>© 2026</span>
        </div>
      </div>
    </main>
  );
}

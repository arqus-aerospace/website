import Link from "next/link";
import JdApplyLink from "@/components/jd-apply-link";
import type { PostedRole } from "@/lib/roles/types";

/** The top of a posting: the title, and the spec card that answers the five
    questions everyone asks before reading a word of it. */
export default function JdHero({ role }: { role: PostedRole }) {
  const { kicker, subtitle, spec } = role.description;

  return (
    <section className="arq-jd__hero">
      <Link className="arq-jd__back" href="/roles">
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
        Open roles
      </Link>

      <div className="arq-jd__cols arq-jd__cols--hero">
        <div className="arq-jd__headline">
          <span className="arq-jd__kicker">{kicker}</span>
          <h1 className="arq-jd__title">
            {role.title} <em>{role.titleAccent}</em>
          </h1>
          <p className="arq-jd__subtitle">{subtitle}</p>
          <div className="arq-jd__cta">
            <JdApplyLink href="#apply" label="Apply" />
            <span className="arq-jd__place">{role.place}</span>
          </div>
        </div>

        <aside className="arq-jd__spec">
          <div className="arq-jd__spectrum" aria-hidden="true" />
          <div className="arq-jd__spec-head">
            <span className="arq-jd__dot" aria-hidden="true" />
            <span>{spec.label}</span>
            <span className="arq-jd__spec-aside">{spec.aside}</span>
          </div>
          <dl className="arq-jd__spec-facts">
            {spec.facts.map((fact) => (
              <div key={fact.term} className={fact.wide ? "arq-jd__fact arq-jd__fact--wide" : "arq-jd__fact"}>
                <dt>{fact.term}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}

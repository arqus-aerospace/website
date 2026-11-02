import type { JdHeading } from "@/lib/roles/types";

/** One numbered section of a job description: its number and heading on the
    left, its content on the right, and anything full width below them. */
export default function JdBlock({
  id,
  number,
  heading,
  last = false,
  children,
  below,
}: {
  id?: string;
  number: string;
  heading: JdHeading;
  /** the last section carries the page's bottom air */
  last?: boolean;
  children?: React.ReactNode;
  below?: React.ReactNode;
}) {
  return (
    <section id={id} className={last ? "arq-jd__section arq-jd__section--last" : "arq-jd__section"}>
      <div className="arq-jd__cols">
        <div className="arq-jd__head">
          <span className="arq-jd__num">{number}</span>
          <h2 className="arq-jd__heading">
            {heading.text} <em>{heading.accent}</em>
          </h2>
        </div>
        {children ? <div className="arq-jd__body">{children}</div> : null}
      </div>
      {below}
    </section>
  );
}

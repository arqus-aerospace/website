import JdBlock from "@/components/jd-block";
import JdBulletList from "@/components/jd-bullets";
import type { JdScenarioSection } from "@/lib/roles/types";

/** The war stories of the job: notched cards across the page, or, where the
    lines should read as one run, a quoted list in the prose column. */
export default function JdScenarios({ number, section }: { number: string; section: JdScenarioSection }) {
  const asList = section.style === "list";
  const note = section.note ? <p className="arq-jd__note">{section.note}</p> : null;

  return (
    <JdBlock
      number={number}
      heading={section.heading}
      below={
        asList ? (
          note
        ) : (
          <>
            <ul className="arq-tiles arq-jd__scenarios">
              {section.items.map((item) => (
                <li key={item.text} className="arq-tile arq-jd__scenario">
                  <span className="arq-tile__meta">{item.meta}</span>
                  <span className="arq-jd__scenario-text">{item.text}</span>
                </li>
              ))}
            </ul>
            {note}
          </>
        )
      }
    >
      {asList ? <JdBulletList bullets={{ items: section.items.map((item) => item.text) }} quote /> : null}
    </JdBlock>
  );
}

import JdDetails from "@/components/jd-details";
import JdHero from "@/components/jd-hero";
import JdProse from "@/components/jd-prose";
import JdScenarios from "@/components/jd-scenarios";
import { WHO_WE_ARE } from "@/lib/roles/company";
import type { PostedRole } from "@/lib/roles/types";

/** "01", "02", … the numbers down the left edge of the page. */
const num = (i: number) => String(i + 1).padStart(2, "0");

/** A whole posting: the hero, "Who we are", the role's own sections, and the
    practical details last. The numbering follows the order, whatever it is. */
export default function JobDescription({ role }: { role: PostedRole }) {
  const sections = [WHO_WE_ARE, ...role.description.sections];
  const { details, applyEmail, area } = role.description;

  return (
    <>
      <JdHero role={role} />
      {sections.map((section, i) =>
        section.kind === "scenarios" ? (
          <JdScenarios key={section.heading.text} number={num(i)} section={section} />
        ) : (
          <JdProse key={section.heading.text} number={num(i)} section={section} />
        ),
      )}
      <JdDetails
        number={num(sections.length)}
        heading={details.heading}
        rows={details.rows}
        email={applyEmail}
        area={area}
      />
    </>
  );
}

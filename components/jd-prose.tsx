import JdBlock from "@/components/jd-block";
import JdBulletList from "@/components/jd-bullets";
import type { JdProseSection } from "@/lib/roles/types";

/** A prose section: the lead, the body, the list, then the closing paragraphs. */
export default function JdProse({ number, section }: { number: string; section: JdProseSection }) {
  return (
    <JdBlock number={number} heading={section.heading}>
      {section.lead ? <p className="arq-jd__lead">{section.lead}</p> : null}
      {section.body?.map((para) => (
        <p key={para} className="arq-jd__p">
          {para}
        </p>
      ))}
      {section.bullets ? <JdBulletList bullets={section.bullets} /> : null}
      {section.after?.map((para) => (
        <p key={para} className="arq-jd__p">
          {para}
        </p>
      ))}
    </JdBlock>
  );
}

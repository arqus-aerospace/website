import ApplyForm from "@/components/apply-form";
import JdBlock from "@/components/jd-block";
import type { JdDetailRow, JdHeading } from "@/lib/roles/types";

/** The answer half of a row, set by what kind of answer it is. */
function Definition({ row }: { row: JdDetailRow }) {
  switch (row.kind) {
    case "mark":
      return (
        <dd className="arq-jd__def arq-jd__def--bone">
          <u className="arq-jd__mark">{row.value}</u>
        </dd>
      );
    case "formats":
      return (
        <dd className="arq-jd__def arq-jd__formats">
          {row.formats.map((format) => (
            <div key={format.name}>
              <strong>{format.name}</strong>
              {format.detail}
            </div>
          ))}
        </dd>
      );
    case "chip":
      return (
        <dd className="arq-jd__def">
          <span className="arq-jd__chip">{row.value}</span>
        </dd>
      );
    default:
      return <dd className="arq-jd__def">{row.value}</dd>;
  }
}

/** The practical details, and the way to apply: the last section of a posting.
    The hero's Apply button runs down here. */
export default function JdDetails({
  number,
  heading,
  rows,
  email,
  area,
}: {
  number: string;
  heading: JdHeading;
  rows: JdDetailRow[];
  email: string;
  area?: string;
}) {
  return (
    <JdBlock id="apply" number={number} heading={heading} last>
      <dl className="arq-jd__details">
        {rows.map((row) => (
          <div key={row.term} className="arq-jd__row">
            <dt className="arq-jd__term">{row.term}</dt>
            <Definition row={row} />
          </div>
        ))}
      </dl>
      <ApplyForm area={area} email={email} />
    </JdBlock>
  );
}

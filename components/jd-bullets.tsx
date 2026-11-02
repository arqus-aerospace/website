import type { JdBullets } from "@/lib/roles/types";

/** A bullet list: a glowing orange square to a row, hairlines between them.
    Quoted lists read the same rows in display italic. */
export default function JdBulletList({ bullets, quote = false }: { bullets: JdBullets; quote?: boolean }) {
  return (
    <>
      {bullets.label ? <span className="arq-jd__sublabel">{bullets.label}</span> : null}
      <ul className={quote ? "arq-jd__bullets arq-jd__bullets--quote" : "arq-jd__bullets"}>
        {bullets.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}

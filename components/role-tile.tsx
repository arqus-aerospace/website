import Link from "next/link";

export type Role = { title: string; team: string; place: string; href: string; action: string; external?: boolean;
  /** which ways the role can be taken, e.g. "Internship / Thesis / Working Student" */
  format?: string };

/** One open role, with its way to apply: out to whoever is hiring for it, or
    in to the posting's own page (through Link, which knows the base path). */
export default function RoleTile({ role }: { role: Role }) {
  return (
    <li className="arq-tile arq-role">
      <span className="arq-tile__meta">{role.team}</span>
      <span className="arq-tile__title">{role.title}</span>
      {role.format ? <span className="arq-tile__format">{role.format}</span> : null}
      <span className="arq-tile__foot">{role.place}</span>
      {role.external ? (
        <a className="arq-tile__link" href={role.href} target="_blank" rel="noopener noreferrer">
          {role.action}
        </a>
      ) : (
        <Link className="arq-tile__link" href={role.href}>
          {role.action}
        </Link>
      )}
    </li>
  );
}

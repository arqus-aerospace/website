export type Role = { title: string; team: string; place: string; href: string; action: string; external?: boolean };

/** One open role, with its way to apply. */
export default function RoleTile({ role }: { role: Role }) {
  return (
    <li className="arq-tile arq-role">
      <span className="arq-tile__meta">{role.team}</span>
      <span className="arq-tile__title">{role.title}</span>
      <span className="arq-tile__foot">{role.place}</span>
      <a
        className="arq-tile__link"
        href={role.href}
        {...(role.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {role.action}
      </a>
    </li>
  );
}

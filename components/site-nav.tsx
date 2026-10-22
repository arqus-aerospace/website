// The menu: a tab hanging from the top edge, fixed over everything. Each
// item scrolls to its section on this page.

const ITEMS = [
  { label: "Threats", href: "#threats" },
  { label: "Opportunities", href: "#opportunities" },
  { label: "News", href: "#news" },
];

export default function SiteNav() {
  return (
    <nav className="arq-navpill arq-nav" aria-label="Sections">
      {ITEMS.map((it) => (
        <a key={it.href} className="arq-navpill__link" href={it.href}>
          {it.label}
        </a>
      ))}
    </nav>
  );
}

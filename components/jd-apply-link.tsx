/** The bone pill with the arrow in its dark dot, as on the thesis page. */
export default function JdApplyLink({ href, label }: { href: string; label: string }) {
  return (
    <a className="arq-joinbtn" href={href}>
      {label}
      <span className="arq-joinbtn__dot">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </a>
  );
}

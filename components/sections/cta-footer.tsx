export default function CtaFooter() {
  return (
    <section className="cta-final">
      <h2 className="display">
        Securing <em>air space</em>, together.
      </h2>
      <div className="cta-row reveal" data-d="200">
        <div className="left">
          A European aerospace company. Based in Munich. For briefings, demos,
          and partnerships, reach out directly.
        </div>
        <a className="cta-button" href="mailto:contact@arqusaerospace.com">
          contact@arqusaerospace.com
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
        <div className="right">
          +31 612 310 062
          <br />
          <a href="https://www.arqusaerospace.com">www.arqusaerospace.com</a>
        </div>
      </div>
      <div className="footer-bottom">
        <div>© 2026 Arqus Aerospace · Munich</div>
        <div className="links">
          <a href="#thesis">Thesis</a>
          <a href="#suite">Suite</a>
          <a href="#team">Team</a>
          <a href="mailto:contact@arqusaerospace.com">Contact</a>
        </div>
        <div>EUDIS · ESA · TUM Venture Labs</div>
      </div>
    </section>
  );
}

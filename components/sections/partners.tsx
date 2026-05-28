export default function Partners() {
  return (
    <section className="partners" id="partners">
      <div className="partners-label">In partnership with</div>
      <h2 className="partners-headline display">
        Backed by Europe&rsquo;s <em>space &amp; defense</em> ecosystem.
      </h2>
      <div className="partners-logos">
        <div className="partner-logo">
          <svg viewBox="0 0 240 40" height="42" fill="currentColor">
            <path d="M0 5 H30 V35 H0 Z" fill="currentColor" />
            <path d="M8 12 H14 V35 H8 Z" fill="#000" />
            <path d="M16 12 H22 V35 H16 Z" fill="#000" />
            <text
              x="45"
              y="28"
              fontFamily="var(--font-sans)"
              fontWeight="700"
              fontSize="20"
              letterSpacing="0.5"
            >
              TUM Venture Labs
            </text>
          </svg>
        </div>
        <div className="partner-logo">
          <svg viewBox="0 0 160 40" height="42" fill="currentColor">
            <path
              d="M0 20 L15 5 L20 10 L10 20 L20 30 L15 35 Z"
              fill="currentColor"
            />
            <path
              d="M10 20 L25 5 L30 10 L20 20 L30 30 L25 35 Z"
              fill="currentColor"
              opacity="0.6"
            />
            <text
              x="40"
              y="28"
              fontFamily="var(--font-sans)"
              fontWeight="700"
              fontSize="22"
              letterSpacing="1.5"
            >
              NLR
            </text>
          </svg>
        </div>
        <div className="partner-logo">
          <svg viewBox="0 0 120 40" height="42" fill="currentColor">
            <path
              d="M20 2 L22 18 L38 20 L22 22 L20 38 L18 22 L2 20 L18 18 Z"
              fill="currentColor"
            />
            <circle
              cx="20"
              cy="20"
              r="12"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <text
              x="50"
              y="28"
              fontFamily="var(--font-sans)"
              fontWeight="700"
              fontSize="20"
              letterSpacing="1"
            >
              NATO
            </text>
          </svg>
        </div>
        <div className="partner-logo">
          <svg viewBox="0 0 150 40" height="42" fill="currentColor">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M4 20 Q20 5 36 20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <text
              x="48"
              y="28"
              fontFamily="var(--font-sans)"
              fontWeight="700"
              fontSize="20"
              letterSpacing="1"
            >
              ESA BIC
            </text>
          </svg>
        </div>
        <div className="partner-logo">
          <svg viewBox="0 0 240 40" height="42" fill="currentColor">
            <path d="M0 35 L12 5 L18 5 L6 35 Z" fill="currentColor" />
            <path d="M12 5 L18 5 L30 35 L24 35 Z" fill="currentColor" />
            <path d="M24 35 L32 15 L38 15 L30 35 Z" fill="currentColor" />
            <path d="M34 10 L36 5 L42 5 L40 10 Z" fill="#B08D57" />
            <text
              x="52"
              y="28"
              fontFamily="var(--font-sans)"
              fontWeight="800"
              fontSize="20"
              letterSpacing="1"
            >
              <tspan fill="currentColor">ALPINE</tspan>
              <tspan fill="#B08D57" dx="6">
                VALLEY
              </tspan>
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}

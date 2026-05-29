export default function WorkingPrinciple() {
  return (
    <section className="s principle" id="capabilities">
      <div className="principle-grid">
        {/* SENSE */}
        <article className="pillar reveal" data-d="100">
          <div className="pillar-num">01 / Sense</div>
          <h3 className="pillar-title display">Sense.</h3>
          <div className="pillar-anim pillar-anim--radar" aria-hidden="true">
            <svg viewBox="-80 -60 160 120" className="radar">
              <defs>
                <radialGradient id="sweepWedge" cx="0" cy="0" r="58" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#E62630" stopOpacity="0.45" />
                  <stop offset="1" stopColor="#E62630" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* rings */}
              <circle r="20" fill="none" stroke="currentColor" strokeOpacity="0.18" />
              <circle r="40" fill="none" stroke="currentColor" strokeOpacity="0.18" />
              <circle r="58" fill="none" stroke="currentColor" strokeOpacity="0.22" />
              {/* crosshair */}
              <line x1="0" y1="-58" x2="0" y2="58" stroke="currentColor" strokeOpacity="0.1" />
              <line x1="-58" y1="0" x2="58" y2="0" stroke="currentColor" strokeOpacity="0.1" />
              <circle r="1.4" fill="#E62630" />
              {/* drone swarm cluster (upper-right area) */}
              <g className="sense-swarm">
                <circle className="sense-dot" cx="50" cy="-25" r="2" fill="#E62630" style={{ animationDelay: "-0.22s" }} />
                <circle className="sense-dot" cx="54" cy="-22" r="2" fill="#E62630" style={{ animationDelay: "-0.18s" }} />
                <circle className="sense-dot" cx="48" cy="-30" r="2" fill="#E62630" style={{ animationDelay: "-0.27s" }} />
                <circle className="sense-dot" cx="44" cy="-28" r="1.8" fill="#E62630" style={{ animationDelay: "-0.27s" }} />
                <circle className="sense-dot" cx="52" cy="-28" r="1.8" fill="#E62630" style={{ animationDelay: "-0.23s" }} />
              </g>
              {/* rotating sweep wedge */}
              <g className="sense-sweep">
                <path
                  d="M 0 0 L 58 -1 A 58 58 0 0 1 58 22 Z"
                  fill="url(#sweepWedge)"
                />
                <line x1="0" y1="0" x2="58" y2="0" stroke="#E62630" strokeWidth="1.4" strokeLinecap="round" />
              </g>
            </svg>
          </div>
          <p>
            Situational-awareness sensors analyse the environment in real time.
            Tracking happens on-device, with no dependence on a ground link.
          </p>
        </article>

        {/* DECIDE */}
        <article className="pillar reveal" data-d="200">
          <div className="pillar-num">02 / Decide</div>
          <h3 className="pillar-title display">Decide.</h3>
          <div className="pillar-anim pillar-anim--decide" aria-hidden="true">
            <svg viewBox="-100 -45 200 90" className="decide">
              {/* input node */}
              <circle className="decide-input" cx="-70" cy="0" r="4.5" />

              {/* ENGAGE branch (top) */}
              <g className="decide-branch decide-branch--engage">
                <line className="decide-leg" x1="-66" y1="-1" x2="-10" y2="-25" />
                <line className="decide-leg" x1="-6" y1="-25" x2="42" y2="-25" />
                <circle className="decide-mid"  cx="-8" cy="-25" r="3.2" />
                <circle className="decide-end"  cx="46" cy="-25" r="3.6" />
                <text className="decide-label" x="54" y="-22.5">ENGAGE</text>
              </g>

              {/* TRACK branch (middle) */}
              <g className="decide-branch decide-branch--track">
                <line className="decide-leg" x1="-66" y1="0" x2="-10" y2="0" />
                <line className="decide-leg" x1="-6" y1="0" x2="42" y2="0" />
                <circle className="decide-mid"  cx="-8" cy="0" r="3" />
                <circle className="decide-end"  cx="46" cy="0" r="3.4" />
                <text className="decide-label" x="54" y="2.5">TRACK</text>
              </g>

              {/* IGNORE branch (bottom) */}
              <g className="decide-branch decide-branch--ignore">
                <line className="decide-leg" x1="-66" y1="1" x2="-10" y2="25" />
                <line className="decide-leg" x1="-6" y1="25" x2="42" y2="25" />
                <circle className="decide-mid"  cx="-8" cy="25" r="3" />
                <circle className="decide-end"  cx="46" cy="25" r="3.4" />
                <text className="decide-label" x="54" y="27.5">IGNORE</text>
              </g>
            </svg>
          </div>
          <p>
            An on-board edge-AI neural engine characterises the threat and
            selects an action in sub-millisecond time, with no operator in the
            loop for dazzling.
          </p>
        </article>

        {/* ACT */}
        <article className="pillar reveal" data-d="300">
          <div className="pillar-num">03 / Act</div>
          <h3 className="pillar-title display">Act.</h3>
          <div className="pillar-anim pillar-anim--act" aria-hidden="true">
            <svg viewBox="0 0 240 160" className="act">
              <line x1="0" y1="130" x2="240" y2="130" stroke="currentColor" strokeOpacity="0.12" />
              {/* tower */}
              <rect x="30" y="100" width="14" height="40" fill="currentColor" opacity="0.65" />
              <rect x="34" y="80" width="6" height="22" fill="currentColor" opacity="0.85" />
              <circle cx="37" cy="78" r="2" fill="#E62630" />
              {/* drone swarm: 5 drones drifting together as a formation */}
              <g className="act-swarm">
                <g transform="translate(180 36)"><g className="act-drone act-drone--1">
                  <ellipse cx="0" cy="0" rx="9" ry="3" fill="currentColor" opacity="0.75" />
                  <circle cx="-10" cy="-2" r="2" fill="currentColor" opacity="0.75" />
                  <circle cx="10"  cy="-2" r="2" fill="currentColor" opacity="0.75" />
                  <circle cx="-10" cy="2"  r="2" fill="currentColor" opacity="0.75" />
                  <circle cx="10"  cy="2"  r="2" fill="currentColor" opacity="0.75" />
                </g></g>
                <g transform="translate(200 22)"><g className="act-drone act-drone--2">
                  <ellipse cx="0" cy="0" rx="7" ry="2.5" fill="currentColor" opacity="0.6" />
                  <circle cx="-8" cy="-1.5" r="1.6" fill="currentColor" opacity="0.6" />
                  <circle cx="8"  cy="-1.5" r="1.6" fill="currentColor" opacity="0.6" />
                  <circle cx="-8" cy="1.5"  r="1.6" fill="currentColor" opacity="0.6" />
                  <circle cx="8"  cy="1.5"  r="1.6" fill="currentColor" opacity="0.6" />
                </g></g>
                <g transform="translate(160 50)"><g className="act-drone act-drone--3">
                  <ellipse cx="0" cy="0" rx="7" ry="2.5" fill="currentColor" opacity="0.6" />
                  <circle cx="-8" cy="-1.5" r="1.6" fill="currentColor" opacity="0.6" />
                  <circle cx="8"  cy="-1.5" r="1.6" fill="currentColor" opacity="0.6" />
                  <circle cx="-8" cy="1.5"  r="1.6" fill="currentColor" opacity="0.6" />
                  <circle cx="8"  cy="1.5"  r="1.6" fill="currentColor" opacity="0.6" />
                </g></g>
                <g transform="translate(214 48)"><g className="act-drone act-drone--4">
                  <ellipse cx="0" cy="0" rx="6" ry="2" fill="currentColor" opacity="0.5" />
                  <circle cx="-7" cy="-1.2" r="1.4" fill="currentColor" opacity="0.5" />
                  <circle cx="7"  cy="-1.2" r="1.4" fill="currentColor" opacity="0.5" />
                  <circle cx="-7" cy="1.2"  r="1.4" fill="currentColor" opacity="0.5" />
                  <circle cx="7"  cy="1.2"  r="1.4" fill="currentColor" opacity="0.5" />
                </g></g>
                <g transform="translate(146 30)"><g className="act-drone act-drone--5">
                  <ellipse cx="0" cy="0" rx="6" ry="2" fill="currentColor" opacity="0.5" />
                  <circle cx="-7" cy="-1.2" r="1.4" fill="currentColor" opacity="0.5" />
                  <circle cx="7"  cy="-1.2" r="1.4" fill="currentColor" opacity="0.5" />
                  <circle cx="-7" cy="1.2"  r="1.4" fill="currentColor" opacity="0.5" />
                  <circle cx="7"  cy="1.2"  r="1.4" fill="currentColor" opacity="0.5" />
                </g></g>
              </g>
              {/* laser firing at the lead drone */}
              <line
                className="act-laser"
                x1="37"
                y1="78"
                x2="180"
                y2="36"
                stroke="#E62630"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <p>
            An ultra-fast scan pattern delivers maximum power on every pass.
            Dazzling first, destruction on operator confirmation. Designed for
            multi-target engagement.
          </p>
        </article>
      </div>
    </section>
  );
}

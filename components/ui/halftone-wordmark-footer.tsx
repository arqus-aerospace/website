"use client"

// Halftone Wordmark Footer — a site footer whose wordmark is set enormous and
// cropped by the bottom edge, printed as a field of halftone dots. Each dot is
// sized by how much of the letter covers its cell, so the type keeps its edges
// at any scale. Move across it and the dots part around the pointer on springs,
// warming in colour as they are pushed off their place; click and a shock ring
// runs through the word. Above it sit the studio line, tracked link columns and
// a back-to-top, separated by a hairline, all over a fine print grain.
//
// One file, React only. A 2D canvas for the dots and the grain, real anchors
// for the links. Every rule in the scoped <style> is .hwf- prefixed and nothing
// is fetched: the faces come from the host page or the fallback stacks.
//
// Local changes: `wordmarkSrc` prints an image (a logo) instead of set type;
// a link without an href renders as plain text, for lines like an address;
// and `satellites` sends small craft drifting across the word, trailing and
// labelled the way ours are round a target on the stage above, each parting
// the dots as it passes.

import * as React from "react"

export interface HalftonePalette {
  /** The footer background. */
  background: string
  /** The dots at rest, and the text. */
  ink: string
  /** The colour a dot warms toward as it is pushed off its place. */
  warm: string
}

export type HalftonePreset = "night" | "paper" | "ember" | "cobalt"

export interface FooterLink {
  label: string
  /** Leave out for a plain line of text. */
  href?: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface HalftoneWordmarkFooterProps {
  /** The giant word printed in dots. Lowercase reads best. Also the accessible name. */
  wordmark?: string
  /**
   * An image to print instead of the word, such as a logo with a transparent
   * background. Its alpha decides where the dots go. It is scaled to fill the
   * width, and `crop` then hides that share of its height below the edge.
   */
  wordmarkSrc?: string
  /** Top-left studio line. */
  label?: string
  /** The muted line under it. */
  meta?: string
  /** Link columns along the top. */
  columns?: FooterColumn[]
  /** Show the back-to-top link. It scrolls the window to 0. Defaults to true. */
  backToTop?: boolean
  /** Starting colours. Defaults to "night". */
  preset?: HalftonePreset
  /** Colour overrides, merged over the preset. */
  palette?: { background?: string; ink?: string; warm?: string }
  /** Distance between dot centres, in CSS px. Defaults to 6. */
  dotGap?: number
  /** How far the pointer pushes, in CSS px. Defaults to 80. */
  radius?: number
  /** How much of the word's cap height hangs below the bottom edge, 0–0.6. Defaults to 0.2. */
  crop?: number
  /** Print grain over everything, 0–1. Defaults to 0.5. */
  grain?: number
  /** Pointer and click response. Defaults to true. */
  interactive?: boolean
  /**
   * How many satellites drift across the word, glowing, trailing and
   * labelled (ARQUS-1, ARQUS-2, ...) like the craft round a target on the
   * stage. Each parts the dots as it passes, as the pointer does. Defaults
   * to 0.
   */
  satellites?: number
  /** Face for the wordmark. Heavy grotesks print best. */
  fontFamily?: string
  /** Weight of the wordmark. Defaults to 800. */
  fontWeight?: number
  /** Face for the small type. */
  monoFamily?: string
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Extra root class names. */
  className?: string
  /** Anything else to place inside the root, over the dots. */
  children?: React.ReactNode
}

const PRESETS: { [K in HalftonePreset]: HalftonePalette } = {
  night: { background: "#0c0c0b", ink: "#e9e4da", warm: "#e9762b" },
  paper: { background: "#efebe3", ink: "#17150f", warm: "#c2361c" },
  ember: { background: "#160a06", ink: "#f2c48c", warm: "#ff5a1f" },
  cobalt: { background: "#0d1b4d", ink: "#dfe7ff", warm: "#ffcd3c" },
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  { title: "Work", links: [{ label: "Index" }, { label: "Archive" }, { label: "Journal" }] },
  { title: "Studio", links: [{ label: "About" }, { label: "Process" }, { label: "Careers" }] },
  { title: "Contact", links: [{ label: "hello@halden.co" }, { label: "+47 22 00 41 00" }] },
]

const SANS_STACK = '"Inter Tight", "Inter Variable", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif'
const MONO_STACK = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace'

// #region halftone
// Pure helpers, lifted out and executed by tests/halftone-wordmark-footer.test.mjs.

/** Hex → [r, g, b] in 0–255, or null for anything that isn't #rgb / #rrggbb. */
export function hwfHex(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Dot radius for a cell coverage in [0, 1]: area-true, so tone stays even. */
export function hwfRadius(coverage: number, gap: number) {
  const c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage
  return Math.sqrt(c) * gap * 0.56
}

/**
 * One step of a dot's spring back to home, plus the push from a pointer at
 * (px, py) within radius r. Returns [x, y, vx, vy]. Away from the pointer a
 * displaced dot always heads home and comes to rest.
 */
export function hwfStep(
  x: number, y: number, vx: number, vy: number,
  hx: number, hy: number, px: number, py: number, r: number,
) {
  const dx = x - px
  const dy = y - py
  const d2 = dx * dx + dy * dy
  if (r > 0 && d2 < r * r) {
    const d = Math.sqrt(d2) + 0.001
    const f = (1 - d / r) * 2.6
    vx += (dx / d) * f
    vy += (dy / d) * f
  }
  vx = (vx + (hx - x) * 0.05) * 0.84
  vy = (vy + (hy - y) * 0.05) * 0.84
  return [x + vx, y + vy, vx, vy]
}

/** How warm a dot is drawn: 0 at home, 1 once it is `span` px or more away. */
export function hwfWarmth(x: number, y: number, hx: number, hy: number, span: number) {
  const d = Math.hypot(x - hx, y - hy)
  return span > 0 ? Math.min(1, d / span) : 0
}

/** Font size that sets `measured` (width at 100px) to fill `width` exactly. */
export function hwfFitSize(measured: number, width: number) {
  return measured > 0 ? (width / measured) * 100 : 0
}
// #endregion

const HWF_CSS = `
.hwf-root {
  position: relative; width: 100%; overflow: hidden; isolation: isolate;
  background: var(--hwf-bg); color: var(--hwf-ink); -webkit-font-smoothing: antialiased;
}
.hwf-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; }
.hwf-top {
  position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.25fr) repeat(3, minmax(0, 1fr));
  gap: 24px; padding: clamp(22px, 3.4vw, 40px) clamp(20px, 3.4vw, 44px) 0;
  font-family: var(--hwf-mono); font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase; line-height: 1.75;
}
.hwf-brand strong { display: block; font-weight: 500; }
.hwf-brand span { opacity: .45; }
.hwf-col h3 { margin: 0; font: inherit; opacity: .4; font-weight: 500; }
.hwf-col ul { list-style: none; margin: 0; padding: 0; }
.hwf-col li > span { opacity: .78; }
.hwf-col a, .hwf-up {
  color: inherit; text-decoration: none; opacity: .78; background: none; border: 0; padding: 0;
  font: inherit; letter-spacing: inherit; text-transform: inherit; cursor: pointer;
  background-image: linear-gradient(currentColor, currentColor); background-size: 0% 1px;
  background-repeat: no-repeat; background-position: 0 100%; transition: opacity .25s ease, background-size .35s cubic-bezier(.2,.7,.1,1);
}
.hwf-col a:hover, .hwf-up:hover { opacity: 1; background-size: 100% 1px; }
.hwf-col a:focus-visible, .hwf-up:focus-visible { outline: 1px solid currentColor; outline-offset: 3px; opacity: 1; }
.hwf-rule {
  position: relative; z-index: 1; display: flex; justify-content: flex-end; align-items: center; gap: 16px;
  margin: clamp(18px, 2.6vw, 30px) clamp(20px, 3.4vw, 44px) 0; padding-top: 12px;
  border-top: 0.5px solid color-mix(in srgb, var(--hwf-ink) 16%, transparent);
  font-family: var(--hwf-mono); font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase;
}
.hwf-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 720px) {
  .hwf-top { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); row-gap: 18px; }
  .hwf-brand { grid-column: 1 / -1; }
}
@media (prefers-reduced-motion: reduce) {
  .hwf-col a, .hwf-up { transition: none; }
}
`

export default function HalftoneWordmarkFooter({
  wordmark = "halden",
  wordmarkSrc,
  label = "Halden Studio",
  meta = "©2026 · Oslo / Lisbon",
  columns = DEFAULT_COLUMNS,
  backToTop = true,
  preset = "night",
  palette,
  dotGap = 6,
  radius = 80,
  crop = 0.2,
  grain = 0.5,
  interactive = true,
  satellites = 0,
  fontFamily = SANS_STACK,
  fontWeight = 800,
  monoFamily = MONO_STACK,
  height = "560px",
  className = "",
  children,
}: HalftoneWordmarkFooterProps) {
  const colors = { ...(PRESETS[preset] || PRESETS.night), ...(palette || {}) }
  const rootRef = React.useRef(null as HTMLElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const opts = React.useRef({ colors, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, wordmark, satellites })
  opts.current = { colors, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, wordmark, satellites }
  const key = [wordmark, wordmarkSrc, dotGap, crop, grain, fontFamily, fontWeight, colors.background, colors.ink, colors.warm, satellites].join("|")

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let w = 0
    let h = 0
    let dpr = 1
    let px = -1e5
    let py = -1e5
    let raf = 0
    let visible = true
    let awake = true
    // shock rings in flight: a click, or a satellite blinking
    type Ring = { x: number; y: number; t: number }
    let rings: Ring[] = []
    const RING_MS = 900

    // The craft: each crosses the canvas on a gentle curve (a quadratic from
    // one side to the other, bowed up or down), leaves a long trail of where
    // it has been, and keeps its name when it comes round again. Colours are
    // the stage swarm's.
    const SAT_RGB = ["216,236,255", "127,208,255", "225,224,204", "159,184,255", "95,224,240"]
    type Sat = {
      ax: number; ay: number; bx: number; by: number; cx: number; cy: number
      t0: number; dur: number; rgb: string
      /** Its name, ARQUS-n, kept across relaunches. */
      label: string
      /** A one-off crossing (the red VULCAN), gone once it is across. */
      once?: boolean
      trail: number[]
      /** Where it is this frame. */
      x: number; y: number
    }
    let sats: Sat[] = []
    // Now and then, and never on a schedule you could set a watch by, a red
    // one crosses once: VULCAN-0 or VULCAN-1. Not ours.
    const VULCAN_RGB = "255,72,56"
    let nextVulcan = performance.now() + 15000 + Math.random() * 25000
    const launch = (now: number, label: string, stagger = 0): Sat => {
      const ltr = Math.random() < 0.5
      const band = (lo: number, hi: number) => h * (lo + Math.random() * (hi - lo))
      // in and out at different heights, most of the time across the word
      const ay = band(0.35, 0.95)
      const by = band(0.35, 0.95)
      const ax = ltr ? -40 : w + 40
      const bx = ltr ? w + 40 : -40
      return {
        ax, ay, bx, by,
        cx: w * (0.3 + Math.random() * 0.4),
        cy: (ay + by) / 2 + (Math.random() - 0.5) * h * 0.7,
        t0: now - stagger,
        dur: 9000 + Math.random() * 9000,
        rgb: SAT_RGB[Math.floor(Math.random() * SAT_RGB.length)],
        label,
        trail: [],
        x: ax, y: ay,
      }
    }
    /** How many past positions a trail keeps: about four seconds of flight. */
    const TRAIL_POINTS = 240
    // labels in the page's Inter, which next/font names under a CSS variable
    const labelFont =
      (getComputedStyle(document.documentElement).getPropertyValue("--font-inter").trim() || "Inter") + ", system-ui, sans-serif"
    const satAt = (sat: Sat, u: number) => {
      const v = 1 - u
      return [v * v * sat.ax + 2 * v * u * sat.cx + u * u * sat.bx, v * v * sat.ay + 2 * v * u * sat.cy + u * u * sat.by]
    }
    // Flat arrays: x, y, vx, vy, hx, hy, r per dot.
    let dots = new Float32Array(0)
    let count = 0
    let grainTile = null as HTMLCanvasElement | null
    const ink = hwfHex(opts.current.colors.ink) || [233, 228, 218]
    const warm = hwfHex(opts.current.colors.warm) || [233, 118, 43]

    // An image wordmark loads on its own time; layout() skips it until then.
    let logo: HTMLImageElement | null = null
    if (wordmarkSrc) {
      logo = new Image()
      logo.onload = () => {
        layout()
        wake()
      }
      logo.src = wordmarkSrc
    }

    const layout = () => {
      const o = opts.current
      const rect = root.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)

      // Set the word once, at a size that fills the width, on a 1x mask.
      const mask = document.createElement("canvas")
      mask.width = w
      mask.height = h
      const m = mask.getContext("2d", { willReadFrequently: true })
      if (!m) return
      const c = Math.max(0, Math.min(0.6, o.crop))
      if (logo) {
        if (!logo.complete || !logo.naturalWidth) return
        const lw = w * 0.96
        const lh = (lw * logo.naturalHeight) / logo.naturalWidth
        m.drawImage(logo, (w - lw) / 2, h - lh * (1 - c), lw, lh)
      } else {
        const face = o.fontWeight + " 100px " + o.fontFamily
        m.font = face
        const word = o.wordmark || " "
        const fit = hwfFitSize(m.measureText(word).width, w * 1.02)
        m.font = o.fontWeight + " " + fit + "px " + o.fontFamily
        const box = m.measureText(word)
        const cap = box.actualBoundingBoxAscent || fit * 0.72
        m.fillStyle = "#000"
        m.textBaseline = "alphabetic"
        m.fillText(word, (w - box.width) / 2, h + cap * c)
      }
      const img = m.getImageData(0, 0, w, h).data

      const gap = Math.max(3, o.dotGap)
      const cols = Math.ceil(w / gap)
      const rows = Math.ceil(h / gap)
      const tmp = []
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          // Coverage: average alpha over a 3×3 sample of the cell.
          let sum = 0
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3))
              const y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3))
              sum += img[(y * w + x) * 4 + 3]
            }
          }
          const cov = sum / (9 * 255)
          if (cov < 0.06) continue
          const hx = gx * gap + gap / 2
          const hy = gy * gap + gap / 2
          tmp.push(hx, hy, 0, 0, hx, hy, hwfRadius(cov, gap))
        }
      }
      dots = new Float32Array(tmp)
      count = tmp.length / 7
      sats = []

      // A fixed tile of print grain, drawn once and laid over every frame.
      grainTile = document.createElement("canvas")
      grainTile.width = 256
      grainTile.height = 256
      const g = grainTile.getContext("2d")
      if (g) {
        const id = g.createImageData(256, 256)
        for (let i = 0; i < id.data.length; i += 4) {
          const v = Math.random() * 255
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v
          id.data[i + 3] = Math.random() < 0.5 ? 0 : 255
        }
        g.putImageData(id, 0, 0)
      }
      awake = true
    }

    const draw = (now: number) => {
      const o = opts.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = o.colors.background
      ctx.fillRect(0, 0, w, h)

      const r = o.interactive && !reduced ? Math.max(0, o.radius) : 0
      rings = rings.filter((g) => now - g.t < RING_MS)

      // Where each satellite is this frame. Placed before the dots, because
      // each one parts them as it passes, the way the pointer does, only
      // over a smaller reach.
      const want = reduced ? 0 : Math.max(0, Math.floor(o.satellites))
      let ours = sats.filter((x) => !x.once)
      while (ours.length < want) {
        const sat = launch(now, `ARQUS-${ours.length + 1}`, Math.random() * 9000)
        ours = [...ours, sat]
        sats.push(sat)
      }
      if (ours.length > want) sats = sats.filter((x) => x.once || ours.indexOf(x) < want)
      if (want > 0 && now >= nextVulcan) {
        const red = launch(now, Math.random() < 0.5 ? "VULCAN-0" : "VULCAN-1")
        red.rgb = VULCAN_RGB
        red.once = true
        sats.push(red)
        nextVulcan = now + 40000 + Math.random() * 50000
      }
      sats = sats.flatMap((sat) => {
        const u = (now - sat.t0) / sat.dur
        // across: ours come round again, a one-off is gone
        if (u > 1.05) return sat.once ? [] : [launch(now, sat.label)]
        const [x, y] = satAt(sat, Math.max(0, u))
        sat.x = x
        sat.y = y
        return [sat]
      })
      const satR = reduced ? 0 : Math.max(0, o.radius) * 0.6
      let moving = false
      for (let i = 0; i < count; i++) {
        const j = i * 7
        let x = dots[j]
        let y = dots[j + 1]
        let vx = dots[j + 2]
        let vy = dots[j + 3]
        const hx = dots[j + 4]
        const hy = dots[j + 5]
        if (!reduced) {
          for (const g of rings) {
            const age = now - g.t
            const dx = hx - g.x
            const dy = hy - g.y
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001
            const band = 1 - Math.min(1, Math.abs(d - age * 0.9) / 26)
            if (band > 0) {
              const f = band * 3.2 * (1 - age / RING_MS)
              vx += (dx / d) * f
              vy += (dy / d) * f
            }
          }
          // each satellite makes way for itself through the word
          for (const sat of sats) {
            const dx = x - sat.x
            const dy = y - sat.y
            const d2 = dx * dx + dy * dy
            if (d2 < satR * satR) {
              const d = Math.sqrt(d2) + 0.001
              const f = (1 - d / satR) * 2.6
              vx += (dx / d) * f
              vy += (dy / d) * f
            }
          }
          const s = hwfStep(x, y, vx, vy, hx, hy, px, py, r)
          x = s[0]
          y = s[1]
          vx = s[2]
          vy = s[3]
          if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) moving = true
          else {
            x = hx
            y = hy
            vx = 0
            vy = 0
          }
          dots[j] = x
          dots[j + 1] = y
          dots[j + 2] = vx
          dots[j + 3] = vy
        }
        const k = hwfWarmth(x, y, hx, hy, 28)
        ctx.fillStyle =
          k > 0.02
            ? "rgb(" +
              Math.round(ink[0] + (warm[0] - ink[0]) * k) + "," +
              Math.round(ink[1] + (warm[1] - ink[1]) * k) + "," +
              Math.round(ink[2] + (warm[2] - ink[2]) * k) + ")"
            : o.colors.ink
        ctx.beginPath()
        ctx.arc(x, y, dots[j + 6], 0, 6.2832)
        ctx.fill()
      }

      // the satellites, drawn over the dots
      ctx.globalCompositeOperation = "lighter"
      for (const sat of sats) {
        const { x, y } = sat
        sat.trail.push(x, y)
        if (sat.trail.length > TRAIL_POINTS * 2) sat.trail.splice(0, 2)
        // the trail, faded toward its tail, one segment at a time
        ctx.lineWidth = 1.3
        ctx.lineCap = "butt"
        const n = sat.trail.length / 2
        for (let q = 1; q < n; q++) {
          const a = Math.pow(q / n, 2.2) * 0.85
          ctx.strokeStyle = "rgba(" + sat.rgb + "," + a.toFixed(3) + ")"
          ctx.beginPath()
          ctx.moveTo(sat.trail[(q - 1) * 2], sat.trail[(q - 1) * 2 + 1])
          ctx.lineTo(sat.trail[q * 2], sat.trail[q * 2 + 1])
          ctx.stroke()
        }
        // the craft: a steady glow
        const R = 9
        const glow = ctx.createRadialGradient(x, y, 0, x, y, R)
        glow.addColorStop(0, "rgba(255,255,255,1)")
        glow.addColorStop(0.25, "rgba(" + sat.rgb + ",0.85)")
        glow.addColorStop(1, "rgba(" + sat.rgb + ",0)")
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, R, 0, 6.2832)
        ctx.fill()
      }
      ctx.globalCompositeOperation = "source-over"

      // their names, the way the stage labels its craft: a hairline up and
      // out to an elbow, then underneath the name in light tracked capitals
      ctx.font = "400 9.5px " + labelFont
      ctx.letterSpacing = "0.2em"
      ctx.textBaseline = "alphabetic"
      for (const sat of sats) {
        if (sat.x < -20 || sat.x > w + 20) continue
        const tw = ctx.measureText(sat.label).width
        const ex = sat.x + 11
        const ey = sat.y - 11
        ctx.fillStyle = "rgba(0,0,0,0.62)"
        ctx.fillRect(ex, ey - 15, tw + 8, 13)
        ctx.strokeStyle = "rgba(" + sat.rgb + ",0.55)"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(sat.x + 4, sat.y - 4)
        ctx.lineTo(ex, ey)
        ctx.lineTo(ex + tw + 6, ey)
        ctx.stroke()
        ctx.fillStyle = "rgba(" + sat.rgb + ",0.95)"
        ctx.fillText(sat.label, ex + 3, ey - 4)
      }
      ctx.letterSpacing = "0px"

      if (grainTile && o.grain > 0) {
        ctx.globalAlpha = Math.min(1, o.grain) * 0.09
        ctx.globalCompositeOperation = "overlay"
        const pattern = ctx.createPattern(grainTile, "repeat")
        if (pattern) {
          ctx.fillStyle = pattern
          ctx.fillRect(0, 0, w, h)
        }
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = "source-over"
      }
      // Sleep once everything is home and nothing is pushing; craft in flight keep it awake.
      awake = moving || rings.length > 0 || px > -1e4 || sats.length > 0
    }

    const loop = (now: number) => {
      raf = 0
      if (!visible) return
      draw(now)
      if (awake) raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      awake = true
      if (!raf && visible) raf = requestAnimationFrame(loop)
    }

    const toLocal = (e: PointerEv) => {
      const b = canvas.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top]
    }
    const onMove = (e: PointerEv) => {
      if (!opts.current.interactive) return
      const p = toLocal(e)
      px = p[0]
      py = p[1]
      wake()
    }
    const onLeave = () => {
      px = -1e5
      py = -1e5
      wake()
    }
    const onDown = (e: PointerEv) => {
      if (!opts.current.interactive || reduced) return
      if ((e.target as HTMLElement).closest("a,button")) return
      const p = toLocal(e)
      rings.push({ x: p[0], y: p[1], t: performance.now() })
      wake()
    }

    layout()
    draw(performance.now())
    wake()

    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("pointerdown", onDown)
    const ro = new ResizeObserver(() => {
      layout()
      wake()
    })
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true
      if (visible) wake()
    })
    io.observe(root)
    // A web font that lands late re-sets the word in its real face.
    let alive = true
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!alive) return
        layout()
        wake()
      })
    }

    return () => {
      alive = false
      if (logo) logo.onload = null
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("pointerdown", onDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` covers every input the layout reads
  }, [key])

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer
      ref={rootRef}
      className={"hwf-root " + className}
      style={
        {
          height,
          "--hwf-bg": colors.background,
          "--hwf-ink": colors.ink,
          "--hwf-mono": monoFamily,
        } as React.CSSProperties
      }
    >
      <style>{HWF_CSS}</style>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="hwf-sr">{wordmark}</span>
      <div className="hwf-top">
        <div className="hwf-brand">
          <strong>{label}</strong>
          <span>{meta}</span>
        </div>
        {columns.map((col) => (
          <nav className="hwf-col" key={col.title} aria-label={col.title}>
            <h3>{col.title}</h3>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>{l.href ? <a href={l.href}>{l.label}</a> : <span>{l.label}</span>}</li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="hwf-rule">
        {backToTop ? (
          <button type="button" className="hwf-up" onClick={toTop}>
            Back to top ↑
          </button>
        ) : null}
      </div>
      {children}
    </footer>
  )
}

type PointerEv = PointerEvent

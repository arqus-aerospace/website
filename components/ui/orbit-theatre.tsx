"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import {
  MOON_RADIUS_KM,
  MU,
  MU_MOON,
  RE,
  altitudeKm,
  gmst,
  makeOrbit,
  moonPosition,
  orbitNormal,
  orbitPath,
  positionAt,
  sunDirection,
  type ElementSet,
  type Orbit,
  type Vec3,
} from "@/lib/orbits/astro";
import { ALL_TRACKED, LUNAR, PATROL, SCENES, THREAT_WORDS } from "@/lib/orbits/scenes";
import { SatModel } from "@/components/ui/sat-model";

/* -------------------------------------------------------------------------- */
/*  The Earth, everything we track around it, and a camera that flies         */
/*  between them.                                                             */
/*                                                                            */
/*  One unit is one Earth radius. Positions are worked out in the inertial    */
/*  frame (see lib/orbits/astro) and handed to three.js as (x, z, −y), so      */
/*  three's y axis is the Earth's pole. The globe is turned by sidereal time   */
/*  and lit from the Sun's true direction, so the day side, the night side     */
/*  and the ground under each satellite are all as they are at that moment.   */
/*                                                                            */
/*  Each scene parks the camera off one target, set back along its track and   */
/*  out from the Earth, and rolls it until the Earth sits up and to the left   */
/*  of the target. Between scenes the camera swings out into open space and    */
/*  back in on the next one.                                                   */
/* -------------------------------------------------------------------------- */

export interface OrbitTheatreProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Simulated seconds per real second. */
  warp?: number;
  /**
   * Where the camera should be: -1 for the wide opening shot of the Earth,
   * or the index of a threat scene. Changing it flies the camera there.
   */
  stage?: number;
  /**
   * The two moves past the threats, each 0 or 1: `zoom` closes in on one of
   * our craft, `shield` pulls back out while the constellation lights up.
   * Setting one plays the move; clearing it plays it back. Once the shield
   * has pulled back, its rollout runs on its own, and the theatre writes the
   * year and how many are up into `year` and `count`, for the page to show.
   * A ref, so the page can set it without a render.
   */
  drive?: React.RefObject<{ zoom: number; shield: number; year?: number; count?: number }>;
  /** Seconds the camera takes to fly between targets. */
  slewSeconds?: number;
  /** Folder holding the Earth textures. */
  textureBase?: string;
  /** Let the pointer swing the camera. */
  interactive?: boolean;
}

/* --- Earth shading -------------------------------------------------------- */

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const EARTH_FRAG = /* glsl */ `
  uniform sampler2D uDay;
  uniform sampler2D uNight;
  uniform sampler2D uPacked; // r: bump, g: roughness, b: clouds
  uniform vec3 uSun;         // view space
  uniform float uCloudShift;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    vec3 L = normalize(uSun);
    float ndl = dot(N, L);

    vec3 day = texture2D(uDay, vUv).rgb;
    vec3 night = texture2D(uNight, vUv).rgb;
    float rough = texture2D(uPacked, vUv).g;
    float cloud = texture2D(uPacked, vUv + vec2(uCloudShift, 0.0)).b;
    cloud = smoothstep(0.15, 0.9, cloud);

    float dayMix = smoothstep(-0.12, 0.22, ndl);
    float lit = max(ndl, 0.0);

    vec3 ground = day * (0.02 + 1.15 * lit);
    vec3 H = normalize(L + V);
    float water = 1.0 - smoothstep(0.35, 0.7, rough);
    float glint = pow(max(dot(N, H), 0.0), 220.0) * water * (1.0 - cloud);
    ground += vec3(1.0, 0.92, 0.78) * glint * 0.45 * lit;

    vec3 cities = night * vec3(1.0, 0.78, 0.5) * 2.2 * (1.0 - cloud * 0.8);
    vec3 color = mix(cities, ground, dayMix);

    vec3 cloudCol = vec3(1.0) * (0.04 + 1.05 * lit);
    color = mix(color, cloudCol, cloud * 0.92);

    float dusk = smoothstep(-0.2, 0.0, ndl) * (1.0 - smoothstep(0.0, 0.25, ndl));
    color += vec3(0.9, 0.35, 0.12) * dusk * 0.08 * cloud;

    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.2);
    color += vec3(0.32, 0.6, 1.0) * fres * (0.15 + 1.25 * smoothstep(-0.25, 0.6, ndl));

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const HALO_FRAG = /* glsl */ `
  uniform vec3 uSun;
  uniform float uEdge; // -N.V where the shell meets the globe's limb
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vView);
    float rim = pow(clamp(-dot(N, V) / uEdge, 0.0, 1.0), 2.4);
    float sun = smoothstep(-0.35, 0.6, dot(N, normalize(uSun)));
    vec3 col = vec3(0.3, 0.58, 1.0) * rim * (0.1 + 0.95 * sun);
    gl_FragColor = vec4(col, rim);
    #include <colorspace_fragment>
  }
`;

/* --- the grade ---------------------------------------------------------------- */
/*                                                                            */
/*  Fury Road, more or less: shadows pushed teal, highlights burnt orange, an  */
/*  S-curve with crushed blacks, warm colours pushed harder than cool ones,    */
/*  colour fringing that grows toward the edges, a heavy scorched vignette,    */
/*  and a faint flicker in exposure like an old print. Runs on display-space   */
/*  colour, after tone mapping.                                                */

const GRADE = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uAspect: { value: 1 },
    uTime: { value: 0 },
    /** One texel, for the halation taps. */
    uTexel: { value: new THREE.Vector2(1 / 1440, 1 / 900) },
    /** The Sun on screen, in uv, and how much of it is in play (0..1). */
    uSun: { value: new THREE.Vector2(0.5, 0.5) },
    uSunVis: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uAspect;
    uniform float uTime;
    uniform vec2 uTexel;
    uniform vec2 uSun;
    uniform float uSunVis;
    varying vec2 vUv;

    float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

    // a soft disc, for the flare's ghosts
    float disc(vec2 uv, vec2 at, float r) {
      float d = length((uv - at) * vec2(uAspect, 1.0));
      return smoothstep(r, r * 0.55, d);
    }

    void main() {
      vec2 p = vUv - 0.5;
      float r2 = dot(p * vec2(uAspect, 1.0), p * vec2(uAspect, 1.0));

      // colour fringing, nothing at the centre and growing with the square
      // of the distance out, like a cheap lens wide open
      vec2 shift = p * r2 * 0.022;
      vec3 c = vec3(
        texture2D(tDiffuse, vUv + shift).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv - shift).b
      );

      // Halation and softness. Sixteen taps on two rings make a cheap blur;
      // what is bright in it bleeds back in red-orange, the way light
      // scatters back off the base of real film, and a little of the blur is
      // mixed through everything so edges are never digitally hard.
      vec3 blur = vec3(0.0);
      for (int k = 0; k < 8; k++) {
        float a = float(k) * 0.7854;
        vec2 o = vec2(cos(a), sin(a)) * uTexel;
        blur += texture2D(tDiffuse, vUv + o * 3.0).rgb;
        blur += texture2D(tDiffuse, vUv + o * 8.0).rgb;
      }
      blur /= 16.0;
      c = mix(c, blur, 0.14);
      c += max(blur - 0.5, 0.0) * vec3(1.0, 0.42, 0.18) * 1.1;

      // split tone: teal into the shadows, burnt orange into the highlights
      float l = luma(c);
      c += vec3(-0.02, 0.05, 0.07) * (1.0 - smoothstep(0.02, 0.5, l));
      c += vec3(0.16, 0.05, -0.08) * smoothstep(0.3, 0.95, l);

      // contrast: an S-curve, then crush the floor
      c = clamp(c, 0.0, 1.0);
      c = mix(c, c * c * (3.0 - 2.0 * c), 0.7);
      c = max(c - 0.025, 0.0) / 0.975;

      // saturation, harder on the warm side than the cool
      float l2 = luma(c);
      float warmth = clamp((c.r - c.b) * 2.0, 0.0, 1.0);
      c = mix(vec3(l2), c, 1.15 + 0.35 * warmth);

      // Lens flare off the Sun: a glow, a long anamorphic streak through it,
      // and ghosts strung along the line from the Sun through the centre of
      // the frame, each a different tint like reflections off coated glass.
      if (uSunVis > 0.001) {
        vec2 sd = (vUv - uSun) * vec2(uAspect, 1.0);
        float glow = exp(-length(sd) * 9.0);
        float streak = exp(-abs(sd.y) * 260.0) * exp(-abs(sd.x) * 1.6);
        vec3 flare = vec3(1.0, 0.72, 0.42) * glow * 0.55 + vec3(1.0, 0.55, 0.25) * streak * 0.5;
        vec2 axis = vec2(0.5) - uSun;
        flare += vec3(0.95, 0.5, 0.2)  * disc(vUv, uSun + axis * 0.55, 0.035) * 0.16;
        flare += vec3(0.3, 0.75, 0.8)  * disc(vUv, uSun + axis * 0.9, 0.018) * 0.22;
        flare += vec3(1.0, 0.65, 0.3)  * disc(vUv, uSun + axis * 1.25, 0.075) * 0.07;
        flare += vec3(0.4, 0.9, 0.75)  * disc(vUv, uSun + axis * 1.6, 0.03) * 0.14;
        flare += vec3(0.9, 0.35, 0.15) * disc(vUv, uSun + axis * 2.1, 0.13) * 0.05;
        c += flare * uSunVis;
      }

      // a warm light leak drifting slowly along the right-hand edge, screened in
      vec2 leakAt = vec2(1.08 + 0.06 * sin(uTime * 0.11), 0.3 + 0.35 * sin(uTime * 0.053));
      float leak = smoothstep(0.75, 0.0, length((vUv - leakAt) * vec2(uAspect * 0.7, 1.0)));
      vec3 leakCol = vec3(1.0, 0.36, 0.1) * leak * (0.16 + 0.06 * sin(uTime * 0.37));
      c = 1.0 - (1.0 - c) * (1.0 - leakCol);

      // scorched vignette: the edges darken and go brown on the way out
      float v = smoothstep(0.95, 0.18, r2);
      c = mix(c * vec3(0.32, 0.2, 0.12), c, v);

      // a faint flicker in exposure, a few times a second
      float flicker = 1.0 + 0.025 * sin(uTime * 23.0) * sin(uTime * 7.3);
      gl_FragColor = vec4(clamp(c * flicker, 0.0, 1.0), 1.0);
    }
  `,
};

/* --- the shield constellation ------------------------------------------- */
// Our constellation, by family: perigee and apogee altitude (equal for a
// circle), inclination, and planes spread evenly in node. The ellipses are
// what make it a shield rather than a ring: they reach from low orbit up past
// GEO, so nothing on the way up or down is out of sight. Illustrative.
type Shell = { periKm: number; apoKm: number; inc: number; argp?: number; planes: number; per: number };
export const SHELLS: Shell[] = [
  { periKm: 550, apoKm: 550, inc: 53, planes: 24, per: 15 },
  { periKm: 800, apoKm: 800, inc: 97.6, planes: 12, per: 12 },
  { periKm: 1000, apoKm: 20000, inc: 30, argp: 0, planes: 8, per: 8 }, // inspection ellipses
  { periKm: 8000, apoKm: 8000, inc: 60, planes: 8, per: 12 },
  { periKm: 600, apoKm: 39700, inc: 63.4, argp: 270, planes: 6, per: 6 }, // Molniya-style
  { periKm: 24000, apoKm: 47500, inc: 63.4, argp: 270, planes: 4, per: 4 }, // Tundra-style
  { periKm: 35786, apoKm: 35786, inc: 0.1, planes: 1, per: 72 },
];
/** How many lights the shield adds up to. */
export const SHIELD_SIZE = SHELLS.reduce((n, sh) => n + sh.planes * sh.per, 0);

/**
 * The rollout, as the share of the constellation in orbit at the start of
 * each year from DEPLOY_FROM. Illustrative: slow first launches, then the
 * cadence picks up, and the last shells close out in the final year.
 */
export const DEPLOY_FROM = 2029;
export const DEPLOY_SHARE = [0.02, 0.07, 0.18, 0.36, 0.58, 0.8, 1];
/** Seconds of screen time per year of the rollout. */
const SECONDS_PER_YEAR = 1.1;
/**
 * How much faster than life our satellites move while the rollout runs: at
 * this rate a low orbit laps in about three seconds, GEO in forty.
 */
const SHIELD_TIMELAPSE = 2000;
/**
 * How far back a trail reaches at most, as a share of the satellite's own
 * period. Crowded planes get less, in step with how close their lights sit.
 */
const TRAIL_SHARE = 0.36;
const TRAIL_SEGMENTS = 24;

/** Share in orbit at timeline position t (0..1 across the whole rollout). */
function deployedShare(t: number) {
  const x = Math.max(0, Math.min(1, t)) * (DEPLOY_SHARE.length - 1);
  const i = Math.min(DEPLOY_SHARE.length - 2, Math.floor(x));
  return DEPLOY_SHARE[i] + (DEPLOY_SHARE[i + 1] - DEPLOY_SHARE[i]) * (x - i);
}

/* --- helpers ---------------------------------------------------------------- */

const TAU = Math.PI * 2;
const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** Canvas text uses the page's Inter; filled in from its CSS variable on mount. */
let SANS = "Inter, system-ui, sans-serif";
const ARQUS_RGB = "216,236,255";

/** Inertial (Earth radii) → three.js world. */
function toWorld(p: Vec3, out: THREE.Vector3) {
  return out.set(p.x, p.z, -p.y);
}

function parseRGB(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const ease = (s: number) => (s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2);

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.18, "rgba(255,255,255,0.95)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.22)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glareTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.06, "rgba(255,248,230,0.9)");
  grad.addColorStop(0.2, "rgba(255,220,170,0.18)");
  grad.addColorStop(1, "rgba(255,200,140,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** True if the segment from the camera to p passes through the Earth. */
function hiddenByEarth(cam: THREE.Vector3, p: THREE.Vector3) {
  const dx = p.x - cam.x, dy = p.y - cam.y, dz = p.z - cam.z;
  const len = Math.hypot(dx, dy, dz);
  const ux = dx / len, uy = dy / len, uz = dz / len;
  const b = cam.x * ux + cam.y * uy + cam.z * uz;
  const c = cam.x * cam.x + cam.y * cam.y + cam.z * cam.z - 1;
  const disc = b * b - c;
  if (disc <= 0) return false;
  const tNear = -b - Math.sqrt(disc);
  return tNear > 0 && tNear < len;
}

/* --- the swarm ------------------------------------------------------------- */
/*                                                                            */
/*  Our craft around each target, drawn the way the planets ran round the    */
/*  moving Sun in the first version of this hero: Kepler ellipses with the     */
/*  target at the focus, inner ones quicker (period ∝ size^1.5), each on its   */
/*  own plane, and the target's motion along its track drawn out behind, so    */
/*  every wake is a helix. Sizes are set in screen terms, not km: at true      */
/*  scale an inspector a few km off would sit inside the target's own pixel.  */

type Craft = {
  label: string;
  /** Orbit size, 0..1 of the swarm's outer radius. */
  size: number;
  e: number;
  th0: number;
  /** Plane tilt off square-to-the-track, and its swing about the track. */
  tilt: number;
  node: number;
  /** Seconds after the hold starts that this one flies in. */
  delay: number;
  rgb: string;
};

/** Tilt and swing per craft, degrees. Fixed so the rosette is the same each load. */
const SWARM_FAN: Array<[number, number]> = [[24, 35], [12, 145], [32, 250], [18, 80], [38, 190]];
const SWARM_ECC = [0.3, 0.16, 0.38, 0.22, 0.12];
const SWARM_ORDER = [2, 0, 4, 1, 3];
const SWARM_RGB = ["216,236,255", "127,208,255", "225,224,204", "159,184,255", "95,224,240"];

/** Seconds per orbit for a craft of size 0.6; the rest scale by Kepler. */
const SWARM_PERIOD = 6.2;
/** Seconds a craft takes to spiral in from far out. */
const SWARM_ARRIVE = 2.6;
/** Seconds between one craft arriving and the next. */
const SWARM_STAGGER = 0.55;

/* --- the card --------------------------------------------------------------- */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·-";

/* --- bodies --------------------------------------------------------------- */

type Body = {
  orbit: Orbit;
  label: string;
  kind: "tracked" | "arqus";
  pos: THREE.Vector3;
  line: THREE.Line;
  /**
   * Set for a craft that orbits the Moon: its modelled orbit about the Moon
   * (semi-major axis in Earth radii, angles in radians, mean motion in
   * rad/s). `orbit` then only carries the plane, for framing and the card.
   */
  moon?: { a: number; e: number; inc: number; raan: number; argp: number; n: number };
};

/** The Moon's radius in Earth radii. */
const MOON_R = MOON_RADIUS_KM / 6378.137;

/** Kepler's equation, for the craft round the Moon. */
function keplerSolve(M: number, e: number) {
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

/** A point on a lunar orbit at eccentric anomaly E, about the Moon, in three.js world. */
function lunarOffset(m: NonNullable<Body["moon"]>, E: number, out: THREE.Vector3) {
  const xp = m.a * (Math.cos(E) - m.e);
  const yp = m.a * Math.sqrt(1 - m.e * m.e) * Math.sin(E);
  const cO = Math.cos(m.raan), sO = Math.sin(m.raan);
  const cw = Math.cos(m.argp), sw = Math.sin(m.argp);
  const ci = Math.cos(m.inc), si = Math.sin(m.inc);
  const x = (cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp;
  const y = (sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp;
  const z = sw * si * xp + cw * si * yp;
  return out.set(x, z, -y);
}

export function OrbitTheatre({
  warp = 60,
  stage = -1,
  drive,
  slewSeconds = 2.8,
  textureBase = "/assets/earth",
  interactive = true,
  className = "",
  ...rest
}: OrbitTheatreProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const opts = useRef({ warp, stage, drive, slewSeconds, interactive });
  opts.current = { warp, stage, drive, slewSeconds, interactive };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // next/font gives Inter a generated family name; read it off the page
    const inter = getComputedStyle(document.documentElement).getPropertyValue("--font-inter").trim();
    if (inter) SANS = `${inter}, system-ui, sans-serif`;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const gl = renderer.domElement;
    gl.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    gl.setAttribute("aria-hidden", "true");
    host.appendChild(gl);

    const hud = document.createElement("canvas");
    hud.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
    hud.setAttribute("aria-hidden", "true");
    host.appendChild(hud);
    const ctx = hud.getContext("2d")!;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.002, 4000);

    /* --- sky ---------------------------------------------------------------- */
    const dot = dotTexture();
    // kept, so the shield can turn the sky round the Earth
    let stars: THREE.Points | null = null;
    {
      const N = 6000;
      const pos = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      let seed = 0x2f6b1d;
      const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
      for (let k = 0; k < N; k++) {
        const u = rnd() * 2 - 1, th = rnd() * TAU, r = Math.sqrt(1 - u * u);
        pos.set([r * Math.cos(th) * 1500, u * 1500, r * Math.sin(th) * 1500], k * 3);
        const m = Math.pow(rnd(), 3.2);
        const tint = rnd();
        const [cr, cg, cb] = tint > 0.9 ? [0.75, 0.85, 1] : tint < 0.08 ? [1, 0.86, 0.7] : [1, 1, 1];
        col.set([cr * (0.18 + m), cg * (0.18 + m), cb * (0.18 + m)], k * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      stars = new THREE.Points(g, new THREE.PointsMaterial({
        size: 2.2 * dpr, sizeAttenuation: false, vertexColors: true, map: dot,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      scene.add(stars);
    }

    const glare = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glareTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    glare.scale.setScalar(80);
    scene.add(glare);

    /* --- Earth -------------------------------------------------------------- */
    const loader = new THREE.TextureLoader();
    const aniso = renderer.capabilities.getMaxAnisotropy();
    const tex = (file: string, srgb: boolean) => {
      const t = loader.load(`${textureBase}/${file}`);
      t.anisotropy = aniso;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    const sunView = new THREE.Vector3();
    const earthUniforms = {
      uDay: { value: tex("earth_day_4096.jpg", true) },
      uNight: { value: tex("earth_night_4096.jpg", true) },
      uPacked: { value: tex("earth_bump_roughness_clouds_4096.jpg", false) },
      uSun: { value: sunView },
      uCloudShift: { value: 0 },
    };
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 160, 160),
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: EARTH_FRAG, uniforms: earthUniforms })
    );
    scene.add(earth);

    // The Moon: textured, lit by the same Sun as the Earth, with a near-black
    // night side (earthshine is far too faint to show at this exposure).
    const moonUniforms = {
      uMap: { value: tex("../moon/moon_1024.jpg", true) },
      uSun: { value: sunView },
    };
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_R, 96, 96),
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform vec3 uSun;
          varying vec2 vUv;
          varying vec3 vNormal;
          void main() {
            float lit = max(dot(normalize(vNormal), normalize(uSun)), 0.0);
            vec3 c = texture2D(uMap, vUv).rgb * (0.015 + 1.15 * lit);
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        uniforms: moonUniforms,
      })
    );
    scene.add(moon);
    const moonI = { x: 0, y: 0, z: 0 };
    const moonWorld = new THREE.Vector3();

    const HALO_R = 1.045;
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(HALO_R, 128, 128),
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: HALO_FRAG,
        uniforms: { uSun: { value: sunView }, uEdge: { value: Math.sqrt(1 - 1 / (HALO_R * HALO_R)) } },
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    scene.add(halo);

    /* --- bodies and their orbits -------------------------------------------- */
    const t0 = Date.now();
    let simMs = t0;

    // hull numbers, unique per load
    const used = new Set<number>();
    const hull = () => {
      let n: number;
      do n = Math.floor(Math.random() * 151);
      while (used.has(n));
      used.add(n);
      return `ARQUS-${String(n).padStart(3, "0")}`;
    };

    const bodies: Body[] = [];
    const lineMat = (rgb: string, opacity: number) =>
      new THREE.LineBasicMaterial({ color: new THREE.Color(rgb), transparent: true, opacity, depthWrite: false });

    function addBody(set: ElementSet, label: string, kind: Body["kind"]) {
      const orbit = makeOrbit(set);
      const line = new THREE.Line(
        new THREE.BufferGeometry(),
        lineMat(kind === "arqus" ? "#9fc6ff" : "#ffb38a", kind === "arqus" ? 0.05 : 0.08)
      );
      scene.add(line);
      bodies.push({ orbit, label, kind, pos: new THREE.Vector3(), line });
    }

    for (const set of ALL_TRACKED) addBody(set, set.name, "tracked");
    // Craft round the Moon: no element sets exist for these, so each flies a
    // modelled orbit about the Moon (see LUNAR), carried along with it.
    for (const L of LUNAR) {
      const rp = MOON_RADIUS_KM + L.periKm;
      const ra = MOON_RADIUS_KM + L.apoKm;
      const aKm = (rp + ra) / 2;
      const e = (ra - rp) / (ra + rp);
      addBody(
        { name: L.name, norad: L.id, epoch: new Date().toISOString(), n: 1, e, i: L.inc, raan: L.raan, argp: L.argp, M: 0, ndot: 0 },
        L.name,
        "tracked"
      );
      const b = bodies[bodies.length - 1];
      const deg = Math.PI / 180;
      b.moon = { a: aKm / 6378.137, e, inc: L.inc * deg, raan: L.raan * deg, argp: L.argp * deg, n: Math.sqrt(MU_MOON / aKm ** 3) };
      const pts: number[] = [];
      const at = new THREE.Vector3();
      for (let q = 0; q <= 240; q++) {
        lunarOffset(b.moon, (q / 240) * TAU, at);
        pts.push(at.x, at.y, at.z);
      }
      b.line.geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    }
    for (const p of PATROL) addBody({ ...p, name: "" }, "", "arqus");

    // Each target gets its own swarm, named once per load.
    const swarms: Craft[][] = SCENES.map(() =>
      SWARM_FAN.map(([tilt, node], k) => ({
        label: hull(),
        size: 0.3 + 0.7 * (k / (SWARM_FAN.length - 1)),
        e: SWARM_ECC[k],
        th0: Math.random() * TAU,
        tilt: tilt * (Math.PI / 180),
        node: node * (Math.PI / 180),
        // in staggered, a beat after the box locks, never in size order
        delay: 1 + SWARM_ORDER[k] * SWARM_STAGGER + Math.random() * 0.15,
        rgb: SWARM_RGB[k],
      }))
    );
    for (const b of bodies) if (b.kind === "arqus") b.label = b.orbit.set.name || hull();

    const byNorad = new Map<number, Body>();
    for (const b of bodies) if (b.kind === "tracked") byNorad.set(b.orbit.set.norad, b);

    /** Every body where it is at simMs; a craft round the Moon rides on it. */
    function placeAll() {
      toWorld(moonPosition(simMs, moonI), moonWorld);
      const lunarSec = (simMs - t0) / 1000;
      for (const b of bodies) {
        if (b.moon) {
          const E = keplerSolve((b.moon.n * lunarSec) % TAU, b.moon.e);
          lunarOffset(b.moon, E, b.pos).add(moonWorld);
          b.line.position.copy(moonWorld);
        } else {
          toWorld(positionAt(b.orbit, simMs, scratchPlace), b.pos);
        }
      }
    }
    const scratchPlace: Vec3 = { x: 0, y: 0, z: 0 };

    // one point cloud for every body, recoloured on each scene change
    const dotGeo = new THREE.BufferGeometry();
    const dotPos = new Float32Array(bodies.length * 3);
    const dotCol = new Float32Array(bodies.length * 3);
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPos, 3));
    dotGeo.setAttribute("color", new THREE.BufferAttribute(dotCol, 3));
    const dots = new THREE.Points(dotGeo, new THREE.PointsMaterial({
      size: 9 * dpr, sizeAttenuation: false, vertexColors: true, map: dot,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    scene.add(dots);

    function rebuildPaths() {
      const tmp = new THREE.Vector3();
      for (const b of bodies) {
        if (b.moon) continue; // its path is about the Moon, set once
        const pts = orbitPath(b.orbit, simMs, b.orbit.a > 20000 ? 360 : 240);
        const arr = new Float32Array(pts.length * 3);
        pts.forEach((p, k) => {
          toWorld(p, tmp);
          arr[k * 3] = tmp.x; arr[k * 3 + 1] = tmp.y; arr[k * 3 + 2] = tmp.z;
        });
        b.line.geometry.setAttribute("position", new THREE.BufferAttribute(arr, 3));
        b.line.geometry.computeBoundingSphere();
      }
    }

    /** Colours the orbits for a stage; -1 lights none of them. */
    function styleFor(idx: number) {
      const sc = idx >= 0 ? SCENES[idx] : null;
      const lit = new Set(sc?.norad ?? []);
      const c = new THREE.Color(sc?.color ?? "#ffb38a");
      bodies.forEach((b, k) => {
        const mat = b.line.material as THREE.LineBasicMaterial;
        let col: THREE.Color;
        if (b.kind === "tracked" && lit.has(b.orbit.set.norad)) {
          col = c;
          mat.color.copy(c);
          mat.opacity = b.orbit.set.norad === sc!.norad[0] ? 0.75 : 0.35;
        } else if (b.kind === "tracked") {
          col = new THREE.Color(sc ? "#a08878" : "#d08a5c");
          mat.color.set("#ffb38a");
          mat.opacity = sc ? 0.07 : 0.16;
        } else {
          col = new THREE.Color("#7fa8d8");
          mat.opacity = 0.05;
        }
        dotCol.set([col.r, col.g, col.b], k * 3);
      });
      dotGeo.attributes.color.needsUpdate = true;
    }

    /* --- camera framing ----------------------------------------------------- */
    let width = 1, height = 1;
    const narrow = () => width < 768;
    /** When the swarm on screen began to leave its scene; Infinity while it stays. */
    let holdNow = Infinity;
    /** How much of the overlay to show: it fades out as the camera closes in. */
    let hudFade = 1;
    /** The swarm craft the camera is closing on, drawn as the cube instead; -1 for none. */
    let zoomCraft = -1;

    const P = new THREE.Vector3();
    const ORIGIN = new THREE.Vector3();
    const tmpA = new THREE.Vector3();
    const tmpB = new THREE.Vector3();
    const basis = new THREE.Matrix4();

    type Pose = { pos: THREE.Vector3; quat: THREE.Quaternion };
    const poseA: Pose = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
    const poseB: Pose = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };

    // camera swing from the pointer, eased
    let camX = 0, camY = 0;

    /**
     * Where to put the camera for a scene: off the lead target, set back
     * along its track, out from the Earth and a little above the orbit
     * plane, then rolled so the Earth sits up and to the left of it (on a
     * phone, where the copy takes the top, down and to the left).
     */
    function poseFor(idx: number, out: Pose) {
      const lead = byNorad.get(SCENES[idx].norad[0])!;
      // framed about the body it orbits: the Earth, or for a lunar craft the Moon
      const centre = lead.moon ? moonWorld : ORIGIN;
      const R0 = lead.moon ? MOON_R : 1;
      P.copy(lead.pos);
      const r = P.distanceTo(centre) / R0;
      const rHat = tmpA.copy(P).sub(centre).normalize();
      const nI = orbitNormal(lead.orbit, simMs);
      const nHat = toWorld(nI, new THREE.Vector3()).normalize();
      const tHat = new THREE.Vector3().crossVectors(nHat, rHat).normalize();

      // Stand well off: far enough that the Earth is a body in the frame, not
      // the whole frame, and further still for the high orbits, so GEO reads
      // as deep space. Off to the side of the track rather than straight out,
      // which puts the target near the limb instead of over the disc's middle.
      const D = R0 * (3 + (r - 1) * 0.3);
      const off = new THREE.Vector3()
        .addScaledVector(rHat, 0.55)
        .addScaledVector(tHat, -0.75)
        .addScaledVector(nHat, 0.38)
        .normalize();
      off.applyAxisAngle(nHat, camX * 0.55);
      off.applyAxisAngle(tHat, camY * 0.32);
      const C = out.pos.copy(P).addScaledVector(off, D);

      const dirT = tmpB.copy(P).sub(C).normalize();
      const dirE = new THREE.Vector3().copy(centre).sub(C).normalize();
      const f = new THREE.Vector3().addScaledVector(dirT, 0.6).addScaledVector(dirE, 0.4).normalize();
      // v: from target toward Earth, across the screen
      const v = new THREE.Vector3().copy(dirE).sub(dirT);
      v.addScaledVector(f, -v.dot(f)).normalize();
      const alpha = (narrow() ? 215 : 140) * (Math.PI / 180);
      const fxv = new THREE.Vector3().crossVectors(f, v);
      const U = new THREE.Vector3().addScaledVector(v, Math.sin(alpha)).addScaledVector(fxv, -Math.cos(alpha)).normalize();
      const R = new THREE.Vector3().crossVectors(f, U).normalize();
      basis.makeBasis(R, U, f.clone().negate());
      out.quat.setFromRotationMatrix(basis);
    }

    /* --- the grade ------------------------------------------------------------ */
    // Scene → bloom → tone map and sRGB → the Fury Road grade, which runs last
    // so it works on display colours, the way a colourist would.
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.7, 0.55, 0.78);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const grade = new ShaderPass(GRADE);
    composer.addPass(grade);

    /* --- sizing --------------------------------------------------------------- */
    function resize() {
      const r = host!.getBoundingClientRect();
      width = Math.max(1, r.width);
      height = Math.max(1, r.height);
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      // bloom at half size: it is a blur, so the lost detail never shows
      bloom.resolution.set(width / 2, height / 2);
      grade.uniforms.uAspect.value = width / height;
      grade.uniforms.uTexel.value.set(1 / (width * dpr), 1 / (height * dpr));
      hud.width = Math.round(width * dpr);
      hud.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      camera.aspect = width / height;
      camera.fov = narrow() ? 52 : 40;
      // On a phone the copy owns the top third, so slide the picture down.
      if (narrow()) camera.setViewOffset(width, height, 0, -height * 0.14, width, height);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(() => { resize(); measureCard(); });
    ro.observe(host);

    /* --- pointer ------------------------------------------------------------- */
    let px = 0, py = 0, hoverX = -1e4, hoverY = -1e4;
    /** When the pointer came onto the stage; 0 while it is off. */
    let hoverSince = 0;
    const onPointer = (ev: PointerEvent) => {
      if (!opts.current.interactive) return;
      const r = host.getBoundingClientRect();
      if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom) {
        px = py = 0; hoverX = hoverY = -1e4; hoverSince = 0;
        return;
      }
      if (!hoverSince) hoverSince = performance.now();
      px = ((ev.clientX - r.left) / r.width - 0.5) * 2;
      py = ((ev.clientY - r.top) / r.height - 0.5) * 2;
      hoverX = ev.clientX - r.left;
      hoverY = ev.clientY - r.top;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    /* --- HUD ------------------------------------------------------------------- */
    const screen = new THREE.Vector3();
    /** World → HUD px; null when behind the camera. */
    function toScreen(p: THREE.Vector3) {
      screen.copy(p).project(camera);
      if (screen.z > 1) return null;
      return { x: (screen.x * 0.5 + 0.5) * width, y: (-screen.y * 0.5 + 0.5) * height };
    }

    type Box = { x: number; y: number; w: number; h: number };

    /* --- the card: name and one line, scrambled on every change ------------- */
    const card = cardRef.current;
    const cardName = card?.querySelector<HTMLElement>("[data-name]") ?? null;
    const cardNote = card?.querySelector<HTMLElement>("[data-note]") ?? null;
    const cardTrack = card?.querySelector<HTMLElement>("[data-track]") ?? null;
    const cardOwner = card?.querySelector<HTMLElement>("[data-owner]") ?? null;
    const OWNERS = { RU: "Russia", CN: "China" } as const;
    const pick = (k: string) => card?.querySelector<HTMLElement>(`[data-${k}]`) ?? null;
    const cardPhoto = pick("photo") as HTMLImageElement | null;
    const cardCaption = pick("caption");
    const cardClass = pick("class");
    const cardMeter = pick("meter");
    const cardThreat = pick("threat");
    const cardLaunched = pick("launched");
    const cardNorad = pick("norad");
    const cardOrbit = pick("orbit");
    let cardBox: Box | null = null;

    function measureCard() {
      if (!card) return;
      const h = host!.getBoundingClientRect();
      const c = card.getBoundingClientRect();
      cardBox = { x: c.left - h.left - 8, y: c.top - h.top - 8, w: c.width + 16, h: c.height + 16 };
    }

    // Each letter settles at its own moment, roughly left to right; until then
    // it flickers through random glyphs. Spaces hold still so the words keep
    // their shape while they resolve.
    type Scramble = { text: string[]; settle: number[][]; start: number; dur: number };
    let scramble: Scramble | null = null;
    let cardFor = -1;
    let lastFlicker = 0;

    function cardTo(idx: number, dur: number) {
      const sc = SCENES[idx];
      const text = [sc.name, sc.note];
      scramble = {
        text,
        settle: text.map((s) =>
          [...s].map((_, i) => dur * (0.15 + 0.6 * (i / Math.max(1, s.length)) + 0.25 * Math.random()))
        ),
        start: performance.now(),
        dur,
      };
      cardFor = idx;
      if (card) {
        card.style.setProperty("--accent", sc.color);
        card.setAttribute("aria-label", `${sc.name}. ${sc.note}`);
      }
      if (cardTrack) cardTrack.textContent = `Track ${String(idx + 1).padStart(2, "0")} / ${String(SCENES.length).padStart(2, "0")}`;
      if (cardOwner) cardOwner.textContent = OWNERS[sc.owner];

      // what sits above the name
      const m = sc.media;
      if (card) card.dataset.media = m.kind;
      if (m.kind === "photo" && cardPhoto) {
        cardPhoto.src = ASSET_BASE + m.src;
        cardPhoto.style.objectPosition = m.focus ?? "50% 50%";
      }
      if (cardCaption) {
        cardCaption.textContent =
          m.kind === "photo" ? `${m.caption} · ${m.credit}`
          : m.kind === "model" ? "Arqus reconstruction · illustrative, not to scale"
          : "Classified or unpublished";
      }

      // the record
      if (cardClass) cardClass.textContent = sc.classification;
      if (cardMeter) cardMeter.dataset.level = String(sc.threat);
      if (cardThreat) cardThreat.textContent = THREAT_WORDS[sc.threat];
      if (cardLaunched) cardLaunched.textContent = `${sc.launched} · ${sc.site}`;
      if (cardNorad) cardNorad.textContent = sc.norad.some((n) => n < 0) ? "None published" : sc.norad.join(" / ");
      if (cardOrbit) {
        const lead = byNorad.get(sc.norad[0])!;
        // back from three.js world to inertial for the altitude
        const alt = altitudeKm({ x: lead.pos.x, y: -lead.pos.z, z: lead.pos.y });
        if (lead.moon) {
          const fromMoon = lead.pos.distanceTo(moonWorld) * 6378.137 - MOON_RADIUS_KM;
          cardOrbit.textContent = `Cislunar · ${Math.round(fromMoon).toLocaleString("en-US")} km above the Moon · orbit modelled`;
        } else {
          const regime = alt > 30000 ? "GEO" : alt > 2000 ? "MEO" : "LEO";
          cardOrbit.textContent = `${regime} · ${Math.round(alt).toLocaleString("en-US")} km · i ${lead.orbit.set.i.toFixed(2)}°`;
        }
      }
    }


    function tickCard(now: number) {
      if (!scramble || !cardName || !cardNote) return;
      // flicker at about 20 fps; any faster just reads as noise
      if (now - lastFlicker < 50) return;
      lastFlicker = now;
      const sc = scramble;
      const t = (now - sc.start) / 1000;
      const out = sc.text.map((s, row) =>
        [...s]
          .map((ch, i) =>
            ch === " " || t >= sc.settle[row][i] ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          )
          .join("")
      );
      cardName.textContent = out[0];
      cardNote.textContent = out[1];
      if (t > sc.dur * 1.05) {
        scramble = null;
        measureCard();
      }
    }

    /* --- marks, in the manner of Dune's interfaces: hairlines, broken circles,
           diamonds for nodes, wide-tracked capitals ------------------------ */

    function diamond(x: number, y: number, s: number, fill: boolean) {
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y);
      ctx.lineTo(x, y + s);
      ctx.lineTo(x - s, y);
      ctx.closePath();
      if (fill) ctx.fill();
      else ctx.stroke();
    }

    /**
     * The target mark. A circle broken at the four points of the compass,
     * with a diamond node in each break and a hollow diamond at the centre;
     * for the lead target, the four tips of a larger rotated square and short
     * ticks on the diagonals. `e` runs 0 → 1 as it locks: the circle sweeps
     * round, the nodes appear, and the square closes in.
     */
    function sigil(x: number, y: number, R: number, rgb: [number, number, number], e: number, primary: boolean) {
      const [r, g, b] = rgb;
      const col = `rgba(${r},${g},${b},${(0.45 + 0.55 * e).toFixed(3)})`;
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 1;
      ctx.lineCap = "butt";

      const gap = 0.24;
      const sweep = (Math.PI / 2 - 2 * gap) * e;
      for (let q = 0; q < 4; q++) {
        const a0 = (q * Math.PI) / 2 + gap;
        ctx.beginPath();
        ctx.arc(x, y, R, a0, a0 + sweep);
        ctx.stroke();
      }
      if (e > 0.55) {
        const n = Math.min(1, (e - 0.55) / 0.3) * 2.6;
        for (let q = 0; q < 4; q++) {
          const a = (q * Math.PI) / 2;
          diamond(x + Math.cos(a) * R, y + Math.sin(a) * R, n, true);
        }
      }
      diamond(x, y, 3.5, false);

      if (!primary) return;
      // the outer square, drawn as its four tips only
      const D = R * 1.6 * (1 + (1 - e) * 0.9);
      const L = R * 0.36;
      const k = Math.SQRT1_2;
      ctx.beginPath();
      for (const [vx, vy] of [[D, 0], [0, D], [-D, 0], [0, -D]]) {
        // the two edges leaving a tip run toward its neighbours
        const ex = -Math.sign(vx), ey = -Math.sign(vy);
        if (vx !== 0) {
          ctx.moveTo(x + vx + ex * L * k, y - L * k);
          ctx.lineTo(x + vx, y);
          ctx.lineTo(x + vx + ex * L * k, y + L * k);
        } else {
          ctx.moveTo(x - L * k, y + vy + ey * L * k);
          ctx.lineTo(x, y + vy);
          ctx.lineTo(x + L * k, y + vy + ey * L * k);
        }
      }
      ctx.stroke();
      // ticks on the diagonals, between the circle and the square
      ctx.beginPath();
      for (let q = 0; q < 4; q++) {
        const a = Math.PI / 4 + (q * Math.PI) / 2;
        ctx.moveTo(x + Math.cos(a) * (R + 4), y + Math.sin(a) * (R + 4));
        ctx.lineTo(x + Math.cos(a) * (R + 9), y + Math.sin(a) * (R + 9));
      }
      ctx.stroke();
    }

    type Mark = { label: string; x: number; y: number; strong: boolean };
    const sample = new THREE.Vector3();

    /** The frame a scene's swarm is laid out in. */
    type SwarmFrame = {
      T: THREE.Vector3;
      /** Direction the wakes are drawn out along: the target's track. */
      axis: THREE.Vector3;
      /** The view's forward, flattened square to the axis, and the third
       *  direction square to both. */
      p1: THREE.Vector3;
      p2: THREE.Vector3;
      /** World units for the swarm's outer radius. */
      unit: number;
      /** World units per second the wakes are drawn out along the track. */
      drift: number;
    };

    /**
     * Lays the swarm out against the scene's own framing, not the live
     * camera, so it holds still while the opening shot or the pointer moves
     * the view. The drift axis is the target's direction of travel, laid flat
     * into that view so the helices run across the picture.
     */
    function swarmFrame(idx: number, ref: Pose): SwarmFrame {
      const lead = byNorad.get(SCENES[idx].norad[0])!;
      const T = lead.pos.clone();
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(ref.quat);
      const nHat = toWorld(orbitNormal(lead.orbit, simMs), new THREE.Vector3()).normalize();
      // along the track: about the Moon for a lunar craft, else the Earth
      const axis = new THREE.Vector3().crossVectors(nHat, tmpA.copy(T).sub(lead.moon ? moonWorld : ORIGIN).normalize());
      axis.addScaledVector(fwd, -axis.dot(fwd));
      if (axis.lengthSq() < 1e-6) axis.set(1, 0, 0).applyQuaternion(ref.quat);
      axis.normalize();
      const p1 = new THREE.Vector3().copy(fwd).addScaledVector(axis, -fwd.dot(axis)).normalize();
      // screen px → world units at the target's range
      const d = Math.max(1e-6, ref.pos.distanceTo(T));
      const pxPerUnit = height / (2 * d * Math.tan((camera.fov * Math.PI) / 360));
      const unit = (Math.min(width, height) * (narrow() ? 0.3 : 0.24)) / pxPerUnit;

      const p2 = new THREE.Vector3().crossVectors(axis, p1);
      return { T, axis, p1, p2, unit, drift: unit * 0.3 };
    }

    type CraftBasis = { n: THREE.Vector3; u: THREE.Vector3; v: THREE.Vector3 };

    /** A craft's orbit plane in a frame: normal n, and u, v across it. */
    function craftBasis(c: Craft, F: SwarmFrame): CraftBasis {
      const n = new THREE.Vector3()
        .addScaledVector(F.axis, Math.cos(c.tilt))
        .addScaledVector(F.p1, Math.sin(c.tilt) * Math.cos(c.node))
        .addScaledVector(F.p2, Math.sin(c.tilt) * Math.sin(c.node))
        .normalize();
      const u = new THREE.Vector3().crossVectors(n, F.p1).normalize();
      const v = new THREE.Vector3().crossVectors(n, u);
      return { n, u, v };
    }

    const periodOf = (c: Craft) => SWARM_PERIOD * Math.pow(c.size / 0.6, 1.5);

    /**
     * Where craft c was `age` seconds before `phase`, written into out, or
     * null if it had not arrived yet. It spirals in from far out after its
     * delay, and back out once the camera starts to leave.
     */
    function craftAt(c: Craft, F: SwarmFrame, B: CraftBasis, phase: number, age: number, out: THREE.Vector3) {
      const tt = phase - c.delay - age;
      if (tt < 0) return null;
      const inE = 1 - Math.pow(1 - Math.min(1, tt / SWARM_ARRIVE), 3);
      let grow = 1 + 6 * (1 - inE) * (1 - inE);
      const ph = phase - age;
      if (ph > holdNow) {
        const s = Math.min(1, (ph - holdNow) / opts.current.slewSeconds);
        grow *= 1 + 7 * s * s;
      }
      const th = c.th0 + (TAU / periodOf(c)) * tt;
      const r = ((F.unit * c.size * (1 - c.e * c.e)) / (1 + c.e * Math.cos(th))) * grow;
      return out
        .copy(F.T)
        .addScaledVector(B.u, r * Math.cos(th))
        .addScaledVector(B.v, r * Math.sin(th))
        .addScaledVector(F.axis, -F.drift * age);
    }

    /**
     * Draws a scene's swarm at `phase` seconds into it and returns where each
     * head landed, so the labels can find them.
     */
    function drawSwarm(idx: number, F: SwarmFrame, phase: number): Mark[] {
      const camPos = camera.position;
      const marks: Mark[] = [];
      ctx.globalCompositeOperation = "lighter";

      swarms[idx].forEach((c, ci) => {
        const tNow = phase - c.delay;
        if (tNow <= 0) return;
        const B = craftBasis(c, F);
        const leave = phase > holdNow ? Math.min(1, (phase - holdNow) / (opts.current.slewSeconds * 0.6)) : 0;
        const fade = Math.min(1, tNow / 0.5) * (1 - leave);
        if (fade <= 0.01) return;

        // the wake: one segment at a time, each with its own alpha
        const span = Math.min(4.5, periodOf(c) * 1.1);
        const N = 110;
        let prev: { x: number; y: number } | null = null;
        ctx.lineWidth = 1.3;
        ctx.lineCap = "butt";
        for (let q = N; q >= 0; q--) {
          const p = craftAt(c, F, B, phase, (q / N) * span, sample);
          const s = p && !hiddenByEarth(camPos, p) ? toScreen(p) : null;
          if (s && prev) {
            const f = 1 - q / N; // 0 at the tail, 1 at the head
            const a = Math.pow(f, 2.2) * 0.9 * fade;
            if (a > 0.006) {
              ctx.strokeStyle = `rgba(${c.rgb},${a.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(prev.x, prev.y);
              ctx.lineTo(s.x, s.y);
              ctx.stroke();
            }
          }
          prev = s;
        }

        // the craft itself, unless the cube is standing in for it
        if (ci === zoomCraft) return;
        const head = craftAt(c, F, B, phase, 0, sample);
        if (!head || hiddenByEarth(camPos, head)) return;
        const s = toScreen(head);
        if (!s) return;
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 9);
        glow.addColorStop(0, `rgba(255,255,255,${fade})`);
        glow.addColorStop(0.25, `rgba(${c.rgb},${0.8 * fade})`);
        glow.addColorStop(1, `rgba(${c.rgb},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 9, 0, TAU);
        ctx.fill();
        if (fade > 0.6 && s.x > 0 && s.y > 0 && s.x < width && s.y < height) {
          marks.push({ label: c.label, x: s.x, y: s.y, strong: true });
        }
      });
      ctx.globalCompositeOperation = "source-over";
      return marks;
    }

    /* --- Vulkan OS: a red launch into LEO, shown once the pointer has rested
           on the opening shot for a second. Its name, and on hover a line
           saying it is still to be announced, is all it says. ------------- */
    const VULKAN_RGB = "255,59,48";
    const VULKAN_ASCENT = 0.45; // radians until it reaches orbit
    const VULKAN_ALT = 0.085; // orbit height, in Earth radii (about 540 km)
    // its mean motion, rad per simulated second, so it keeps pace with the
    // other craft at the same warp
    const VULKAN_N = Math.sqrt(MU / Math.pow(RE * (1 + VULKAN_ALT), 3));
    const VULKAN_TRAIL = TAU - 0.4; // longest track kept behind the head
    const VULKAN_BLINK_S = 2.6; // one cycle of the head's two blinks and rest
    let vulkan: { site: THREE.Vector3; dir: THREE.Vector3; t0: number; sim0: number } | null = null;
    let vulkanHotUntil = 0;
    let vulkanVis = 0;
    let vulkanLastT = 0;
    const vulkanP = new THREE.Vector3();

    /** The track at `th` radians downrange: up from the ground, then round in LEO. */
    function vulkanAt(V: { site: THREE.Vector3; dir: THREE.Vector3 }, th: number) {
      const u = Math.min(1, th / VULKAN_ASCENT);
      const r = 1.002 + VULKAN_ALT * (1 - Math.pow(1 - u, 3));
      return vulkanP
        .copy(V.site)
        .multiplyScalar(Math.cos(th))
        .addScaledVector(V.dir, Math.sin(th))
        .multiplyScalar(r);
    }

    function drawVulkan(hits: (a: Box) => boolean, taken: Box[]) {
      const now = performance.now();
      const dt = vulkanLastT ? Math.min(0.1, (now - vulkanLastT) / 1000) : 0;
      vulkanLastT = now;
      const opening = at === -1 && to === null && zoomS === 0 && shieldS === 0;
      if (!vulkan && opening && hoverSince && now - hoverSince > 1000) {
        // Launch from the near side, low and right of centre, heading up and
        // across the face, so the climb is in view whatever the hour.
        const c = camera.position.clone().normalize();
        const R = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const U = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        const site = c.clone().multiplyScalar(0.8).addScaledVector(R, 0.25).addScaledVector(U, -0.5).normalize();
        const head = U.clone().multiplyScalar(0.85).addScaledVector(R, -0.35);
        const dir = head.addScaledVector(site, -head.dot(site)).normalize();
        vulkan = { site, dir, t0: now, sim0: simMs };
      }
      if (!vulkan) return;
      vulkanVis = reduced
        ? (opening ? 1 : 0)
        : Math.max(0, Math.min(1, vulkanVis + (opening ? dt / 0.6 : -dt / 0.25)));
      if (vulkanVis <= 0.01) return;

      // the head flies at orbital pace from lift-off; reduced motion holds it
      // part way round
      const reach = reduced ? 0.8 : (VULKAN_N * (simMs - vulkan.sim0)) / 1000;
      const from = Math.max(0, reach - VULKAN_TRAIL);
      const camPos = camera.position;
      const N = Math.max(8, Math.ceil((reach - from) * 60));
      let prev: { x: number; y: number } | null = null;
      let newest: { x: number; y: number } | null = null; // furthest point along still in view
      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      for (let q = 0; q <= N; q++) {
        const p = vulkanAt(vulkan, from + (q / N) * (reach - from));
        const s = !hiddenByEarth(camPos, p) ? toScreen(p) : null;
        if (s && prev) {
          ctx.strokeStyle = `rgba(${VULKAN_RGB},${(0.35 + 0.6 * (q / N)) * vulkanVis})`;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
        }
        if (s) newest = s;
        prev = s;
      }
      // The head glows while it is on this side of the Earth. The name never
      // leaves: behind the Earth it waits on the last of the track in view.
      const headP = vulkanAt(vulkan, reach);
      const headS = !hiddenByEarth(camPos, headP) ? toScreen(headP) : null;
      const tip = headS ?? newest;
      if (!tip) {
        ctx.restore();
        return;
      }
      // the head: two short calm blinks, then low, over and over
      const beat = reduced ? 1 : ((now - vulkan.t0) / 1000) % VULKAN_BLINK_S;
      const flash = (t: number) => Math.max(0, 1 - Math.abs(beat - t) / 0.12);
      const lit = 0.3 + 0.7 * Math.max(flash(0.15), flash(0.55));
      if (headS) {
        const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 9 + 4 * lit);
        glow.addColorStop(0, `rgba(255,255,255,${lit * vulkanVis})`);
        glow.addColorStop(0.25, `rgba(${VULKAN_RGB},${(0.35 + 0.5 * lit) * vulkanVis})`);
        glow.addColorStop(1, `rgba(${VULKAN_RGB},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 9 + 4 * lit, 0, TAU);
        ctx.fill();
      }

      // the name, on a leader like the craft labels; the note under it on hover
      const label = "VULCAN OS";
      const note = "TO BE ANNOUNCED SOON";
      ctx.font = `400 9.5px ${SANS}`;
      ctx.letterSpacing = "0.2em";
      const tw = ctx.measureText(label).width;
      const nw = ctx.measureText(note).width;
      const off = 11;
      // the first clear corner, or the first corner if none is clear
      const corners = [[1, -1], [-1, -1], [1, 1], [-1, 1]];
      const boxAt = ([ex, ey]: number[]) => {
        const lx = ex > 0 ? tip.x + ex * off : tip.x + ex * off - tw - 6;
        return { x: lx - 2, y: tip.y + ey * off - 15, w: tw + 10, h: 18 };
      };
      const corner = corners.find((c) => !hits(boxAt(c))) ?? corners[0];
      {
        const [ex, ey] = corner;
        const elbowX = tip.x + ex * off, elbowY = tip.y + ey * off;
        const box = boxAt(corner);
        taken.push(box);
        // The camera leans after the pointer, so the name shifts a little as
        // you reach for it: a generous target, and a beat of grace on leaving.
        const over =
          (hoverX >= box.x - 16 && hoverX <= box.x + box.w + 16 && hoverY >= box.y - 16 && hoverY <= box.y + box.h + 24) ||
          Math.hypot(hoverX - tip.x, hoverY - tip.y) < 28;
        if (over) vulkanHotUntil = now + 500;
        const hot = now < vulkanHotUntil;
        const end = ex > 0 ? elbowX + tw + 6 : elbowX - tw - 6;
        ctx.strokeStyle = `rgba(${VULKAN_RGB},${(hot ? 1 : 0.7) * vulkanVis})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tip.x + ex * 4, tip.y + ey * 4);
        ctx.lineTo(elbowX, elbowY);
        ctx.lineTo(end, elbowY);
        ctx.stroke();
        ctx.fillStyle = `rgba(${VULKAN_RGB},${vulkanVis})`;
        ctx.fillText(label, ex > 0 ? elbowX + 3 : end + 3, elbowY - 4);
        if (hot) {
          ctx.fillStyle = `rgba(225,224,204,${0.8 * vulkanVis})`;
          ctx.fillText(note, ex > 0 ? elbowX + 3 : end + tw + 6 - nw, elbowY + 14);
        }
      }
      ctx.restore();
    }

    /**
     * The overlay for one frame: the swarm of the last scene reached (it
     * spirals out once we leave), the mark on the target we are settled on,
     * then the craft labels, kept off the page copy and the card.
     */
    function drawHud(swarmAt: number, into: number, settled: number, F: SwarmFrame | null) {
      ctx.clearRect(0, 0, width, height);
      const taken: Box[] = [
        narrow()
          ? { x: 0, y: 0, w: width, h: height * 0.34 }
          : { x: 0, y: height * 0.52, w: width * 0.42, h: height * 0.48 },
      ];
      if (cardBox) taken.push(cardBox);
      const camPos = camera.position;

      // The swarm goes down first, under the box.
      const marks = swarmAt >= 0 && F ? drawSwarm(swarmAt, F, into) : [];
      ctx.globalAlpha = hudFade;

      if (settled >= 0) {
        const sc = SCENES[settled];
        const rgb = parseRGB(sc.color);
        const lock = Math.min(1, into / 0.7);
        const e = 1 - Math.pow(1 - lock, 3);
        const base = Math.max(16, Math.min(width, height) * 0.03);
        sc.norad.forEach((id, k) => {
          const body = byNorad.get(id)!;
          if (hiddenByEarth(camPos, body.pos)) return;
          const s = toScreen(body.pos);
          if (!s) return;
          const R = k === 0 ? base : base * 0.62;
          sigil(s.x, s.y, R, rgb, e, k === 0);
          const reach = k === 0 ? R * 1.6 : R;
          taken.push({ x: s.x - reach, y: s.y - reach, w: reach * 2, h: reach * 2 });
        });
      }

      // Patrol craft stay unnamed dots unless hovered.
      for (const b of bodies) {
        if (b.kind !== "arqus" || hiddenByEarth(camPos, b.pos)) continue;
        const s = toScreen(b.pos);
        if (!s || s.x < 0 || s.y < 0 || s.x > width || s.y > height) continue;
        marks.push({ label: b.label, x: s.x, y: s.y, strong: false });
      }
      ctx.font = `400 9.5px ${SANS}`;
      ctx.letterSpacing = "0.2em";
      ctx.textBaseline = "alphabetic";
      let hovered: Mark | null = null;
      let best = 60;
      for (const m of marks) {
        const dd = Math.hypot(m.x - hoverX, m.y - hoverY);
        if (dd < best) { best = dd; hovered = m; }
      }
      const shown = marks.filter((m) => m.strong || m === hovered);
      shown.sort((p, q) => (p === hovered ? -1 : 0) - (q === hovered ? -1 : 0));
      if (hovered) {
        // a diamond turning slowly round the craft under the pointer
        ctx.save();
        ctx.translate(hovered.x, hovered.y);
        ctx.rotate(performance.now() / 1400);
        ctx.strokeStyle = "rgba(225,224,204,0.9)";
        ctx.lineWidth = 1;
        diamond(0, 0, 12, false);
        ctx.restore();
      }
      const hits = (a: Box) =>
        a.x < 4 || a.y < 4 || a.x + a.w > width - 4 || a.y + a.h > height - 4 ||
        taken.some((o) => a.x < o.x + o.w && o.x < a.x + a.w && a.y < o.y + o.h && o.y < a.y + a.h);
      for (const item of shown) {
        const { x, y, label, strong } = item;
        // A leader at 45° to an elbow, then a hairline the length of the
        // name, with the name sitting on it.
        const tw = ctx.measureText(label).width;
        const off = 11;
        let placed: Box | null = null;
        let dx = 1, dy = -1;
        for (const [ex, ey] of [[1, -1], [-1, -1], [1, 1], [-1, 1]]) {
          const elbowX = x + ex * off, elbowY = y + ey * off;
          const lx = ex > 0 ? elbowX : elbowX - tw - 6;
          const box = { x: lx - 2, y: elbowY - 15, w: tw + 10, h: 18 };
          if (!hits(box)) { placed = box; dx = ex; dy = ey; break; }
        }
        if (!placed) continue;
        taken.push(placed);
        const hot = item === hovered;
        const ex = x + dx * off, ey = y + dy * off;
        const end = dx > 0 ? ex + tw + 6 : ex - tw - 6;
        ctx.strokeStyle = `rgba(${ARQUS_RGB},${hot ? 0.9 : 0.45})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + dx * 4, y + dy * 4);
        ctx.lineTo(ex, ey);
        ctx.lineTo(end, ey);
        ctx.stroke();
        ctx.fillStyle = hot ? "rgba(240,238,222,1)" : `rgba(${ARQUS_RGB},${strong ? 0.9 : 0.65})`;
        ctx.fillText(label, dx > 0 ? ex + 3 : end + 3, ey - 4);
      }

      drawVulkan(hits, taken);

      // the clock, bottom right
      const d = new Date(simMs);
      const stamp = d.toISOString().replace("T", " ").slice(0, 19);
      ctx.font = `400 9.5px ${SANS}`;
      ctx.letterSpacing = "0.16em";
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(225,224,204,0.55)";
      ctx.fillText(
        `UTC ${stamp} · ×${Math.round(opts.current.warp)}`,
        width - (narrow() ? 16 : 28),
        height - (narrow() ? 16 : 28),
      );
      ctx.textAlign = "left";
      ctx.letterSpacing = "0px";
      ctx.globalAlpha = 1;
    }

    /* --- loop ------------------------------------------------------------------ */
    let visible = true;
    const io = new IntersectionObserver((e) => { visible = e[0]?.isIntersecting ?? true; });
    io.observe(host);

    /*
     * Stages: -1 is the wide opening shot of the whole Earth, 0..n-1 are the
     * threat scenes. The page sets the stage it wants through the `stage`
     * prop (scrolling, the arrows); whenever that differs from where we are
     * or are heading, the camera flies there. A flight can be redirected
     * mid-air: it then starts again from wherever the camera is.
     *
     * Past the threats, two more moves, played when the page asks for them
     * (the `drive` prop) and played back when it stops:
     *   zoom    in on one of our craft round the current target, until the
     *           dot is a spacecraft (a stand-in cube for now);
     *   shield  back out to the whole Earth, very far; then the years run
     *           2029 to 2035 and our constellation goes up around it.
     */
    type From = { kind: "stage"; s: number } | { kind: "fixed"; pos: THREE.Vector3; quat: THREE.Quaternion };
    let at = -1; // the stage we are settled on, or last left
    let from: From = { kind: "stage", s: -1 };
    let to: number | null = null; // where we are flying, if anywhere
    let slewT = 0;
    // The swarm belongs to the last scene arrived at. `phase` is seconds since
    // arriving there; holdNow is when it began to leave (Infinity while we
    // stay), which is what spirals the swarm out.
    let swarmIdx = -1;
    let phase = 0;
    holdNow = Infinity;
    // the scroll-driven moves, eased toward what the page asks for
    let zoomS = 0;
    let shieldS = 0;
    let deployT = 0; // the shield's rollout, 0 at its first year, 1 at its last

    // place everything once, so the first card can read a real altitude
    placeAll();
    if (card) card.dataset.hidden = "";
    let lastPaths = 0;
    let last = 0;
    let raf = 0;
    let styled = -2;
    rebuildPaths();

    const sunI = { x: 0, y: 0, z: 0 };
    const sunW = new THREE.Vector3();
    const skyQuat = new THREE.Quaternion();
    // the Sun's sweep in the far view: where it starts, measured round the
    // camera's vertical from straight ahead (behind the camera, lighting the
    // Earth's face), and how far above the line of sight it rides
    const SUN_START = 2.4;
    const SUN_RISE = 0.16;
    /** Extra turns per second the Earth spins at the height of the rollout. */
    const EARTH_SPIN = 1.2;
    let spinExtra = 0;
    const farSun = new THREE.Vector3();
    let farFrozen = false;
    const sunScreen = new THREE.Vector3();
    let sunVis = 0;
    const scratch: Vec3 = { x: 0, y: 0, z: 0 };
    const poseS: Pose = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
    const poseZ: Pose = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
    const poseFar: Pose = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() };
    const lookM = new THREE.Matrix4();
    const Y = new THREE.Vector3(0, 1, 0);

    /* --- our spacecraft, close up: a stand-in cube for now ------------------ */
    // Sized far beyond any real spacecraft, so that it reads as an object
    // before the camera is close enough to clip it.
    const CUBE = 0.0016;
    /** Seconds each move takes to play. */
    const ZOOM_SECONDS = 2.4;
    const SHIELD_SECONDS = 3.6;
    const ZOOM_CRAFT = SWARM_ORDER.indexOf(0);
    let zoomPick = -1;
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xd4a548, metalness: 0.85, roughness: 0.32 })
    );
    cube.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(cube.geometry),
      new THREE.LineBasicMaterial({ color: 0xf07427, transparent: true, opacity: 0.6 })
    ));
    cube.scale.setScalar(CUBE);
    cube.visible = false;
    scene.add(cube);
    // only the cube uses these: the Earth and the rest light themselves
    const sunLight = new THREE.DirectionalLight(0xffd6a8, 3);
    scene.add(sunLight);
    scene.add(sunLight.target);
    scene.add(new THREE.AmbientLight(0x51607a, 0.9));
    // a soft fill from the lens, as a film crew would light a model, so the
    // cube still reads when its sunlit side faces away
    // the light bar on our craft: a point light just above it, red or blue
    // as the bar flashes, so the cube's faces catch each pulse
    const barLight = new THREE.PointLight(0xff3020, 0, CUBE * 8, 0);
    scene.add(barLight);
    const fillLight = new THREE.DirectionalLight(0xa9bcff, 1.6);
    scene.add(fillLight);
    scene.add(fillLight.target);
    const craftPos = new THREE.Vector3();

    /* --- the shield: our constellation, launched year by year -------------- */
    // Each light gets a place in the launch order (low shells first, the high
    // ellipses and GEO last, shuffled within and a little across), a light
    // bar of its own (red then blue, read at its own offset, so the sky never
    // flashes in unison), and a trail behind it. Elliptical orbits run on
    // Kepler's equation.
    const lightPos = { x: 0, y: 0, z: 0 };
    const smooth = (a: number, b: number, x: number) => {
      const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    type Light = {
      a: number; e: number; inc: number; raan: number; argp: number; M0: number; n: number;
      order: number; rank: number; period: number; onAt: number;
      /** Share of its orbit a trail covers: at most two gaps back to the light behind. */
      trail: number;
    };
    const lights: Light[] = [];
    let shellNo = 0;
    for (const sh of SHELLS) {
      const rp = 1 + sh.periKm / 6378.137;
      const ra = 1 + sh.apoKm / 6378.137;
      const a = (rp + ra) / 2;
      const e = (ra - rp) / (ra + rp);
      const n = Math.sqrt(398600.4418 / Math.pow(a * 6378.137, 3)); // rad/s
      const inc = sh.inc * (Math.PI / 180);
      for (let p = 0; p < sh.planes; p++) {
        const raan = (p / sh.planes) * TAU;
        // ellipses get their perigees turned a little plane to plane, so the
        // family fans out instead of stacking on one line of apsides
        const argp = ((sh.argp ?? 0) + (e > 0.05 ? p * (360 / sh.planes) * 0.35 : 0)) * (Math.PI / 180);
        for (let k = 0; k < sh.per; k++) {
          lights.push({
            a, e, inc, raan, argp, n,
            // phase each plane a little against its neighbour, Walker-style
            M0: (k / sh.per) * TAU + (p / sh.planes) * (TAU / sh.per) * 0.5,
            order: shellNo * 0.22 + Math.random() * 0.8,
            rank: 0,
            // where in the light bar's cycle this one starts
            period: 2.6 + Math.random() * 2.4,
            onAt: -1,
            trail: Math.min(TRAIL_SHARE, 2 / sh.per),
          });
        }
      }
      shellNo++;
    }
    [...lights].sort((x, y) => x.order - y.order).forEach((L, i) => (L.rank = i));
    // the trails: one strip of segments per light, faded toward its tail
    const trailPos = new Float32Array(lights.length * TRAIL_SEGMENTS * 6);
    const trailCol = new Float32Array(lights.length * TRAIL_SEGMENTS * 8);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setAttribute("color", new THREE.BufferAttribute(trailCol, 4));
    const trails = new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    trails.frustumCulled = false;
    trails.visible = false;
    scene.add(trails);
    /** Seconds of shield time-lapse so far: how far our satellites have flown. */
    let shieldClock = 0;
    const trailA = new THREE.Vector3();
    const trailB = new THREE.Vector3();

    /** Screen-space state per light, for the overlay to draw. */
    const shieldPos = new Float32Array(lights.length * 3);
    const shieldOn = new Float32Array(lights.length); // 0 down, else seconds up
    const shieldBeep = new Float32Array(lights.length);

    /** Perifocal (x toward perigee) → three.js world, into out. */
    function perifocalToWorld(xp: number, yp: number, argp: number, inc: number, raan: number, out: THREE.Vector3) {
      const cO = Math.cos(raan), sO = Math.sin(raan);
      const cw = Math.cos(argp), sw = Math.sin(argp);
      const ci = Math.cos(inc), si = Math.sin(inc);
      lightPos.x = (cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp;
      lightPos.y = (sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp;
      lightPos.z = sw * si * xp + cw * si * yp;
      return toWorld(lightPos, out);
    }

    /**
     * A police light bar, as a signal: two short red pulses, a gap, two short
     * blue pulses, every LIGHT_BAR_S seconds. Positive is red, negative blue,
     * the size how bright. Each light reads it at its own offset, so the sky
     * never flashes in unison.
     */
    const LIGHT_BAR_S = 1.4;
    function lightBar(t: number) {
      const f = (t % LIGHT_BAR_S) / LIGHT_BAR_S;
      const pulse = (at: number) => Math.max(0, 1 - Math.abs(f - at) / 0.035);
      return pulse(0.05) + pulse(0.17) - pulse(0.55) - pulse(0.67);
    }

    /**
     * Our craft's light bar in the overlay. Close up it is a beacon sat just
     * above the cube, sized with it; as the camera pulls back the cube shrinks
     * away and the beacon with it, until it is one more small point flashing
     * red and blue among the constellation, drawn just as they are.
     */
    function drawOwnBeacon(head: THREE.Vector3, bar: number) {
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      const at = sample.copy(head).addScaledVector(up, CUBE * 0.9 * (1 - smooth(0.5, 0.95, shieldS)));
      if (hiddenByEarth(camera.position, at)) return;
      const s = toScreen(at);
      if (!s) return;
      // the cube's size on screen, in px
      const d = Math.max(1e-9, camera.position.distanceTo(head));
      const cubePx = (CUBE / d) * (height / (2 * Math.tan((camera.fov * Math.PI) / 360)));
      const scale = Math.max(0, Math.min(1, cubePx / 40));
      ctx.globalCompositeOperation = "lighter";
      // the steady core, shrinking to the constellation's small dim point
      const core = 2.5 + 10 * scale;
      ctx.globalAlpha = 0.5 + 0.4 * scale;
      ctx.drawImage(coreSprite, s.x - core, s.y - core, core * 2, core * 2);
      if (Math.abs(bar) > 0.02) {
        const r = (3 + 5 * Math.abs(bar)) * (1 + 9 * scale);
        ctx.globalAlpha = Math.abs(bar) * 0.9;
        ctx.drawImage(bar > 0 ? redSprite : blueSprite, s.x - r, s.y - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    /** Kepler's equation for the eccentric anomaly; a few Newton steps. */
    function keplerE(M: number, e: number) {
      let E = e < 0.8 ? M : Math.PI;
      for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      return E;
    }

    /**
     * Places every light, its trail and its beep. `deploy` is the rollout,
     * 0..1; a light is up once the count has passed its rank, and its first
     * beep comes the moment it arrives. Positions run on the shield's own
     * time-lapse clock, so the orbits are quick enough to see.
     */
    function updateShield(deploy: number) {
      const now = performance.now() / 1000;
      const count = deployedShare(deploy) * lights.length;
      const where = (L: Light, t: number, out: THREE.Vector3) => {
        const E = keplerE((L.M0 + L.n * t) % TAU, L.e);
        return perifocalToWorld(L.a * (Math.cos(E) - L.e), L.a * Math.sqrt(1 - L.e * L.e) * Math.sin(E), L.argp, L.inc, L.raan, out);
      };
      lights.forEach((L, k) => {
        const base = k * TRAIL_SEGMENTS * 8;
        if (L.rank >= count) {
          L.onAt = -1;
          shieldOn[k] = 0;
          trailCol.fill(0, base, base + TRAIL_SEGMENTS * 8);
          return;
        }
        where(L, shieldClock, tmpA);
        shieldPos[k * 3] = tmpA.x; shieldPos[k * 3 + 1] = tmpA.y; shieldPos[k * 3 + 2] = tmpA.z;
        if (L.onAt < 0) L.onAt = now;
        const age = now - L.onAt;
        shieldOn[k] = Math.max(1e-3, age);
        shieldBeep[k] = lightBar(age + L.period);
        // the trail: back along the orbit, a fixed share of its period,
        // growing in over the first second so a new light drags it out
        const span = ((TAU / L.n) * L.trail) * Math.min(1, age);
        const grow = Math.min(1, age / 0.4);
        trailB.copy(tmpA);
        for (let q = 0; q < TRAIL_SEGMENTS; q++) {
          where(L, shieldClock - (span * (q + 1)) / TRAIL_SEGMENTS, trailA);
          const o = (k * TRAIL_SEGMENTS + q) * 6;
          trailPos[o] = trailB.x; trailPos[o + 1] = trailB.y; trailPos[o + 2] = trailB.z;
          trailPos[o + 3] = trailA.x; trailPos[o + 4] = trailA.y; trailPos[o + 5] = trailA.z;
          const a0 = Math.pow(1 - q / TRAIL_SEGMENTS, 1.6) * 0.3 * grow;
          const a1 = Math.pow(1 - (q + 1) / TRAIL_SEGMENTS, 1.6) * 0.3 * grow;
          const c = (k * TRAIL_SEGMENTS + q) * 8;
          trailCol.set([0.5, 0.66, 0.85, a0, 0.5, 0.66, 0.85, a1], c);
          trailB.copy(trailA);
        }
      });
      trailGeo.attributes.position.needsUpdate = true;
      trailGeo.attributes.color.needsUpdate = true;
      trails.visible = true;
    }

    function hideShield() {
      trails.visible = false;
      shieldOn.fill(0);
    }

    // sprites, drawn once: a soft round light in a given colour
    const sprite = (core: string, mid: string, edge: string) => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, core);
      grad.addColorStop(0.16, mid);
      grad.addColorStop(0.4, edge);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return c;
    };
    const coreSprite = sprite("rgba(225,232,245,1)", "rgba(170,190,220,0.6)", "rgba(120,140,180,0.12)");
    const redSprite = sprite("rgba(255,235,230,1)", "rgba(255,50,40,0.95)", "rgba(255,30,20,0.3)");
    const blueSprite = sprite("rgba(230,240,255,1)", "rgba(40,110,255,0.95)", "rgba(30,90,255,0.3)");

    /**
     * Draws the shield in the overlay, not the 3D scene, so the grade and
     * the blur leave it crisp: every light that is up is a small dim point,
     * flashing red then blue like a police light bar.
     */
    function drawShield() {
      const camPos = camera.position;
      ctx.globalCompositeOperation = "lighter";
      for (let k = 0; k < lights.length; k++) {
        const on = shieldOn[k];
        if (!on) continue;
        sample.set(shieldPos[k * 3], shieldPos[k * 3 + 1], shieldPos[k * 3 + 2]);
        if (hiddenByEarth(camPos, sample)) continue;
        const s = toScreen(sample);
        if (!s || s.x < -10 || s.y < -10 || s.x > width + 10 || s.y > height + 10) continue;
        const settle = Math.min(1, on / 0.2);
        // the steady light: small and dim, so the sky does not glitter
        ctx.globalAlpha = 0.5 * settle;
        ctx.drawImage(coreSprite, s.x - 2.5, s.y - 2.5, 5, 5);
        // the light bar: red then blue (none with reduced motion)
        const bar = reduced ? 0 : shieldBeep[k];
        if (Math.abs(bar) > 0.02) {
          const r = 3 + 5 * Math.abs(bar);
          ctx.globalAlpha = settle * Math.abs(bar) * 0.9;
          ctx.drawImage(bar > 0 ? redSprite : blueSprite, s.x - r, s.y - r, r * 2, r * 2);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    /**
     * The opening shot: the whole Earth from a few radii out, mostly day side
     * with the terminator in frame, drifting slowly. Sat right of centre so
     * the copy has the left (on a phone, low, under the copy).
     */
    function overviewPose(out: Pose, dist = narrow() ? 5.6 : 4.3, shift = 1.25, sun: THREE.Vector3 = sunW) {
      const t = performance.now() / 1000;
      // the opening shot drifts a little; the shield's far view holds still
      const drift = sun === sunW ? 0.12 * Math.sin(t * 0.04) : 0;
      const dir = new THREE.Vector3().copy(sun).applyAxisAngle(Y, -0.95 + drift + camX * 0.18);
      dir.y += 0.32 + camY * 0.1;
      dir.normalize();
      out.pos.copy(dir).multiplyScalar(dist);
      const f = tmpA.copy(out.pos).negate().normalize();
      const right = tmpB.crossVectors(f, Y).normalize();
      const look = narrow()
        ? new THREE.Vector3().crossVectors(right, f).multiplyScalar(shift * (dist / 4.3))
        : new THREE.Vector3().copy(right).multiplyScalar(-shift * (dist / 4.3));
      lookM.lookAt(out.pos, look, Y);
      out.quat.setFromRotationMatrix(lookM);
    }

    function poseOf(s: number, out: Pose) {
      if (s < 0) overviewPose(out);
      else poseFor(s, out);
    }

    /** Blends two poses the way the flights do: log radius, bowed out. */
    function blendPose(A: Pose, B: Pose, e: number, bow: number, out: Pose) {
      const rA = A.pos.length(), rB = B.pos.length();
      const qa = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tmpA.copy(A.pos).normalize());
      const qb = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), tmpB.copy(B.pos).normalize());
      const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(qa.slerp(qb, e));
      const r = Math.exp(Math.log(rA) + (Math.log(rB) - Math.log(rA)) * e) * (1 + bow * Math.sin(Math.PI * e));
      out.pos.copy(dir).multiplyScalar(r);
      out.quat.copy(A.quat).slerp(B.quat, e);
    }

    /**
     * The close-up: from the scene's view, straight in on our craft, until
     * the cube nearly fills the frame. Early on the view keeps its framing;
     * by the end it is looking dead at the craft.
     */
    function zoomPose(base: Pose, head: THREE.Vector3, z: number, out: Pose) {
      const e = ease(z);
      const back = new THREE.Vector3().copy(base.pos).sub(head);
      const d0 = Math.max(1e-6, back.length());
      back.divideScalar(d0);
      const d = Math.exp(Math.log(d0) + (Math.log(CUBE * 4.2) - Math.log(d0)) * e);
      out.pos.copy(head).addScaledVector(back, d);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(base.quat);
      lookM.lookAt(out.pos, head, up);
      const aim = new THREE.Quaternion().setFromRotationMatrix(lookM);
      out.quat.copy(base.quat).slerp(aim, ease(Math.min(1, z * 1.6)));
    }

    function step(dt: number) {
      const O = opts.current;
      const D = O.drive?.current;
      if (!reduced) simMs += dt * 1000 * O.warp;
      // The two moves play at a steady pace toward where the page wants
      // them, and back, one after the other: the shield only starts once the
      // zoom is all the way in, and the zoom only backs out once the shield
      // has played all the way back. The zoom also waits for a flight to land.
      const toward = (v: number, goal: number, secs: number) =>
        reduced ? goal : goal > v ? Math.min(goal, v + dt / secs) : Math.max(goal, v - dt / secs);
      const zoomGoal = shieldS > 0 ? 1 : D?.zoom ?? 0;
      const shieldGoal = zoomS >= 1 ? D?.shield ?? 0 : 0;
      if (to === null) zoomS = toward(zoomS, zoomGoal, ZOOM_SECONDS);
      shieldS = toward(shieldS, shieldGoal, SHIELD_SECONDS);
      // the rollout runs once the camera is out, and rewinds fast on leaving
      const rollout = SECONDS_PER_YEAR * (DEPLOY_SHARE.length - 1);
      if (shieldGoal > 0 && shieldS >= 1) deployT = reduced ? 1 : Math.min(1, deployT + dt / rollout);
      else if (shieldGoal === 0) deployT = reduced ? 0 : Math.max(0, deployT - dt / 0.6);
      if (D) {
        D.year = DEPLOY_FROM + deployT * (DEPLOY_SHARE.length - 1);
        D.count = shieldS > 0 ? Math.round(deployedShare(deployT) * SHIELD_SIZE) : 0;
      }

      // the Moon, then everything in orbit
      placeAll();
      moon.position.copy(moonWorld);
      // tidally locked: the near side (the texture's middle) faces the Earth
      moon.lookAt(0, 0, 0);
      moon.rotateY(-Math.PI / 2);
      bodies.forEach((b, k) => {
        dotPos[k * 3] = b.pos.x; dotPos[k * 3 + 1] = b.pos.y; dotPos[k * 3 + 2] = b.pos.z;
      });
      dotGeo.attributes.position.needsUpdate = true;
      if (simMs - lastPaths > 6 * 3600 * 1000) { rebuildPaths(); lastPaths = simMs; }

      // Earth and Sun
      // While the rollout runs the Earth spins fast on top of its true turn,
      // a day-night cycle racing round the globe; it ramps up and back down
      // with the rollout, and winds on to a whole turn once the shield is
      // gone, so the ground under the tracked satellites is right again.
      if (shieldS > 0 && deployT > 0 && deployT < 1) {
        spinExtra += dt * EARTH_SPIN * TAU * Math.sin(Math.PI * deployT);
      } else if (spinExtra > 0 && (D?.shield ?? 0) === 0) {
        const whole = Math.ceil(spinExtra / TAU) * TAU;
        spinExtra = Math.min(whole, spinExtra + dt * EARTH_SPIN * TAU);
        if (spinExtra >= whole) spinExtra = 0;
      }
      earth.rotation.y = gmst(simMs) + spinExtra;
      earthUniforms.uCloudShift.value = ((simMs - t0) / 86400000) * 0.02;
      Object.assign(sunI, sunDirection(simMs));
      toWorld(sunI, sunW);
      // While the shield runs the camera holds still and the sky turns
      // instead. The far view is fixed from where the Sun was as the shield
      // began; then the stars and the Sun go once round the camera's own
      // vertical, the Sun a little above the line of sight, so it lights the
      // Earth from the front, sweeps the terminator across it, rises behind
      // it with its flare, and comes round again. Through the pull-back the
      // light eases over from the real Sun, so nothing jumps.
      if (shieldS > 0) {
        if (!farFrozen) { farSun.copy(sunW); farFrozen = true; }
        overviewPose(poseFar, narrow() ? 22 : 17, 0.8, farSun);
        const fwdV = new THREE.Vector3(0, 0, -1).applyQuaternion(poseFar.quat);
        const upV = new THREE.Vector3(0, 1, 0).applyQuaternion(poseFar.quat);
        const rightV = new THREE.Vector3(1, 0, 0).applyQuaternion(poseFar.quat);
        // the Sun passes once per year of the rollout; the stars take the
        // whole rollout for one slow turn
        const turn = TAU * ease(deployT);
        const phi = SUN_START + TAU * (DEPLOY_SHARE.length - 1) * deployT;
        const swept = new THREE.Vector3()
          .addScaledVector(fwdV, Math.cos(SUN_RISE) * Math.cos(phi))
          .addScaledVector(rightV, Math.cos(SUN_RISE) * Math.sin(phi))
          .addScaledVector(upV, Math.sin(SUN_RISE));
        sunW.lerp(swept, smooth(0, 1, shieldS)).normalize();
        // the stars turn with it: carrying forward toward right is a turn of -phi about up
        skyQuat.setFromAxisAngle(upV, -turn);
      } else {
        farFrozen = false;
        skyQuat.identity();
      }
      stars?.quaternion.copy(skyQuat);
      glare.position.copy(sunW).multiplyScalar(1200);

      camX += (px - camX) * 0.05;
      camY += (py - camY) * 0.05;

      // Where the page wants us. Start a flight if that is somewhere new.
      const want = Math.max(-1, Math.min(SCENES.length - 1, Math.round(O.stage)));
      if (want !== (to ?? at)) {
        if (to !== null) {
          // redirected mid-air: fly on from exactly where the camera is
          from = { kind: "fixed", pos: camera.position.clone(), quat: camera.quaternion.clone() };
        } else {
          from = { kind: "stage", s: at };
        }
        to = want;
        slewT = 0;
        if (swarmIdx >= 0 && holdNow === Infinity) holdNow = phase; // the swarm starts to leave
        if (want >= 0) cardTo(want, O.slewSeconds * 0.9);
      }
      // close in, the swarm all but stops, so the shot can hold on one craft
      phase += dt * (1 - 0.96 * zoomS * (1 - shieldS));

      // the card is for the threats only, not the close-up or the shield
      const showCard = (to ?? at) >= 0 && zoomS < 0.04 && shieldS < 0.01;
      if (card) {
        const isHidden = "hidden" in card.dataset;
        if (showCard && isHidden) delete card.dataset.hidden;
        else if (!showCard && !isHidden) card.dataset.hidden = "";
      }

      // the swarm is laid out against its own scene's framing
      let F: SwarmFrame | null = null;
      if (swarmIdx >= 0) {
        poseFor(swarmIdx, poseS);
        F = swarmFrame(swarmIdx, poseS);
      }

      const slew = reduced ? 0.001 : O.slewSeconds;
      if (to === null) {
        poseOf(at, poseA);
        camera.position.copy(poseA.pos);
        camera.quaternion.copy(poseA.quat);
        if (styled !== at) { styleFor(at); styled = at; }
      } else {
        slewT += dt;
        const e = ease(Math.min(1, slewT / slew));
        if (from.kind === "stage") poseOf(from.s, poseA);
        else { poseA.pos.copy(from.pos); poseA.quat.copy(from.quat); }
        poseOf(to, poseB);
        blendPose(poseA, poseB, e, 1.1, poseA);
        camera.position.copy(poseA.pos);
        camera.quaternion.copy(poseA.quat);
        // hand the colours over halfway through the flight
        if (e > 0.5 && styled !== to) { styleFor(to); styled = to; }
        if (slewT >= slew) {
          at = to;
          to = null;
          if (at >= 0) {
            swarmIdx = at;
            phase = 0;
            holdNow = Infinity;
          }
        }
      }

      // The scroll-driven moves take over from the scene once we are settled.
      // The craft to close on is picked as the zoom starts: the first, in
      // order of arrival, that the camera can actually see, so the push-in
      // never runs through the Earth. Scrolling back to zero lets it go.
      if (zoomS === 0 && shieldS === 0) zoomPick = -1;
      else if (zoomPick < 0 && F && swarmIdx >= 0) {
        const swarm = swarms[swarmIdx];
        // a fast scroll can outrun the swarm: bring it in, so there is one to pick
        phase = Math.max(phase, Math.max(...swarm.map((c) => c.delay)) + SWARM_ARRIVE);
        const byArrival = swarm.map((_, ci) => ci).sort((a, b) => swarm[a].delay - swarm[b].delay);
        zoomPick = byArrival.find((ci) => {
          const h = craftAt(swarm[ci], F!, craftBasis(swarm[ci], F!), phase, 0, craftPos);
          return !!h && !hiddenByEarth(camera.position, h);
        }) ?? ZOOM_CRAFT;
      }
      let head: THREE.Vector3 | null = null;
      if (F && swarmIdx >= 0 && zoomPick >= 0) {
        const c = swarms[swarmIdx][zoomPick];
        head = craftAt(c, F, craftBasis(c, F), phase, 0, craftPos);
      }
      if (to === null && (zoomS > 0 || shieldS > 0)) {
        const base: Pose = { pos: camera.position.clone(), quat: camera.quaternion.clone() };
        if (head) zoomPose(base, head, zoomS, poseZ);
        else { poseZ.pos.copy(base.pos); poseZ.quat.copy(base.quat); }
        if (shieldS > 0) {
          // The far view: the whole Earth with the GEO ring round it. The
          // camera never just slerps between the two views, which would face
          // empty space halfway; it keeps its eye on something, swinging its
          // aim from the craft to the Earth early in the pull-back.
          // set above, from the frozen Sun: fixed but for the pointer
          const e = ease(shieldS);
          blendPose(poseZ, poseFar, e, 0, poseA);
          const farLook = new THREE.Vector3(0, 0, -1).applyQuaternion(poseFar.quat).multiplyScalar(poseFar.pos.length()).add(poseFar.pos);
          const look = new THREE.Vector3().copy(head ?? farLook).lerp(farLook, ease(Math.min(1, shieldS * 4)));
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(poseZ.quat)
            .lerp(new THREE.Vector3(0, 1, 0).applyQuaternion(poseFar.quat), e).normalize();
          lookM.lookAt(poseA.pos, look, up);
          camera.position.copy(poseA.pos);
          camera.quaternion.setFromRotationMatrix(lookM);
        } else {
          camera.position.copy(poseZ.pos);
          camera.quaternion.copy(poseZ.quat);
        }
      }
      // the cube rides on the craft, turning
      cube.visible = !!head && (zoomS > 0.02 || shieldS > 0) && shieldS < 0.98;
      if (cube.visible && head) {
        cube.position.copy(head);
        cube.rotation.x += dt * 0.35;
        cube.rotation.y += dt * 0.6;
      }
      sunLight.position.copy(sunW).multiplyScalar(10).add(cube.position);
      sunLight.target.position.copy(cube.position);
      fillLight.position.copy(camera.position);
      fillLight.target.position.copy(cube.position);
      // our craft's light bar, the same one each sentinel in the shield runs
      const ownBar = reduced || !head ? 0 : lightBar(performance.now() / 1000);
      if (head) barLight.position.copy(head).addScaledVector(new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion), CUBE * 1.1);
      barLight.color.set(ownBar >= 0 ? 0xff3020 : 0x2a6cff);
      barLight.intensity = cube.visible ? 6 * Math.abs(ownBar) : 0;
      const shieldUp = shieldS > 0.001;
      if (shieldUp) {
        if (!reduced) shieldClock += dt * SHIELD_TIMELAPSE;
        updateShield(deployT);
      }
      else hideShield();

      camera.updateMatrixWorld();
      sunView.copy(sunW).transformDirection(camera.matrixWorldInverse);

      grade.uniforms.uTime.value = performance.now() / 1000;
      // The flare follows the Sun on screen. It stays up a little past the
      // frame edge, since a real lens flares from light just out of shot,
      // and drops out behind the Earth. Eased, so it never pops.
      sunScreen.copy(glare.position).project(camera);
      let wantFlare = 0;
      if (sunScreen.z < 1 && !hiddenByEarth(camera.position, glare.position)) {
        const over = Math.max(Math.abs(sunScreen.x), Math.abs(sunScreen.y)) - 1;
        wantFlare = Math.max(0, Math.min(1, 1 - over / 0.6));
      }
      // quick to rise in the shield, where the Sun only crosses for a moment
      sunVis += (wantFlare - sunVis) * Math.min(1, dt * (shieldS > 0 ? 14 : 4));
      grade.uniforms.uSun.value.set(sunScreen.x * 0.5 + 0.5, sunScreen.y * 0.5 + 0.5);
      grade.uniforms.uSunVis.value = sunVis;
      composer.render();

      // The marks fade as we close in; the craft we zoom on loses its glow
      // once the cube can stand for it.
      const settled = to === null && at >= 0 && zoomS < 0.15 && shieldS === 0 ? at : -1;
      hudFade = 1 - smooth(0, 0.25, zoomS + shieldS);
      zoomCraft = zoomS > 0.12 || shieldS > 0 ? zoomPick : -1;
      drawHud(swarmIdx, phase, settled, F);
      if (shieldUp) drawShield();
      if (head && (zoomS > 0.02 || shieldS > 0)) drawOwnBeacon(head, ownBar);
      tickCard(performance.now());
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (!visible || document.hidden) return;
      step(dt);
    };

    // With reduced motion the loop still runs, so the arrows still move the
    // view, but time stands still and every flight is a cut.
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      earthUniforms.uDay.value.dispose();
      earthUniforms.uNight.value.dispose();
      earthUniforms.uPacked.value.dispose();
      dot.dispose();
      composer.dispose();
      renderer.dispose();
      gl.remove();
      hud.remove();
    };
  }, [textureBase]);

  return (
    <div
      ref={hostRef}
      className={`relative isolate h-full w-full overflow-hidden bg-black ${className}`}
      {...rest}
    >
      {/* Filled in from the effect; the scramble is for the eye, so screen
          readers get the settled text from aria-label instead. */}
      {/* hidden until a threat is up; without WebGL it simply stays hidden */}
      <div ref={cardRef} className="arq-card" role="status" data-hidden="">
        <div className="arq-card__stripes" aria-hidden="true" />
        <div className="arq-card__head" aria-hidden="true">
          <span data-track />
          <span className="arq-card__owner" data-owner />
        </div>
        <div className="arq-card__media" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="arq-card__photo" data-photo alt="" />
          <SatModel className="arq-card__model" />
          <div className="arq-card__void">
            <span>No public imagery</span>
          </div>
          <div className="arq-card__caption" data-caption />
        </div>
        <div className="arq-card__name" data-name aria-hidden="true" />
        <div className="arq-card__note" data-note aria-hidden="true" />
        <dl className="arq-card__data" aria-hidden="true">
          <div className="arq-card__wide">
            <dt>Class</dt>
            <dd data-class />
          </div>
          <div className="arq-card__wide">
            <dt>Threat</dt>
            <dd>
              <span className="arq-card__meter" data-meter>
                <i /><i /><i /><i /><i />
              </span>
              <span data-threat />
            </dd>
          </div>
          <div>
            <dt>Launched</dt>
            <dd data-launched />
          </div>
          <div>
            <dt>Catalogue</dt>
            <dd data-norad />
          </div>
          <div className="arq-card__wide">
            <dt>Orbit</dt>
            <dd data-orbit />
          </div>
        </dl>
      </div>
    </div>
  );
}

export default OrbitTheatre;

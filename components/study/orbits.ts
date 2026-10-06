// Circular-orbit Walker-delta constellations, propagated analytically.
// Units: 1 scene unit = 1 Earth radius. Scene is y-up; ECI z maps to scene y.

export const EARTH_RADIUS_KM = 6371;
const MU = 398600.4418; // km^3/s^2
export const EARTH_ROT = 7.2921159e-5; // rad/s (sidereal)

export type ShellId = "leo" | "polar" | "sso" | "meo" | "geo";

export type Shell = {
  id: ShellId;
  label: string;
  regime: string;
  altKm: number;
  incDeg: number;
  planes: number;
  perPlane: number;
  /** Walker phasing factor F (0..planes-1). */
  phasing: number;
  color: string;
  size: number;
  /** Draw inter-satellite links (in-plane + cross-plane neighbours). */
  links?: boolean;
};

export const SHELLS: Shell[] = [
  {
    id: "leo",
    label: "Broadband shell",
    regime: "LEO",
    altKm: 550,
    incDeg: 53,
    planes: 72,
    perPlane: 22,
    phasing: 17,
    color: "#f07427",
    size: 1.6,
    links: true,
  },
  {
    id: "polar",
    label: "Polar relay",
    regime: "LEO",
    altKm: 1100,
    incDeg: 87.9,
    planes: 18,
    perPlane: 20,
    phasing: 7,
    color: "#e1e0cc",
    size: 1.7,
  },
  {
    id: "sso",
    label: "Sun-synchronous imaging",
    regime: "SSO",
    altKm: 620,
    incDeg: 97.8,
    planes: 12,
    perPlane: 8,
    phasing: 5,
    color: "#9fd3ff",
    size: 2.2,
  },
  {
    id: "meo",
    label: "Navigation",
    regime: "MEO",
    altKm: 23222,
    incDeg: 56,
    planes: 3,
    perPlane: 8,
    phasing: 1,
    color: "#c0fb50",
    size: 3.2,
  },
  {
    id: "geo",
    label: "Geostationary belt",
    regime: "GEO",
    altKm: 35786,
    incDeg: 0.05,
    planes: 1,
    perPlane: 24,
    phasing: 0,
    color: "#ffd166",
    size: 3.4,
  },
];

export const SHELL_BY_ID = Object.fromEntries(SHELLS.map((s) => [s.id, s])) as Record<
  ShellId,
  Shell
>;

export function shellCount(s: Shell) {
  return s.planes * s.perPlane;
}

export function radiusOf(s: Shell) {
  return (EARTH_RADIUS_KM + s.altKm) / EARTH_RADIUS_KM;
}

export function meanMotion(s: Shell) {
  const a = EARTH_RADIUS_KM + s.altKm;
  return Math.sqrt(MU / (a * a * a)); // rad/s
}

export function periodMin(s: Shell) {
  return (2 * Math.PI) / meanMotion(s) / 60;
}

export function velocityKms(s: Shell) {
  return Math.sqrt(MU / (EARTH_RADIUS_KM + s.altKm));
}

/** Writes scene-space positions of every satellite in `s` at time `t` (s). */
export function propagate(s: Shell, t: number, out: Float32Array) {
  const r = radiusOf(s);
  const inc = (s.incDeg * Math.PI) / 180;
  const ci = Math.cos(inc);
  const si = Math.sin(inc);
  const n = meanMotion(s) * t;
  const total = shellCount(s);
  let k = 0;
  for (let p = 0; p < s.planes; p++) {
    const raan = (2 * Math.PI * p) / s.planes;
    const cO = Math.cos(raan);
    const sO = Math.sin(raan);
    for (let j = 0; j < s.perPlane; j++) {
      const u = (2 * Math.PI * j) / s.perPlane + (2 * Math.PI * s.phasing * p) / total + n;
      const cu = Math.cos(u);
      const su = Math.sin(u);
      const x = r * (cO * cu - sO * su * ci);
      const y = r * (sO * cu + cO * su * ci);
      const z = r * (su * si);
      out[k++] = x;
      out[k++] = z;
      out[k++] = -y;
    }
  }
}

/** Static orbit rings (one loop per plane) as line-segment pairs. */
export function ringSegments(s: Shell, steps = 96) {
  const r = radiusOf(s);
  const inc = (s.incDeg * Math.PI) / 180;
  const out = new Float32Array(s.planes * steps * 6);
  let k = 0;
  const pt = (raan: number, u: number) => {
    const x = r * (Math.cos(raan) * Math.cos(u) - Math.sin(raan) * Math.sin(u) * Math.cos(inc));
    const y = r * (Math.sin(raan) * Math.cos(u) + Math.cos(raan) * Math.sin(u) * Math.cos(inc));
    const z = r * Math.sin(u) * Math.sin(inc);
    return [x, z, -y];
  };
  for (let p = 0; p < s.planes; p++) {
    const raan = (2 * Math.PI * p) / s.planes;
    for (let i = 0; i < steps; i++) {
      const a = pt(raan, (2 * Math.PI * i) / steps);
      const b = pt(raan, (2 * Math.PI * (i + 1)) / steps);
      out.set(a, k);
      out.set(b, k + 3);
      k += 6;
    }
  }
  return out;
}

/** Index pairs for in-plane and cross-plane neighbour links. */
export function linkPairs(s: Shell) {
  const pairs: number[] = [];
  for (let p = 0; p < s.planes; p++) {
    for (let j = 0; j < s.perPlane; j++) {
      const i = p * s.perPlane + j;
      pairs.push(i, p * s.perPlane + ((j + 1) % s.perPlane));
      if (p < s.planes - 1) pairs.push(i, (p + 1) * s.perPlane + j);
    }
  }
  return new Uint32Array(pairs);
}

export function satId(s: Shell, index: number) {
  const plane = Math.floor(index / s.perPlane);
  const slot = index % s.perPlane;
  return `${s.regime}-${String(plane + 1).padStart(2, "0")}${String.fromCharCode(65 + (slot % 26))}${slot >= 26 ? Math.floor(slot / 26) : ""}`;
}

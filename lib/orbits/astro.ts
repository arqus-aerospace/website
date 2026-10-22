/* -------------------------------------------------------------------------- */
/*  Just enough astrodynamics to put real objects in the right place.         */
/*                                                                            */
/*  Element sets are CelesTrak OMMs (the same numbers as a TLE). They are      */
/*  propagated here as Kepler orbits with the J2 secular drifts of node,       */
/*  perigee and mean anomaly, plus the TLE's mean-motion-dot term for drag.    */
/*  That is not full SGP4, but within a few days of epoch it puts a LEO        */
/*  object within tens of km along-track, and a GEO object far closer — at     */
/*  the scale of this picture, both are exact.                                 */
/*                                                                            */
/*  Frames: positions come out in the inertial frame (TEME, treated as ECI),  */
/*  in Earth radii. GMST turns that into the Earth-fixed frame, which is what  */
/*  lines the satellites up over the right patch of the textured globe.       */
/* -------------------------------------------------------------------------- */

export const MU = 398600.4418; // km³/s²
export const RE = 6378.137; // km, equatorial radius
export const J2 = 1.08262668e-3;

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;

export type ElementSet = {
  name: string;
  norad: number;
  /** ISO time of the element set. */
  epoch: string;
  /** Mean motion, revolutions per day. */
  n: number;
  e: number;
  /** Inclination, degrees. */
  i: number;
  /** Right ascension of the ascending node, degrees. */
  raan: number;
  /** Argument of perigee, degrees. */
  argp: number;
  /** Mean anomaly at epoch, degrees. */
  M: number;
  /** TLE first derivative term: half of dn/dt, in rev/day². */
  ndot: number;
};

/** Element set with the per-orbit constants worked out once. */
export type Orbit = {
  set: ElementSet;
  epochMs: number;
  /** Semi-major axis, km. */
  a: number;
  e: number;
  inc: number;
  raan0: number;
  argp0: number;
  M0: number;
  /** Mean motion, rad/s. */
  n: number;
  raanDot: number;
  argpDot: number;
  mDot: number;
};

export function makeOrbit(set: ElementSet): Orbit {
  const n = (set.n * TAU) / 86400;
  const a = Math.cbrt(MU / (n * n));
  const e = set.e;
  const inc = set.i * RAD;
  const p = a * (1 - e * e);
  const k = n * J2 * (RE / p) ** 2;
  const c = Math.cos(inc);
  return {
    set,
    epochMs: Date.parse(set.epoch),
    a,
    e,
    inc,
    raan0: set.raan * RAD,
    argp0: set.argp * RAD,
    M0: set.M * RAD,
    n,
    // J2 secular rates, rad/s
    raanDot: -1.5 * k * c,
    argpDot: 0.75 * k * (5 * c * c - 1),
    mDot: n + 0.75 * k * Math.sqrt(1 - e * e) * (3 * c * c - 1),
  };
}

/** Kepler's equation, M = E − e sin E, by Newton's method. */
function eccentricAnomaly(M: number, e: number) {
  let m = M % TAU;
  if (m < 0) m += TAU;
  let E = e < 0.8 ? m : Math.PI;
  for (let k = 0; k < 10; k++) {
    const d = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

export type Vec3 = { x: number; y: number; z: number };

/** Node and perigee at a time, after J2 has turned them. */
function angles(o: Orbit, tMs: number) {
  const dt = (tMs - o.epochMs) / 1000;
  const days = dt / 86400;
  return {
    raan: o.raan0 + o.raanDot * dt,
    argp: o.argp0 + o.argpDot * dt,
    // the TLE's ndot is already halved, so ΔM = ndot·Δt² in revolutions
    M: o.M0 + o.mDot * dt + o.set.ndot * days * days * TAU,
  };
}

/** Perifocal (x along perigee) → inertial, written into out, in Earth radii. */
function toInertial(o: Orbit, raan: number, argp: number, xp: number, yp: number, out: Vec3) {
  const cO = Math.cos(raan), sO = Math.sin(raan);
  const cw = Math.cos(argp), sw = Math.sin(argp);
  const ci = Math.cos(o.inc), si = Math.sin(o.inc);
  out.x = ((cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp) / RE;
  out.y = ((sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp) / RE;
  out.z = (sw * si * xp + cw * si * yp) / RE;
  return out;
}

/** Inertial position at a time, in Earth radii. */
export function positionAt(o: Orbit, tMs: number, out: Vec3 = { x: 0, y: 0, z: 0 }) {
  const { raan, argp, M } = angles(o, tMs);
  const E = eccentricAnomaly(M, o.e);
  const xp = o.a * (Math.cos(E) - o.e);
  const yp = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E);
  return toInertial(o, raan, argp, xp, yp, out);
}

/** The whole ellipse as it stands at a time, as `steps` points in Earth radii. */
export function orbitPath(o: Orbit, tMs: number, steps = 256): Vec3[] {
  const { raan, argp } = angles(o, tMs);
  const pts: Vec3[] = [];
  const b = o.a * Math.sqrt(1 - o.e * o.e);
  for (let k = 0; k <= steps; k++) {
    const E = (k / steps) * TAU;
    pts.push(toInertial(o, raan, argp, o.a * (Math.cos(E) - o.e), b * Math.sin(E), { x: 0, y: 0, z: 0 }));
  }
  return pts;
}

/** Unit normal of the orbit plane at a time, inertial. */
export function orbitNormal(o: Orbit, tMs: number): Vec3 {
  const { raan } = angles(o, tMs);
  return {
    x: Math.sin(o.inc) * Math.sin(raan),
    y: -Math.sin(o.inc) * Math.cos(raan),
    z: Math.cos(o.inc),
  };
}

/** Julian date from Unix milliseconds. */
export const julian = (tMs: number) => tMs / 86400000 + 2440587.5;

/**
 * Greenwich mean sidereal time, radians: the angle the Earth has turned
 * through, which carries the inertial frame onto the Earth-fixed one.
 */
export function gmst(tMs: number) {
  const d = julian(tMs) - 2451545.0;
  const T = d / 36525;
  const deg = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T;
  return ((deg % 360) + 360) % 360 * RAD;
}

/**
 * Unit vector to the Sun, inertial. The Astronomical Almanac's low-precision
 * formula: good to about 0.01°, far finer than the terminator can show.
 */
export function sunDirection(tMs: number): Vec3 {
  const n = julian(tMs) - 2451545.0;
  const L = (280.46 + 0.9856474 * n) * RAD;
  const g = (357.528 + 0.9856003 * n) * RAD;
  const lam = L + (1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  return {
    x: Math.cos(lam),
    y: Math.cos(eps) * Math.sin(lam),
    z: Math.sin(eps) * Math.sin(lam),
  };
}

/** Altitude above the equatorial radius, km. */
export const altitudeKm = (p: Vec3) => Math.hypot(p.x, p.y, p.z) * RE - RE;

/** Sub-satellite longitude, degrees east, from an inertial position. */
export function longitudeOf(p: Vec3, tMs: number) {
  const lon = (Math.atan2(p.y, p.x) - gmst(tMs)) / RAD;
  return ((lon + 540) % 360) - 180;
}

/** The Moon's mean radius, km. */
export const MOON_RADIUS_KM = 1737.4;
/** The Moon's gravitational parameter, km³/s². */
export const MU_MOON = 4902.8;

/**
 * The Moon's position, inertial (equatorial), in Earth radii. The
 * low-precision series from the Astronomical Almanac: good to a few tenths of
 * a degree and a few hundred km, which at this scale is exact.
 */
export function moonPosition(tMs: number, out: Vec3 = { x: 0, y: 0, z: 0 }): Vec3 {
  const d = julian(tMs) - 2451545.0;
  const L = (218.316 + 13.176396 * d) * RAD; // mean longitude
  const M = (134.963 + 13.064993 * d) * RAD; // mean anomaly
  const F = (93.272 + 13.22935 * d) * RAD; // argument of latitude
  const lam = L + 6.289 * RAD * Math.sin(M); // ecliptic longitude
  const beta = 5.128 * RAD * Math.sin(F); // ecliptic latitude
  const distKm = 385001 - 20905 * Math.cos(M);
  const eps = (23.439 - 0.0000004 * d) * RAD;
  // ecliptic → equatorial
  const xe = Math.cos(beta) * Math.cos(lam);
  const ye = Math.cos(beta) * Math.sin(lam);
  const ze = Math.sin(beta);
  const r = distKm / RE;
  out.x = r * xe;
  out.y = r * (ye * Math.cos(eps) - ze * Math.sin(eps));
  out.z = r * (ye * Math.sin(eps) + ze * Math.cos(eps));
  return out;
}

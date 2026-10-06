// Folder-tab card silhouettes as polygon point lists, so they can be tweened
// vertex-by-vertex and used both as shapes and as holes in a mask.

export type Pt = [number, number];

/** 8-vertex folder shape: a stepped tab on the top edge, chamfered bottom corners. */
export function folder(L: number, T: number, R: number, B: number, c: number, tab = 0.42): Pt[] {
  const tx = L + (R - L) * tab;
  return [
    [L, T],
    [tx, T],
    [tx + c, T + c],
    [R, T + c],
    [R, B - c],
    [R - c, B],
    [L + c, B],
    [L, B - c],
  ];
}

export function lerpPts(a: Pt[], b: Pt[], t: number): Pt[] {
  return a.map(([x, y], i) => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t]);
}

export function polygon(pts: Pt[]) {
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",")})`;
}

/** Full-viewport rect with `hole` punched out (even-odd). */
export function holePolygon(w: number, h: number, hole: Pt[]) {
  const outer = `0px 0px,${w}px 0px,${w}px ${h}px,0px ${h}px,0px 0px`;
  const inner = hole.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",");
  const [x0, y0] = hole[0];
  return `polygon(evenodd,${outer},${inner},${x0.toFixed(1)}px ${y0.toFixed(1)}px)`;
}

export const ease = (t: number) => {
  const k = Math.min(1, Math.max(0, t));
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};

/** Normalised sub-progress of `p` inside [a, b]. */
export const span = (p: number, a: number, b: number) =>
  Math.min(1, Math.max(0, (p - a) / (b - a)));

// Generates public/study/land-dots.json: unit-sphere points (x,y,z, y-up)
// that fall on land, sampled on a Fibonacci lattice.
// Data: Natural Earth via world-atlas (public domain / ISC).
// Usage: node scripts/gen-land-dots.mjs [count]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { feature } from "topojson-client";

const N = Number(process.argv[2] ?? 60000);
const topo = JSON.parse(
  readFileSync(new URL("../node_modules/world-atlas/land-110m.json", import.meta.url)),
);
const land = feature(topo, topo.objects.land);

// Planar even-odd test in lon/lat with per-ring bounding boxes — far faster
// than spherical geoContains and accurate enough for a dot globe.
const rings = [];
for (const f of land.features) {
  const polys =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    for (const ring of poly) {
      let minX = 180, maxX = -180, minY = 90, maxY = -90;
      for (const [x, y] of ring) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      rings.push({ ring, minX, maxX, minY, maxY });
    }
  }
}

function onLand(lon, lat) {
  if (lat < -78) return true; // Antarctic interior
  let inside = false;
  for (const { ring, minX, maxX, minY, maxY } of rings) {
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) continue;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}

const golden = Math.PI * (3 - Math.sqrt(5));
const out = [];
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2;
  const r = Math.sqrt(1 - y * y);
  const theta = golden * i;
  const x = Math.cos(theta) * r;
  const z = Math.sin(theta) * r;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = (Math.atan2(-z, x) * 180) / Math.PI;
  if (onLand(lon, lat)) out.push(+x.toFixed(4), +y.toFixed(4), +z.toFixed(4));
}

mkdirSync(new URL("../public/study/", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../public/study/land-dots.json", import.meta.url),
  JSON.stringify(out),
);
console.log(`${out.length / 3} land points of ${N}`);

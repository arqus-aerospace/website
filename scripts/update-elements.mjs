// Refreshes lib/orbits/elements.json from CelesTrak's GP feed.
//
//   node scripts/update-elements.mjs
//
// CelesTrak rate-limits bursts, so the requests go out one at a time with a
// pause between them. An object that fails keeps its previous element set.

import { readFile, writeFile } from "node:fs/promises";

const FILE = new URL("../lib/orbits/elements.json", import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const data = JSON.parse(await readFile(FILE, "utf8"));
let fresh = 0;

for (const obj of data.objects) {
  const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${obj.norad}&FORMAT=json`;
  try {
    const res = await fetch(url);
    const rows = await res.json();
    const g = rows[0];
    if (!g) throw new Error("no element set");
    Object.assign(obj, {
      name: g.OBJECT_NAME,
      epoch: new Date(g.EPOCH + "Z").toISOString(),
      n: g.MEAN_MOTION,
      e: g.ECCENTRICITY,
      i: g.INCLINATION,
      raan: g.RA_OF_ASC_NODE,
      argp: g.ARG_OF_PERICENTER,
      M: g.MEAN_ANOMALY,
      ndot: g.MEAN_MOTION_DOT,
    });
    fresh++;
    console.log(`ok   ${obj.norad} ${obj.name}  epoch ${obj.epoch}`);
  } catch (err) {
    console.warn(`kept ${obj.norad} ${obj.name}: ${err.message}`);
  }
  await sleep(1500);
}

data.source = `CelesTrak GP (OMM), fetched ${new Date().toISOString().slice(0, 10)}. Refresh with: node scripts/update-elements.mjs`;
await writeFile(FILE, JSON.stringify(data, null, 2) + "\n");
console.log(`${fresh}/${data.objects.length} element sets refreshed`);

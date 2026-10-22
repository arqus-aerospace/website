import elements from "./elements.json";
import type { ElementSet } from "./astro";

/* -------------------------------------------------------------------------- */
/*  What the hero tracks, one scene per target.                               */
/*                                                                            */
/*  Every tracked object flies on its real, current element set. Three of the  */
/*  objects in the old list are gone: Kosmos 2542 re-entered on 2023-10-24,    */
/*  Kosmos 2543 on 2024-08-26 and Kosmos 2558 on 2026-09-12, so there is no    */
/*  orbit left to show. Kosmos 2553 is still up (about 2,000 km, 67°), but no  */
/*  public element set is published for it, so it has no scene either.        */
/*                                                                            */
/*  The Arqus craft are ours and fictional. The swarm that circles each       */
/*  target is drawn by components/ui/orbit-theatre; the patrol below flies     */
/*  on ordinary orbits of its own.                                            */
/* -------------------------------------------------------------------------- */

export const ALL_TRACKED: ElementSet[] = elements.objects as ElementSet[];

/**
 * What the card shows above the name. Freely licensed pictures of these
 * spacecraft barely exist: several are classified and were never shown, and
 * the rest appear only in state-media renderings that are not ours to use.
 * So a card shows a licensed launch photo where there is one, our own 3D
 * reconstruction for one target, and otherwise says plainly there is none.
 */
export type SceneMedia =
  | {
      kind: "photo";
      src: string;
      /** What the picture shows, since it is the launch and not the craft. */
      caption: string;
      credit: string;
      /** CSS object-position, to frame the part worth seeing. */
      focus?: string;
    }
  | { kind: "model" }
  | { kind: "none" };

/**
 * Threat on a five-step scale: 1 low, 2 guarded, 3 elevated, 4 high,
 * 5 severe. These are Arqus's own illustrative readings of public reporting
 * (Secure World Foundation and CSIS counterspace reports, US Space Force
 * statements), not intelligence assessments.
 */
export type Threat = 1 | 2 | 3 | 4 | 5;

export const THREAT_WORDS: Record<Threat, string> = {
  1: "Low",
  2: "Guarded",
  3: "Elevated",
  4: "High",
  5: "Severe",
};

export type Scene = {
  /** Caption name. */
  name: string;
  owner: "RU" | "CN";
  note: string;
  color: string;
  /** NORAD numbers of the bodies boxed in this scene; the first leads. */
  norad: number[];
  /** What it is taken to be for. */
  classification: string;
  threat: Threat;
  /** Launch date of the lead object, from the CelesTrak catalogue. */
  launched: string;
  /** Launch site, in words. */
  site: string;
  media: SceneMedia;
  /** The trend this scene stands for, as a heading. */
  trend: string;
  /** What is going on, in two or three sentences. Placeholder copy. */
  story: string;
};

export const SCENES: Scene[] = [
  {
    name: "Kosmos 2576", owner: "RU", note: "Co-orbital with USA 314 · 2024", color: "#FF5E8A", norad: [59773],
    classification: "Co-orbital inspector · suspected ASAT", threat: 4,
    launched: "2024-05-16", site: "Plesetsk",
    media: {
      kind: "photo",
      src: "/assets/sats/kosmos-2576-launch.png",
      caption: "Soyuz-2.1b fairing, Plesetsk, before launch",
      credit: "Russian Aerospace Forces · CC BY 4.0",
      focus: "50% 22%",
    },
    trend: "Shadowing",
    story: "A Russian inspector launched into the same orbital plane as a US reconnaissance satellite, and has kept pace with it ever since. Close enough to watch it, image it, and, one day, to interfere.",
  },
  {
    name: "Shiyan-24C 01–03", owner: "CN", note: "LEO 'dogfighting' drills · 2024", color: "#FB7185", norad: [58650, 58651, 58652],
    classification: "Coordinated proximity ops · tactics trials", threat: 3,
    launched: "2023-12-25", site: "Sea platform",
    media: { kind: "none" },
    trend: "Dogfighting",
    story: "Three Chinese satellites trading positions around each other in low orbit: pursuit, evasion and coordinated manoeuvre, rehearsed where it will matter. Tactics, not tests.",
  },
  {
    name: "Luch / Olymp-K 1", owner: "RU", note: "GEO loitering near comsats · 2015–", color: "#FF8A3D", norad: [40258],
    classification: "GEO signals intelligence · loitering", threat: 4,
    launched: "2014-09-27", site: "Baikonur",
    media: { kind: "none" },
    trend: "Eavesdropping",
    story: "A Russian satellite that moves between Western communications satellites in geostationary orbit and parks beside them for months, close enough to listen in on what they carry.",
  },
  {
    name: "Shijian-17", owner: "CN", note: "GEO rendezvous & inspection · 2016–", color: "#E879F9", norad: [41838],
    classification: "GEO inspection · rendezvous", threat: 3,
    launched: "2016-11-03", site: "Wenchang",
    media: { kind: "none" },
    trend: "Inspection",
    story: "Years of close approaches to other spacecraft in GEO. Each pass maps how a satellite looks, how it is built and how it reacts when something comes near.",
  },
  {
    name: "Luch / Olymp-K 2", owner: "RU", note: "GEO proximity ops · 2023–", color: "#F5D04A", norad: [55841],
    classification: "GEO signals intelligence · proximity ops", threat: 4,
    launched: "2023-03-12", site: "Baikonur",
    media: { kind: "none" },
    trend: "Stalking",
    story: "The successor to Olymp-K picks up where the first left off: new neighbours, the same patient loitering, and a second pair of ears on the same orbit.",
  },
  {
    name: "Shijian-25 · Shijian-21", owner: "CN", note: "Docked & refuelled in GEO · 2025", color: "#FACC15", norad: [62485, 49330],
    classification: "Grapple, tow & refuel · dual-use servicing", threat: 5,
    launched: "2021-10-24", site: "Xichang",
    media: { kind: "model" },
    trend: "Grapple & tow",
    story: "In 2022 one Chinese satellite took hold of a dead one and towed it out of its slot. In 2025 another docked with it and refuelled it in orbit. A spacecraft that can grab, move and refuel others can also take them away.",
  },
  {
    name: "Shijian-23", owner: "CN", note: "GEO manoeuvring · 2023–", color: "#C084FC", norad: [55131],
    classification: "GEO manoeuvring · inspection", threat: 3,
    launched: "2023-01-08", site: "Wenchang",
    media: {
      kind: "photo",
      src: "/assets/sats/shijian-23-prelaunch.png",
      caption: "Long March 7A with Shijian-23, Wenchang",
      credit: "China News Service · CC BY 4.0",
      focus: "45% 45%",
    },
    trend: "Manoeuvre",
    story: "Frequent, unannounced changes of orbit high above the equator. The point is not where it is, but that nobody can be sure where it will be next.",
  },
  {
    name: "TJS-3", owner: "CN", note: "Released a GEO sub-satellite · 2018", color: "#F97316", norad: [43874],
    classification: "Sub-satellite deployer · proximity ops", threat: 3,
    launched: "2018-12-24", site: "Xichang",
    media: { kind: "none" },
    trend: "Deployment",
    story: "A satellite that set loose a smaller companion in GEO: the pattern of a mothership dispatching an inspector, and a way to put two objects where only one was announced.",
  },
  {
    name: "Queqiao-2", owner: "CN", note: "Holds the far side of the Moon · 2024–", color: "#E0213A", norad: [-2401],
    classification: "Cislunar relay & awareness · dual-use", threat: 3,
    launched: "2024-03-20", site: "Wenchang",
    media: { kind: "none" },
    trend: "Cislunar warfare",
    story: "The contest is already moving past GEO. China keeps a relay on station around the Moon and has flown spacecraft through the distant orbits between here and there. Whoever can see and manoeuvre in the Earth–Moon corridor first will set its rules.",
  },
];

/**
 * Things that orbit the Moon rather than the Earth. No element sets are
 * published for these, so each is a modelled orbit: the right shape, size
 * and period around the Moon, not its true place on it at this moment. The
 * id stands in for a catalogue number.
 */
export type LunarOrbit = {
  id: number;
  name: string;
  /** Altitude above the lunar surface at the low and high points, km. */
  periKm: number;
  apoKm: number;
  /** Plane, degrees, in the Earth's equatorial frame. */
  inc: number;
  raan: number;
  argp: number;
};

export const LUNAR: LunarOrbit[] = [
  // Queqiao-2: elliptical frozen orbit, about 200 × 16,000 km, a 24 h period
  { id: -2401, name: "QUEQIAO-2", periKm: 200, apoKm: 16000, inc: 55, raan: 40, argp: 90 },
];

/** A few more of ours on ordinary orbits, so the sky is never just theirs. */
export const PATROL: Omit<ElementSet, "name">[] = [
  // sun-synchronous, 550 km
  { norad: -1, epoch: "2026-10-18T00:00:00Z", n: 15.05, e: 0.0004, i: 97.6, raan: 120, argp: 90, M: 10, ndot: 0 },
  // mid-inclination LEO, 600 km
  { norad: -1, epoch: "2026-10-18T00:00:00Z", n: 14.9, e: 0.0006, i: 53, raan: 300, argp: 0, M: 200, ndot: 0 },
  // MEO, 20,000 km
  { norad: -1, epoch: "2026-10-18T00:00:00Z", n: 2.006, e: 0.002, i: 55, raan: 30, argp: 0, M: 80, ndot: 0 },
  // GEO
  { norad: -1, epoch: "2026-10-18T00:00:00Z", n: 1.0027, e: 0.0002, i: 0.05, raan: 0, argp: 0, M: 120, ndot: 0 },
  // Molniya-style, high and eccentric
  { norad: -1, epoch: "2026-10-18T00:00:00Z", n: 2.006, e: 0.72, i: 63.4, raan: 200, argp: 270, M: 0, ndot: 0 },
];

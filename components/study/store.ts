"use client";

import { useSyncExternalStore } from "react";
import type { ShellId } from "./orbits";

// ---------------------------------------------------------------------------
// Rig: mutable, per-frame scene targets written by scroll triggers and read in
// useFrame. Kept outside React so scrolling never re-renders the tree.
// ---------------------------------------------------------------------------

export type RigState = {
  dist: number;
  elev: number; // camera elevation (rad)
  yaw: number; // camera azimuth offset (rad)
  shiftX: number; // horizontal film offset, -1..1 (moves globe on screen)
  shiftY: number; // look-at vertical offset (scene units)
  leo: number;
  polar: number;
  sso: number;
  meo: number;
  geo: number;
  links: number;
  rings: number;
  land: number;
  spin: number; // auto-yaw speed (rad/s)
};

export const PRESETS = {
  landing: {
    dist: 3.1, elev: 0.32, yaw: 0, shiftX: -0.42, shiftY: 0.12,
    leo: 1, polar: 0.35, sso: 0, meo: 0, geo: 0, links: 0, rings: 0.18, land: 1, spin: 0.035,
  },
  landingOut: {
    dist: 2.4, elev: 0.18, yaw: 0.4, shiftX: -0.2, shiftY: 0.3,
    leo: 1, polar: 0.2, sso: 0, meo: 0, geo: 0, links: 0.6, rings: 0.1, land: 1, spin: 0.035,
  },
  explorer: {
    dist: 10.5, elev: 0.42, yaw: 0, shiftX: 0.22, shiftY: 0,
    leo: 1, polar: 1, sso: 1, meo: 1, geo: 1, links: 0, rings: 0.22, land: 1, spin: 0.02,
  },
  links: {
    dist: 1.62, elev: 0.08, yaw: 0.9, shiftX: 0, shiftY: 0.62,
    leo: 1, polar: 0, sso: 0, meo: 0, geo: 0, links: 1, rings: 0, land: 1, spin: 0.02,
  },
  persistence: {
    dist: 15, elev: 0.95, yaw: 1.6, shiftX: 0, shiftY: 0,
    leo: 0.25, polar: 0, sso: 0, meo: 1, geo: 1, links: 0, rings: 0.6, land: 1, spin: 0.015,
  },
  coverage: {
    dist: 3.6, elev: 1.25, yaw: 2.4, shiftX: 0, shiftY: 0,
    leo: 0, polar: 1, sso: 1, meo: 0, geo: 0, links: 0, rings: 0.45, land: 1, spin: 0.03,
  },
} satisfies Record<string, RigState>;

export type PresetName = keyof typeof PRESETS;

export const rig = {
  target: { ...PRESETS.landing } as RigState,
  interactive: false,
  timeScale: 90,
  /** User-driven yaw/pitch from dragging (explorer only). */
  drag: { yaw: 0, pitch: 0, vYaw: 0, vPitch: 0 },
  reducedMotion: false,
};

const KEYS = Object.keys(PRESETS.landing) as (keyof RigState)[];

/** Blend two presets into the rig target. */
export function mixPresets(a: PresetName, b: PresetName, t: number) {
  const A = PRESETS[a];
  const B = PRESETS[b];
  const k = Math.min(1, Math.max(0, t));
  const e = k * k * (3 - 2 * k); // smoothstep
  for (const key of KEYS) rig.target[key] = A[key] + (B[key] - A[key]) * e;
}

export function setPreset(p: PresetName) {
  Object.assign(rig.target, PRESETS[p]);
}

// ---------------------------------------------------------------------------
// UI store: low-frequency state that the DOM HUD renders.
// ---------------------------------------------------------------------------

export type SatInfo = { shell: ShellId; index: number };

export type UiState = {
  hovered: SatInfo | null;
  selected: SatInfo | null;
  enabled: Record<ShellId, boolean>;
  timeScale: number;
  frame: "dark" | "light";
  nav: string;
  canvasVisible: boolean;
  interactive: boolean;
  briefing: boolean;
  menu: boolean;
};

let ui: UiState = {
  hovered: null,
  selected: null,
  enabled: { leo: true, polar: true, sso: true, meo: true, geo: true },
  timeScale: 90,
  frame: "dark",
  nav: "landing",
  canvasVisible: true,
  interactive: false,
  briefing: false,
  menu: false,
};

const listeners = new Set<() => void>();

export function getUi() {
  return ui;
}

export function setUi(patch: Partial<UiState> | ((s: UiState) => Partial<UiState>)) {
  const next = typeof patch === "function" ? patch(ui) : patch;
  let changed = false;
  for (const k in next) {
    if (ui[k as keyof UiState] !== next[k as keyof UiState]) changed = true;
  }
  if (!changed) return;
  ui = { ...ui, ...next };
  if ("timeScale" in next && next.timeScale !== undefined) rig.timeScale = next.timeScale;
  if ("interactive" in next && next.interactive !== undefined) rig.interactive = next.interactive;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useUi<T>(select: (s: UiState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(ui),
    () => select(ui),
  );
}

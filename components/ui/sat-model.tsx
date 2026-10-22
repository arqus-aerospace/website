"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* -------------------------------------------------------------------------- */
/*  Shijian-21, as we reconstruct it.                                         */
/*                                                                            */
/*  No licensed picture of the spacecraft exists, so this is built from what  */
/*  has been said in public about it: a GEO-class box bus under gold foil, a  */
/*  solar wing either side, a capture arm (it grappled the dead BeiDou-2 G2   */
/*  and towed it to a graveyard orbit in 2022), a docking ring on the face    */
/*  Shijian-25 later docked to, and a dish. Proportions are plausible, not    */
/*  measured. Shown small in the target card, turning, with a faint vector    */
/*  outline over the edges.                                                   */
/* -------------------------------------------------------------------------- */

export interface SatModelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Seconds per turn. */
  turnSeconds?: number;
}

/** A canvas texture of solar cells: dark blue squares on a lighter grid. */
function cellTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#3a4a66";
  g.fillRect(0, 0, 256, 128);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 16; x++) {
      const shade = 18 + Math.floor(Math.random() * 10);
      g.fillStyle = `rgb(${shade},${shade + 14},${shade + 46})`;
      g.fillRect(x * 16 + 1, y * 16 + 1, 14, 14);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Crinkled gold foil: a noisy bump map, so the light breaks up across it. */
function foilBump() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.random() * 90;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.filter = "blur(1.2px)";
  g.drawImage(c, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}

function buildSatellite() {
  const root = new THREE.Group();
  const edges = new THREE.LineBasicMaterial({ color: 0xf07427, transparent: true, opacity: 0.35 });
  const outline = (mesh: THREE.Mesh) => {
    const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 25), edges);
    mesh.add(l);
    return mesh;
  };

  const foil = new THREE.MeshStandardMaterial({
    color: 0xd4a548, metalness: 0.95, roughness: 0.32, bumpMap: foilBump(), bumpScale: 0.6,
  });
  const radiator = new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 0.4, roughness: 0.45 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.85, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x23262b, metalness: 0.6, roughness: 0.5 });
  const cells = new THREE.MeshStandardMaterial({ map: cellTexture(), metalness: 0.35, roughness: 0.35 });
  const white = new THREE.MeshStandardMaterial({ color: 0xeeeeea, metalness: 0.1, roughness: 0.55, side: THREE.DoubleSide });

  // bus: gold on four faces, white radiators north and south
  const bus = outline(
    new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.4), [radiator, radiator, foil, foil, foil, foil])
  );
  root.add(bus);

  // solar wings, three panels each on a yoke
  for (const side of [-1, 1]) {
    const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), metal);
    yoke.rotation.z = Math.PI / 2;
    yoke.position.set(side * 1.15, 0, 0);
    root.add(yoke);
    for (let k = 0; k < 3; k++) {
      const panel = outline(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.02, 0.95), cells));
      panel.position.set(side * (1.55 + 0.63 + k * 1.3), 0, 0);
      root.add(panel);
    }
  }

  // dish on the earth face
  const dishProfile: THREE.Vector2[] = [];
  for (let k = 0; k <= 12; k++) {
    const r = (k / 12) * 0.55;
    dishProfile.push(new THREE.Vector2(r, (r * r) / 0.9));
  }
  const dish = new THREE.Mesh(new THREE.LatheGeometry(dishProfile, 40), white);
  dish.rotation.x = Math.PI;
  dish.position.set(0.25, -0.9 - 0.32, 0.2);
  root.add(dish);
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 6), metal);
  feed.position.set(0.25, -1.08, 0.2);
  root.add(feed);

  // docking ring on the anti-earth face, where Shijian-25 came in
  const ring = outline(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 10, 36), metal));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(-0.25, 0.95, -0.2);
  root.add(ring);

  // the capture arm, folded out from the forward face
  const arm = new THREE.Group();
  arm.position.set(0.35, 0.35, 0.72);
  const joint = (r: number) => new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), dark);
  arm.add(joint(0.09));
  const upper = new THREE.Group();
  upper.rotation.set(-0.9, 0.35, 0);
  arm.add(upper);
  const boom1 = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.9, 10), radiator));
  boom1.position.y = 0.45;
  upper.add(boom1);
  const elbow = new THREE.Group();
  elbow.position.y = 0.9;
  elbow.rotation.x = 1.5;
  elbow.add(joint(0.075));
  upper.add(elbow);
  const boom2 = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 10), radiator));
  boom2.position.y = 0.4;
  elbow.add(boom2);
  const wrist = new THREE.Group();
  wrist.position.y = 0.8;
  wrist.add(joint(0.06));
  elbow.add(wrist);
  // three-finger end effector
  for (let f = 0; f < 3; f++) {
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.2, 0.025), metal);
    const a = (f / 3) * Math.PI * 2;
    finger.position.set(Math.cos(a) * 0.06, 0.12, Math.sin(a) * 0.06);
    finger.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
    wrist.add(finger);
  }
  root.add(arm);

  // thruster bells at the aft corners
  for (const [x, z] of [[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.6], [0.7, 0.6]]) {
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 12, 1, true), dark);
    bell.position.set(x, -0.98, z);
    root.add(bell);
  }

  return root;
}

export function SatModel({ turnSeconds = 18, className = "", ...rest }: SatModelProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 2, 0.1, 100);
    camera.position.set(0, 1.3, 10.5);
    camera.lookAt(0, 0, 0);

    // a hard warm sun, a cool rim from behind, very little fill: space light
    const sun = new THREE.DirectionalLight(0xffd2a0, 3.2);
    sun.position.set(5, 3, 4);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x5fd0e0, 1.1);
    rim.position.set(-4, -1, -5);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0x404858, 0.35));
    // something for the foil to reflect
    const pmrem = new THREE.PMREMGenerator(renderer);
    const sky = new THREE.Scene();
    sky.background = new THREE.Color(0x0a0d14);
    const glowA = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8), new THREE.MeshBasicMaterial({ color: 0xffb070 }));
    glowA.position.set(6, 3, 4);
    sky.add(glowA);
    const env = pmrem.fromScene(sky, 0.04).texture;
    scene.environment = env;

    const sat = buildSatellite();
    sat.rotation.set(0.35, 0, 0.12);
    scene.add(sat);

    const resize = () => {
      const r = host.getBoundingClientRect();
      const w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      // the card hides this when another target is up; skip the work then
      if (host.offsetParent === null || document.hidden) return;
      if (!reduced) {
        sat.rotation.y += (dt * Math.PI * 2) / turnSeconds;
        sat.position.y = Math.sin(now / 1600) * 0.08;
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [turnSeconds]);

  return <div ref={hostRef} aria-hidden="true" className={className} {...rest} />;
}

export default SatModel;

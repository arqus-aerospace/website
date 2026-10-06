"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Billboard, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  EARTH_ROT,
  SHELLS,
  SHELL_BY_ID,
  linkPairs,
  periodMin,
  propagate,
  radiusOf,
  ringSegments,
  satId,
  shellCount,
  velocityKms,
  type Shell,
  type ShellId,
} from "./orbits";
import { PRESETS, getUi, rig, setUi, useUi, type RigState } from "./store";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SUN = new THREE.Vector3(-0.55, 0.35, 0.76).normalize();

// Shared per-frame state between scene components.
const live = {
  current: { ...PRESETS.landing } as RigState,
  simT: 0,
  spin: 0,
  positions: {} as Partial<Record<ShellId, Float32Array>>,
  enabled: { leo: 1, polar: 1, sso: 1, meo: 1, geo: 1 } as Record<ShellId, number>,
};

const damp = (a: number, b: number, lambda: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-lambda * dt));

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------

const pointVert = /* glsl */ `
  uniform float uSize;
  uniform float uPR;
  varying float vShade;
  uniform vec3 uSun;
  uniform float uLit;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPR * clamp(pow(3.2 / -mv.z, 0.6), 0.35, 2.2);
    vec3 n = normalize((modelMatrix * vec4(position, 0.0)).xyz);
    vShade = mix(1.0, 0.28 + 0.72 * smoothstep(-0.25, 0.45, dot(n, uSun)), uLit);
  }
`;

const pointFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vShade;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(uColor * vShade, a * uOpacity);
  }
`;

const oceanVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = normalize(wp.xyz);
    vN = normalize(normalMatrix * normal);
    vec4 mv = viewMatrix * wp;
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const oceanFrag = /* glsl */ `
  uniform vec3 uSun;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    float fres = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
    float day = smoothstep(-0.2, 0.6, dot(vW, uSun));
    vec3 night = vec3(0.020, 0.030, 0.055);
    vec3 dayc = vec3(0.045, 0.075, 0.125);
    vec3 col = mix(night, dayc, day) + vec3(0.25, 0.38, 0.62) * fres * (0.25 + 0.75 * day);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const atmoFrag = /* glsl */ `
  uniform vec3 uSun;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    float fres = pow(1.0 - abs(dot(vN, vV)), 4.0);
    float day = smoothstep(-0.4, 0.6, dot(vW, uSun));
    gl_FragColor = vec4(vec3(0.45, 0.62, 1.0) * fres, fres * (0.15 + 0.6 * day));
  }
`;

function pointMaterial(color: string, size: number, lit = 0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 1 },
      uSize: { value: size },
      uPR: { value: 1 },
      uSun: { value: SUN },
      uLit: { value: lit },
    },
    vertexShader: pointVert,
    fragmentShader: pointFrag,
    transparent: true,
    depthWrite: false,
  });
}

// ---------------------------------------------------------------------------
// Camera rig — eases toward scroll-set targets, adds drag + auto-spin.
// ---------------------------------------------------------------------------

function Rig() {
  const { camera, gl, raycaster } = useThree();
  const dragging = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (!rig.interactive) return;
      dragging.current = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragging.current.x;
      const dy = e.clientY - dragging.current.y;
      dragging.current = { x: e.clientX, y: e.clientY };
      rig.drag.vYaw = -dx * 0.0045;
      rig.drag.vPitch = dy * 0.0035;
      rig.drag.yaw += rig.drag.vYaw;
      rig.drag.pitch = Math.max(-0.9, Math.min(0.9, rig.drag.pitch + rig.drag.vPitch));
    };
    const up = () => {
      dragging.current = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const c = live.current;
    const t = rig.target;
    const lambda = rig.reducedMotion ? 30 : 3.2;
    for (const k in t) {
      const key = k as keyof RigState;
      c[key] = damp(c[key], t[key], lambda, dt);
    }

    live.simT += dt * rig.timeScale;
    if (!rig.reducedMotion) live.spin += c.spin * dt;

    const d = rig.drag;
    if (!dragging.current) {
      d.yaw += d.vYaw;
      d.vYaw *= 0.93;
      d.vPitch *= 0.9;
      if (!rig.interactive) {
        d.yaw = damp(d.yaw, 0, 1.5, dt);
        d.pitch = damp(d.pitch, 0, 1.5, dt);
      }
    }

    const yaw = c.yaw + live.spin + d.yaw;
    const elev = Math.max(-1.45, Math.min(1.45, c.elev + d.pitch));
    camera.position.set(
      c.dist * Math.cos(elev) * Math.sin(yaw),
      c.dist * Math.sin(elev),
      c.dist * Math.cos(elev) * Math.cos(yaw),
    );
    camera.lookAt(0, c.shiftY, 0);
    const cam = camera as THREE.PerspectiveCamera;
    cam.filmOffset = c.shiftX * cam.getFilmWidth() * 0.5;
    cam.updateProjectionMatrix();

    raycaster.params.Points = { threshold: c.dist * 0.012 };

    const enabled = getUi().enabled;
    for (const s of SHELLS) {
      live.enabled[s.id] = damp(live.enabled[s.id], enabled[s.id] ? 1 : 0, 6, dt);
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// Globe
// ---------------------------------------------------------------------------

function Globe() {
  const group = useRef<THREE.Group>(null);
  const landMat = useMemo(() => pointMaterial("#e1e0cc", 1.6, 1), []);
  const landGeo = useMemo(() => new THREE.BufferGeometry(), []);
  const { gl } = useThree();

  useEffect(() => {
    let alive = true;
    fetch(`${BASE}/study/land-dots.json`)
      .then((r) => r.json())
      .then((arr: number[]) => {
        if (!alive) return;
        const pos = new Float32Array(arr.length);
        for (let i = 0; i < arr.length; i++) pos[i] = arr[i] * 1.002;
        landGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        landGeo.computeBoundingSphere();
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [landGeo]);

  const ocean = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uSun: { value: SUN } },
        vertexShader: oceanVert,
        fragmentShader: oceanFrag,
      }),
    [],
  );
  const atmo = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uSun: { value: SUN } },
        vertexShader: oceanVert,
        fragmentShader: atmoFrag,
        side: THREE.BackSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useFrame(() => {
    if (group.current) group.current.rotation.y = EARTH_ROT * live.simT;
    landMat.uniforms.uOpacity.value = live.current.land;
    landMat.uniforms.uPR.value = gl.getPixelRatio();
  });

  const block = (e: ThreeEvent<PointerEvent>) => e.stopPropagation();

  return (
    <>
      <group ref={group}>
        <mesh material={ocean} onPointerMove={block} onPointerOver={block}>
          <sphereGeometry args={[0.996, 96, 96]} />
        </mesh>
        <points geometry={landGeo} material={landMat} />
      </group>
      <mesh material={atmo} scale={1.075}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
    </>
  );
}

function Stars() {
  const geo = useMemo(() => {
    const n = 1800;
    const pos = new Float32Array(n * 3);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const r = 120 + rnd() * 60;
      const s = Math.sqrt(1 - u * u);
      pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const mat = useMemo(() => {
    const m = pointMaterial("#c9d2e6", 40);
    m.uniforms.uOpacity.value = 0.45;
    return m;
  }, []);
  const { gl } = useThree();
  useFrame(() => {
    mat.uniforms.uPR.value = gl.getPixelRatio();
  });
  return <points geometry={geo} material={mat} />;
}

// ---------------------------------------------------------------------------
// Constellation shells
// ---------------------------------------------------------------------------

function ShellLayer({ shell }: { shell: Shell }) {
  const { gl } = useThree();
  const count = shellCount(shell);
  const r = radiusOf(shell);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(positions, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", attr);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), r * 1.05);
    return g;
  }, [positions, r]);
  const mat = useMemo(() => pointMaterial(shell.color, shell.size * 3.2), [shell]);

  const ringGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(ringSegments(shell), 3));
    return g;
  }, [shell]);
  const ringMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: shell.color,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    [shell],
  );

  const pairs = useMemo(() => (shell.links ? linkPairs(shell) : null), [shell]);
  const linkPos = useMemo(() => (pairs ? new Float32Array(pairs.length * 3) : null), [pairs]);
  const linkGeo = useMemo(() => {
    if (!linkPos) return null;
    const g = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(linkPos, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", attr);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), r * 1.05);
    return g;
  }, [linkPos, r]);
  const linkMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#ff9a52",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  const pts = useRef<THREE.Points>(null);
  const rings = useRef<THREE.LineSegments>(null);
  const links = useRef<THREE.LineSegments>(null);

  useEffect(() => {
    live.positions[shell.id] = positions;
    return () => {
      delete live.positions[shell.id];
    };
  }, [positions, shell.id]);

  useFrame(() => {
    const o = live.current[shell.id] * live.enabled[shell.id];
    const visible = o > 0.01;
    if (pts.current) pts.current.visible = visible;
    if (rings.current) rings.current.visible = visible && live.current.rings > 0.01;
    if (!visible) return;

    propagate(shell, live.simT, positions);
    geo.attributes.position.needsUpdate = true;
    mat.uniforms.uOpacity.value = o;
    mat.uniforms.uPR.value = gl.getPixelRatio();
    ringMat.opacity = live.current.rings * o * Math.min(1, 5 / shell.planes + 0.12);

    if (pairs && linkPos && linkGeo && links.current) {
      const lo = live.current.links * o;
      links.current.visible = lo > 0.01;
      linkMat.opacity = lo * 0.55;
      if (lo > 0.01) {
        for (let i = 0; i < pairs.length; i++) {
          const src = pairs[i] * 3;
          linkPos[i * 3] = positions[src];
          linkPos[i * 3 + 1] = positions[src + 1];
          linkPos[i * 3 + 2] = positions[src + 2];
        }
        linkGeo.attributes.position.needsUpdate = true;
      }
    }
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!rig.interactive || e.index === undefined) return;
    if (live.current[shell.id] * live.enabled[shell.id] < 0.3) return;
    e.stopPropagation();
    const h = getUi().hovered;
    if (!h || h.shell !== shell.id || h.index !== e.index) {
      setUi({ hovered: { shell: shell.id, index: e.index } });
    }
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    const h = getUi().hovered;
    if (h && h.shell === shell.id) setUi({ hovered: null });
    document.body.style.cursor = "";
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!rig.interactive || e.index === undefined) return;
    e.stopPropagation();
    setUi({ selected: { shell: shell.id, index: e.index } });
  };

  return (
    <group>
      <lineSegments ref={rings} geometry={ringGeo} material={ringMat} />
      {linkGeo && <lineSegments ref={links} geometry={linkGeo} material={linkMat} />}
      <points
        ref={pts}
        geometry={geo}
        material={mat}
        onPointerMove={onMove}
        onPointerOut={onOut}
        onClick={onClick}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Hover / selection marker with live caption
// ---------------------------------------------------------------------------

function Marker() {
  const hovered = useUi((s) => s.hovered);
  const selected = useUi((s) => s.selected);
  const interactive = useUi((s) => s.interactive);
  const target = interactive ? hovered ?? selected : null;
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  const planeGeo = useMemo(() => {
    if (!selected) return null;
    const s = SHELL_BY_ID[selected.shell];
    const plane = Math.floor(selected.index / s.perPlane);
    const all = ringSegments(s, 160);
    const per = 160 * 6;
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(all.slice(plane * per, (plane + 1) * per), 3),
    );
    return g;
  }, [selected]);

  useFrame(({ camera }) => {
    if (!group.current || !target) return;
    const p = live.positions[target.shell];
    if (!p) return;
    const i = target.index * 3;
    group.current.position.set(p[i], p[i + 1], p[i + 2]);
    const scale = group.current.position.distanceTo(camera.position) * 0.022;
    if (ring.current) ring.current.scale.setScalar(scale);
  });

  const shell = target ? SHELL_BY_ID[target.shell] : null;

  return (
    <>
      {interactive && planeGeo && selected && (
        <lineSegments geometry={planeGeo}>
          <lineBasicMaterial color={SHELL_BY_ID[selected.shell].color} transparent opacity={0.9} />
        </lineSegments>
      )}
      <group ref={group} visible={!!target}>
        <Billboard>
          <mesh ref={ring}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthTest={false} />
          </mesh>
        </Billboard>
        {shell && target && (
          <Html
            className="st-satcap"
            style={{ pointerEvents: "none" }}
            position={[0, 0, 0]}
            zIndexRange={[5, 0]}
          >
            <div className="st-satcap__inner">
              <div className="st-satcap__id">
                <span className="st-dot" style={{ background: shell.color }} />
                {satId(shell, target.index)}
              </div>
              <dl>
                <dt>Shell</dt>
                <dd>{shell.label}</dd>
                <dt>Alt</dt>
                <dd>{shell.altKm.toLocaleString("en-US")} km</dd>
                <dt>Inc</dt>
                <dd>{shell.incDeg.toFixed(1)}°</dd>
                <dt>Period</dt>
                <dd>{periodMin(shell).toFixed(1)} min</dd>
                <dt>Vel</dt>
                <dd>{velocityKms(shell).toFixed(2)} km/s</dd>
              </dl>
            </div>
          </Html>
        )}
      </group>
    </>
  );
}

// ---------------------------------------------------------------------------

export default function StudyScene() {
  const visible = useUi((s) => s.canvasVisible);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    rig.reducedMotion = mq.matches;
  }, []);

  return (
    <div className="st-canvas" aria-hidden="true">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ fov: 32, near: 0.01, far: 400, position: [0, 0, 4] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor("#04060b")}
      >
        <Rig />
        <Stars />
        <Globe />
        {SHELLS.map((s) => (
          <ShellLayer key={s.id} shell={s} />
        ))}
        <Marker />
      </Canvas>
    </div>
  );
}

"use client";

import React, { useRef, useEffect } from 'react';

interface HeroProps {
  nav?: {
    logo: string;
    logoSrc?: string;
    ctaText: string;
    onCtaClick?: () => void;
  };
  trustBadge?: {
    text: string;
    icon?: string;
  };
  backedBy?: {
    text: string;
    logos: { src: string; alt: string; height?: number }[];
  };
  headline: {
    line1: string;
    line2: string;
  };
  subtitle: string;
  button?: {
    text: string;
    onClick?: () => void;
  };
  secondButton?: {
    text: string;
    onClick?: () => void;
  };
  scrollIndicator?: boolean;
  className?: string;
}

const useShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const pointersRef = useRef<PointerHandler | null>(null);

  class WebGLRenderer {
    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram | null = null;
    private vs: WebGLShader | null = null;
    private fs: WebGLShader | null = null;
    private buffer: WebGLBuffer | null = null;
    private shaderSource: string;
    private mouseMove: [number, number] = [0, 0];
    private mouseCoords: [number, number] = [0, 0];
    private pointerCoords: number[] = [0, 0];
    private nbrOfPointers = 0;

    private vertexSrc = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`;

    private vertices = [-1, 1, -1, -1, 1, 1, 1, -1];

    constructor(canvas: HTMLCanvasElement, scale: number) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl2')!;
      this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
      this.shaderSource = defaultShaderSource;
    }

    updateShader(source: string) {
      this.reset();
      this.shaderSource = source;
      this.setup();
      this.init();
    }

    updateMove(deltas: [number, number]) { this.mouseMove = deltas; }
    updateMouse(coords: [number, number]) { this.mouseCoords = coords; }
    updatePointerCoords(coords: number[]) { this.pointerCoords = coords; }
    updatePointerCount(nbr: number) { this.nbrOfPointers = nbr; }

    updateScale(scale: number) {
      this.gl.viewport(0, 0, this.canvas.width * scale, this.canvas.height * scale);
    }

    compile(shader: WebGLShader, source: string) {
      const gl = this.gl;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      }
    }

    test(source: string) {
      let result = null;
      const gl = this.gl;
      const shader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        result = gl.getShaderInfoLog(shader);
      }
      gl.deleteShader(shader);
      return result;
    }

    reset() {
      const gl = this.gl;
      if (this.program && !gl.getProgramParameter(this.program, gl.DELETE_STATUS)) {
        if (this.vs) { gl.detachShader(this.program, this.vs); gl.deleteShader(this.vs); }
        if (this.fs) { gl.detachShader(this.program, this.fs); gl.deleteShader(this.fs); }
        gl.deleteProgram(this.program);
      }
    }

    setup() {
      const gl = this.gl;
      this.vs = gl.createShader(gl.VERTEX_SHADER)!;
      this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
      this.compile(this.vs, this.vertexSrc);
      this.compile(this.fs, this.shaderSource);
      this.program = gl.createProgram()!;
      gl.attachShader(this.program, this.vs);
      gl.attachShader(this.program, this.fs);
      gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(this.program));
      }
    }

    init() {
      const gl = this.gl;
      const program = this.program!;
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      (program as any).resolution = gl.getUniformLocation(program, 'resolution');
      (program as any).time = gl.getUniformLocation(program, 'time');
      (program as any).move = gl.getUniformLocation(program, 'move');
      (program as any).touch = gl.getUniformLocation(program, 'touch');
      (program as any).pointerCount = gl.getUniformLocation(program, 'pointerCount');
      (program as any).pointers = gl.getUniformLocation(program, 'pointers');
    }

    render(now = 0) {
      const gl = this.gl;
      const program = this.program;
      if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.uniform2f((program as any).resolution, this.canvas.width, this.canvas.height);
      gl.uniform1f((program as any).time, now * 1e-3);
      gl.uniform2f((program as any).move, ...this.mouseMove);
      gl.uniform2f((program as any).touch, ...this.mouseCoords);
      gl.uniform1i((program as any).pointerCount, this.nbrOfPointers);
      gl.uniform2fv((program as any).pointers, this.pointerCoords);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  class PointerHandler {
    private scale: number;
    private active = false;
    private pointers = new Map<number, [number, number]>();
    private lastCoords: [number, number] = [0, 0];
    private moves: [number, number] = [0, 0];

    constructor(element: HTMLCanvasElement, scale: number) {
      this.scale = scale;
      const map = (el: HTMLCanvasElement, sc: number, x: number, y: number): [number, number] =>
        [x * sc, el.height - y * sc];

      element.addEventListener('pointerdown', (e) => {
        this.active = true;
        this.pointers.set(e.pointerId, map(element, this.scale, e.clientX, e.clientY));
      });
      element.addEventListener('pointerup', (e) => {
        if (this.count === 1) this.lastCoords = this.first;
        this.pointers.delete(e.pointerId);
        this.active = this.pointers.size > 0;
      });
      element.addEventListener('pointerleave', (e) => {
        if (this.count === 1) this.lastCoords = this.first;
        this.pointers.delete(e.pointerId);
        this.active = this.pointers.size > 0;
      });
      element.addEventListener('pointermove', (e) => {
        if (!this.active) return;
        this.lastCoords = [e.clientX, e.clientY];
        this.pointers.set(e.pointerId, map(element, this.scale, e.clientX, e.clientY));
        this.moves = [this.moves[0] + e.movementX, this.moves[1] + e.movementY];
      });
    }

    updateScale(scale: number) { this.scale = scale; }
    get count() { return this.pointers.size; }
    get move() { return this.moves; }
    get coords() {
      return this.pointers.size > 0 ? Array.from(this.pointers.values()).flat() : [0, 0];
    }
    get first(): [number, number] {
      return this.pointers.values().next().value || this.lastCoords;
    }
  }

  const resize = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    if (rendererRef.current) rendererRef.current.updateScale(dpr);
  };

  const loop = (now: number) => {
    if (!rendererRef.current || !pointersRef.current) return;
    rendererRef.current.updateMouse(pointersRef.current.first);
    rendererRef.current.updatePointerCount(pointersRef.current.count);
    rendererRef.current.updatePointerCoords(pointersRef.current.coords);
    rendererRef.current.updateMove(pointersRef.current.move);
    rendererRef.current.render(now);
    animationFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);
    rendererRef.current = new WebGLRenderer(canvas, dpr);
    pointersRef.current = new PointerHandler(canvas, dpr);
    rendererRef.current.setup();
    rendererRef.current.init();
    resize();
    if (rendererRef.current.test(defaultShaderSource) === null) {
      rendererRef.current.updateShader(defaultShaderSource);
    }
    loop(0);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (rendererRef.current) rendererRef.current.reset();
    };
  }, []);

  return canvasRef;
};

const Hero: React.FC<HeroProps> = ({
  nav,
  trustBadge,
  headline,
  subtitle,
  button,
  secondButton,
  scrollIndicator = false,
  backedBy,
  className = ""
}) => {
  const canvasRef = useShaderBackground();

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-black ${className}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-16px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(24px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes line-grow {
            from { transform: scaleY(0); opacity: 0; }
            to { transform: scaleY(1); opacity: 1; }
          }
          .animate-fade-in-down {
            animation: fade-in-down 1s ease-out forwards;
          }
          .animate-fade-in-up {
            animation: fade-in-up 1s ease-out forwards;
            opacity: 0;
          }
          .animate-fade-in {
            animation: fade-in 1.2s ease-out forwards;
            opacity: 0;
          }
          .animate-line-grow {
            animation: line-grow 1.5s ease-out forwards;
            transform-origin: top;
          }
          .delay-100 { animation-delay: 0.1s; }
          .delay-200 { animation-delay: 0.2s; }
          .delay-400 { animation-delay: 0.4s; }
          .delay-600 { animation-delay: 0.6s; }
          .delay-800 { animation-delay: 0.8s; }
          .delay-1000 { animation-delay: 1.0s; }
          .delay-1200 { animation-delay: 1.2s; }
        `
      }} />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain touch-none"
        style={{ background: 'black' }}
      />

      {/* Vignette overlay for depth */}
      <div className="absolute inset-0 z-[1]" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)'
      }} />

      {/* Nav */}
      {nav && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 md:px-12 py-7 animate-fade-in delay-100">
          {nav.logoSrc ? (
            <img src={nav.logoSrc} alt={nav.logo} className="h-8 w-auto select-none" />
          ) : (
            <span className="text-white/90 font-medium tracking-[0.3em] text-xs uppercase select-none">
              {nav.logo}
            </span>
          )}
          <button
            onClick={nav.onCtaClick}
            className="px-6 py-2.5 border border-white/30 hover:border-white/60 hover:bg-white/5 text-white/85 hover:text-white text-xs tracking-[0.2em] uppercase transition-all duration-300"
          >
            {nav.ctaText}
          </button>
        </div>
      )}

      {/* Hero Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white px-4">

        {/* Trust Badge */}
        {trustBadge && (
          <div className="mb-10 animate-fade-in-down">
            <div className="flex items-center justify-center gap-3 px-5 py-2 border border-white/20 bg-white/[0.05] backdrop-blur-sm text-[11px] tracking-[0.2em] uppercase text-white/65 text-center">
              {trustBadge.icon && (
                <span className="text-cyan-400/70">{trustBadge.icon}</span>
              )}
              {trustBadge.text}
            </div>
          </div>
        )}

        <div className="text-center space-y-8 max-w-5xl mx-auto">
          {/* Headline */}
          <div className="space-y-1">
            <h1 className="text-5xl md:text-7xl lg:text-[88px] font-bold text-white tracking-tight leading-none animate-fade-in-up delay-200">
              {headline.line1}
            </h1>
            <h1 className="text-5xl md:text-7xl lg:text-[88px] font-bold tracking-tight leading-none animate-fade-in-up delay-400"
              style={{
                backgroundImage: 'linear-gradient(90deg, #ffffff 0%, #bfdbfe 50%, #67e8f9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {headline.line2}
            </h1>
          </div>

          {/* Divider line */}
          <div className="flex justify-center animate-fade-in delay-600">
            <div className="w-px h-8 animate-line-grow delay-600"
              style={{ background: 'linear-gradient(to bottom, rgba(103,232,249,0.4), transparent)' }}
            />
          </div>

          {/* Subtitle */}
          <div className="max-w-xl mx-auto animate-fade-in-up delay-600">
            <p className="text-base md:text-lg text-white/65 font-light leading-relaxed tracking-wide">
              {subtitle}
            </p>
          </div>

          {/* CTA */}
          {(button || secondButton) && (
            <div className="pt-2 animate-fade-in-up delay-800 flex flex-wrap gap-4 justify-center">
              {button && (
                <button
                  onClick={button.onClick}
                  className="group px-10 py-4 border border-white/30 hover:border-cyan-400/50 hover:bg-cyan-400/5 text-white/85 hover:text-white text-xs tracking-[0.25em] uppercase transition-all duration-500"
                >
                  {button.text}
                  <span className="inline-block ml-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">→</span>
                </button>
              )}
              {secondButton && (
                <button
                  onClick={secondButton.onClick}
                  className="group px-10 py-4 border border-white/20 hover:border-white/40 hover:bg-white/5 text-white/60 hover:text-white/85 text-xs tracking-[0.25em] uppercase transition-all duration-500"
                >
                  {secondButton.text}
                  <span className="inline-block ml-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">→</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backed By */}
      {backedBy && (
        <div className="absolute bottom-8 left-8 md:left-12 z-10 animate-fade-in delay-1000">
          <div className="flex flex-col gap-2">
            <span className="text-white/45 tracking-[0.25em] uppercase" style={{ fontSize: 'clamp(11px, 1.25vw, 18px)' }}>{backedBy.text}</span>
            <div className="flex items-center gap-4">
              {backedBy.logos.map((logo, i) => (
                <img
                  key={i}
                  src={logo.src}
                  alt={logo.alt}
                  style={{ height: `clamp(${Math.round((logo.height ?? 20) * 0.33)}px, ${((logo.height ?? 20) / 1440 * 100).toFixed(2)}vw, ${logo.height ?? 20}px)`, mixBlendMode: 'screen', filter: 'brightness(2)' }}
                  className="w-auto opacity-90 select-none"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scroll Indicator */}
      {scrollIndicator && (
        <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center animate-fade-in delay-1200">
          <div className="flex flex-col items-center gap-3">
            <span className="text-white/20 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
            <div className="w-px h-10 animate-line-grow delay-1200"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const defaultShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)

float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}

float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float a=rnd(i), b=rnd(i+vec2(1,0)), c=rnd(i+vec2(0,1)), d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}

float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}

float clouds(vec2 p) {
  float d=1., t=.0;
  for (float i=.0; i<3.; i++) {
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a);
    d=a;
    p*=2./(i+1.);
  }
  return t;
}

void main(void) {
  vec2 uv=(FC-.5*R)/MN, st=uv*vec2(2,1);
  vec3 stars=vec3(0);
  vec3 sky=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);

  for (float i=1.; i<12.; i++) {
    uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    // Fiery yellow/orange stars
    stars+=.00125/d*(cos(sin(i)*vec3(5.,3.,1.))+1.);
    float b=noise(i+p+bg*1.731);
    stars+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    // Blue sky
    sky=mix(sky,vec3(bg*.02,bg*.06,bg*.25),d);
  }

  // Dark amber/red palette for stars
  stars = vec3(stars.r*0.9, stars.g*0.35, stars.b*0.04);
  // Deep blue palette for sky/clouds
  sky = vec3(sky.r*0.05, sky.g*0.12, sky.b*0.7);

  vec3 col = clamp((stars + sky) * 0.55, 0.0, 1.0);
  O=vec4(col,1);
}`;

export default Hero;

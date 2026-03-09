"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ThermodynamicGridProps extends React.HTMLAttributes<HTMLDivElement> {
  glowRadius?: number;
}

interface Pulse {
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

const ThermodynamicGrid = ({
  className,
  glowRadius = 60,
  style,
  ...props
}: ThermodynamicGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animFrameId: number;

    const mouse = { x: -9999, y: -9999, inside: false };
    const pulses: Pulse[] = [];

    const resize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.inside = mouse.x >= 0 && mouse.x <= width && mouse.y >= 0 && mouse.y <= height;
    };

    const handleMouseLeave = () => { mouse.inside = false; };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= width && y >= 0 && y <= height) {
        pulses.push({ x, y, startTime: performance.now(), duration: 800 });
      }
    };

    const update = () => {
      ctx.clearRect(0, 0, width, height);

      // Cursor glow
      if (mouse.inside) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, glowRadius);
        g.addColorStop(0,   "rgba(249,115,22,0.18)");
        g.addColorStop(0.4, "rgba(249,115,22,0.07)");
        g.addColorStop(1,   "rgba(249,115,22,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Click pulses
      const now = performance.now();
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        const progress = (now - pulse.startTime) / pulse.duration;
        if (progress >= 1) { pulses.splice(i, 1); continue; }

        const ease = 1 - Math.pow(1 - progress, 3);
        const r = ease * 80;
        const alpha = (1 - progress) * 0.85;

        // Glow halo
        ctx.save();
        ctx.filter = "blur(3px)";
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249,115,22,${alpha * 0.4})`;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();

        // Crisp ring
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249,115,22,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animFrameId = requestAnimationFrame(update);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    container.addEventListener("mouseleave", handleMouseLeave);

    resize();
    update();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animFrameId);
    };
  }, [glowRadius]);

  return (
    <div
      ref={containerRef}
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      style={style}
      {...props}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default ThermodynamicGrid;

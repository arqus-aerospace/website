"use client";

import { useRef, useEffect } from "react";

export default function CursorGlow({ glowRadius = 70 }: { glowRadius?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animFrameId: number;
    const mouse = { x: -9999, y: -9999 };

    interface Pulse { x: number; y: number; startTime: number; duration: number; }
    const pulses: Pulse[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleClick = (e: MouseEvent) => {
      pulses.push({ x: e.clientX, y: e.clientY, startTime: performance.now(), duration: 800 });
    };

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cursor glow
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, glowRadius);
      g.addColorStop(0,   "rgba(249,115,22,0.18)");
      g.addColorStop(0.4, "rgba(249,115,22,0.07)");
      g.addColorStop(1,   "rgba(249,115,22,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

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

    resize();
    update();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animFrameId);
    };
  }, [glowRadius]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
    />
  );
}

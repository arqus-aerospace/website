"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#%<>_=+";

/**
 * Text that decodes from random glyphs on first view and again on hover.
 * The real text is always in the DOM for assistive tech.
 */
export default function Scramble({
  text,
  as: Tag = "span",
  className,
  hover = true,
  delay = 0,
}: {
  text: string;
  as?: "span" | "p" | "div" | "h2" | "h3";
  className?: string;
  hover?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const inner = el.querySelector<HTMLElement>("[data-scr]");
    if (!inner) return;

    const run = () => {
      cancelAnimationFrame(raf.current);
      const start = performance.now() + delay;
      const dur = Math.min(900, 260 + text.length * 28);
      const step = (now: number) => {
        const p = Math.max(0, (now - start) / dur);
        let s = "";
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === " " || p >= (i + 1) / text.length) s += ch;
          else if (p > i / text.length - 0.35) s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
          else s += ch === " " ? " " : " ";
        }
        inner.textContent = s;
        if (p < 1) raf.current = requestAnimationFrame(step);
        else inner.textContent = text;
      };
      raf.current = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    const enter = () => run();
    if (hover) el.addEventListener("mouseenter", enter);
    return () => {
      io.disconnect();
      el.removeEventListener("mouseenter", enter);
      cancelAnimationFrame(raf.current);
    };
  }, [text, hover, delay]);

  return (
    <Tag ref={ref as React.RefObject<never>} className={className} aria-label={text}>
      <span data-scr aria-hidden="true">
        {text}
      </span>
    </Tag>
  );
}

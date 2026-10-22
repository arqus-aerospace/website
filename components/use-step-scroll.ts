"use client";

import { useEffect } from "react";

/**
 * One gesture, one step. Over the first `steps` screens of the page (the
 * pinned stage, then the top of whatever follows it), scrolling never stops
 * between screens: a wheel notch, a trackpad swipe, a touch swipe or an arrow
 * or page key moves exactly one screen, gliding there. A gesture is a burst
 * of events with no gap longer than GESTURE_GAP, so the momentum tail of a
 * trackpad flick cannot carry on into a second step. Past the last step the
 * page scrolls freely. If something else leaves the page between two steps
 * (the scrollbar, a link), it settles onto the nearer one.
 */
const GESTURE_GAP = 220;
const GLIDE_MS = 950;

export function useStepScroll(steps: number) {
  useEffect(() => {
    if (steps <= 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vh = () => window.innerHeight;
    let gliding = false;
    let lastWheel = 0;
    let raf = 0;
    let settleTimer = 0;
    let touchY: number | null = null;

    /** Is a move in this direction ours to make, rather than the page's? */
    const ours = (dir: number) => {
      const y = window.scrollY;
      const end = steps * vh();
      return y < end - 2 || (dir < 0 && y <= end + 2);
    };

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const glideTo = (step: number) => {
      const target = Math.max(0, Math.min(steps, step)) * vh();
      const start = window.scrollY;
      if (Math.abs(target - start) < 1) return;
      cancelAnimationFrame(raf);
      document.documentElement.style.scrollBehavior = "auto";
      if (reduced) {
        window.scrollTo(0, target);
        return;
      }
      gliding = true;
      const t0 = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / GLIDE_MS);
        window.scrollTo(0, start + (target - start) * ease(t));
        if (t < 1) raf = requestAnimationFrame(frame);
        else {
          gliding = false;
          document.documentElement.style.scrollBehavior = "";
        }
      };
      raf = requestAnimationFrame(frame);
    };

    const stepBy = (dir: number) => {
      const here = Math.round(window.scrollY / vh());
      glideTo(here + dir);
    };

    const onWheel = (e: WheelEvent) => {
      const dir = Math.sign(e.deltaY);
      if (!dir || !ours(dir)) return;
      e.preventDefault();
      const now = performance.now();
      const fresh = now - lastWheel > GESTURE_GAP;
      lastWheel = now;
      if (fresh && !gliding) stepBy(dir);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /input|textarea|select/i.test(e.target.tagName)) return;
      const dir =
        e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey) ? 1
        : e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey) ? -1
        : 0;
      if (!dir || !ours(dir)) return;
      e.preventDefault();
      if (!gliding) stepBy(dir);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return;
      const dy = touchY - (e.touches[0]?.clientY ?? touchY);
      if (ours(Math.sign(dy) || 1)) e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (touchY === null) return;
      const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
      touchY = null;
      const dir = Math.abs(dy) > 40 ? Math.sign(dy) : 0;
      if (dir && ours(dir) && !gliding) stepBy(dir);
    };

    // anything that leaves us between two steps settles onto the nearer
    const onScroll = () => {
      if (gliding) return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        const y = window.scrollY;
        if (y >= steps * vh() - 2) return;
        const near = Math.round(y / vh());
        if (Math.abs(y - near * vh()) > 2) glideTo(near);
      }, 160);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settleTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("scroll", onScroll);
    };
  }, [steps]);
}

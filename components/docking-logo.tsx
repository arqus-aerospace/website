"use client";

import { useEffect, useRef } from "react";

/**
 * The Arqus wordmark, which starts big in the opening copy and, as the page
 * scrolls, shrinks and glides into the top left corner, where it stays as a
 * small header logo that leads back to the top.
 *
 * The opening layout keeps an empty slot (the `slot` element, sized like the
 * big logo). The logo itself is fixed to the screen and, each frame, placed
 * between where that slot is now and the corner, by how far the page has
 * scrolled through the first half screen. Scrolling back up plays it back.
 */
export default function DockingLogo({ src, dock = true }: { src: string; dock?: boolean }) {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const slot = slotRef.current;
    const logo = logoRef.current;
    if (!slot || !logo) return;
    let raf = 0;

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const place = () => {
      raf = 0;
      const vh = window.innerHeight;
      const narrow = window.innerWidth < 768;
      const from = slot.getBoundingClientRect();
      if (!from.width) return;
      // the corner: small, clear of the frame's rounded edge
      const toH = narrow ? 22 : 28;
      const toW = (from.width / from.height) * toH;
      const toX = narrow ? 16 : 30;
      const toY = narrow ? 14 : 24;
      const e = dock ? ease(Math.max(0, Math.min(1, window.scrollY / (vh * 0.55)))) : 0;
      const s = 1 + (toW / from.width - 1) * e;
      const x = from.left + (toX - from.left) * e;
      const y = from.top + (toY - from.top) * e;
      logo.style.width = `${from.width}px`;
      logo.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
      logo.dataset.docked = e > 0.98 ? "true" : "false";
      logo.dataset.ready = "";
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    place();
    // The slot can move while the fonts above and around it settle. The copy
    // is pinned to the bottom of the screen, so the headline under the slot
    // growing moves the slot without resizing it: watch the copy as well.
    const ro = new ResizeObserver(request);
    ro.observe(slot);
    if (slot.parentElement) ro.observe(slot.parentElement);
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) request();
    });
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    window.addEventListener("load", request);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      window.removeEventListener("load", request);
    };
  }, [dock]);

  return (
    <>
      <div ref={slotRef} className="arq-hero__logo" aria-hidden="true" />
      <a ref={logoRef} href="#top" className="arq-docklogo" data-dock={dock ? undefined : "off"} aria-label="Arqus Aerospace, back to top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Arqus Aerospace" />
      </a>
    </>
  );
}

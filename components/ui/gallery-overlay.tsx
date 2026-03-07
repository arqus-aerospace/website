"use client";

export default function GalleryOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center px-6 mix-blend-exclusion text-white">
      <a
        href="#top"
        className="pointer-events-auto mb-8 flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
        onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </a>
      <p className="font-instrument-serif font-normal text-4xl md:text-6xl lg:text-[5.5rem] leading-tight tracking-tight max-w-5xl mx-auto">
        Critical infrastructure is moving to orbit faster than defense can follow.
      </p>
      <p className="mt-5 font-instrument-serif font-normal text-2xl md:text-3xl lg:text-4xl">
        <span style={{ textShadow: '0 0 10px rgba(245,158,11,1), 0 0 30px rgba(245,158,11,1), 0 0 60px rgba(245,158,11,0.8), 0 0 100px rgba(245,158,11,0.6), 0 0 150px rgba(245,158,11,0.4)' }}>Arqus closes that gap.</span>
      </p>
    </div>
  );
}

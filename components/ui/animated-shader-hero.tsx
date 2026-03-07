"use client";

import React from 'react';

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
    logos: { src: string; alt: string; height?: number; href?: string }[];
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
  backgroundImageUrl?: string;
}

const Hero: React.FC<HeroProps> = ({
  nav,
  trustBadge,
  headline,
  subtitle,
  button,
  secondButton,
  backedBy,
  className = "",
  backgroundImageUrl = "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/0e2dbea0-c0a9-413f-a57b-af279633c0df_3840w.jpg"
}) => {
  return (
    <section className={`w-full isolate min-h-screen overflow-hidden relative ${className}`}>
      {/* Background image */}
      <img
        src={backgroundImageUrl}
        alt=""
        className="w-full h-full object-cover absolute top-0 right-0 bottom-0 left-0"
      />

      {/* Subtle ring overlay (matches original) */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-black/30" />

      {/* Nav */}
      {nav && (
        <header className="z-20 relative pt-4 px-6">
          <div className="flex items-center justify-between">
            {nav.logoSrc ? (
              <img src={nav.logoSrc} alt={nav.logo} className="h-8 w-auto select-none" />
            ) : (
              <span className="text-white/90 font-medium tracking-[0.3em] text-xs uppercase select-none">
                {nav.logo}
              </span>
            )}
            <div className="rounded-full bg-white/5 px-1 py-1 ring-1 ring-white/10 backdrop-blur-sm">
              <button
                onClick={nav.onCtaClick}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-neutral-900 hover:bg-white/90 transition-colors"
              >
                {nav.ctaText}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 7h10v10" />
                  <path d="M7 17 17 7" />
                </svg>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Hero content */}
      <div className="z-10 relative">
        <div className="max-w-7xl mx-auto pt-28 sm:pt-32 md:pt-36 lg:pt-44 px-6 pb-16">
          <div className="mx-auto max-w-3xl text-center">

            {/* Trust badge */}
            {trustBadge && (
              <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2.5 ring-1 ring-white/15 backdrop-blur-sm animate-fade-slide-in-1">
                <span className="text-xs font-medium text-white/75 tracking-wide text-center">
                  {trustBadge.text}
                </span>
              </div>
            )}

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-white tracking-tight font-instrument-serif font-normal animate-fade-slide-in-2">
              {headline.line1}
              <br className="hidden sm:block" />
              {headline.line2}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-base sm:text-lg text-white/75 max-w-2xl mt-6 mx-auto animate-fade-slide-in-3">
                {subtitle}
              </p>
            )}

            {/* CTA buttons */}
            {(button || secondButton) && (
              <div className="flex flex-col sm:flex-row sm:gap-4 mt-10 gap-3 items-center justify-center animate-fade-slide-in-4">
                {button && (
                  <button
                    onClick={button.onClick}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/15 hover:bg-white/20 text-sm font-medium text-white py-3 px-6 transition-colors"
                  >
                    {button.text}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                )}
                {secondButton && (
                  <button
                    onClick={secondButton.onClick}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 hover:border-white/40 bg-transparent px-6 py-3 text-sm font-medium text-white/85 hover:text-white transition-colors"
                  >
                    {secondButton.text}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Backed by */}
          {backedBy && (
            <div className="mx-auto mt-24 max-w-5xl animate-fade-slide-in-4">
              <p className="text-sm text-white/55 text-center tracking-widest uppercase mb-6">
                {backedBy.text}
              </p>
              <div className="flex items-center justify-center gap-8 flex-wrap">
                {backedBy.logos.map((logo, i) => {
                  const img = (
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      style={{
                        height: `clamp(${Math.round((logo.height ?? 20) * 0.33)}px, ${((logo.height ?? 20) / 1440 * 100).toFixed(2)}vw, ${logo.height ?? 20}px)`,
                        mixBlendMode: 'screen',
                        filter: 'brightness(2)'
                      }}
                      className="w-auto opacity-75 hover:opacity-100 transition-opacity select-none"
                    />
                  );
                  return logo.href ? (
                    <a key={i} href={logo.href} target="_blank" rel="noopener noreferrer">{img}</a>
                  ) : (
                    <span key={i}>{img}</span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;

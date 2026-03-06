"use client";

import { useState } from "react";

interface WhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhitepaperModal({ isOpen, onClose }: WhitepaperModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/whitepaper-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md mx-4 border border-white/15 bg-black/90 p-8">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors text-xs tracking-widest uppercase"
        >
          ✕
        </button>

        {status === "success" ? (
          <div className="text-center py-8">
            <p className="text-white/85 text-sm tracking-[0.2em] uppercase mb-2">Request received</p>
            <p className="text-white/45 text-xs tracking-wide mt-3">
              We&apos;ll send the whitepaper to <span className="text-white/65">{email}</span> shortly.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-white/85 text-xs tracking-[0.3em] uppercase mb-1">Request Whitepaper</h2>
            <p className="text-white/35 text-xs tracking-wide mb-8">
              Leave your details and we&apos;ll send it over.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 text-[10px] tracking-[0.25em] uppercase">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-transparent border border-white/15 px-4 py-3 text-white/80 text-xs tracking-wide placeholder:text-white/20 focus:outline-none focus:border-white/35 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 text-[10px] tracking-[0.25em] uppercase">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-transparent border border-white/15 px-4 py-3 text-white/80 text-xs tracking-wide placeholder:text-white/20 focus:outline-none focus:border-white/35 transition-colors"
                />
              </div>

              {status === "error" && (
                <p className="text-red-400/70 text-[10px] tracking-wide">Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 group px-8 py-3.5 border border-white/30 hover:border-cyan-400/50 hover:bg-cyan-400/5 text-white/85 hover:text-white text-xs tracking-[0.25em] uppercase transition-all duration-500 disabled:opacity-40"
              >
                {status === "loading" ? "Sending..." : "Submit Request"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

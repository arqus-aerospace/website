"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";

interface HiringModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HiringModal({ isOpen, onClose }: HiringModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("linkedin", linkedin);
      formData.append("message", message);
      if (file) formData.append("file", file);

      const res = await fetch("/api/hiring", {
        method: "POST",
        body: formData,
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md mx-4 border border-white/15 bg-black/90 p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors text-xs tracking-widest uppercase"
        >
          ✕
        </button>

        {status === "success" ? (
          <div className="text-center py-8">
            <p className="text-white/85 text-sm tracking-[0.2em] uppercase mb-2">Application received</p>
            <p className="text-white/45 text-xs tracking-wide mt-3">
              We&apos;ll be in touch at <span className="text-white/65">{email}</span>.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-white/85 text-xs tracking-[0.3em] uppercase mb-1">Join Arqus</h2>
            <p className="text-white/35 text-xs tracking-wide mb-8">
              Tell us about yourself and we&apos;ll reach out.
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

              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 text-[10px] tracking-[0.25em] uppercase">LinkedIn</label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="bg-transparent border border-white/15 px-4 py-3 text-white/80 text-xs tracking-wide placeholder:text-white/20 focus:outline-none focus:border-white/35 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 text-[10px] tracking-[0.25em] uppercase">Anything to add?</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your background, what excites you about Arqus, or anything else..."
                  rows={4}
                  className="bg-transparent border border-white/15 px-4 py-3 text-white/80 text-xs tracking-wide placeholder:text-white/20 focus:outline-none focus:border-white/35 transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/40 text-[10px] tracking-[0.25em] uppercase">Documents (optional)</label>
                <div
                  className="border border-dashed border-white/15 hover:border-white/30 transition-colors p-6 text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-white/60 text-xs">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="text-white/30 hover:text-white/60"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-4 w-4 text-white/25" />
                      <p className="text-white/30 text-[10px] tracking-wide">CV, portfolio or other documents</p>
                      <p className="text-white/20 text-[10px]">PDF, DOC, DOCX</p>
                    </div>
                  )}
                </div>
              </div>

              {status === "error" && (
                <p className="text-red-400/70 text-[10px] tracking-wide">Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 px-8 py-3.5 border border-white/30 hover:border-cyan-400/50 hover:bg-cyan-400/5 text-white/85 hover:text-white text-xs tracking-[0.25em] uppercase transition-all duration-500 disabled:opacity-40"
              >
                {status === "loading" ? "Sending..." : "Submit Application"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

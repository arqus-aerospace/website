"use client";

import { useState } from "react";

export default function BriefingModal({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);

  return (
    <div className="arq-modal" onClick={onClose}>
      <div className="arq-modal__panel" onClick={(e) => e.stopPropagation()}>
        <button
          className="arq-modal__close"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ✕
        </button>
        {sent ? (
          <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
            <div className="arq-modal__eyebrow">Request received</div>
            <div
              className="arq-modal__sub"
              style={{ marginTop: 12, marginBottom: 0 }}
            >
              We&rsquo;ll be in touch shortly.
            </div>
          </div>
        ) : (
          <>
            <div className="arq-modal__eyebrow">Join us</div>
            <div className="arq-modal__sub">
              Leave your details and we&rsquo;ll reach out.
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="arq-field">
                <label>Name</label>
                <input required placeholder="Your name" />
              </div>
              <div className="arq-field">
                <label>Email</label>
                <input required type="email" placeholder="you@domain.com" />
              </div>
              <div className="arq-field">
                <label>Organization</label>
                <input placeholder="Company, programme, or fund" />
              </div>
              <button className="arq-modal__submit" type="submit">
                Submit
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

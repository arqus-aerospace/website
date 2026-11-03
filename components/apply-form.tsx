"use client";

// The application form, in our own colours, posting straight to the CRM so
// nobody has to leave the site. Two requests, the way the CRM wants them: the
// answers first, which come back with an upload token, then one request per
// file carrying that token. Once the answers are in they cannot be sent twice;
// files that failed can be retried on their own.
//
// The CRM has to allow the origin this page is served from, or the browser
// blocks the request before it leaves and the form says so, offering the
// address to write to instead. The site is served from the Pages CNAME, so
// the origin to allow is https://arqusaerospace.com — not arqus.space, which
// the imprint names and which is what the CRM allowed first by mistake.

import { useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_APPLY_API ?? "https://arqus-crm-swqv.swedencentral.cloudapp.azure.com";

/** What the CRM accepts, so we can say no before a long upload fails. */
const MAX_FILES = 20;
const MAX_FILE = 1024 ** 3;
const MAX_TOTAL = 2 * 1024 ** 3;

/** The disciplines the CRM sorts applications into. */
const AREAS = [
  "GNC and flight software",
  "Avionics and electronics",
  "Propulsion",
  "Structures and mechanisms",
  "Systems engineering",
  "Manufacturing and test",
  "Operations and business",
  "Something else",
];

type Attachment = { file: File; done: boolean; pct: number; error?: string };

/** A url field wants a scheme, but "linkedin.com/in/me" is what people type.
    Put https:// in front of anything that has no scheme of its own, so the
    field is satisfied without the applicant having to work out why it was
    not. Left alone when empty: the field is required, and that is the
    browser's complaint to make, not ours. */
const withScheme = (e: React.FocusEvent<HTMLInputElement>) => {
  const value = e.target.value.trim();
  if (!value) return;
  e.target.value = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
};

const size = (bytes: number) =>
  bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;

/** One file, straight to the CRM, with the token the answers earned. */
function upload(file: File, token: string, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open("POST", `${API}/api/apply/files`);
    req.setRequestHeader("X-Upload-Token", token);
    req.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    req.upload.onprogress = (e) => e.lengthComputable && onProgress((100 * e.loaded) / e.total);
    req.onload = () => {
      if (req.status < 300) return resolve();
      let message = "";
      try {
        message = JSON.parse(req.responseText).error;
      } catch {
        /* the body was not ours to read */
      }
      reject(new Error(message || "The upload was refused."));
    };
    req.onerror = () => reject(new Error("The connection dropped."));
    req.send(file);
  });
}

export default function ApplyForm({ area, email }: { area?: string; email: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** true once every answer and file is in: the form is spent. */
  const [sent, setSent] = useState(false);
  /** the CRM could not be reached at all, so offer the address instead */
  const [unreachable, setUnreachable] = useState(false);

  const total = files.reduce((sum, f) => sum + f.file.size, 0);

  const add = (picked: FileList | null) => {
    if (!picked) return;
    setError("");
    setFiles((was) => {
      const next = [...was];
      for (const file of Array.from(picked)) {
        if (next.length >= MAX_FILES) return setError(`Up to ${MAX_FILES} files.`), next;
        if (file.size > MAX_FILE) return setError(`${file.name} is over 1 GB.`), next;
        if (next.some((f) => f.file.name === file.name && f.file.size === file.size)) continue;
        next.push({ file, done: false, pct: 0 });
      }
      return next;
    });
  };

  const drop = (e: React.DragEvent) => {
    e.preventDefault();
    add(e.dataTransfer.files);
  };

  const mark = (name: string, patch: Partial<Attachment>) =>
    setFiles((was) => was.map((f) => (f.file.name === name ? { ...f, ...patch } : f)));

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy || !form.current) return;
    if (total > MAX_TOTAL) return setError("The files come to more than 2 GB together.");

    setBusy(true);
    setError("");
    setUnreachable(false);

    // The answers, once. A second submit only retries what is left to upload.
    let ticket = token;
    if (!ticket) {
      const body: Record<string, string | boolean> = Object.fromEntries(
        [...new FormData(form.current)].map(([k, v]) => [k, String(v)]),
      );
      // The CRM wants this one as a boolean, not the checkbox's "on".
      const consent = form.current.elements.namedItem("consent");
      body.consent = consent instanceof HTMLInputElement && consent.checked;
      try {
        const res = await fetch(`${API}/api/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
        ticket = data.uploadToken || "";
        setToken(ticket);
      } catch (thrown) {
        // A blocked or refused request arrives here with nothing useful in it.
        const network = thrown instanceof TypeError;
        setUnreachable(network);
        setError(network ? "We could not reach our application system from here." : (thrown as Error).message);
        setBusy(false);
        return;
      }
    }

    // Answers accepted but no token back: the CRM has taken the application
    // and does not want its files. It answers that way without saying why, so
    // we say nothing either — there is simply nothing left to send.
    const todo = ticket ? files.filter((f) => !f.done) : [];

    // Then the files, one at a time, each able to fail on its own.
    let failed = 0;
    for (const item of todo) {
      try {
        mark(item.file.name, { error: undefined, pct: 0 });
        await upload(item.file, ticket, (pct) => mark(item.file.name, { pct }));
        mark(item.file.name, { done: true, pct: 100 });
      } catch (thrown) {
        failed += 1;
        mark(item.file.name, { error: (thrown as Error).message });
      }
    }

    setBusy(false);
    if (failed) setError(`${failed} ${failed === 1 ? "file" : "files"} did not go through. Your answers are safe — try the files again.`);
    else setSent(true);
  };

  if (sent)
    return (
      <div className="arq-apply arq-apply--done" role="status">
        <p className="arq-apply__lead">Your application is in. Thank you.</p>
        <p className="arq-apply__note">
          We read every one ourselves. If it is a fit you will hear from us at the address you gave.
        </p>
      </div>
    );

  return (
    <form ref={form} className="arq-apply" onSubmit={submit}>
      <div className="arq-apply__grid">
        <label className="arq-apply__field">
          <span>Your name</span>
          <input name="name" type="text" maxLength={120} required autoComplete="name" />
        </label>
        <label className="arq-apply__field">
          <span>Email</span>
          <input name="email" type="email" maxLength={200} required autoComplete="email" />
        </label>
        <label className="arq-apply__field">
          <span>LinkedIn</span>
          <input
            name="linkedin"
            type="url"
            maxLength={300}
            required
            placeholder="https://www.linkedin.com/in/your-name"
            onBlur={withScheme}
          />
        </label>
        <label className="arq-apply__field">
          <span>Nationality</span>
          <input name="nationality" type="text" maxLength={200} required placeholder="e.g. Dutch, Canadian" />
        </label>
        <label className="arq-apply__field">
          <span>Where you live</span>
          <input name="location" type="text" maxLength={120} required autoComplete="address-level2" />
        </label>
        <label className="arq-apply__field">
          <span>Area</span>
          <select name="area" required defaultValue={area ?? ""}>
            <option value="" disabled>
              Choose one
            </option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="arq-apply__field arq-apply__field--wide">
        <span>The most powerful thing you have built</span>
        <textarea name="project" maxLength={3000} rows={6} required />
      </label>
      <label className="arq-apply__field arq-apply__field--wide">
        <span>The hardest problem you have solved</span>
        <textarea name="hardest" maxLength={3000} rows={6} required />
      </label>
      <label className="arq-apply__field arq-apply__field--wide">
        <span>What you are exceptional at</span>
        <textarea name="exceptional" maxLength={2000} rows={5} required />
      </label>
      <label className="arq-apply__field arq-apply__field--wide">
        <span>
          A requirement you questioned, and what came of it <i>optional</i>
        </span>
        <textarea name="deleted" maxLength={2000} rows={4} />
      </label>

      <div className="arq-apply__grid">
        <label className="arq-apply__field">
          <span>
            Links to your work <i>optional</i>
          </span>
          <input name="links" type="text" maxLength={1000} />
        </label>
        <label className="arq-apply__field">
          <span>
            Earliest start <i>optional</i>
          </span>
          <input name="start" type="text" maxLength={60} placeholder="e.g. March 2027, or after 3 months' notice" />
        </label>
      </div>

      <div className="arq-apply__drop" onDragOver={(e) => e.preventDefault()} onDrop={drop}>
        <input id="arq-apply-files" type="file" multiple onChange={(e) => add(e.target.files)} />
        <label htmlFor="arq-apply-files">
          <strong>CV, transcript, anything else</strong>
          <span>
            Drop files here or choose them. Up to {MAX_FILES} files, 1 GB each, 2 GB together.
            {files.length ? ` ${files.length} chosen, ${size(total)}.` : ""}
          </span>
        </label>
      </div>

      {files.length ? (
        <ul className="arq-apply__files">
          {files.map((f) => (
            <li key={f.file.name} className={f.error ? "is-failed" : f.done ? "is-done" : undefined}>
              <span className="arq-apply__file-name">{f.file.name}</span>
              <span className="arq-apply__file-size">{f.error ?? (f.done ? "sent" : size(f.file.size))}</span>
              <span className="arq-apply__bar" aria-hidden="true">
                <i style={{ width: `${f.done ? 100 : f.pct}%` }} />
              </span>
              {!busy && !f.done ? (
                <button
                  type="button"
                  className="arq-apply__drop-file"
                  onClick={() => setFiles((was) => was.filter((x) => x.file.name !== f.file.name))}
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <label className="arq-apply__consent">
        <input type="checkbox" name="consent" required />
        <span>
          Arqus Aerospace may keep this application for up to two years to consider me for roles. I can ask for it to
          be deleted at any time.
        </span>
      </label>

      {/* for the robots, hidden from everyone else */}
      <input className="arq-apply__trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="arq-apply__foot">
        <button className="arq-joinbtn arq-apply__send" type="submit" disabled={busy}>
          {busy ? "Sending…" : token ? "Try the files again" : "Send application"}
          <span className="arq-joinbtn__dot">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>

      <p className="arq-apply__error" role="alert">
        {error}
        {unreachable ? (
          <>
            {" "}
            Please send it to <a href={`mailto:${email}`}>{email}</a> instead, and tell us it happened.
          </>
        ) : null}
      </p>
    </form>
  );
}

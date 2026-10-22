// Rebuilds lib/news/news.json: everything written about Arqus, as links.
//
//   npm run news            (also runs before every `npm run build`)
//
// Inputs, all in lib/news/sources.json:
//   links    URLs added by hand. Each page is fetched and its title, outlet,
//            date, summary and picture read from its Open Graph, Twitter and
//            JSON-LD tags; anything written alongside the URL wins.
//   queries  searched each run on Google News, Bing News, Bing web search and
//            DuckDuckGo.
//   exclude  substrings of URLs never to keep (our own site, profile pages).
//   hide     exact URLs never to show.
//
// A search result is kept only if it is really about us. If its title or
// snippet names Arqus Aerospace, it is in. If it only says "Arqus" (there is
// a university alliance, a tax society, a camera and more by that name), the
// page itself is opened and read, and it is kept only if the text names
// Arqus Aerospace, or Arqus alongside Marnix Meersman.
//
// Everything is merged, duplicates dropped, newest first. Each item's
// preview picture is downloaded into public/assets/news/, so the site never
// depends on someone else's server, or on links that expire.
//
// It never fails a build: a source that times out or errors is skipped, and
// if nothing at all could be fetched the previous news.json is kept.

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

const SOURCES = new URL("../lib/news/sources.json", import.meta.url);
const OUT = new URL("../lib/news/news.json", import.meta.url);
const IMG_DIR = new URL("../public/assets/news/", import.meta.url);
const TIMEOUT_MS = 12000;
const MAX_IMAGE_BYTES = 3_000_000;
const MAX_PAGE_CHECKS = 30;
const EXT = { jpeg: "jpg", jpg: "jpg", png: "png", webp: "webp", gif: "gif", avif: "avif" };
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
// LinkedIn gives its post details to link-preview bots, not to scripts
const PREVIEW_UA = "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)";
const SITE_NAMES = { "linkedin.com": "LinkedIn", "youtube.com": "YouTube", "x.com": "X", "twitter.com": "X" };

/* --- fetching and reading -------------------------------------------------- */

const decode = (s = "") =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

async function get(url, accept = "text/html,application/xhtml+xml,application/rss+xml,*/*") {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const ua = host(url).endsWith("linkedin.com") ? PREVIEW_UA : BROWSER_UA;
    const res = await fetch(url, {
      headers: { "user-agent": ua, accept, "accept-language": "en,de;q=0.8,nl;q=0.6" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { text: await res.text(), url: res.url };
  } finally {
    clearTimeout(timer);
  }
}

/** Everything a page says about itself: meta tags first, JSON-LD to fill gaps. */
function readPage(html, url) {
  const meta = (names) => {
    for (const n of names) {
      const re = new RegExp(`<meta\\b[^>]*(?:property|name|itemprop)\\s*=\\s*["']${n}["'][^>]*>`, "i");
      const tag = html.match(re)?.[0];
      const content = tag?.match(/content\s*=\s*"([^"]*)"/i)?.[1] ?? tag?.match(/content\s*=\s*'([^']*)'/i)?.[1];
      if (content) return decode(content);
    }
    return "";
  };
  // JSON-LD: the first object with a date, a headline or an image
  let ld = {};
  for (const [, block] of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(block);
      const nodes = [data, ...(Array.isArray(data) ? data : []), ...(data["@graph"] ?? [])];
      const hit = nodes.find((n) => n && typeof n === "object" && (n.datePublished || n.headline));
      if (hit) {
        ld = hit;
        break;
      }
    } catch {
      /* malformed JSON-LD: ignore it */
    }
  }
  const ldImage = typeof ld.image === "string" ? ld.image : ld.image?.url ?? ld.image?.[0]?.url ?? ld.image?.[0] ?? ld.thumbnailUrl ?? "";
  const author = typeof ld.author === "string" ? ld.author : ld.author?.name ?? ld.author?.[0]?.name ?? "";
  const h = host(url);
  return {
    title: meta(["og:title", "twitter:title"]) || decode(ld.headline || "") || decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]),
    source: meta(["og:site_name", "application-name"]) || SITE_NAMES[h] || h,
    author,
    date: meta(["article:published_time", "og:published_time", "datePublished", "date", "pubdate"]) || ld.datePublished || ld.uploadDate ||
      html.match(/<time[^>]+datetime=["']([^"']+)["']/i)?.[1] || "",
    summary: meta(["og:description", "description", "twitter:description"]),
    image: meta(["og:image", "og:image:url", "twitter:image", "twitter:image:src"]) || ldImage,
    // the readable text, for checking a page is about us
    text: decode(html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")).slice(0, 200_000),
  };
}

/** Items from an RSS feed: title, link, date, outlet, summary. */
function readRss(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => {
    const tag = (t) => decode(it.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`))?.[1]);
    let url = tag("link");
    // Bing wraps the real address in a click-tracking link
    if (url.includes("bing.com/news/apiclick")) url = new URL(url).searchParams.get("url") || url;
    return { title: tag("title"), url, date: tag("pubDate"), source: tag("source") || tag("News:Source"), summary: tag("description") };
  });
}

/** Results from DuckDuckGo's plain HTML page. */
function readDuckDuckGo(html) {
  return [...html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)].map(
    ([, href, title, snippet]) => {
      const raw = decode(href);
      const real = raw.includes("duckduckgo.com/l/") ? new URL(raw, "https://duckduckgo.com").searchParams.get("uddg") || raw : raw;
      return { title: decode(title), url: real, date: "", source: "", summary: decode(snippet) };
    }
  );
}

/* --- relevance ------------------------------------------------------------- */

const sources = JSON.parse(await readFile(SOURCES, "utf8"));
const mentions = (sources.mustMention ?? []).map((m) => m.toLowerCase());
const namesUs = (text) => {
  const t = text.toLowerCase();
  return mentions.some((m) => t.includes(m)) || (t.includes("arqus") && t.includes("meersman"));
};
const excluded = (u) => (sources.exclude ?? []).some((x) => u.toLowerCase().includes(x.toLowerCase()));

/* --- tidying --------------------------------------------------------------- */

const isoDate = (d) => {
  const t = Date.parse(d);
  return Number.isFinite(t) ? new Date(t).toISOString() : "";
};

/** Canonical form of a URL, for spotting the same story twice. */
const keyOf = (u) => {
  try {
    const x = new URL(u);
    x.hash = "";
    for (const p of [...x.searchParams.keys()]) if (/^utm_|^ref$|^oc$|^trk|^rcm$/.test(p)) x.searchParams.delete(p);
    let path = x.pathname.replace(/\/$/, "");
    // LinkedIn has several addresses for one post; the activity number is the post
    const activity = u.match(/activity[:-](\d{15,})/)?.[1];
    if (activity) return "linkedin:" + activity;
    return (host(u) + path + x.search).toLowerCase();
  } catch {
    return u;
  }
};

/**
 * "Headline - Outlet" and "Post | Author" lose the tail that repeats the
 * byline. A social post has no headline, so its title is the start of its
 * text: links are taken out and it is cut at a word near 110 characters.
 */
function tidyTitle(title, source, author) {
  let t = title.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  for (const tail of [source, author].filter(Boolean)) {
    for (const sep of [" | ", " - ", " – ", " — "]) {
      if (t.toLowerCase().endsWith((sep + tail).toLowerCase())) t = t.slice(0, -(sep + tail).length).trim();
    }
  }
  if (t.length > 120) t = t.slice(0, t.lastIndexOf(" ", 110)).replace(/[\s,;:.\-–—]+$/, "") + "…";
  return t;
}

/* --- pictures -------------------------------------------------------------- */

/**
 * Downloads a picture into public/assets/news and returns its site path.
 * Named by its address without the query string, so a signed link whose
 * token changes maps to the same file, and one already saved is reused.
 */
async function saveImage(src, pageUrl, have) {
  const abs = new URL(src, pageUrl).href;
  const stem = createHash("sha1").update(abs.split("?")[0]).digest("hex").slice(0, 16);
  const already = [...have].find((f) => f.startsWith(stem + "."));
  if (already) return "/assets/news/" + already;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(abs, { headers: { "user-agent": BROWSER_UA }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = (res.headers.get("content-type") || "").split(";")[0].trim();
    const ext = EXT[type.split("/")[1]];
    if (!type.startsWith("image/") || !ext) throw new Error(`not an image (${type || "no type"})`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) throw new Error(`too big (${buf.length} bytes)`);
    const name = `${stem}.${ext}`;
    await writeFile(new URL(name, IMG_DIR), buf);
    have.add(name);
    return "/assets/news/" + name;
  } finally {
    clearTimeout(timer);
  }
}

/* --- 1. links added by hand ------------------------------------------------- */

const previous = JSON.parse(await readFile(OUT, "utf8").catch(() => '{"items":[]}'));
const items = [];
const pages = new Map(); // url → what the page said, so nothing is fetched twice
let fetched = 0;

async function page(url) {
  if (pages.has(url)) return pages.get(url);
  const p = await get(url);
  fetched++;
  const read = readPage(p.text, p.url);
  pages.set(url, read);
  return read;
}

for (const entry of sources.links ?? []) {
  const given = typeof entry === "string" ? { url: entry } : entry;
  let found = {};
  try {
    found = await page(given.url);
  } catch (err) {
    console.warn(`link   ${given.url}: ${err.message}; using what was given`);
  }
  items.push({
    url: given.url,
    title: given.title || found.title || given.url,
    source: given.source || found.source || host(given.url),
    author: given.author || found.author || "",
    date: isoDate(given.date || found.date),
    summary: given.summary || found.summary || "",
    image: given.image || found.image || "",
    origin: "link",
  });
}
console.log(`links  ${items.length} added by hand`);

/* --- 2. search, kept only if really about us ------------------------------- */

const engines = [
  { name: "Google News", url: (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`, read: readRss },
  { name: "Bing News", url: (q) => `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss`, read: readRss },
  { name: "Bing", url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}&format=rss&count=50`, read: readRss },
  { name: "DuckDuckGo", url: (q) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, read: readDuckDuckGo },
];
let pageChecks = 0;
for (const q of sources.queries ?? []) {
  for (const engine of engines) {
    let hits;
    try {
      const { text } = await get(engine.url(q));
      fetched++;
      hits = engine.read(text).filter((h) => /^https?:/.test(h.url) && !excluded(h.url) && !/bing\.com\/search|google\.com\/search/.test(h.url));
    } catch (err) {
      console.warn(`search ${engine.name} ${q}: ${err.message}`);
      continue;
    }
    let kept = 0;
    for (const h of hits) {
      let ok = namesUs(`${h.title} ${h.summary}`);
      // only "Arqus" in the snippet: read the page before deciding
      if (!ok && /arqus/i.test(`${h.title} ${h.summary}`) && pageChecks < MAX_PAGE_CHECKS) {
        pageChecks++;
        try {
          const p = await page(h.url);
          ok = namesUs(`${p.title} ${p.summary} ${p.text}`);
        } catch {
          ok = false;
        }
      }
      if (!ok) continue;
      kept++;
      items.push({ ...h, author: "", date: isoDate(h.date), image: "", origin: "search" });
    }
    console.log(`search ${engine.name.padEnd(11)} ${q}: ${kept} of ${hits.length} kept`);
  }
}

// What earlier runs found and kept stays, even if a search engine skips it
// this time: they are flaky from one run to the next. Fresh results come
// first, so their details win.
for (const it of previous.items ?? []) if (it.origin === "search") items.push({ ...it });

/* --- 3. merge: hand-added first, so their details win; newest first ------- */

const hidden = new Set((sources.hide ?? []).map(keyOf));
const seen = new Map();
// a second key, site and title, catches one page published in two languages
const titleKey = (it) => host(it.url) + "|" + it.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const seenTitles = new Set();
for (const it of items) {
  const k = keyOf(it.url);
  if (hidden.has(k) || excluded(it.url) || seen.has(k) || seenTitles.has(titleKey(it))) continue;
  seen.set(k, it);
  seenTitles.add(titleKey(it));
}
const merged = [...seen.values()];

/* --- 4. fill in from each page, and keep a picture for every card ----------- */

await mkdir(IMG_DIR, { recursive: true });
const have = new Set(await readdir(IMG_DIR).catch(() => []));
for (const it of merged) {
  if (it.origin === "search" || !it.image || !it.date) {
    try {
      const p = await page(it.url);
      if (it.origin === "search") {
        // The page usually knows its own title better than a search snippet,
        // but pages that build their title in script can report something
        // unrelated: then the search engine's title stands.
        if (p.title && /arqus/i.test(p.title)) it.title = p.title;
        it.source = p.source || it.source || host(it.url);
        it.summary = p.summary || it.summary;
        it.author = p.author || it.author;
      }
      it.date = it.date || isoDate(p.date);
      it.image = it.image || p.image;
    } catch (err) {
      console.warn(`page   ${it.url}: ${err.message}`);
    }
  }
  // LinkedIn titles end in " | Author", even where the page names no author
  const byline = it.source === "LinkedIn" && it.title.match(/^(.*\S) \| ([^|]{2,60})$/);
  if (byline) it.author = it.author || byline[2].trim();
  it.title = tidyTitle(it.title, it.source, it.author);
  // a summary loses its links, and goes if it only repeats the title
  it.summary = (it.summary || "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const bare = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (bare(it.summary).startsWith(bare(it.title.replace(/…$/, ""))) && it.summary.length < it.title.length + 20) it.summary = "";
  if (it.image && /^https?:|^\/\//.test(it.image)) {
    try {
      it.image = await saveImage(it.image, it.url, have);
    } catch (err) {
      // a remote picture we could not keep may expire or vanish: show none
      console.warn(`image  ${it.url}: ${err.message}`);
      it.image = "";
    }
  }
}
merged.sort((a, b) => (b.date || "0").localeCompare(a.date || "0"));

if (!fetched && (sources.links?.length || sources.queries?.length)) {
  console.warn("nothing could be fetched; keeping the previous news.json");
} else {
  const out = merged.map(({ url, title, source, author, date, summary, image, origin }) => ({ url, title, source, author, date, summary, image, origin }));
  await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), items: out }, null, 2) + "\n");
  console.log(`${out.length} item(s) written (${previous.items?.length ?? 0} before)`);
}

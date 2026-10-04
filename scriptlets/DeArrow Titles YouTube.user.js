// ==UserScript==
// @name         DeArrow Titles YouTube
// @match        https://*.youtube.com/*
// @exclude      https://*.youtube.com/shorts/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/**
 * Replace eligible YouTube link/watch titles with community DeArrow titles.
 * This script changes titles only, not the displayed thumbnail images.
 * The watch-page fast path reads the thumbnail service's X-Title response
 * header and cancels its body; the branding API supplies the normal fallback.
 * C = bounded title cache, D = displayed-title cache, P/W = shared pending
 * requests, F = short failure cooldowns, S = per-anchor state (WeakMap),
 * R = pending DOM scan roots. Observers and timers handle page reuse.
 * Short helper names are retained; the comments below explain their roles.
 */

(() => {
  "use strict";
  const API = "https://sponsor.ajay.app";
  const FAST = "https://dearrow-thumb.ajay.app";
  const SEL = 'a[href*="/watch?v="],a[href*="/embed/"]';
  const MAX = 1000;
  const C = new Map();
  const D = new Map();
  const P = new Map();
  const F = new Map();
  const W = new Map();
  const S = new WeakMap();
  const R = new Set();
  let ft = 0;
  let fd = Infinity;
  let wt = 0;
  let wd = Infinity;
  let mt = 0;
  let mrt = 0;
  let io = null;
  let mo = null;
  let to = null;
  let te = null;
  let ho = null;
  let he = null;
  let lc = null;
  let ct = 0;

  /* Extract a video ID from supported watch or embed URLs. */
  function V(x) {
    try {
      const u = new URL(x, location.href);
      if (u.pathname === "/watch") return u.searchParams.get("v");
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
    } catch {}
    return null;
  }

  /* Normalize a title by removing the existing angle-bracket characters and repeated whitespace. */
  function K(t) {
    return (t || "")
      .replace(/[<>‹›]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* Read a cached title and move its entry to the most recently used position. */
  function GC(v) {
    if (!C.has(v)) return;
    const t = C.get(v);
    C.delete(v);
    C.set(v, t);
    return t;
  }

  /* Check the per-video failure cooldown and remove an expired cooldown. */
  function RF(v) {
    if ((F.get(v) || 0) > Date.now()) return true;
    F.delete(v);
    return false;
  }

  /* Start a 30-second failure cooldown, keeping the cooldown map bounded. */
  function FF(v) {
    F.delete(v);
    F.set(v, Date.now() + 30000);
    if (F.size > MAX) F.delete(F.keys().next().value);
  }

  /* Store a title result, clear its failure cooldown, and enforce the title-cache limit. */
  function PC(v, t) {
    F.delete(v);
    if (C.has(v)) C.delete(v);
    C.set(v, t);
    if (C.size > MAX) C.delete(C.keys().next().value);
  }

  /* Store a title already displayed in the page, keeping that cache bounded too. */
  function PD(v, t) {
    if (D.has(v)) D.delete(v);
    D.set(v, t);
    if (D.size > MAX) D.delete(D.keys().next().value);
  }

  /* Fetch a suitable community title, sharing in-flight requests and caching titles or 404 misses. */
  async function G(v) {
    if (!v) return null;
    const c = GC(v);
    if (c !== undefined) return c;
    if (RF(v)) return null;
    if (P.has(v)) return P.get(v);
    const p = (async () => {
      try {
        const r = await fetch(`${API}/api/branding?videoID=${encodeURIComponent(v)}`, {
          credentials: "omit",
        });
        if (!r.ok) {
          if (r.status === 404) PC(v, null);
          else FF(v);
          return null;
        }
        const x = await r.json();
        if (!x || !Array.isArray(x.titles)) {
          PC(v, null);
          return null;
        }
        const b = x.titles.find(
          (t) => t && t.title && t.original !== true && (t.locked || Number(t.votes) >= 0),
        );
        const o = b ? K(b.title) : null;
        PC(v, o);
        return o;
      } catch {
        FF(v);
        return null;
      } finally {
        P.delete(v);
      }
    })();
    P.set(v, p);
    return p;
  }

  /* Read the fast service's title header, then cancel the unneeded response body. */
  async function Q(v) {
    if (!v) return null;
    try {
      const r = await fetch(`${FAST}/api/v1/getThumbnail?videoID=${encodeURIComponent(v)}`, {
        credentials: "omit",
        cache: "force-cache",
      });
      const t = K(r.headers.get("X-Title"));
      r.body?.cancel().catch(() => {});
      return t || null;
    } catch {
      return null;
    }
  }

  /* Use the watch-page fast path, falling back to the branding API, with shared requests and cooldown. */
  async function GW(v) {
    if (!v) return null;
    const c = GC(v);
    if (c !== undefined) return c;
    if (RF(v)) return null;
    if (W.has(v)) return W.get(v);
    const p = (async () => {
      const t = await Q(v);
      return t ? (PC(v, t), t) : G(v);
    })().finally(() => W.delete(v));
    W.set(v, p);
    return p;
  }

  /* Recognize thumbnail containers that should not receive text replacements. */
  function IT(e) {
    return !!e.closest?.(
      "ytd-thumbnail,ytm-thumbnail,yt-thumbnail-view-model,a#thumbnail,a.ytd-thumbnail,.thumbnail,.yt-thumbnail-view-model,.media-item-thumbnail-container,.compact-media-item-image,ytm-thumbnail-overlay-time-status-renderer",
    );
  }

  /* Reject elements containing image, thumbnail, video, canvas, or similar visual content. */
  function HV(e) {
    return !!e.querySelector?.(
      "img,picture,image,svg,ytd-thumbnail,ytm-thumbnail,yt-thumbnail-view-model,video,canvas",
    );
  }

  /* Check computed visibility and nonzero layout dimensions. */
  function VI(e) {
    if (!e || !(e instanceof Element)) return false;
    const s = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    return (
      s.display !== "none" &&
      s.visibility !== "hidden" &&
      Number(s.opacity) !== 0 &&
      r.width > 0 &&
      r.height > 0
    );
  }

  /* Reject empty text and common metadata labels such as durations, views, and quality badges. */
  function BT(t) {
    const v = (t || "").trim();
    return (
      !v ||
      v.length < 3 ||
      /^\d+([:.]\d+)+$/.test(v) ||
      /^\d+[KMB]?\s+views?/i.test(v) ||
      /^\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i.test(v) ||
      /^(live|new|cc|hd|4k)$/i.test(v)
    );
  }

  /* Find the best eligible text element inside a title anchor without entering visual subtrees. */
  function TT(a) {
    if (!a || IT(a) || HV(a) || !VI(a)) return null;
    let b = null;
    let s = 0;
    const w = document.createTreeWalker(a, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (n) => {
        if (!(n instanceof Element) || IT(n) || HV(n) || !VI(n)) {
          return NodeFilter.FILTER_REJECT;
        }
        return BT((n.textContent || "").trim()) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
      },
    });
    for (let n = w.currentNode; n; n = w.nextNode()) {
      const t = (n.textContent || "").trim();
      if (BT(t)) continue;
      let q = t.length;
      if (/^H[1-6]$/.test(n.tagName)) q += 200;
      if (n.tagName === "SPAN") q += 20;
      if (q > s) {
        s = q;
        b = n;
      }
    }
    return b;
  }

  /* Update the anchor's existing title/accessible label to match the replacement. */
  function M(a, t) {
    if (!a || !t || IT(a)) return;
    if (a.title !== undefined && a.title !== t) a.title = t;
    if (a.ariaLabel !== undefined && a.ariaLabel !== t) a.ariaLabel = t;
    if (a.getAttribute?.("aria-label") && a.getAttribute("aria-label") !== t) {
      a.setAttribute("aria-label", t);
    }
  }

  /* Apply a title only to its still-current anchor; reuse a valid title-node reference when possible. */
  function AL(a, v, t) {
    if (!a.isConnected || V(a.href) !== v || IT(a) || HV(a)) return;
    const p = S.get(a);
    if (
      p &&
      p.videoId === v &&
      p.title === t &&
      p.node?.isConnected &&
      a.contains(p.node) &&
      (p.node.textContent || "").trim() === t
    ) {
      M(a, t);
      return;
    }
    const g = TT(a);
    if (!g) return;
    if ((g.textContent || "").trim() !== t) g.textContent = t;
    M(a, t);
    S.set(a, { videoId: v, title: t, node: g });
    PD(v, t);
  }

  /* Process an eligible title link using its previous state or a fetched community title. */
  async function PL(a) {
    if (!(a instanceof HTMLAnchorElement)) return;
    const v = V(a.href);
    if (!v || IT(a) || HV(a)) return;
    const p = S.get(a);
    if (p && p.videoId === v && p.title) {
      AL(a, v, p.title);
      return;
    }
    const t = await G(v);
    if (t) AL(a, v, t);
  }

  /* Identify a visible, plausible watch-page heading near the top of the viewport. */
  function LH(e) {
    if (!VI(e) || IT(e) || HV(e)) return false;
    const t = (e.textContent || "").trim();
    if (BT(t)) return false;
    const r = e.getBoundingClientRect();
    return r.top >= 0 && r.top < innerHeight * 0.75;
  }

  /* Observe the current heading so later site changes can be repaired. */
  function OH(e) {
    if (!e || e === he) return;
    if (ho) ho.disconnect();
    he = e;
    ho = new MutationObserver(() => SW(0));
    ho.observe(e, { childList: true, subtree: true, characterData: true });
  }

  /* Update the desktop page title and the best eligible watch heading's text node. */
  function AW(v, t) {
    if (!t || V(location.href) !== v) return false;
    const d = `${t} - YouTube`;
    if (document.title !== d) document.title = d;
    let b = null;
    let s = 0;
    document.querySelectorAll("h1,h2").forEach((e) => {
      if (!LH(e)) return;
      let q = (e.textContent || "").trim().length + (e.tagName === "H1" ? 100 : 50);
      const r = e.getBoundingClientRect();
      q += Math.max(0, 300 - r.top);
      if (q > s) {
        s = q;
        b = e;
      }
    });
    if (!b) return false;
    const e = b.querySelector("yt-formatted-string") || b;
    OH(e);
    const n = [...e.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
    if (!n) return false;
    if ((n.data || "").trim() !== t) n.data = t;
    return true;
  }

  /* Update the mobile watch title, preserving its existing element structure. */
  function AM(v, t) {
    if (!t || V(location.href) !== v) return false;
    const d = `${t} - YouTube`;
    if (document.title !== d) document.title = d;
    const b = document.querySelector(".slim-video-information-title");
    if (!b) return false;
    const e =
      b.querySelector(
        ".ytAttributedStringHost:not(.cbCustomTitle),.yt-core-attributed-string:not(.cbCustomTitle),yt-formatted-string:not(.cbCustomTitle)",
      ) || b;
    OH(e);
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    const a = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if ((n.data || "").trim()) a.push(n);
    }
    if (!a.length) return false;
    if ((e.textContent || "").trim() !== t) {
      a[0].data = t;
      for (let i = 1; i < a.length; i++) a[i].data = "";
    }
    return true;
  }

  /* Choose the mobile or desktop watch-title handler for this hostname. */
  function AX(v, t) {
    return location.hostname === "m.youtube.com" ? AM(v, t) : AW(v, t);
  }

  /* Apply a cached watch title or schedule the appropriate title lookup. */
  function PW() {
    const v = V(location.href);
    if (!v) {
      if (ho) ho.disconnect();
      ho = null;
      he = null;
      return;
    }
    if (he && !he.isConnected) {
      if (ho) ho.disconnect();
      ho = null;
      he = null;
    }
    const t = lc && lc.videoId === v ? lc.title : (D.get(v) ?? GC(v));
    if (t !== undefined) {
      if (t) AX(v, t);
      return;
    }
    GW(v).then((t) => {
      if (t) AX(v, t);
    });
  }

  /* Register an eligible link with the visibility observer, or process it directly if unavailable. */
  function QL(a) {
    if (!(a instanceof HTMLAnchorElement)) return;
    const v = V(a.href);
    if (!v || IT(a) || HV(a)) return;
    if (io) io.observe(a);
    else PL(a);
  }

  /* Scan one root and its descendant links for supported video URLs. */
  function SL(r = document) {
    if (r instanceof HTMLAnchorElement && r.matches(SEL)) QL(r);
    r.querySelectorAll?.(SEL).forEach(QL);
  }

  /* Run a link scan and request a watch-title update. */
  function SC(r = document) {
    SL(r);
    SW(0);
  }

  /* Coalesce full scans, keeping the earliest scheduled deadline. */
  function SF(d = 250) {
    const n = performance.now() + d;
    if (ft && n >= fd) return;
    if (ft) clearTimeout(ft);
    fd = n;
    ft = setTimeout(
      () => {
        ft = 0;
        fd = Infinity;
        SC();
      },
      Math.max(0, n - performance.now()),
    );
  }

  /* Coalesce watch-title updates, keeping the earliest scheduled deadline. */
  function SW(d = 0) {
    const n = performance.now() + d;
    if (wt && n >= wd) return;
    if (wt) clearTimeout(wt);
    wd = n;
    wt = setTimeout(
      () => {
        wt = 0;
        wd = Infinity;
        PW();
      },
      Math.max(0, n - performance.now()),
    );
  }

  /* Queue a changed DOM root for a short-delayed incremental scan. */
  function QR(r) {
    if (!(r instanceof Element)) return;
    R.add(r);
    if (!mt) mt = setTimeout(FR, 50);
  }

  /* Remove disconnected/nested duplicate roots, scan the survivors, and update the watch title. */
  function FR() {
    mt = 0;
    const a = [...R];
    R.clear();
    const m = [];
    for (const r of a) {
      if (!r.isConnected) continue;
      if (m.some((p) => p.contains(r))) continue;
      for (let i = m.length - 1; i >= 0; i--) {
        if (r.contains(m[i])) m.splice(i, 1);
      }
      m.push(r);
    }
    for (const r of m) SL(r);
    SW(0);
  }

  /* Observe the document title element, reconnecting if the site replaces it. */
  function OT() {
    const e = document.querySelector("title");
    if (!e || e === te) return;
    if (to) to.disconnect();
    te = e;
    to = new MutationObserver(() => SW(0));
    to.observe(e, { childList: true, subtree: true, characterData: true });
  }

  /* Debounce an additional watch-title check after DOM activity settles. */
  function SR() {
    clearTimeout(mrt);
    mrt = setTimeout(() => {
      mrt = 0;
      SW(0);
    }, 700);
  }

  /* Handle added nodes and changed links; queue incremental scans and refresh title observation. */
  function HM(ms) {
    let tc = false;
    for (const m of ms) {
      if (m.type === "attributes" && m.target instanceof HTMLAnchorElement) {
        QR(m.target);
        continue;
      }
      if (m.type === "childList" && m.target instanceof Element) {
        const a = m.target.closest?.(SEL);
        if (a instanceof HTMLAnchorElement) QR(a);
      }
      for (const n of m.addedNodes) {
        if (n instanceof Element) {
          QR(n);
          if (n.tagName === "TITLE" || n.querySelector?.("title")) tc = true;
        }
      }
    }
    if (tc) OT();
    SR();
  }

  /* Schedule the existing link and watch-title checks around page navigation. */
  function NAV(d = 350) {
    SF(d);
    SW(d);
  }

  /* Carry a known clicked-link title into navigation, with the existing bounded short retry window. */
  function CK(e) {
    const a = e.target instanceof Element && e.target.closest(SEL);
    if (!(a instanceof HTMLAnchorElement)) return;
    const v = V(a.href);
    if (!v) return;
    clearInterval(ct);
    ct = 0;
    lc = null;
    const p = S.get(a);
    const t = p && p.videoId === v ? p.title : (D.get(v) ?? GC(v));
    if (!t) return;
    lc = { videoId: v, title: t };
    let n = 0;
    ct = setInterval(() => {
      const d = V(location.href) === v && AX(v, t);
      if (d || ++n >= 75) {
        clearInterval(ct);
        ct = 0;
        if (lc?.videoId === v) lc = null;
      }
    }, 40);
  }

  /* Install link visibility/DOM/title observers, lifecycle events, and the initial scan. */
  function START() {
    const r = document.documentElement;
    if (!r) {
      setTimeout(START, 0);
      return;
    }
    io =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            (es) => {
              for (const e of es) {
                if (!e.isIntersecting) continue;
                io.unobserve(e.target);
                PL(e.target);
              }
            },
            { rootMargin: "240px 0px", threshold: 0.01 },
          )
        : null;
    mo = new MutationObserver(HM);
    mo.observe(r, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
    OT();
    const o = { capture: true, passive: true };
    document.addEventListener("click", CK, o);
    document.addEventListener("yt-navigate-start", () => NAV(100), o);
    document.addEventListener(
      "yt-navigate-finish",
      () => {
        SF(350);
        SW(0);
      },
      o,
    );
    document.addEventListener("ytm-navigate-start", () => NAV(100), o);
    document.addEventListener("ytm-navigate-finish", () => NAV(350), o);
    document.addEventListener("yt-page-data-updated", () => NAV(350), o);
    document.addEventListener("spfdone", () => NAV(350), o);
    window.addEventListener("popstate", () => NAV(350), o);
    window.addEventListener("pageshow", () => NAV(80), o);
    document.addEventListener("loadedmetadata", () => NAV(80), true);
    document.addEventListener("loadeddata", () => NAV(80), true);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) NAV(0);
    });
    SC();
  }
  START();
})();

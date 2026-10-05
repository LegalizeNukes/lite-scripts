// ==UserScript==
// @name         SponsorBlock YouTube
// @match        https://*.youtube.com/watch*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/**
 * Retrieve SponsorBlock skip segments for the current YouTube video.
 * Positive results are cached for a day; empty results for an hour.
 * Overlapping segments are merged. Playback skips use the existing 0.2-second
 * tolerance and timeupdate events rather than a continuous polling interval.
 * Segment definitions remain available after a skip so rewinding works.
 * The reported set prevents duplicate viewed-segment reports within a binding.
 * v = video element, id = video ID, segs = merged segments, ctrl = request
 * controller, mo = temporary video-discovery observer, tm/due = scheduled setup.
 */

(function () {
  "use strict";
  const C = [
      "sponsor",
      "selfpromo",
      "interaction",
      "intro",
      "outro",
      "preview",
      "music_offtopic",
      "exclusive_access",
    ],
    A = ["skip"],
    T = 0.2,
    E = "https://sponsor.ajay.app",
    TRACK = true,
    S = "video",
    K = "sponsorblock:",
    D = 864e5,
    N = 36e5,
    reported = new Set();
  let v = null,
    id = null,
    segs = [],
    ctrl = null,
    mo = null,
    tm = 0,
    due = 1 / 0,
    href = "";

  /* Read the current video ID and reject Shorts URLs. */
  function VID() {
    const u = new URL(location.href);
    return u.pathname.startsWith("/shorts/") ? null : u.searchParams.get("v");
  }

  /* Abort the currently pending segment request. */
  function cancel() {
    if (ctrl) (ctrl.abort(), (ctrl = null));
  }

  /* Clear playback listeners, queued setup, requests, and per-binding reporting state. */
  function stop() {
    if (tm) (clearTimeout(tm), (tm = 0), (due = 1 / 0));
    if (v) v.removeEventListener("timeupdate", tick);
    v = null;
    id = null;
    href = "";
    segs = [];
    reported.clear();
    cancel();
    if (mo) (mo.disconnect(), (mo = null));
  }

  /* Report skipped segment UUIDs when TRACK is enabled, preferring sendBeacon. */
  function track(a) {
    if (!TRACK || !a.length) return;
    for (const u of a)
      try {
        (navigator.sendBeacon &&
          navigator.sendBeacon(`${E}/api/viewedVideoSponsorTime?UUID=${encodeURIComponent(u)}`)) ||
          fetch(`${E}/api/viewedVideoSponsorTime?UUID=${encodeURIComponent(u)}`, {
            method: "POST",
            keepalive: true,
          }).catch(() => {});
      } catch {}
  }

  /* Combine overlapping intervals while preserving their UUIDs for reporting. */
  function merge(a) {
    a.sort((x, y) => x.start - y.start);
    const o = [];
    for (const s of a) {
      const p = o[o.length - 1];
      p && s.start <= p.end
        ? ((p.end = Math.max(p.end, s.end)), p.uuid.push(...s.uuid))
        : o.push(s);
    }
    return o;
  }

  /* Read a valid cached response and discard an expired entry. */
  function cached(x) {
    try {
      const y = localStorage.getItem(K + x);
      if (!y) return null;
      const z = JSON.parse(y);
      if (z && Array.isArray(z.d) && Date.now() - z.t < (z.d.length ? D : N)) return z.d;
      localStorage.removeItem(K + x);
    } catch {}
    return null;
  }

  /* Persist a segment response with its retrieval timestamp. */
  function save(x, j) {
    try {
      localStorage.setItem(K + x, JSON.stringify({ t: Date.now(), d: j }));
    } catch {}
  }

  /* Validate skip intervals, merge them, and check the current playback position. */
  function use(x, j) {
    if (!Array.isArray(j) || id !== x) return;
    segs = merge(
      j
        .filter((s) => s && s.actionType === "skip" && s.segment)
        .map((s) => ({ start: +s.segment[0], end: +s.segment[1], uuid: s.UUID ? [s.UUID] : [] }))
        .filter((s) => Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start),
    );
    tick();
  }

  /* Reuse cache or fetch segments; reject responses that belong to a previous video. */
  async function load(x) {
    cancel();
    const z = cached(x);
    if (z) return use(x, z);
    const c = new AbortController();
    ctrl = c;
    try {
      const r = await fetch(
        `${E}/api/skipSegments?videoID=${encodeURIComponent(x)}&categories=${encodeURIComponent(JSON.stringify(C))}&actionTypes=${encodeURIComponent(JSON.stringify(A))}`,
        { signal: c.signal },
      );
      if (id !== x) return;
      if (r.status === 404) return (save(x, []), use(x, []));
      if (!r.ok) return;
      const j = await r.json();
      if (!Array.isArray(j) || id !== x) return;
      save(x, j);
      use(x, j);
    } catch {
    } finally {
      ctrl === c && (ctrl = null);
    }
  }

  /* Skip a matching interval and report its UUIDs only once, retaining intervals for replay. */
  function tick() {
    if (!v || !segs.length) return;
    if (location.href !== href) return q(0);
    const t = v.currentTime;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (s.start > t + T) break;
      if (t >= s.start - T && t < s.end) {
        v.currentTime = s.end;
        track(
          s.uuid.filter((u) => {
            if (reported.has(u)) return false;
            reported.add(u);
            return true;
          }),
        );
        return;
      }
    }
  }

  /* Reset the previous binding, attach to this video, and load its segment definitions. */
  function bind(nv, x) {
    stop();
    v = nv;
    id = x;
    href = location.href;
    v.addEventListener("timeupdate", tick, { passive: true });
    load(x);
  }

  /* Find the current video, temporarily observe its arrival if necessary, and avoid duplicate bindings. */
  function setup() {
    const x = VID();
    if (!x) return stop();
    const nv = document.querySelector(S);
    if (!nv) {
      if (!mo) {
        mo = new MutationObserver(() => {
          VID() && document.querySelector(S) && (mo.disconnect(), (mo = null), q(0));
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      }
      return;
    }
    if (v === nv && id === x) return ((href = location.href), mo && (mo.disconnect(), (mo = null)));
    bind(nv, x);
  }

  /* Schedule setup at the earliest pending deadline, coalescing navigation and media events. */
  function q(d) {
    const n = performance.now() + d;
    if (tm && n >= due) return;
    tm && clearTimeout(tm);
    due = n;
    tm = setTimeout(
      () => {
        tm = 0;
        due = 1 / 0;
        setup();
      },
      Math.max(0, n - performance.now()),
    );
  }
  const o = { capture: true, passive: true };
  document.addEventListener("DOMContentLoaded", () => q(0), o);
  window.addEventListener("load", () => q(0), o);
  window.addEventListener("pageshow", () => q(50), o);
  window.addEventListener("pagehide", stop, o);
  document.addEventListener("yt-navigate-start", stop, o);
  document.addEventListener("yt-navigate-finish", () => q(80), o);
  document.addEventListener("yt-page-data-updated", () => q(100), o);
  document.addEventListener("loadedmetadata", () => q(0), true);
  document.addEventListener("play", () => q(0), true);
  window.addEventListener(
    "popstate",
    () => {
      stop();
      q(120);
    },
    o,
  );
  q(0);
})();

// ==UserScript==
// @name         Redirect Google Maps
// @match        https://*.google.com/maps*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/**
 * Open a Google Maps coordinate link in the handler for the maps:// scheme.
 * Coordinate priority: place data (!3d/!4d), query/q/ll parameters, then
 * the @latitude,longitude viewport coordinates. URLSearchParams decodes
 * encoded commas and spaces before the coordinate pair is checked.
 * P and R hold the original history methods. I is the 500 ms poll interval;
 * L limits that fallback polling to two minutes. All hooks are cleaned up
 * after a redirect or when that time limit is reached.
 */

(() => {
  "use strict";
  const A = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    Q = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/,
    D = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    I = 500,
    L = 12e4,
    P = history.pushState,
    R = history.replaceState;
  let d = false,
    q = false,
    i = 0,
    t = 0;

  /* Validate finite coordinates and their allowed ranges. The existing 0,0 exclusion is retained. */
  function V(a, o) {
    return (
      Number.isFinite(a) &&
      Number.isFinite(o) &&
      !(a === 0 && o === 0) &&
      a >= -90 &&
      a <= 90 &&
      o >= -180 &&
      o <= 180
    );
  }

  /* Convert the two coordinate strings to numbers and return a validated pair. */
  function C(a, o) {
    const l = Number(a),
      n = Number(o);
    return V(l, n) ? { lat: l, lon: n } : null;
  }

  /* Find the most specific usable coordinate pair in the current Maps URL. */
  function G(h) {
    let m = D.exec(h),
      c = m && C(m[1], m[2]);
    if (c) return c;
    try {
      const u = new URL(h, location.href);
      for (const key of ["query", "q", "ll"]) {
        m = Q.exec((u.searchParams.get(key) || "").trim());
        if (m && (c = C(m[1], m[2]))) return c;
      }
    } catch {}
    m = A.exec(h);
    return m ? C(m[1], m[2]) : null;
  }

  /* Extract a readable place label from /maps/place/... when one is available. */
  function N(h) {
    const m = /\/maps\/place\/([^/@?]+)/.exec(h);
    if (!m) return null;
    try {
      const n = decodeURIComponent(m[1].replace(/\+/g, " ")).trim();
      return n.split(",")[0].trim() || null;
    } catch {
      return null;
    }
  }

  /* Build the maps:// link using coordinates and a place label, or the coordinates as its label. */
  function U(h, a, o) {
    const l = `${a},${o}`,
      n = N(h) || l;
    return `maps://?ll=${encodeURIComponent(l)}&q=${encodeURIComponent(n)}`;
  }

  /* Stop monitoring and restore only history methods that still belong to this script. */
  function S() {
    if (d) return;
    d = true;
    q = false;
    window.removeEventListener("popstate", E);
    window.removeEventListener("hashchange", E);
    try {
      history.pushState === W && (history.pushState = P);
      history.replaceState === X && (history.replaceState = R);
    } catch {}
    i && (clearInterval(i), (i = 0));
    t && (clearTimeout(t), (t = 0));
  }

  /* Check the current URL; clean up and redirect as soon as coordinates are available. */
  function T() {
    if (d) return;
    const h = location.href,
      c = G(h);
    if (!c) return;
    const u = U(h, c.lat, c.lon);
    S();
    location.replace(u);
  }

  /* Coalesce history/hash notifications into one queued microtask. */
  function E() {
    if (d || q) return;
    q = true;
    queueMicrotask(() => {
      q = false;
      T();
    });
  }

  /* Wrap pushState without changing its arguments, result, or receiver. */
  function W(...a) {
    const r = P.apply(this, a);
    E();
    return r;
  }

  /* Wrap replaceState, then request the same coalesced URL check. */
  function X(...a) {
    const r = R.apply(this, a);
    E();
    return r;
  }
  try {
    history.pushState = W;
    history.replaceState = X;
  } catch {}
  window.addEventListener("popstate", E, { passive: true });
  window.addEventListener("hashchange", E, { passive: true });
  T();
  if (!d) {
    i = setInterval(T, I);
    t = setTimeout(S, L);
  }
})();

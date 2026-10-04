// ==UserScript==
// @name         Hide Nav Bars
// @match        https://*.x.com/*
// @match        https://*.youtube.com/*
// @match        https://*.reddit.com/*
// @match        https://redlib.catsarch.com/*
// @exclude      https://*.youtube.com/watch*
// @exclude		 https://*.youtube.com/shorts/*
// @grant        none
// ==/UserScript==

/**
 * Hide suitable fixed/sticky navigation bars after scrolling past the existing
 * 5% viewport threshold. YouTube watch pages are excluded by both the header
 * and the runtime guard, because YouTube can navigate without reloading.
 * Bars are discovered by sampling the top and bottom of the viewport.
 * Elements that contain video, audio, or iframes are not hidden.
 * Outer names: h = hidden state, t = pending scroll frame, p = pending
 * discovery frame, M = marked bar elements, o = mutation observer.
 * Inside E, W/H are viewport width/height; Q holds candidate bars.
 */

(() => {
  let h = false,
    t = 0,
    p = 0,
    M = new Set(),
    /* Calculate the existing scroll threshold from the visible viewport height. */
    T = () => (window.visualViewport?.height || innerHeight) * 0.05,
    /* Runtime watch-page guard for navigation that happens without a full page load. */
    W = () => location.hostname.endsWith("youtube.com") && location.pathname === "/watch",
    s = document.createElement("style");
  s.textContent = "html.AHN-hide .AHN{display:none!important}";
  document.documentElement.append(s);
  /* Detect media on an element or anywhere inside it. */
  let V = (e) => e?.matches?.("video,audio,iframe") || e?.querySelector?.("video,audio,iframe"),
    /* Restore removed marker classes and rediscover bars after relevant element changes. */
    o = new MutationObserver((m) => {
      if (W()) {
        h && S(0);
        return;
      }
      if (!h) return;
      let r = 0;
      for (let x of m)
        if (x.type === "attributes") {
          M.has(x.target) && !x.target.classList.contains("AHN") && x.target.classList.add("AHN");
        } else if (
          !M.has(x.target) &&
          [...x.addedNodes, ...x.removedNodes].some((n) => n.nodeType === 1)
        )
          r = 1;
      r &&
        !p &&
        ((p = 1),
        requestAnimationFrame(() => {
          ((p = 0), h && E());
        }));
    }),
    /* Mark a discovered bar and monitor its class so the site cannot simply erase the marker. */
    A = (e) => {
      if (!e || M.has(e) || V(e)) return;
      M.add(e);
      e.classList.add("AHN");
      o.observe(e, { attributes: true, attributeFilter: ["class"] });
    },
    /* Discover bar candidates, eliminate nested duplicates, and mark the surviving elements. */
    E = () => {
      let Q = new Map(),
        W = innerWidth,
        H = innerHeight,
        L = Math.min(300, H * 0.4),
        /* Per-pass computed-position cache. These measurements are not reused across later scans. */
        cs = new Map(),
        /* Per-pass bounding-rectangle cache. */
        rs = new Map(),
        /* Per-pass media-presence cache. */
        vs = new Map(),
        /* Read an element's computed position at most once during this discovery pass. */
        F = (n) => {
          if (!cs.has(n)) cs.set(n, getComputedStyle(n).position);
          return cs.get(n);
        },
        /* Measure an element's rectangle at most once during this discovery pass. */
        B = (n) => {
          if (!rs.has(n)) rs.set(n, n.getBoundingClientRect());
          return rs.get(n);
        },
        /* Check for media at most once per element during this discovery pass. */
        J = (n) => {
          if (!vs.has(n)) vs.set(n, !!V(n));
          return vs.get(n);
        };
      for (let b of [0, 1])
        for (let Y of b ? [H - 120, H - 80, H - 40, H - 2] : [2, 40, 80, 120])
          for (let X of [W * 0.06, W * 0.25, W * 0.5, W * 0.75, W * 0.94])
            for (let e of document.elementsFromPoint(X, Y)) {
              let P = [],
                f = -1;
              for (
                let n = e;
                n && n !== document.body && n !== document.documentElement;
                n = n.parentElement
              ) {
                P.push(n);
                if (f < 0) {
                  let c = F(n);
                  if (c === "fixed" || c === "sticky") f = P.length - 1;
                }
              }
              if (f < 0) continue;
              let q = null;
              for (let i = 0; i <= f; i++) {
                let n = P[i],
                  r = B(n);
                if (
                  r.width > W * 0.45 &&
                  r.height > 18 &&
                  r.height < L &&
                  (b ? r.bottom > H - 130 : r.top < 130) &&
                  !J(n)
                )
                  q = n;
              }
              if (q) {
                for (let n = q.parentElement; n && n !== document.body; n = n.parentElement) {
                  let r = B(n);
                  if (
                    r.width > W * 0.45 &&
                    r.height < L &&
                    (b ? r.bottom > H - 130 : r.top < 130) &&
                    !J(n)
                  )
                    q = n;
                  else break;
                }
                Q.set(q, b);
              }
            }
      for (let [e, b] of [...Q])
        for (let [p, c] of Q)
          if (e !== p && p.contains(e) && b === c) {
            Q.delete(e);
            break;
          }
      for (let e of Q.keys()) A(e);
    },
    /* Apply or release the hidden state and its observer registrations. */
    S = (v) => {
      h = v;
      if (v) {
        M.clear();
        document.querySelectorAll(".AHN").forEach((e) => e.classList.remove("AHN"));
        E();
        document.documentElement.classList.add("AHN-hide");
        o.observe(document.documentElement, { subtree: true, childList: true });
      } else {
        o.disconnect();
        document.documentElement.classList.remove("AHN-hide");
        M.forEach((e) => e.classList.remove("AHN"));
        M.clear();
      }
    },
    /* Handle one scheduled scroll update and change state only when the threshold is crossed. */
    R = () => {
      t = 0;
      if (W()) {
        h && S(0);
        return;
      }
      let q = Math.max(0, scrollY) > T();
      q !== h && S(q);
    };
  addEventListener(
    "scroll",
    () => {
      t || (t = requestAnimationFrame(R));
    },
    { passive: true },
  );
  R();
})();

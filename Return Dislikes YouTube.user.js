// ==UserScript==
// @name         Return Dislikes YouTube
// @match        https://*.youtube.com/watch/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/**
 * Display third-party vote counts alongside YouTube's existing vote buttons.
 * Use a fresh cache when possible, with a longer-lived stale fallback if the
 * API fails. Local clicks adjust the displayed counts without submitting
 * votes to the third-party API; YouTube still handles the original clicks.
 * Page observers are inactive off supported video routes. During playback
 * they prefer watch/fullscreen roots, with document-level discovery only
 * when those roots are not yet available.
 */

(function () {
  "use strict";
  const API_URL = "https://returnyoutubedislikeapi.com/votes?videoId=",
    CACHE_KEY = "return-youtube-dislike-cache-v2",
    CACHE_TTL = 9e5,
    STALE_CACHE_TTL = 864e5,
    CACHE_LIMIT = 100,
    UI_WAIT_LIMIT = 6e3,
    formatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }),
    BUTTON_SELECTOR = [
      "like-button-view-model button",
      "dislike-button-view-model button",
      "#segmented-like-button button",
      "#segmented-dislike-button button",
      "ytm-like-button-renderer button",
      "ytm-dislike-button-renderer button",
      "ytm-slim-video-action-bar-renderer button[aria-label]",
      "ytm-segmented-like-dislike-button-renderer button[aria-label]",
      "segmented-like-dislike-button-view-model button[aria-label]",
      ".ytp-fullscreen-quick-actions button[aria-label]",
    ].join(","),
    UI_SELECTOR = [
      "like-button-view-model",
      "dislike-button-view-model",
      "#segmented-like-button",
      "#segmented-dislike-button",
      "ytm-slim-video-action-bar-renderer",
      "ytm-segmented-like-dislike-button-renderer",
      "segmented-like-dislike-button-view-model",
      ".ytp-fullscreen-quick-actions",
    ].join(","),
    STYLE = `.return-youtube-vote-count{display:inline-block!important;flex:0 0 auto!important;min-width:0!important;margin:0!important;padding:0!important;color:currentColor!important;font:inherit!important;font-weight:500!important;line-height:1!important;white-space:nowrap!important;pointer-events:none!important}button.return-youtube-vote-button{display:inline-flex!important;align-items:center!important;column-gap:6px!important}:where(ytm-slim-video-action-bar-renderer,.ytp-fullscreen-quick-actions) :is(like-button-view-model,dislike-button-view-model).return-youtube-vote-host{flex:0 0 auto!important;width:auto!important;min-width:0!important;margin:0!important}:where(ytm-slim-video-action-bar-renderer,.ytp-fullscreen-quick-actions) button.return-youtube-vote-button{width:auto!important;min-width:0!important;margin:0!important;padding-inline:5px!important;column-gap:4px!important}ytm-slim-video-action-bar-renderer .return-youtube-vote-count{font-size:14px!important}.ytp-fullscreen-quick-actions .return-youtube-vote-count{font-size:12px!important}segmented-like-dislike-button-view-model button.return-youtube-vote-button,ytd-watch-metadata button.return-youtube-vote-button{width:auto!important;min-width:0!important}`;
  let currentVideoId = "",
    baseVotes = null,
    localDelta = { likes: 0, dislikes: 0 },
    currentVoteState = null,
    requestController = null,
    requestVideoId = "",
    updateTimer = 0,
    updateDueAt = Infinity,
    observer = null,
    observerExpiry = 0,
    pendingVote = null;
  const cache = loadCache();

  /* Format a nonnegative rounded vote count using compact English notation. */
  function formatCount(v) {
    return formatter.format(Math.max(0, Math.round(v)));
  }

  /* Resolve the current supported video route, avoiding stale metadata on non-video pages. */
  function getVideoId() {
    const u = new URL(location.href);
    if (
      u.pathname !== "/watch" &&
      !u.pathname.startsWith("/live/") &&
      !u.pathname.startsWith("/embed/")
    )
      return "";
    const v = u.searchParams.get("v");
    if (v) return v;
    const m = document.querySelector('meta[itemprop="videoId"],meta[itemprop="identifier"]');
    if (m && m.content) return m.content;
    const c = document.querySelector('link[rel="canonical"],meta[property="og:video:url"]'),
      h = c && (c.href || c.content);
    if (h)
      try {
        return new URL(h, location.href).searchParams.get("v") || "";
      } catch {}
    return "";
  }

  /* Validate API/cache counts and represent unavailable likes with null. */
  function cleanVotes(v) {
    if (!v || typeof v !== "object") return null;
    const d = Number(v.dislikes),
      l = Number(v.likes);
    return Number.isFinite(d) && d >= 0
      ? { dislikes: d, likes: Number.isFinite(l) && l >= 0 ? l : null }
      : null;
  }

  /* Load persistent vote entries that remain within the stale-cache lifetime. */
  function loadCache() {
    const m = new Map();
    try {
      const a = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
      if (!Array.isArray(a)) return m;
      for (const e of a) {
        if (!Array.isArray(e) || e.length !== 2) continue;
        const [v, c] = e,
          d = cleanVotes(c && c.votes),
          t = Number(c && c.time);
        typeof v === "string" &&
          d &&
          Number.isFinite(t) &&
          Date.now() - t <= STALE_CACHE_TTL &&
          m.set(v, { votes: d, time: t });
      }
    } catch {}
    return m;
  }

  /* Persist the in-memory vote cache, tolerating unavailable or full storage. */
  function saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify([...cache]));
    } catch {}
  }

  /* Return fresh or permitted stale data and update its recency position. */
  function getCached(v, stale) {
    const e = cache.get(v);
    if (!e) return null;
    const a = Date.now() - e.time;
    if (a > STALE_CACHE_TTL || (!stale && a > CACHE_TTL)) {
      if (a > STALE_CACHE_TTL) {
        cache.delete(v);
        saveCache();
      }
      return null;
    }
    cache.delete(v);
    cache.set(v, e);
    return e.votes;
  }

  /* Store fetched votes and evict oldest map entries beyond the existing limit. */
  function putCached(v, d) {
    cache.delete(v);
    cache.set(v, { votes: d, time: Date.now() });
    while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
    saveCache();
  }

  /* Install this script's vote-count and button-layout styles once. */
  function ensureStyle() {
    if (document.getElementById("return-youtube-dislike-style")) return;
    const s = document.createElement("style");
    s.id = "return-youtube-dislike-style";
    s.textContent = STYLE;
    (document.head || document.documentElement).appendChild(s);
  }

  /* Remove inserted vote labels and this script's layout classes. */
  function clearCounts() {
    document.querySelectorAll(".return-youtube-vote-count").forEach((e) => e.remove());
    document
      .querySelectorAll(".return-youtube-vote-button")
      .forEach((e) => e.classList.remove("return-youtube-vote-button"));
    document
      .querySelectorAll(".return-youtube-vote-host")
      .forEach((e) => e.classList.remove("return-youtube-vote-host"));
  }

  /* Cancel the current vote request and clear its associated video ID. */
  function abortRequest() {
    requestController && requestController.abort();
    requestController = null;
    requestVideoId = "";
  }

  /* Cancel the delayed check that reconciles a local click with YouTube's state. */
  function cancelPendingVote() {
    pendingVote && pendingVote.timer && clearTimeout(pendingVote.timer);
    pendingVote = null;
  }

  /* Cancel the pending page-update timer and reset its deadline. */
  function cancelUpdate() {
    updateTimer && clearTimeout(updateTimer);
    updateTimer = 0;
    updateDueAt = Infinity;
  }

  /* Disconnect observers, cancel old work, and clear the previous video's UI/state. */
  function resetForNavigation() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (observerExpiry) {
      clearTimeout(observerExpiry);
      observerExpiry = 0;
    }
    cancelUpdate();
    cancelPendingVote();
    abortRequest();
    clearCounts();
    currentVideoId = "";
    baseVotes = null;
    localDelta = { likes: 0, dislikes: 0 };
    currentVoteState = null;
  }

  /* Coalesce updates at the earliest requested deadline. */
  function scheduleUpdate(d = 0) {
    const n = performance.now() + d;
    if (updateTimer && n >= updateDueAt) return;
    updateTimer && clearTimeout(updateTimer);
    updateDueAt = n;
    updateTimer = setTimeout(
      () => {
        updateTimer = 0;
        updateDueAt = Infinity;
        updatePage();
      },
      Math.max(0, n - performance.now()),
    );
  }

  /* Use a fresh cache or fetch votes, retaining stale data as an error fallback. */
  async function fetchVotes(v) {
    const fresh = getCached(v, false);
    if (fresh) return fresh;
    const stale = getCached(v, true);
    abortRequest();
    const a = new AbortController();
    requestController = a;
    requestVideoId = v;
    try {
      const r = await fetch(API_URL + encodeURIComponent(v), {
        signal: a.signal,
        credentials: "omit",
      });
      if (!r.ok) return stale;
      const d = cleanVotes(await r.json());
      if (!d) return stale;
      putCached(v, d);
      return d;
    } catch {
      return stale;
    } finally {
      if (requestController === a) {
        requestController = null;
        requestVideoId = "";
      }
    }
  }

  /* Identify a like/dislike button from its container or existing accessible label. */
  function voteType(b) {
    if (!(b instanceof Element)) return null;
    if (
      b.closest("dislike-button-view-model,#segmented-dislike-button,ytm-dislike-button-renderer")
    )
      return "dislike";
    if (b.closest("like-button-view-model,#segmented-like-button,ytm-like-button-renderer"))
      return "like";
    if (!b.closest(UI_SELECTOR)) return null;
    const a = b.getAttribute("aria-label") || "";
    return /dislike/i.test(a)
      ? "dislike"
      : /(?:^|\s)(?:like|unlike)(?:\s|$)/i.test(a)
        ? "like"
        : null;
  }

  /* Collect supported vote buttons without processing the same button twice. */
  function getButtons(r = document) {
    const a = [],
      s = new Set();
    r.querySelectorAll(BUTTON_SELECTOR).forEach((b) => {
      const t = voteType(b);
      t && !s.has(b) && (s.add(b), a.push({ button: b, type: t }));
    });
    return a;
  }

  /* Detect a native like count so this script does not add a duplicate. */
  function hasNativeCount(b) {
    return [
      ...b.querySelectorAll(".ytSpecButtonShapeNextButtonTextContent,span[role='text'],#text"),
    ].some(
      (e) => !e.classList.contains("return-youtube-vote-count") && /\d/.test(e.textContent || ""),
    );
  }

  /* Combine the fetched base count with this binding's local click adjustment. */
  function displayed(type) {
    if (!baseVotes) return null;
    const k = type === "like" ? "likes" : "dislikes",
      v = baseVotes[k];
    return v === null ? null : Math.max(0, v + localDelta[k]);
  }

  /* Remove this script's count for one button and clean up unused layout classes. */
  function removeCount(b, t) {
    b.querySelectorAll(`.return-youtube-vote-count[data-vote-type="${t}"]`).forEach((e) =>
      e.remove(),
    );
    if (!b.querySelector(".return-youtube-vote-count")) {
      b.classList.remove("return-youtube-vote-button");
      const h = b.closest("like-button-view-model,dislike-button-view-model");
      h && h.classList.remove("return-youtube-vote-host");
    }
  }

  /* Insert or update a count, avoiding redundant writes and preserving native like counts. */
  function ensureCount(b, t, v) {
    if (v === null || (t === "like" && hasNativeCount(b))) {
      removeCount(b, t);
      return;
    }
    let c = b.querySelector(`.return-youtube-vote-count[data-vote-type="${t}"]`);
    if (!c) {
      c = document.createElement("span");
      c.className = "return-youtube-vote-count";
      c.dataset.voteType = t;
      const f = [...b.children].find((e) =>
        e.matches("yt-touch-feedback-shape,yt-light-shape,yt-interaction"),
      );
      b.insertBefore(c, f || null);
      b.classList.add("return-youtube-vote-button");
      const h = b.closest("like-button-view-model,dislike-button-view-model");
      h && h.classList.add("return-youtube-vote-host");
    }
    const text = formatCount(v);
    if (c.textContent !== text) c.textContent = text;
    if (c.dataset.videoId !== currentVideoId) c.dataset.videoId = currentVideoId;
  }

  /* Render counts only if the response and current route still refer to the same video. */
  function renderCurrent() {
    if (!baseVotes || !currentVideoId || getVideoId() !== currentVideoId) return false;
    ensureStyle();
    const b = getButtons();
    for (const { button: e, type: t } of b) ensureCount(e, t, displayed(t));
    return b.some((e) => e.type === "dislike");
  }

  /* Read pressed-button state, preferring visible controls when multiple copies exist. */
  function inferVoteState(preferred) {
    let b = getButtons();
    if (!b.length) return null;
    const visible = b.filter((e) => e.button.getClientRects().length);
    visible.length && (b = visible);
    if (preferred && preferred.getAttribute("aria-pressed") === "true") return voteType(preferred);
    const p = b.find((e) => e.button.getAttribute("aria-pressed") === "true");
    return p ? p.type : "none";
  }

  /* Update local like/dislike deltas when the pressed vote state changes. */
  function transition(from, to) {
    if (from === to) return;
    from === "like" && localDelta.likes--;
    from === "dislike" && localDelta.dislikes--;
    to === "like" && localDelta.likes++;
    to === "dislike" && localDelta.dislikes++;
    currentVoteState = to;
    renderCurrent();
  }

  /* Find the clicked vote button, including one in an event's composed path. */
  function eventButton(e) {
    const p = typeof e.composedPath === "function" ? e.composedPath() : [];
    for (const n of p) if (n instanceof HTMLButtonElement && voteType(n)) return n;
    return e.target instanceof Element ? e.target.closest("button") : null;
  }

  /* Apply the expected local count change, then reconcile it with YouTube after the existing delay. */
  function onVoteClick(e) {
    const b = eventButton(e),
      t = voteType(b);
    if (!t || !currentVideoId || getVideoId() !== currentVideoId) return;
    const before = currentVoteState || inferVoteState(b) || "none",
      expected = before === t ? "none" : t;
    cancelPendingVote();
    transition(before, expected);
    const v = currentVideoId;
    pendingVote = {
      videoId: v,
      expected,
      timer: setTimeout(() => {
        if (!pendingVote || pendingVote.videoId !== v) return;
        const actual = inferVoteState();
        actual !== null &&
          actual !== currentVoteState &&
          transition(currentVoteState || "none", actual);
        pendingVote = null;
      }, 1200),
    };
  }

  /* Filter DOM records for relevant vote controls or video-ID changes. */
  function touchesUi(m) {
    if (m.type === "attributes") return m.attributeName === "video-id";
    for (const n of [...m.addedNodes, ...m.removedNodes])
      if (
        n instanceof Element &&
        (n.matches(UI_SELECTOR) ||
          n.querySelector(UI_SELECTOR) ||
          (n.matches("button") && voteType(n)) ||
          n.querySelector(BUTTON_SELECTOR))
      )
        return true;
    return false;
  }

  /* Observe current watch/fullscreen UI and replacement boundaries, with a discovery fallback. */
  function startObserver() {
    if (!currentVideoId || !document.documentElement) return;
    if (!observer)
      observer = new MutationObserver((m) => {
        if (getVideoId() !== currentVideoId) {
          scheduleUpdate(0);
          return;
        }
        m.some(touchesUi) && scheduleUpdate(50);
      });
    observer.disconnect();
    const roots = [
        ...document.querySelectorAll(
          "ytd-watch-flexy,ytm-watch,ytm-watch-page,.ytp-fullscreen-quick-actions",
        ),
      ],
      options = { childList: true, subtree: true, attributes: true, attributeFilter: ["video-id"] };
    if (!roots.length) observer.observe(document.documentElement, options);
    else {
      for (const root of roots) {
        observer.observe(root, options);
        if (root.parentNode && !roots.includes(root.parentNode))
          observer.observe(root.parentNode, { childList: true });
      }
      if (document.body) observer.observe(document.body, { childList: true });
    }
  }

  /* Schedule the existing delayed retry when vote controls are not yet present. */
  function waitForUi() {
    observerExpiry && clearTimeout(observerExpiry);
    observerExpiry = setTimeout(() => {
      observerExpiry = 0;
      scheduleUpdate(0);
    }, UI_WAIT_LIMIT);
  }

  /* Resolve navigation, attach the needed observer, load votes, and render current controls. */
  async function updatePage() {
    const v = getVideoId();
    if (!v) {
      (currentVideoId || observer) && resetForNavigation();
      return;
    }
    if (v !== currentVideoId) {
      cancelPendingVote();
      abortRequest();
      clearCounts();
      currentVideoId = v;
      baseVotes = null;
      localDelta = { likes: 0, dislikes: 0 };
      currentVoteState = null;
    }
    startObserver();
    if (baseVotes) {
      renderCurrent() || waitForUi();
      return;
    }
    if (requestController && requestVideoId === v) return;
    const d = await fetchVotes(v);
    if (!d || currentVideoId !== v || getVideoId() !== v) return;
    baseVotes = d;
    currentVoteState = inferVoteState();
    startObserver();
    renderCurrent() || waitForUi();
  }

  /* Discard the previous binding as YouTube begins navigating. */
  function navStart() {
    resetForNavigation();
  }

  /* Schedule the existing short-delayed update after navigation finishes. */
  function navFinish() {
    scheduleUpdate(80);
  }

  /* Reset and schedule a new update after browser history navigation. */
  function historyNav() {
    resetForNavigation();
    scheduleUpdate(80);
  }
  const passiveCapture = { capture: true, passive: true };
  document.addEventListener("click", onVoteClick, true);
  document.addEventListener("DOMContentLoaded", () => scheduleUpdate(0), passiveCapture);
  window.addEventListener("load", () => scheduleUpdate(0), passiveCapture);
  window.addEventListener("pageshow", () => scheduleUpdate(50), passiveCapture);
  window.addEventListener("pagehide", resetForNavigation, passiveCapture);
  document.addEventListener("yt-navigate-start", navStart, passiveCapture);
  document.addEventListener("yt-navigate-finish", navFinish, passiveCapture);
  document.addEventListener("ytm-navigate-start", navStart, passiveCapture);
  document.addEventListener("ytm-navigate-finish", navFinish, passiveCapture);
  document.addEventListener("yt-page-data-updated", () => scheduleUpdate(100), passiveCapture);
  document.addEventListener("spfdone", () => scheduleUpdate(100), passiveCapture);
  document.addEventListener("loadedmetadata", () => scheduleUpdate(20), true);
  document.addEventListener("loadeddata", () => scheduleUpdate(20), true);
  document.addEventListener("play", () => scheduleUpdate(0), true);
  window.addEventListener("popstate", historyNav, passiveCapture);
  document.addEventListener("fullscreenchange", () => scheduleUpdate(0), passiveCapture);
  document.addEventListener("webkitfullscreenchange", () => scheduleUpdate(0), passiveCapture);
  document.addEventListener("visibilitychange", () => {
    document.hidden || scheduleUpdate(0);
  });
  scheduleUpdate(0);
})();
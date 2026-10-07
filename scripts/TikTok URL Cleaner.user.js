// ==UserScript==
// @name         TikTok URL Cleaner
// @match        https://*.tiktok.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
(()=>{if(top==self&&location.search)location.replace(location.origin+location.pathname)})();
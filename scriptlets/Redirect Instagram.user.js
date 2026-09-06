// ==UserScript==
// @name         Redirect Instagram
// @match        https://*.instagram.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==
location.replace(`https://imginn.com${location.pathname}${location.search}${location.hash}`);

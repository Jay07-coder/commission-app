// Minimal service worker — required for PWA installability.
// Pass-through fetch (no aggressive caching) so the live, auth'd app always stays fresh.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => { /* network passthrough */ });

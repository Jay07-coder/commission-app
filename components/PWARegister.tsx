"use client";

import { useEffect } from "react";

/* Registers the service worker so SplitKey is installable as an app. */
export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

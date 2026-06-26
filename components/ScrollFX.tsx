"use client";

import { useEffect } from "react";

/* Cinematic scroll reveals + count-up stats.
   [data-reveal] elements tilt + rise into view; [data-count] numbers
   animate from 0 to their target the first time they're seen. */
export default function ScrollFX() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const supported = "IntersectionObserver" in window;

    // ---- reveals ----
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (reduce || !supported) {
      els.forEach((e) => e.classList.add("in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        }),
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
      );
      els.forEach((e) => io.observe(e));
    }

    // ---- count-up numbers ----
    const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));
    const fmt = (el: HTMLElement, v: number) => {
      const dec = parseInt(el.dataset.dec || "0", 10);
      const comma = el.dataset.comma != null;
      let s = comma ? Math.round(v).toLocaleString() : dec > 0 ? v.toFixed(dec) : Math.round(v).toString();
      return (el.dataset.prefix || "") + s + (el.dataset.suffix || "");
    };
    const run = (el: HTMLElement) => {
      const target = parseFloat(el.dataset.count || "0");
      const dur = 1500, t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(el, target * e);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmt(el, target);
      };
      requestAnimationFrame(step);
    };
    if (reduce || !supported) {
      // leave server-rendered values as-is
    } else {
      const io2 = new IntersectionObserver(
        (entries) => entries.forEach((en) => {
          if (en.isIntersecting) { run(en.target as HTMLElement); io2.unobserve(en.target); }
        }),
        { threshold: 0.5 }
      );
      counters.forEach((c) => io2.observe(c));
    }
  }, []);

  return null;
}

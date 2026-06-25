"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { money } from "@/lib/commission";

interface Deal { zip: string; source: string; gross: number; brokerage: number; }
type Metric = "deals" | "gross";
/* eslint-disable @typescript-eslint/no-explicit-any */

const CACHE_KEY = "splitkey_zip_centroids_v1";

export default function MapView({ deals }: { deals: Deal[] }) {
  const [source, setSource] = useState("");
  const [metric, setMetric] = useState<Metric>("deals");
  const [centroids, setCentroids] = useState<Record<string, [number, number]>>({});
  const [ready, setReady] = useState(false);

  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sources = useMemo(
    () => Array.from(new Set(deals.map((d) => d.source).filter(Boolean))).sort(),
    [deals]
  );

  const byZip = useMemo(() => {
    const m = new Map<string, { zip: string; count: number; gross: number; brokerage: number }>();
    for (const d of deals) {
      if (source && d.source !== source) continue;
      const c = m.get(d.zip) || { zip: d.zip, count: 0, gross: 0, brokerage: 0 };
      c.count += 1; c.gross += d.gross; c.brokerage += d.brokerage;
      m.set(d.zip, c);
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [deals, source]);

  const zipsKey = useMemo(() => byZip.map((z) => z.zip).sort().join(","), [byZip]);

  // Load cached centroids from localStorage once.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) setCentroids(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Load Leaflet from CDN and init the map.
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const l = document.createElement("link");
      l.id = "leaflet-css"; l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
    }
    function init() {
      const L = (window as any).L;
      if (!L || !containerRef.current || mapRef.current) { setReady(!!L); return; }
      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([42.5, -83.1], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setTimeout(() => map.invalidateSize(), 200);
      setReady(true);
    }
    if ((window as any).L) { init(); return; }
    let s = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (!s) {
      s = document.createElement("script");
      s.id = "leaflet-js"; s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = init; document.body.appendChild(s);
    } else {
      s.addEventListener("load", init);
    }
  }, []);

  // Geocode any zips we don't have centroids for yet (cached to localStorage).
  useEffect(() => {
    const need = byZip.map((z) => z.zip).filter((z) => !centroids[z]);
    if (!need.length) return;
    let cancel = false;
    (async () => {
      const upd: Record<string, [number, number]> = {};
      for (let i = 0; i < need.length; i += 20) {
        const chunk = need.slice(i, i + 20);
        await Promise.all(chunk.map(async (z) => {
          try {
            const r = await fetch("https://api.zippopotam.us/us/" + z);
            if (r.ok) {
              const j = await r.json();
              const p = j.places && j.places[0];
              if (p) upd[z] = [parseFloat(p.latitude), parseFloat(p.longitude)];
            }
          } catch { /* ignore */ }
        }));
        if (cancel) return;
      }
      if (!cancel && Object.keys(upd).length) {
        setCentroids((c) => {
          const next = { ...c, ...upd };
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      }
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipsKey]);

  // Draw / redraw markers when data, metric, or centroids change.
  useEffect(() => {
    const L = (window as any).L;
    if (!ready || !L || !mapRef.current || !layerRef.current) return;
    const layer = layerRef.current;
    layer.clearLayers();
    const pts = byZip.filter((z) => centroids[z.zip]);
    if (!pts.length) return;
    const max = Math.max(...pts.map((p) => (metric === "deals" ? p.count : p.gross)), 1);
    const shade = (t: number) => (t > 0.66 ? "#1e3a8a" : t > 0.33 ? "#2563eb" : "#60a5fa");
    const latlngs: [number, number][] = [];
    for (const p of pts) {
      const ll = centroids[p.zip]; latlngs.push(ll);
      const v = metric === "deals" ? p.count : p.gross;
      const t = v / max;
      const radius = 7 + 24 * Math.sqrt(t);
      const m = L.circleMarker(ll, { radius, fillColor: shade(t), color: "#ffffff", weight: 1.5, fillOpacity: 0.78 });
      m.bindPopup(`<b>Zip ${p.zip}</b><br/>${p.count} deal${p.count === 1 ? "" : "s"}<br/>Gross ${money(p.gross)}<br/>Net to brokerage ${money(p.brokerage)}`);
      m.bindTooltip(p.zip, { direction: "top" });
      layer.addLayer(m);
    }
    try { mapRef.current.fitBounds(latlngs, { padding: [40, 40], maxZoom: 11 }); } catch { /* ignore */ }
  }, [ready, byZip, centroids, metric]);

  const geocoded = byZip.filter((z) => centroids[z.zip]).length;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "var(--ink)" }}>Target map</h2>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap", alignItems: "center" }}>
          <Segmented options={[{ key: "deals", label: "By deals" }, { key: "gross", label: "By commission" }]} value={metric} onChange={(v) => setMetric(v as Metric)} />
          <select value={source} onChange={(e) => setSource(e.target.value)} style={{ width: "auto" }}>
            <option value="">All sources</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: 14 }}>
        <div ref={containerRef} style={{ height: "62vh", minHeight: 440, width: "100%" }} />
      </div>
      <p className="hint" style={{ marginTop: 12 }}>
        Showing {geocoded} of {byZip.length} zip areas{source ? ` for ${source}` : ""}. Bigger, darker circles mean more {metric === "deals" ? "deals" : "commission"}. Click a circle for details. Deals without a zip code aren&apos;t plotted.
      </p>
    </>
  );
}

function Segmented({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--panel2)", border: "1px solid var(--line)", borderRadius: 9, padding: 3, gap: 2 }}>
      {options.map((o) => (
        <button key={o.key} onClick={() => onChange(o.key)}
          style={{
            border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 500, padding: "6px 11px", borderRadius: 6,
            background: value === o.key ? "var(--panel)" : "transparent",
            color: value === o.key ? "var(--ink)" : "var(--muted)",
            boxShadow: value === o.key ? "0 1px 2px rgba(16,24,40,.08)" : "none",
          }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

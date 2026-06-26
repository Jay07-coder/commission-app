"use client";

import { useEffect, useRef } from "react";

/* Immersive WebGL backdrop: a glassy floating dashboard, orbiting KPI cards,
   and a particle depth field. Reacts to scroll + mouse. Three.js via CDN. */
export default function Scene3D() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    let disposed = false;
    const cleanups: Array<() => void> = [];
    /* eslint-disable @typescript-eslint/no-explicit-any */

    function roundRect(c: any, x: number, y: number, w: number, h: number, r: number) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    function dashTexture(THREE: any) {
      const cv = document.createElement("canvas");
      cv.width = 720; cv.height = 460;
      const c = cv.getContext("2d")!;
      // panel
      const g = c.createLinearGradient(0, 0, 0, 460);
      g.addColorStop(0, "#13284a"); g.addColorStop(1, "#0c1c38");
      c.fillStyle = g; roundRect(c, 0, 0, 720, 460, 26); c.fill();
      c.strokeStyle = "rgba(120,160,230,.35)"; c.lineWidth = 2; c.stroke();
      // header
      c.fillStyle = "#fff"; c.font = "700 26px Inter, Arial"; c.fillText("Reports", 34, 52);
      c.fillStyle = "#6ea8ff"; c.font = "600 15px Inter, Arial"; c.fillText("● Live", 34, 78);
      // kpi tiles
      const tiles = [["GROSS", "$1.78M", "#3b82f6"], ["NET", "$503K", "#16a34a"], ["AGENTS", "$1.04M", "#7c3aed"], ["DEALS", "256", "#f59e0b"]];
      tiles.forEach((t, i) => {
        const x = 34 + i * 166, y = 100;
        c.fillStyle = "rgba(255,255,255,.05)"; roundRect(c, x, y, 150, 92, 14); c.fill();
        c.fillStyle = t[2]; c.fillRect(x, y + 12, 4, 68);
        c.fillStyle = "#9fb4d4"; c.font = "600 12px Inter, Arial"; c.fillText(t[0], x + 16, y + 30);
        c.fillStyle = "#fff"; c.font = "800 26px Inter, Arial"; c.fillText(t[1], x + 16, y + 64);
      });
      // bar chart
      const bx = 34, by = 230, bw = 652, bh = 190;
      c.fillStyle = "rgba(255,255,255,.04)"; roundRect(c, bx, by, bw, bh, 14); c.fill();
      const bars = [52, 38, 60, 44, 30, 40, 24, 30, 36, 48, 92, 72];
      const gap = bw / bars.length;
      bars.forEach((h, i) => {
        const bh2 = (h / 100) * (bh - 36);
        const gx = bx + 14 + i * gap;
        const grd = c.createLinearGradient(0, by + bh - bh2, 0, by + bh - 14);
        grd.addColorStop(0, "#60a5fa"); grd.addColorStop(1, "#2563eb");
        c.fillStyle = grd; roundRect(c, gx, by + bh - 14 - bh2, gap - 18, bh2, 5); c.fill();
      });
      const tex = new THREE.CanvasTexture(cv);
      tex.anisotropy = 4;
      return tex;
    }

    function cardTexture(THREE: any, label: string, sub: string, color: string) {
      const cv = document.createElement("canvas");
      cv.width = 360; cv.height = 200;
      const c = cv.getContext("2d")!;
      c.fillStyle = "rgba(16,30,56,.92)"; roundRect(c, 4, 4, 352, 192, 22); c.fill();
      c.strokeStyle = "rgba(130,170,235,.4)"; c.lineWidth = 2; c.stroke();
      c.fillStyle = color; roundRect(c, 26, 26, 46, 46, 12); c.fill();
      c.fillStyle = "#9fb4d4"; c.font = "600 16px Inter, Arial"; c.fillText(sub, 90, 50);
      c.fillStyle = "#fff"; c.font = "800 40px Inter, Arial"; c.fillText(label, 26, 140);
      return new THREE.CanvasTexture(cv);
    }

    function init(THREE: any) {
      const canvas = ref.current;
      if (!canvas || disposed) return;
      const W = () => window.innerWidth, H = () => window.innerHeight;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W(), H());

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x070d1a, 0.045);
      const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 100);
      camera.position.set(0, 0, 10);

      scene.add(new THREE.AmbientLight(0x8aa0c8, 0.9));
      const dir = new THREE.DirectionalLight(0xffffff, 1.0); dir.position.set(5, 6, 8); scene.add(dir);
      const pt = new THREE.PointLight(0x2563eb, 2.2, 50); pt.position.set(-7, 3, 5); scene.add(pt);

      const group = new THREE.Group();
      const wide = W() > 900;
      group.position.x = wide ? 3.6 : 0;
      group.position.y = wide ? 0.5 : 1.7;
      group.scale.setScalar(wide ? 0.86 : 0.6);

      // glass frame + dashboard
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 3.7),
        new THREE.MeshStandardMaterial({ color: 0x0c2545, transparent: true, opacity: 0.5, roughness: 0.15, metalness: 0.7 })
      );
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(5.0, 3.2),
        new THREE.MeshStandardMaterial({ map: dashTexture(THREE), transparent: true, roughness: 0.4, metalness: 0.05 })
      );
      panel.position.z = 0.05;
      group.add(frame, panel);

      // orbiting KPI cards
      const cards: any[] = [];
      const cfg = [["$1.78M", "Gross", "#3b82f6"], ["256", "Deals", "#16a34a"], ["AI", "Copilot", "#7c3aed"], ["1099", "Ready", "#f59e0b"]];
      cfg.forEach((d, i) => {
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(1.7, 0.95),
          new THREE.MeshStandardMaterial({ map: cardTexture(THREE, d[0], d[1], d[2]), transparent: true, roughness: 0.35 })
        );
        m.userData = { ang: (i / cfg.length) * Math.PI * 2, r: 2.6, ry: 1.7, spd: 0.07 * (i % 2 ? 1 : -1), bob: Math.random() * 6 };
        cards.push(m); group.add(m);
      });
      scene.add(group);

      // particle depth field
      const N = W() > 700 ? 750 : 350;
      const pg = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 44; pos[i * 3 + 1] = (Math.random() - 0.5) * 32; pos[i * 3 + 2] = (Math.random() - 0.5) * 32 - 6; }
      pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const points = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x6ea8ff, size: 0.07, transparent: true, opacity: 0.65, depthWrite: false }));
      scene.add(points);

      let tmx = 0, tmy = 0, mx = 0, my = 0, scrollY = 0;
      const onMouse = (e: MouseEvent) => { tmx = e.clientX / W() - 0.5; tmy = e.clientY / H() - 0.5; };
      const onScroll = () => { scrollY = window.scrollY; };
      const onResize = () => { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); };
      window.addEventListener("mousemove", onMouse);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      cleanups.push(() => { window.removeEventListener("mousemove", onMouse); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); });

      const clock = new THREE.Clock();
      const baseX = group.position.x, baseY = group.position.y;
      function animate() {
        if (disposed) return;
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
        const max = (document.body.scrollHeight - window.innerHeight) || 1;
        const sp = Math.min(scrollY / max, 1);

        camera.position.z = 10 + sp * 7;
        camera.position.y = -sp * 4;
        camera.lookAt(0, -sp * 2, 0);

        group.rotation.y = mx * 0.5 + Math.sin(t * 0.25) * 0.06;
        group.rotation.x = my * 0.3 + Math.cos(t * 0.3) * 0.04;
        group.rotation.z = sp * 0.25;
        group.position.y = baseY + Math.sin(t * 0.6) * 0.18 - sp * 2;
        group.position.x = baseX - sp * 1.2;

        cards.forEach((m) => {
          m.userData.ang += m.userData.spd * 0.05;
          const a = m.userData.ang;
          m.position.set(Math.cos(a) * m.userData.r, Math.sin(a) * m.userData.ry + Math.sin(t + m.userData.bob) * 0.22, Math.sin(a) * 1.3 + 0.6);
          m.lookAt(camera.position);
        });
        points.rotation.y = t * 0.018;
        points.rotation.x = my * 0.1;
        renderer.render(scene, camera);
      }
      animate();

      cleanups.push(() => { renderer.dispose(); pg.dispose(); });
    }

    const existing = (window as any).THREE;
    if (existing) init(existing);
    else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      s.async = true;
      s.onload = () => init((window as any).THREE);
      document.head.appendChild(s);
    }

    return () => { disposed = true; cancelAnimationFrame(raf); cleanups.forEach((f) => f()); };
  }, []);

  return <canvas ref={ref} aria-hidden style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}

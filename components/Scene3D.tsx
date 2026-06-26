"use client";

import { useEffect, useRef } from "react";

/* Immersive WebGL hero: glowing grid floor, a glassy floating dashboard,
   orbiting KPI cards wired with animated data-lines, neon halos, a glowing
   particle field, a cursor-tracking light, and a cinematic entrance.
   Three.js via CDN. Reacts to mouse + scroll. */
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

    function glowTex(THREE: any, rgb: string) {
      const cv = document.createElement("canvas"); cv.width = cv.height = 128;
      const x = cv.getContext("2d")!;
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, `rgba(${rgb},0.95)`); g.addColorStop(0.28, `rgba(${rgb},0.42)`); g.addColorStop(1, `rgba(${rgb},0)`);
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(cv);
    }

    function dashTexture(THREE: any) {
      const cv = document.createElement("canvas"); cv.width = 720; cv.height = 460;
      const c = cv.getContext("2d")!;
      const g = c.createLinearGradient(0, 0, 0, 460);
      g.addColorStop(0, "#15294d"); g.addColorStop(1, "#0b1a36");
      c.fillStyle = g; roundRect(c, 0, 0, 720, 460, 26); c.fill();
      c.strokeStyle = "rgba(120,165,240,.4)"; c.lineWidth = 2; c.stroke();
      c.fillStyle = "#fff"; c.font = "700 26px Inter, Arial"; c.fillText("Reports", 34, 52);
      c.fillStyle = "#7fd1a6"; c.font = "600 15px Inter, Arial"; c.fillText("● Live", 34, 78);
      const tiles = [["GROSS", "$1.78M", "#3b82f6"], ["NET", "$503K", "#22c55e"], ["AGENTS", "$1.04M", "#a78bfa"], ["DEALS", "256", "#f59e0b"]];
      tiles.forEach((t, i) => {
        const x = 34 + i * 166, y = 100;
        c.fillStyle = "rgba(255,255,255,.05)"; roundRect(c, x, y, 150, 92, 14); c.fill();
        c.fillStyle = t[2]; c.fillRect(x, y + 12, 4, 68);
        c.fillStyle = "#9fb4d4"; c.font = "600 12px Inter, Arial"; c.fillText(t[0], x + 16, y + 30);
        c.fillStyle = "#fff"; c.font = "800 26px Inter, Arial"; c.fillText(t[1], x + 16, y + 64);
      });
      const bx = 34, by = 230, bw = 652, bh = 190;
      c.fillStyle = "rgba(255,255,255,.04)"; roundRect(c, bx, by, bw, bh, 14); c.fill();
      const bars = [52, 38, 60, 44, 30, 40, 24, 30, 36, 48, 92, 72];
      const gap = bw / bars.length;
      bars.forEach((h, i) => {
        const bh2 = (h / 100) * (bh - 36);
        const gx = bx + 14 + i * gap;
        const grd = c.createLinearGradient(0, by + bh - bh2, 0, by + bh - 14);
        grd.addColorStop(0, "#7cc0ff"); grd.addColorStop(1, "#2563eb");
        c.fillStyle = grd; roundRect(c, gx, by + bh - 14 - bh2, gap - 18, bh2, 5); c.fill();
      });
      const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4; return tex;
    }

    function cardTexture(THREE: any, label: string, sub: string, color: string) {
      const cv = document.createElement("canvas"); cv.width = 360; cv.height = 200;
      const c = cv.getContext("2d")!;
      c.fillStyle = "rgba(15,28,54,.95)"; roundRect(c, 4, 4, 352, 192, 22); c.fill();
      c.strokeStyle = "rgba(130,175,240,.45)"; c.lineWidth = 2; c.stroke();
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
      scene.fog = new THREE.FogExp2(0x060d1c, 0.05);
      const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 120);
      camera.position.set(0, 0, 10);

      scene.add(new THREE.AmbientLight(0x8aa0c8, 0.85));
      const dir = new THREE.DirectionalLight(0xffffff, 0.9); dir.position.set(5, 6, 8); scene.add(dir);
      const cursorLight = new THREE.PointLight(0x4f8cff, 2.4, 60); cursorLight.position.set(0, 3, 8); scene.add(cursorLight);
      const warm = new THREE.PointLight(0x7c3aed, 1.4, 40); warm.position.set(-8, -2, 4); scene.add(warm);

      // ---- glowing grid floor (scrolling) ----
      const grid = new THREE.GridHelper(80, 80, 0x3b82f6, 0x16315e);
      (grid.material as any).transparent = true;
      (grid.material as any).opacity = 0.25;
      (grid.material as any).depthWrite = false;
      grid.position.y = -5.5;
      scene.add(grid);

      const group = new THREE.Group();
      const wide = W() > 900;
      const targetScale = wide ? 0.86 : 0.58;
      group.position.x = wide ? 3.6 : 0;
      group.position.y = wide ? 0.5 : 1.7;

      // dashboard glow halo (sprite)
      const haloMat = new THREE.SpriteMaterial({ map: glowTex(THREE, "47,109,235"), color: 0x2f6deb, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85 });
      const halo = new THREE.Sprite(haloMat); halo.scale.set(9.5, 7, 1); halo.position.z = -0.3; group.add(halo);

      // glass frame + dashboard
      const frame = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 3.7),
        new THREE.MeshStandardMaterial({ color: 0x0c2545, transparent: true, opacity: 0.5, roughness: 0.15, metalness: 0.7 })
      );
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(5.0, 3.2),
        new THREE.MeshStandardMaterial({ map: dashTexture(THREE), transparent: true, roughness: 0.4, metalness: 0.05, emissive: 0x12233f, emissiveIntensity: 0.4 })
      );
      panel.position.z = 0.05;
      group.add(frame, panel);

      // holographic sweep (additive sheen moving across the panel)
      const sweepTex = (() => {
        const cv = document.createElement("canvas"); cv.width = 256; cv.height = 8;
        const x = cv.getContext("2d")!;
        const g = x.createLinearGradient(0, 0, 256, 0);
        g.addColorStop(0, "rgba(120,180,255,0)"); g.addColorStop(0.5, "rgba(150,200,255,0.5)"); g.addColorStop(1, "rgba(120,180,255,0)");
        x.fillStyle = g; x.fillRect(0, 0, 256, 8);
        return new THREE.CanvasTexture(cv);
      })();
      const sweep = new THREE.Mesh(
        new THREE.PlaneGeometry(5.0, 3.2),
        new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 })
      );
      sweep.position.z = 0.1; group.add(sweep);

      // ---- orbiting KPI cards + halos + data-lines ----
      const cards: any[] = [];
      const cfg = [["$1.78M", "Gross", "#3b82f6", "59,130,246"], ["256", "Deals", "#22c55e", "34,197,94"], ["AI", "Copilot", "#a78bfa", "167,139,250"], ["1099", "Ready", "#f59e0b", "245,158,11"]];
      cfg.forEach((d, i) => {
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(1.7, 0.95),
          new THREE.MeshStandardMaterial({ map: cardTexture(THREE, d[0], d[1], d[2]), transparent: true, roughness: 0.35, emissive: 0x0a1730, emissiveIntensity: 0.3 })
        );
        const ch = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(THREE, d[3]), color: new THREE.Color(d[2]), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.6 }));
        ch.scale.set(3, 2, 1);
        const lg = new THREE.BufferGeometry();
        lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
        const line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: new THREE.Color(d[2]), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
        m.userData = { ang: (i / cfg.length) * Math.PI * 2, r: 2.65, ry: 1.75, spd: 0.06 * (i % 2 ? 1 : -1), bob: Math.random() * 6, halo: ch, line, lg };
        cards.push(m); group.add(ch, line, m);
      });
      scene.add(group);

      // ---- glowing particle field (two depth layers) ----
      const pTex = glowTex(THREE, "150,190,255");
      function layer(n: number, spread: number, size: number, op: number) {
        const g2 = new THREE.BufferGeometry();
        const pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * spread; pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7; pos[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.7 - 6; }
        g2.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const pts = new THREE.Points(g2, new THREE.PointsMaterial({ map: pTex, color: 0x8fb6ff, size, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
        scene.add(pts); return pts;
      }
      const big = W() > 700;
      const p1 = layer(big ? 420 : 200, 46, 0.22, 0.9);
      const p2 = layer(big ? 260 : 120, 60, 0.12, 0.5);

      // ---- interaction ----
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
      const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
      const lp = new THREE.Vector3();

      function animate() {
        if (disposed) return;
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const rev = easeOut(Math.min(t / 1.6, 1));            // entrance reveal
        mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
        const max = (document.body.scrollHeight - window.innerHeight) || 1;
        const sp = Math.min(scrollY / max, 1);

        // cinematic camera: dolly in on load, push through on scroll
        camera.position.z = (14 - 4 * rev) + sp * 7;
        camera.position.y = -sp * 4 + my * 0.6;
        camera.position.x = mx * 0.6;
        camera.lookAt(0, -sp * 2, 0);

        // cursor light tracks the pointer
        cursorLight.position.set(mx * 12, -my * 9 + 2, 7);

        // group: reveal scale + float + parallax + scroll tilt
        group.scale.setScalar(targetScale * (0.5 + 0.5 * rev));
        group.position.x = baseX - sp * 1.2;
        group.position.y = baseY + Math.sin(t * 0.6) * 0.18 - sp * 2;
        group.rotation.y = (1 - rev) * -0.7 + mx * 0.5 + Math.sin(t * 0.25) * 0.06;
        group.rotation.x = my * 0.3 + Math.cos(t * 0.3) * 0.04;
        group.rotation.z = sp * 0.22;

        // dashboard halo + holographic sweep
        haloMat.opacity = (0.6 + Math.sin(t * 1.4) * 0.18) * rev;
        sweep.position.x = Math.sin(t * 0.5) * 2.6;
        (sweep.material as any).opacity = 0.35 * rev;

        // cards orbit, face camera, wired with pulsing data-lines
        cards.forEach((m, i) => {
          m.userData.ang += m.userData.spd * 0.06;
          const a = m.userData.ang;
          m.position.set(Math.cos(a) * m.userData.r, Math.sin(a) * m.userData.ry + Math.sin(t + m.userData.bob) * 0.22, Math.sin(a) * 1.3 + 0.6);
          m.lookAt(camera.position);
          m.userData.halo.position.copy(m.position);
          const arr = m.userData.lg.attributes.position.array as Float32Array;
          arr[0] = 0; arr[1] = 0; arr[2] = 0.1;
          arr[3] = m.position.x; arr[4] = m.position.y; arr[5] = m.position.z;
          m.userData.lg.attributes.position.needsUpdate = true;
          (m.userData.line.material as any).opacity = (0.25 + 0.22 * (0.5 + 0.5 * Math.sin(t * 2 + i))) * rev;
        });

        // grid scroll + particle drift
        grid.position.z = (t * 1.1) % 1;
        (grid.material as any).opacity = 0.22 * rev;
        p1.rotation.y = t * 0.02; p1.rotation.x = my * 0.1;
        p2.rotation.y = -t * 0.014; p2.position.copy(lp.set(mx * 0.6, -my * 0.4, 0));

        renderer.render(scene, camera);
      }
      animate();

      cleanups.push(() => { renderer.dispose(); });
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

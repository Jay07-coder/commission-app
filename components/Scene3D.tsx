"use client";

import { useEffect, useRef } from "react";

/* Morphing cosmic particle system (textura-style). One point-cloud that
   reassembles between formations as you scroll the whole page:
   orb -> flowing wave -> galaxy -> vortex. Reacts to mouse + scroll. */
export default function Scene3D() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    let disposed = false;
    const cleanups: Array<() => void> = [];
    /* eslint-disable @typescript-eslint/no-explicit-any */

    function glowTex(THREE: any) {
      const cv = document.createElement("canvas"); cv.width = cv.height = 64;
      const x = cv.getContext("2d")!;
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,0.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
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
      scene.fog = new THREE.FogExp2(0x04060e, 0.028);
      const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 120);
      camera.position.set(0, 0.6, 9.2);

      const big = W() > 768;
      const N = big ? 9000 : 4200;

      const cBlue = new THREE.Color("#2f6dff");
      const cPurple = new THREE.Color("#b15cff");
      const cRed = new THREE.Color("#ff4d6d");
      const grad = (u: number) => (u < 0.5 ? cBlue.clone().lerp(cPurple, u * 2) : cPurple.clone().lerp(cRed, (u - 0.5) * 2));

      // formations
      const sphere = new Float32Array(N * 3);
      const wave = new Float32Array(N * 3);
      const wbase = new Float32Array(N * 2);
      const galaxy = new Float32Array(N * 3);
      const vortex = new Float32Array(N * 3);
      const colors = new Float32Array(N * 3);
      const cols = Math.ceil(Math.sqrt(N * 1.7));
      const rows = Math.ceil(N / cols);

      for (let i = 0; i < N; i++) {
        const u = i / N, i3 = i * 3;
        // orb (fibonacci sphere)
        const sy = 1 - 2 * u, sr = Math.sqrt(Math.max(0, 1 - sy * sy)), phi = i * 2.399963, R = 3.35;
        sphere[i3] = Math.cos(phi) * sr * R; sphere[i3 + 1] = sy * R; sphere[i3 + 2] = Math.sin(phi) * sr * R;
        // wave grid (y animated at runtime)
        const ix = i % cols, iz = Math.floor(i / cols);
        const wx = (ix / (cols - 1) - 0.5) * 12, wz = (iz / (rows - 1) - 0.5) * 12;
        wbase[i * 2] = wx; wbase[i * 2 + 1] = wz;
        wave[i3] = wx; wave[i3 + 1] = 0; wave[i3 + 2] = wz;
        // galaxy (spiral arms + core)
        const gt = Math.pow(u, 0.72), arm = i % 3;
        const ga = gt * 7 * Math.PI + arm * (2.0944) + (Math.random() - 0.5) * 0.35, gr = gt * 4.4;
        galaxy[i3] = Math.cos(ga) * gr; galaxy[i3 + 1] = (Math.random() - 0.5) * (0.7 * (1 - gt) + 0.12); galaxy[i3 + 2] = Math.sin(ga) * gr;
        // vortex (spiral cone)
        const va = u * 17 * Math.PI, vr = 0.45 + u * 2.9;
        vortex[i3] = Math.cos(va) * vr; vortex[i3 + 1] = (u - 0.5) * 7.6; vortex[i3 + 2] = Math.sin(va) * vr;
        // color
        const c = grad(u); colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
      }

      const cur = new Float32Array(sphere); // start as orb
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(cur, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({ size: 0.135, map: glowTex(THREE), vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
      const points = new THREE.Points(geo, mat);
      const group = new THREE.Group();
      group.add(points);
      scene.add(group);

      // starfield
      const ST = big ? 700 : 320;
      const stp = new Float32Array(ST * 3);
      for (let i = 0; i < ST; i++) { stp[i * 3] = (Math.random() - 0.5) * 70; stp[i * 3 + 1] = (Math.random() - 0.5) * 45; stp[i * 3 + 2] = (Math.random() - 0.5) * 30 - 10; }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(stp, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ map: glowTex(THREE), color: 0x9fb6ff, size: 0.08, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
      scene.add(stars);

      const forms = [sphere, wave, galaxy, vortex];

      let tmx = 0, tmy = 0, mx = 0, my = 0, tScroll = 0, sScroll = 0;
      const onMouse = (e: MouseEvent) => { tmx = e.clientX / W() - 0.5; tmy = e.clientY / H() - 0.5; };
      const onScroll = () => { const max = (document.body.scrollHeight - window.innerHeight) || 1; tScroll = Math.min(window.scrollY / max, 1); };
      const onResize = () => { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); };
      window.addEventListener("mousemove", onMouse);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      onScroll();
      cleanups.push(() => { window.removeEventListener("mousemove", onMouse); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize); });

      const clock = new THREE.Clock();
      const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

      function animate() {
        if (disposed) return;
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const rev = easeOut(Math.min(t / 2.0, 1));
        mx += (tmx - mx) * 0.045; my += (tmy - my) * 0.045;
        sScroll += (tScroll - sScroll) * 0.06;          // smoothed scroll
        const sp = sScroll;

        // formation blend
        const f = sp * (forms.length - 1);
        const i0 = Math.min(forms.length - 1, Math.floor(f));
        const i1 = Math.min(forms.length - 1, i0 + 1);
        const fr = f - i0;
        const A = forms[i0], B = forms[i1];
        const wWeight = (i0 === 1 ? 1 - fr : 0) + (i1 === 1 ? fr : 0); // wave presence

        for (let n = 0; n < N; n++) {
          const n3 = n * 3;
          let tx = A[n3] + (B[n3] - A[n3]) * fr;
          let ty = A[n3 + 1] + (B[n3 + 1] - A[n3 + 1]) * fr;
          let tz = A[n3 + 2] + (B[n3 + 2] - A[n3 + 2]) * fr;
          if (wWeight > 0.001) {
            const bx = wbase[n * 2], bz = wbase[n * 2 + 1];
            const wy = Math.sin(bx * 0.4 + t * 0.8) * 0.55 + Math.sin(bz * 0.5 + t * 0.62) * 0.5 + Math.sin((bx + bz) * 0.28 + t * 1.05) * 0.36;
            ty += wy * wWeight;
          }
          // subtle life
          ty += Math.sin(tx * 0.5 + t * 0.9) * 0.04;
          cur[n3] += (tx - cur[n3]) * 0.075;
          cur[n3 + 1] += (ty - cur[n3 + 1]) * 0.075;
          cur[n3 + 2] += (tz - cur[n3 + 2]) * 0.075;
        }
        geo.attributes.position.needsUpdate = true;
        mat.opacity = 0.95 * rev;

        // move from right (hero) toward center for the content formations
        group.position.x = 2.4 * (1 - Math.min(sp * 3, 1));
        group.position.y = -sp * 0.6;
        group.rotation.y = t * 0.04 + mx * 0.45;
        group.rotation.x = my * 0.22;
        stars.rotation.y = t * 0.012;

        camera.position.x = mx * 1.3;
        camera.position.y = 0.6 + my * 0.9;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      }
      animate();

      cleanups.push(() => { renderer.dispose(); geo.dispose(); starGeo.dispose(); });
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

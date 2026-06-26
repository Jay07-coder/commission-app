"use client";

import { useEffect, useRef } from "react";

/* Cosmic particle backdrop (textura-style): a flowing gradient wave-ribbon of
   glowing points, a particle orb, and a starfield. Reacts to mouse + scroll.
   Three.js via CDN. */
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
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
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
      scene.fog = new THREE.FogExp2(0x04060e, 0.03);
      const camera = new THREE.PerspectiveCamera(55, W() / H(), 0.1, 120);
      camera.position.set(0, 4.4, 9);

      const glow = glowTex(THREE);
      const big = W() > 768;
      const cBlue = new THREE.Color("#2f6dff");
      const cPurple = new THREE.Color("#a855f7");
      const cRed = new THREE.Color("#ff4d6d");
      const grad = (tx: number) => (tx < 0.5 ? cBlue.clone().lerp(cPurple, tx * 2) : cPurple.clone().lerp(cRed, (tx - 0.5) * 2));

      // ---- flowing particle wave ----
      const COLS = big ? 180 : 110, ROWS = big ? 60 : 40, COUNT = COLS * ROWS;
      const wpos = new Float32Array(COUNT * 3);
      const wcol = new Float32Array(COUNT * 3);
      const base = new Float32Array(COUNT * 2);
      let k = 0;
      for (let i = 0; i < COLS; i++) {
        for (let j = 0; j < ROWS; j++) {
          const x = -15 + (i / (COLS - 1)) * 30;
          const z = -17 + (j / (ROWS - 1)) * 19;
          base[k * 2] = x; base[k * 2 + 1] = z;
          wpos[k * 3] = x; wpos[k * 3 + 1] = 0; wpos[k * 3 + 2] = z;
          const c = grad(i / (COLS - 1));
          wcol[k * 3] = c.r; wcol[k * 3 + 1] = c.g; wcol[k * 3 + 2] = c.b;
          k++;
        }
      }
      const waveGeo = new THREE.BufferGeometry();
      waveGeo.setAttribute("position", new THREE.BufferAttribute(wpos, 3));
      waveGeo.setAttribute("color", new THREE.BufferAttribute(wcol, 3));
      const waveMat = new THREE.PointsMaterial({ size: 0.14, map: glow, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
      const wave = new THREE.Points(waveGeo, waveMat);
      scene.add(wave);

      // ---- particle orb ----
      const SP = big ? 5200 : 2600;
      const spos = new Float32Array(SP * 3);
      const scol = new Float32Array(SP * 3);
      for (let i = 0; i < SP; i++) {
        const y = 1 - (i / (SP - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const phi = i * 2.399963;
        const rad = 3.05 + (Math.random() - 0.5) * 0.18;
        spos[i * 3] = Math.cos(phi) * r * rad;
        spos[i * 3 + 1] = y * rad;
        spos[i * 3 + 2] = Math.sin(phi) * r * rad;
        const c = grad((y + 1) / 2);
        scol[i * 3] = c.r; scol[i * 3 + 1] = c.g; scol[i * 3 + 2] = c.b;
      }
      const orbGeo = new THREE.BufferGeometry();
      orbGeo.setAttribute("position", new THREE.BufferAttribute(spos, 3));
      orbGeo.setAttribute("color", new THREE.BufferAttribute(scol, 3));
      const orbMat = new THREE.PointsMaterial({ size: 0.105, map: glow, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
      const orb = new THREE.Points(orbGeo, orbMat);
      const orbGroup = new THREE.Group();
      orbGroup.add(orb);
      orbGroup.position.set(big ? 5.4 : 0, big ? 3.4 : 5.4, -3.5);
      orbGroup.scale.setScalar(big ? 1 : 0.62);
      scene.add(orbGroup);

      // ---- starfield ----
      const ST = big ? 900 : 400;
      const stp = new Float32Array(ST * 3);
      for (let i = 0; i < ST; i++) { stp[i * 3] = (Math.random() - 0.5) * 60; stp[i * 3 + 1] = (Math.random() - 0.5) * 40; stp[i * 3 + 2] = (Math.random() - 0.5) * 30 - 8; }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(stp, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ map: glow, color: 0x9fb6ff, size: 0.07, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
      scene.add(stars);

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
      const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
      const wp = waveGeo.attributes.position.array as Float32Array;

      function animate() {
        if (disposed) return;
        raf = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        const rev = easeOut(Math.min(t / 2.0, 1));
        mx += (tmx - mx) * 0.045; my += (tmy - my) * 0.045;
        const max = (document.body.scrollHeight - window.innerHeight) || 1;
        const sp = Math.min(scrollY / max, 1);

        // animate the wave surface
        for (let n = 0; n < COUNT; n++) {
          const x = base[n * 2], z = base[n * 2 + 1];
          wp[n * 3 + 1] =
            Math.sin(x * 0.38 + t * 0.8) * 0.55 +
            Math.sin(z * 0.5 + t * 0.62) * 0.5 +
            Math.sin((x + z) * 0.28 + t * 1.05) * 0.38;
        }
        waveGeo.attributes.position.needsUpdate = true;
        waveMat.opacity = 0.92 * rev;
        orbMat.opacity = 0.95 * rev;

        // orb spin + drift
        orb.rotation.y = t * 0.16;
        orb.rotation.x = Math.sin(t * 0.3) * 0.12;
        orbGroup.position.y = (big ? 3.4 : 5.4) + Math.sin(t * 0.5) * 0.25;
        stars.rotation.y = t * 0.01;

        // cinematic camera: entrance dolly + fly-through on scroll + parallax
        camera.position.z = (12 - 3 * rev) + sp * -7;
        camera.position.y = 4.4 - sp * 3 + my * 1.1;
        camera.position.x = mx * 1.6;
        camera.lookAt(0, 0.6 - sp * 1.5, -3);

        renderer.render(scene, camera);
      }
      animate();

      cleanups.push(() => { renderer.dispose(); waveGeo.dispose(); orbGeo.dispose(); starGeo.dispose(); });
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

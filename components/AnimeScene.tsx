"use client";

// Physics-simulated sunset-lake background on a <canvas> with a real rAF loop,
// tuned for smooth scrolling:
//   - opaque context + own compositor layer (see .anime-scene CSS)
//   - capped at 30fps, low device-independent internal resolution
//   - every static layer (sky, water, tint, grade, vignette, sun, embers,
//     clouds, mountains) is pre-rendered to a sprite once per resize
//   - the water reflection samples an OFFSCREEN copy of the sky (no per-frame
//     canvas self-copy), stepping rows for speed
// Simulation (all driven by one gusting wind field): boids-flocking birds with
// dynamic flapping/banking; travelling-wave mirror reflection with drifting
// sun glitter; wind-advected clouds, embers, petals and wind-bent reeds.
// Respects prefers-reduced-motion (one static frame).

import { useEffect, useRef } from "react";

export default function AnimeScene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const g = ctx;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---------- helpers ----------
    const IH = 460; // internal render height (kept low for perf; upscaled by CSS)
    let IW = 820;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const hash2 = (ix: number, iy: number) => {
      let h = (ix * 374761393 + iy * 668265263) | 0;
      h = (h ^ (h >> 13)) * 1274126177;
      return ((h ^ (h >> 16)) >>> 0) / 4294967295;
    };
    const mk = (w: number, h: number) => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w));
      c.height = Math.max(1, Math.round(h));
      return c;
    };

    const horizonY = () => Math.round(IH * 0.5);
    const waterBottom = () => Math.round(IH * 0.9);
    const sunX = () => Math.round(IW * 0.62);
    const sunY = () => Math.round(IH * 0.44);

    // ---------- cached sprites (rebuilt on resize) ----------
    let above: HTMLCanvasElement; // offscreen sky+sun+clouds+mountains
    let actx: CanvasRenderingContext2D;
    let skySprite: HTMLCanvasElement;
    let waterSprite: HTMLCanvasElement;
    let tintSprite: HTMLCanvasElement;
    let gradeSprite: HTMLCanvasElement;
    let vignetteSprite: HTMLCanvasElement;
    let sunSprite: HTMLCanvasElement;
    let emberSprite: HTMLCanvasElement;
    let mtnSprite: HTMLCanvasElement;
    let cloudFar: HTMLCanvasElement;
    let cloudNear: HTMLCanvasElement;

    function ridgeVal(nx: number, seed: number, rough: number) {
      let v = 0;
      v += Math.sin(nx * Math.PI * 2 * 1.0 * rough + seed * 1.7) * 0.5;
      v += Math.sin(nx * Math.PI * 2 * 2.3 * rough + seed * 3.1) * 0.27;
      v += Math.sin(nx * Math.PI * 2 * 4.7 * rough + seed * 5.5) * 0.16;
      v += Math.sin(nx * Math.PI * 2 * 9.3 * rough + seed * 2.2) * 0.09;
      return v * 0.5 + 0.5;
    }

    function buildMountains() {
      const c = mk(IW, IH);
      const m = c.getContext("2d")!;
      const hz = horizonY();
      const layers = [
        { base: hz - 4, amp: 0.16, rough: 0.8, seed: 2.0, top: "#caa0aa", bot: "#9a83ad", haze: 0.55 },
        { base: hz + 2, amp: 0.22, rough: 1.35, seed: 5.3, top: "#77567a", bot: "#48375f", haze: 0.34 },
        { base: hz + 8, amp: 0.13, rough: 2.3, seed: 9.1, top: "#291d3a", bot: "#160e28", haze: 0.14 },
      ];
      for (const L of layers) {
        m.beginPath();
        m.moveTo(0, IH);
        for (let x = 0; x <= IW; x += 2) {
          const nx = x / IW;
          m.lineTo(x, L.base - L.amp * IH * (ridgeVal(nx, L.seed, L.rough) - 0.35));
        }
        m.lineTo(IW, IH);
        m.closePath();
        const grd = m.createLinearGradient(0, L.base - L.amp * IH, 0, L.base + 50);
        grd.addColorStop(0, L.top);
        grd.addColorStop(1, L.bot);
        m.fillStyle = grd;
        m.fill();
        const hg = m.createLinearGradient(0, L.base - 34, 0, L.base + 26);
        hg.addColorStop(0, "rgba(255,205,160,0)");
        hg.addColorStop(1, `rgba(255,196,150,${L.haze})`);
        m.fillStyle = hg;
        m.fillRect(0, L.base - 34, IW, 62);
      }
      mtnSprite = c;
    }

    function makeCloudSprite(tint: [number, number, number], lo: number, hi: number) {
      const TW = 512;
      const TH = 160;
      const c = mk(TW, TH);
      const cc = c.getContext("2d")!;
      const img = cc.createImageData(TW, TH);
      const octaves = 5;
      for (let y = 0; y < TH; y++) {
        for (let x = 0; x < TW; x++) {
          let amp = 0.5;
          let cells = 5;
          let sum = 0;
          let norm = 0;
          for (let o = 0; o < octaves; o++) {
            const lx = (x / TW) * cells;
            const ly = (y / TH) * cells * (TH / TW) * 3.2;
            const x0 = Math.floor(lx);
            const y0 = Math.floor(ly);
            const s = smooth(lx - x0);
            const t = smooth(ly - y0);
            const wx0 = ((x0 % cells) + cells) % cells;
            const wx1 = (wx0 + 1) % cells;
            const n00 = hash2(wx0, y0);
            const n10 = hash2(wx1, y0);
            const n01 = hash2(wx0, y0 + 1);
            const n11 = hash2(wx1, y0 + 1);
            sum += amp * lerp(lerp(n00, n10, s), lerp(n01, n11, s), t);
            norm += amp;
            amp *= 0.5;
            cells *= 2;
          }
          let d = clamp((sum / norm - lo) / (hi - lo), 0, 1);
          d = smooth(d);
          const band = Math.sin(clamp(y / TH, 0, 1) * Math.PI);
          const idx = (y * TW + x) * 4;
          img.data[idx] = tint[0];
          img.data[idx + 1] = tint[1];
          img.data[idx + 2] = tint[2];
          img.data[idx + 3] = Math.round(clamp(d * band, 0, 1) * 255);
        }
      }
      cc.putImageData(img, 0, 0);
      return c;
    }

    function buildSky() {
      const hz = horizonY();
      const c = mk(IW, IH);
      const s = c.getContext("2d")!;
      const sky = s.createLinearGradient(0, 0, 0, hz + 30);
      sky.addColorStop(0, "#181642");
      sky.addColorStop(0.16, "#33265f");
      sky.addColorStop(0.34, "#5f3670");
      sky.addColorStop(0.48, "#95446e");
      sky.addColorStop(0.6, "#c85f61");
      sky.addColorStop(0.72, "#ea8150");
      sky.addColorStop(0.86, "#f8ab5c");
      sky.addColorStop(1, "#ffd884");
      s.fillStyle = sky;
      s.fillRect(0, 0, IW, hz + 30);
      skySprite = c;
    }

    function buildWater() {
      const hz = horizonY();
      const wb = waterBottom();
      const wh = wb - hz;
      const c = mk(IW, wh);
      const w = c.getContext("2d")!;
      const wg = w.createLinearGradient(0, 0, 0, wh);
      wg.addColorStop(0, "#f6b979");
      wg.addColorStop(0.12, "#dd8e80");
      wg.addColorStop(0.4, "#8f6690");
      wg.addColorStop(0.72, "#463561");
      wg.addColorStop(1, "#1f1636");
      w.fillStyle = wg;
      w.fillRect(0, 0, IW, wh);
      waterSprite = c;

      const c2 = mk(IW, wh);
      const t = c2.getContext("2d")!;
      const tg = t.createLinearGradient(0, 0, 0, wh);
      tg.addColorStop(0, "rgba(255,190,120,0.05)");
      tg.addColorStop(0.5, "rgba(70,45,90,0.28)");
      tg.addColorStop(1, "rgba(20,14,44,0.62)");
      t.fillStyle = tg;
      t.fillRect(0, 0, IW, wh);
      tintSprite = c2;
    }

    function buildOverlays() {
      const grade = mk(IW, IH);
      const gg = grade.getContext("2d")!;
      const gr = gg.createLinearGradient(0, 0, 0, IH);
      gr.addColorStop(0, "rgba(40,20,90,0.5)");
      gr.addColorStop(0.55, "rgba(255,150,90,0.12)");
      gr.addColorStop(1, "rgba(12,8,32,0.6)");
      gg.fillStyle = gr;
      gg.fillRect(0, 0, IW, IH);
      gradeSprite = grade;

      const vig = mk(IW, IH);
      const vg = vig.getContext("2d")!;
      const vr = vg.createRadialGradient(IW * 0.52, IH * 0.42, IH * 0.2, IW * 0.52, IH * 0.42, IH * 0.95);
      vr.addColorStop(0, "rgba(6,4,18,0)");
      vr.addColorStop(1, "rgba(6,4,18,0.62)");
      vg.fillStyle = vr;
      vg.fillRect(0, 0, IW, IH);
      vignetteSprite = vig;
    }

    function buildSun() {
      const R = Math.round(IH * 0.72);
      const S = R * 2;
      const c = mk(S, S);
      const s = c.getContext("2d")!;
      const bloom = s.createRadialGradient(R, R, 0, R, R, R);
      bloom.addColorStop(0, "rgba(255,250,240,0.98)");
      bloom.addColorStop(0.1, "rgba(255,242,206,0.88)");
      bloom.addColorStop(0.28, "rgba(255,208,142,0.4)");
      bloom.addColorStop(0.6, "rgba(255,158,110,0.1)");
      bloom.addColorStop(1, "rgba(255,158,110,0)");
      s.fillStyle = bloom;
      s.fillRect(0, 0, S, S);
      const core = s.createRadialGradient(R, R, 0, R, R, IH * 0.12);
      core.addColorStop(0, "#fffdf6");
      core.addColorStop(0.55, "#fff0c6");
      core.addColorStop(1, "rgba(255,223,158,0)");
      s.fillStyle = core;
      s.beginPath();
      s.arc(R, R, IH * 0.12, 0, Math.PI * 2);
      s.fill();
      s.fillStyle = "#fffdf6";
      s.beginPath();
      s.arc(R, R, IH * 0.05, 0, Math.PI * 2);
      s.fill();
      sunSprite = c;
    }

    function buildEmber() {
      const S = 24;
      const c = mk(S, S);
      const s = c.getContext("2d")!;
      const gr = s.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      gr.addColorStop(0, "rgba(255,238,196,1)");
      gr.addColorStop(1, "rgba(255,214,150,0)");
      s.fillStyle = gr;
      s.fillRect(0, 0, S, S);
      emberSprite = c;
    }

    // ---------- entities ----------
    interface Bird { x: number; y: number; vx: number; vy: number; flap: number; size: number; }
    interface Particle { x: number; y: number; vx: number; vy: number; size: number; life: number; max: number; }
    interface Reed { x: number; h: number; w: number; phase: number; lean: number; }
    interface Petal { x: number; y: number; vx: number; vy: number; rot: number; vr: number; size: number; }
    interface Spark { u: number; v: number; seed: number; }

    let birds: Bird[] = [];
    let particles: Particle[] = [];
    let reeds: Reed[] = [];
    let petals: Petal[] = [];
    let sparks: Spark[] = [];

    function seedEntities() {
      const hz = horizonY();
      birds = Array.from({ length: 12 }, () => ({
        x: rand(0, IW),
        y: rand(hz * 0.28, hz * 0.72),
        vx: rand(0.6, 1.1),
        vy: rand(-0.1, 0.1),
        flap: rand(0, 6.28),
        size: rand(6, 10),
      }));
      particles = Array.from({ length: 26 }, () => ({
        x: rand(0, IW),
        y: rand(hz, IH),
        vx: rand(-0.2, 0.4),
        vy: rand(-0.5, -0.1),
        size: rand(1, 2.6),
        life: rand(0, 1),
        max: rand(300, 900),
      }));
      reeds = [];
      for (let i = 0; i < 12; i++) reeds.push({ x: rand(0, IW * 0.24), h: rand(50, 130), w: rand(2.4, 5), phase: rand(0, 6.28), lean: rand(-0.1, 0.1) });
      for (let i = 0; i < 9; i++) reeds.push({ x: rand(IW * 0.78, IW), h: rand(50, 120), w: rand(2.4, 5), phase: rand(0, 6.28), lean: rand(-0.1, 0.1) });
      petals = Array.from({ length: 11 }, () => ({
        x: rand(0, IW),
        y: rand(-IH * 0.3, IH * 0.6),
        vx: rand(0.3, 0.9),
        vy: rand(0.4, 0.9),
        rot: rand(0, 6.28),
        vr: rand(-0.05, 0.05),
        size: rand(3, 6),
      }));
      sparks = Array.from({ length: 70 }, () => ({ u: rand(-1, 1), v: Math.random(), seed: rand(0, 1000) }));
    }

    function windAt(time: number) {
      return 0.7 + 0.42 * Math.sin(time * 0.06) + 0.26 * Math.sin(time * 0.017 + 1.3) + 0.12 * Math.sin(time * 0.11 + 4.1);
    }

    // ---------- resize ----------
    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      IW = Math.max(560, Math.round(IH * (w / h)));
      canvas.width = IW;
      canvas.height = IH;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      above = mk(IW, IH);
      actx = above.getContext("2d")!;
      buildSky();
      buildWater();
      buildOverlays();
      buildSun();
      buildEmber();
      buildMountains();
      cloudFar = makeCloudSprite([214, 196, 220], 0.46, 0.82);
      cloudNear = makeCloudSprite([255, 224, 188], 0.5, 0.86);
      seedEntities();
      if (reduced) render(0);
    }

    // ---------- clouds ----------
    let cloudFarX = 0;
    let cloudNearX = 0;
    function drawCloud(c: CanvasRenderingContext2D, sprite: HTMLCanvasElement, offset: number, top: number, height: number, alpha: number) {
      let x = -(((offset % IW) + IW) % IW);
      c.globalAlpha = alpha;
      while (x < IW) {
        c.drawImage(sprite, 0, 0, sprite.width, sprite.height, Math.round(x), top, IW, height);
        x += IW;
      }
      c.globalAlpha = 1;
    }

    // ---------- simulation ----------
    let windMul = 0.8;
    function step(time: number, dt: number) {
      windMul = windAt(time);
      const wind = windMul;
      const hz = horizonY();
      cloudFarX += wind * 0.24 * dt;
      cloudNearX += wind * 0.44 * dt;

      const R2 = 70 * 70;
      const sep2 = 26 * 26;
      for (const b of birds) {
        let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;
        for (const o of birds) {
          if (o === b) continue;
          const ddx = o.x - b.x;
          const ddy = o.y - b.y;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < R2) {
            cx += o.x; cy += o.y; ax += o.vx; ay += o.vy; n++;
            if (d2 < sep2 && d2 > 0.0001) { sx -= ddx / d2; sy -= ddy / d2; }
          }
        }
        if (n > 0) { cx = cx / n - b.x; cy = cy / n - b.y; ax = ax / n - b.vx; ay = ay / n - b.vy; }
        b.vx += (cx * 0.0009 + ax * 0.012 + sx * 1.1) * dt;
        b.vy += (cy * 0.0009 + ay * 0.012 + sy * 1.1) * dt;
        b.vx += wind * 0.02 * dt;
        b.vy += ((hz * 0.5 - b.y) * 0.0009 + rand(-0.02, 0.02)) * dt;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp < 0.7) { b.vx = (b.vx / sp) * 0.7; b.vy = (b.vy / sp) * 0.7; }
        else if (sp > 2.4) { b.vx = (b.vx / sp) * 2.4; b.vy = (b.vy / sp) * 2.4; }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.flap += (0.28 + Math.max(0, -b.vy) * 0.14) * dt;
        if (b.x > IW + 30) { b.x = -30; b.y = rand(hz * 0.25, hz * 0.75); }
        if (b.x < -40) b.x = IW + 30;
        b.y = clamp(b.y, 16, hz - 16);
      }

      for (const p of particles) {
        const turbX = Math.sin(p.y * 0.03 + time * 0.6) * 0.15;
        p.vx += (wind * 0.35 + turbX - p.vx) * 0.03 * dt;
        p.vy += (-0.18 - p.vy) * 0.02 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt * 4;
        if (p.y < hz - 10 || p.x > IW + 10 || p.life > p.max) {
          p.x = rand(-10, IW * 0.9); p.y = rand(IH * 0.9, IH);
          p.vx = rand(-0.1, 0.4); p.vy = rand(-0.5, -0.1);
          p.life = 0; p.max = rand(300, 900);
        }
      }

      for (const p of petals) {
        p.vx += (wind * 0.6 - p.vx) * 0.02 * dt;
        p.vy += (0.6 - p.vy) * 0.02 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += (p.vr + wind * 0.01) * dt;
        if (p.y > IH + 20 || p.x > IW + 20) {
          p.x = rand(-40, IW * 0.6); p.y = rand(-40, -10);
          p.vx = rand(0.3, 0.9); p.vy = rand(0.4, 0.9);
        }
      }
    }

    // ---------- render ----------
    let frameCount = 0;
    function render(time: number) {
      const hz = horizonY();
      const wb = waterBottom();
      const wh = wb - hz;

      // build offscreen "above water" scene
      actx.drawImage(skySprite, 0, 0);
      const pulse = 1 + 0.03 * Math.sin(time * 0.8);
      const S = sunSprite.width * pulse;
      actx.drawImage(sunSprite, sunX() - S / 2, sunY() - S / 2, S, S);
      drawCloud(actx, cloudFar, cloudFarX, IH * 0.05, IH * 0.34, 0.8);
      drawCloud(actx, cloudNear, cloudNearX, IH * 0.12, IH * 0.3, 0.9);
      actx.drawImage(mtnSprite, 0, 0);

      // composite above-water onto main
      g.drawImage(above, 0, 0);

      // water base
      g.drawImage(waterSprite, 0, hz);

      // rippled reflection sampled from offscreen (no self-copy)
      const stepPx = 3;
      for (let yd = hz; yd < wb; yd += stepPx) {
        const depth = (yd - hz) / wh;
        let ys = hz - (yd - hz) * 0.86;
        if (ys < 0) ys = 0;
        const amp = lerp(0.4, 4.4, depth) + 0.6;
        const spd = lerp(1.1, 3.2, depth);
        const dx = amp * Math.sin(yd * 0.1 + time * spd) + amp * 0.5 * Math.sin(yd * 0.18 - time * spd * 1.4 + 1.7);
        g.globalAlpha = lerp(0.85, 0.32, depth);
        g.drawImage(above, 0, ys, IW, stepPx, dx, yd, IW, stepPx);
      }
      g.globalAlpha = 1;

      // tint reflection into water
      g.drawImage(tintSprite, 0, hz);

      // advancing crest highlights
      g.strokeStyle = "rgba(255,232,196,0.5)";
      for (let i = 0; i < 10; i++) {
        const v = (i / 10 + ((time * 0.03) % 1)) % 1;
        const yd = hz + v * v * wh;
        const w = lerp(0.03, 0.5, v) * IW;
        const cx = IW * 0.5 + Math.sin(i * 1.7 + time * 0.5) * IW * 0.12;
        const a = Math.sin(v * Math.PI) * 0.4;
        if (a <= 0.02) continue;
        g.globalAlpha = a;
        g.lineWidth = lerp(0.6, 2.2, v);
        g.beginPath();
        for (let x = cx - w; x <= cx + w; x += 14) {
          const yy = yd + Math.sin(x * 0.05 + time * 2 + i) * lerp(0.5, 2.2, v);
          if (x === cx - w) g.moveTo(x, yy);
          else g.lineTo(x, yy);
        }
        g.stroke();
      }
      g.globalAlpha = 1;

      // sun glitter drifting toward viewer
      const sx = sunX();
      for (const s of sparks) {
        s.v += (0.0016 + s.v * 0.006) * windMul;
        if (s.v >= 1) { s.v -= 1; s.u = rand(-1, 1); }
        const yd = hz + s.v * wh;
        const halfW = lerp(IW * 0.02, IW * 0.09, s.v);
        const x = sx + s.u * halfW + Math.sin(yd * 0.08 + time * 2 + s.seed) * lerp(1, 5, s.v);
        const wave = Math.sin(yd * 0.14 + time * 3.2 + s.seed * 0.3);
        const bright = Math.pow(Math.max(0, wave), 3) * Math.sin(s.v * Math.PI);
        if (bright <= 0.03) continue;
        g.globalAlpha = clamp(bright, 0, 1);
        g.fillStyle = wave > 0.7 ? "#fffaf0" : "#ffd79a";
        g.beginPath();
        g.arc(x, yd, lerp(0.6, 1.7, s.v), 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;

      // foreground (opaque fill so context stays fully covered)
      g.fillStyle = "#0c0817";
      g.fillRect(0, wb - 1, IW, IH - wb + 1);
      g.beginPath();
      g.moveTo(0, IH);
      g.lineTo(0, wb - 4);
      g.quadraticCurveTo(IW * 0.16, wb - 12, IW * 0.34, wb - 1);
      g.quadraticCurveTo(IW * 0.44, wb + 6, IW * 0.5, IH);
      g.closePath();
      g.fill();
      g.beginPath();
      g.moveTo(IW, IH);
      g.lineTo(IW, wb - 6);
      g.quadraticCurveTo(IW * 0.86, wb - 14, IW * 0.7, wb - 2);
      g.quadraticCurveTo(IW * 0.6, wb + 6, IW * 0.56, IH);
      g.closePath();
      g.fill();

      drawReeds(time);
      drawFigure(time);
      drawBirds();
      drawPetals();
      drawParticles();

      // colour grade + film grain + vignette
      g.globalCompositeOperation = "soft-light";
      g.drawImage(gradeSprite, 0, 0);
      g.globalCompositeOperation = "source-over";
      g.drawImage(vignetteSprite, 0, 0);

      frameCount++;
    }

    function drawReeds(time: number) {
      g.strokeStyle = "#070410";
      g.lineCap = "round";
      for (const r of reeds) {
        const bend = (windMul - 0.6) * r.h * 0.5 + Math.sin(time * 1.6 + r.phase) * r.h * 0.06 + r.lean * r.h;
        const baseY = IH - 2;
        g.lineWidth = r.w;
        g.beginPath();
        g.moveTo(r.x, baseY);
        g.quadraticCurveTo(r.x + bend * 0.4, baseY - r.h * 0.55, r.x + bend, baseY - r.h);
        g.stroke();
      }
      g.lineCap = "butt";
    }

    function drawFigure(time: number) {
      const x = IW * 0.72;
      const y = waterBottom() - 1;
      const s = IH / 640;
      const flutter = (windMul - 0.7) * 6 + Math.sin(time * 2.2) * 2.2;
      g.save();
      g.translate(x, y);
      g.scale(s, s);
      g.fillStyle = "#0a0713";
      g.fillRect(-5, -34, 4, 34);
      g.fillRect(1, -34, 4, 34);
      g.beginPath();
      g.moveTo(-8, -34);
      g.quadraticCurveTo(0, -40, 8, -34);
      g.lineTo(6, -60);
      g.quadraticCurveTo(0, -64, -6, -60);
      g.closePath();
      g.fill();
      g.beginPath();
      g.arc(0, -70, 7, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(-2, -76);
      g.quadraticCurveTo(10 + flutter, -74, 16 + flutter * 1.6, -66);
      g.quadraticCurveTo(8, -66, 6, -58);
      g.quadraticCurveTo(4, -66, -4, -64);
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(255,214,150,0.75)";
      g.lineWidth = 1.1;
      g.beginPath();
      g.arc(0, -70, 7, Math.PI * 0.7, Math.PI * 1.35);
      g.stroke();
      g.beginPath();
      g.moveTo(-7, -58);
      g.lineTo(-6, -36);
      g.stroke();
      g.restore();
    }

    function drawPetals() {
      g.fillStyle = "rgba(255,190,150,0.8)";
      for (const p of petals) {
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        g.beginPath();
        g.moveTo(0, -p.size);
        g.quadraticCurveTo(p.size * 0.7, -p.size * 0.2, 0, p.size);
        g.quadraticCurveTo(-p.size * 0.7, -p.size * 0.2, 0, -p.size);
        g.fill();
        g.restore();
      }
    }

    function drawParticles() {
      for (const p of particles) {
        const a = clamp(Math.sin((p.life / p.max) * Math.PI), 0, 1) * 0.8;
        if (a <= 0.03) continue;
        const d = p.size * 6;
        g.globalAlpha = a;
        g.drawImage(emberSprite, p.x - d / 2, p.y - d / 2, d, d);
      }
      g.globalAlpha = 1;
    }

    function drawBirds() {
      g.strokeStyle = "rgba(24,18,34,0.92)";
      g.lineJoin = "round";
      g.lineCap = "round";
      for (const b of birds) {
        const heading = Math.atan2(b.vy, b.vx);
        const bank = clamp(b.vy / (Math.abs(b.vx) + 0.001), -1, 1);
        const up = Math.sin(b.flap);
        const s = b.size * (1 - Math.abs(bank) * 0.25);
        g.save();
        g.translate(b.x, b.y);
        g.rotate(heading * 0.35);
        g.lineWidth = Math.max(1, b.size * 0.15);
        g.beginPath();
        g.moveTo(-s * 1.25, -s * 0.08 + up * s * 0.32);
        g.quadraticCurveTo(-s * 0.55, -up * s * 0.7 - s * 0.12, 0, 0);
        g.quadraticCurveTo(s * 0.55, -up * s * 0.7 - s * 0.12, s * 1.25, -s * 0.08 + up * s * 0.32);
        g.stroke();
        g.restore();
      }
    }

    // ---------- loop (30fps cap) ----------
    let raf = 0;
    const FRAME = 1000 / 30;
    let last = performance.now();
    let t = 0;
    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      const elapsed = now - last;
      if (elapsed < FRAME - 1) return;
      last = now;
      const dt = Math.min(2.6, elapsed / 16.6667);
      t += elapsed / 1000;
      step(t, dt);
      render(t);
    }

    resize();
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 180);
    };
    window.addEventListener("resize", onResize);

    // pause the loop while the tab is hidden
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (!reduced) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="anime-scene" aria-hidden="true" />;
}

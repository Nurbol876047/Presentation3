/* Living animated background: drifting aurora blobs + slow particles.
   Runs continuously on requestAnimationFrame, independent of slide changes,
   so the deck never looks static even on a single slide. */
(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, DPR;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.floor(window.innerWidth * DPR);
    H = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  // 5 palettes matching data-palette on slides (0..4), each a pair of blob colors
  const PALETTES = [
    [[143, 140, 255], [255, 207, 107]], // 0 indigo / gold
    [[73, 214, 224], [95, 139, 255]],   // 1 cyan / blue
    [[255, 159, 90], [255, 107, 168]],  // 2 amber / pink
    [[91, 224, 160], [201, 255, 94]],   // 3 emerald / lime
    [[255, 122, 184], [255, 210, 122]], // 4 rose / gold
  ];

  let paletteIndex = 0;
  let paletteMix = PALETTES[0].map(c => c.slice());
  let targetPalette = PALETTES[0];

  window.setBgPalette = function (idx) {
    paletteIndex = ((idx % PALETTES.length) + PALETTES.length) % PALETTES.length;
    targetPalette = PALETTES[paletteIndex];
  };

  function lerpColor(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  // Blob definitions: orbit params create continuous organic motion
  const blobs = [
    { cx: 0.22, cy: 0.28, rx: 0.42, ry: 0.36, speed: 0.00022, phase: 0,   colorIdx: 0, alpha: 0.5 },
    { cx: 0.78, cy: 0.22, rx: 0.38, ry: 0.34, speed: 0.00017, phase: 2.1, colorIdx: 1, alpha: 0.42 },
    { cx: 0.5,  cy: 0.82, rx: 0.46, ry: 0.4,  speed: 0.00013, phase: 4.2, colorIdx: 0, alpha: 0.38 },
    { cx: 0.85, cy: 0.78, rx: 0.3,  ry: 0.28, speed: 0.00026, phase: 1.3, colorIdx: 1, alpha: 0.32 },
    { cx: 0.12, cy: 0.75, rx: 0.3,  ry: 0.26, speed: 0.0002,  phase: 3.0, colorIdx: 0, alpha: 0.3 },
  ];

  // particles
  const PCOUNT = 46;
  const particles = [];
  for (let i = 0; i < PCOUNT; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.5,
      speed: Math.random() * 0.00012 + 0.00004,
      drift: (Math.random() - 0.5) * 0.00006,
      alpha: Math.random() * 0.5 + 0.15,
      twinkleSpeed: Math.random() * 0.002 + 0.001,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }

  let mouseX = 0.5, mouseY = 0.5;
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  });

  let t0 = performance.now();

  function frame(now) {
    const dt = now - t0;
    t0 = now;

    // smoothly mix current blend color toward target palette
    paletteMix[0] = lerpColor(paletteMix[0], targetPalette[0], 0.015);
    paletteMix[1] = lerpColor(paletteMix[1], targetPalette[1], 0.015);

    ctx.clearRect(0, 0, W, H);

    // base wash
    const base = ctx.createLinearGradient(0, 0, W, H);
    base.addColorStop(0, '#0a0d1a');
    base.addColorStop(1, '#0d1024');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'screen';
    for (const b of blobs) {
      const parallax = 0.015;
      const ox = (mouseX - 0.5) * parallax;
      const oy = (mouseY - 0.5) * parallax;
      const angle = now * b.speed + b.phase;
      const x = (b.cx + Math.cos(angle) * 0.05 + ox) * W;
      const y = (b.cy + Math.sin(angle * 1.3) * 0.05 + oy) * H;
      const rx = b.rx * W * (0.9 + Math.sin(angle * 0.7) * 0.08);
      const ry = b.ry * H * (0.9 + Math.cos(angle * 0.9) * 0.08);
      const c = paletteMix[b.colorIdx];
      const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      grad.addColorStop(0, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${b.alpha})`);
      grad.addColorStop(1, `rgba(${c[0]|0},${c[1]|0},${c[2]|0},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // particles drifting slowly upward, twinkling
    for (const p of particles) {
      p.y -= p.speed * dt;
      p.x += p.drift * dt;
      if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
      if (p.x < -0.02) p.x = 1.02;
      if (p.x > 1.02) p.x = -0.02;
      const tw = 0.5 + 0.5 * Math.sin(now * p.twinkleSpeed + p.twinklePhase);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${p.alpha * tw})`;
      ctx.arc(p.x * W, p.y * H, p.r * DPR, 0, Math.PI * 2);
      ctx.fill();
    }

    // soft vignette
    const vg = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

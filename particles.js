/* ============================================================
   SUBHAN MANJ — DIGITAL CONSCIOUSNESS
   particles.js — Blue Particle Field System
   ============================================================ */

(function () {
  const canvas  = document.getElementById('particle-canvas');
  const ctx     = canvas.getContext('2d');

  let W, H, particles = [], connections = [];
  const PARTICLE_COUNT = 90;
  const CONNECTION_DIST = 130;
  const MOUSE = { x: -9999, y: -9999 };

  /* ── RESIZE ─────────────────────────────────────────────── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  /* ── PARTICLE CLASS ─────────────────────────────────────── */
  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x    = Math.random() * W;
      this.y    = initial ? Math.random() * H : H + 10;
      this.vx   = (Math.random() - 0.5) * 0.35;
      this.vy   = -(Math.random() * 0.4 + 0.1);
      this.size = Math.random() * 1.8 + 0.4;
      this.life = 0;
      this.maxLife = Math.random() * 400 + 200;

      // Color variation: core blue to bright cyan
      const hue = 185 + Math.random() * 20;
      const sat = 80 + Math.random() * 20;
      const lit = 55 + Math.random() * 25;
      this.color = `hsl(${hue}, ${sat}%, ${lit}%)`;
      this.glowColor = `hsla(${hue}, 100%, 75%, `;

      // Occasional "data" particles — slightly larger, faster
      this.isData = Math.random() < 0.08;
      if (this.isData) {
        this.size = Math.random() * 1.2 + 2.5;
        this.vy   = -(Math.random() * 1.2 + 0.6);
        this.vx   = (Math.random() - 0.5) * 0.8;
      }
    }

    update() {
      this.life++;

      // Mouse repulsion (subtle)
      const dx = this.x - MOUSE.x;
      const dy = this.y - MOUSE.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        const force = (100 - dist) / 100 * 0.3;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }

      // Drift damping
      this.vx *= 0.995;
      this.vy *= 0.998;

      this.x += this.vx;
      this.y += this.vy;

      // Wrap horizontal
      if (this.x < -10)  this.x = W + 10;
      if (this.x > W+10) this.x = -10;

      // Reset when off top or life expired
      if (this.y < -20 || this.life > this.maxLife) {
        this.reset();
      }
    }

    draw() {
      const alpha = Math.min(
        this.life / 40,
        (this.maxLife - this.life) / 40,
        1
      ) * (this.isData ? 0.9 : 0.65);

      ctx.save();

      if (this.isData) {
        // Data particles: small bright squares
        ctx.shadowBlur  = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle   = `${this.glowColor}${alpha})`;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
      } else {
        // Regular particles: soft circles
        ctx.shadowBlur  = 6;
        ctx.shadowColor = this.color;

        const grad = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 2
        );
        grad.addColorStop(0, `${this.glowColor}${alpha})`);
        grad.addColorStop(1, `${this.glowColor}0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Bright core dot
        ctx.fillStyle = `${this.glowColor}${alpha * 1.4})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  /* ── INIT PARTICLES ─────────────────────────────────────── */
  function init() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
  }

  /* ── DRAW CONNECTIONS ───────────────────────────────────── */
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.18;

          ctx.save();
          ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
          ctx.lineWidth   = 0.6;
          ctx.shadowBlur  = 4;
          ctx.shadowColor = 'rgba(0,200,255,0.3)';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  /* ── DRAW AMBIENT NEBULA CLOUDS ─────────────────────────── */
  let nebulaTime = 0;
  function drawNebula() {
    nebulaTime += 0.003;

    const clouds = [
      { x: W * 0.15, y: H * 0.3,  r: 200, a: 0.025 },
      { x: W * 0.8,  y: H * 0.7,  r: 240, a: 0.020 },
      { x: W * 0.5,  y: H * 0.5,  r: 300, a: 0.015 },
      { x: W * 0.9,  y: H * 0.2,  r: 150, a: 0.018 },
    ];

    clouds.forEach((c, i) => {
      const pulse = Math.sin(nebulaTime + i * 1.3) * 0.4 + 0.6;
      const grad  = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * pulse);
      grad.addColorStop(0,   `rgba(0, 150, 220, ${c.a * pulse})`);
      grad.addColorStop(0.5, `rgba(0, 80,  160, ${c.a * 0.5 * pulse})`);
      grad.addColorStop(1,   'rgba(0, 0, 0, 0)');

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  /* ── DRAW SCAN LINES (horizontal sweeping) ──────────────── */
  let scanY = 0;
  function drawScanBeam() {
    scanY = (scanY + 0.4) % H;

    const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
    grad.addColorStop(0,   'rgba(0,200,255,0)');
    grad.addColorStop(0.5, 'rgba(0,200,255,0.04)');
    grad.addColorStop(1,   'rgba(0,200,255,0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 40, W, 80);
  }

  /* ── MAIN LOOP ──────────────────────────────────────────── */
  function loop() {
    ctx.clearRect(0, 0, W, H);

    drawNebula();
    drawScanBeam();
    drawConnections();

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(loop);
  }

  /* ── MOUSE TRACKING ─────────────────────────────────────── */
  window.addEventListener('mousemove', e => {
    MOUSE.x = e.clientX;
    MOUSE.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    MOUSE.x = -9999;
    MOUSE.y = -9999;
  });

  /* ── START ──────────────────────────────────────────────── */
  init();
  loop();

  // Expose for boot sequence (can trigger a particle burst)
  window.particleBurst = function (x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      const p  = new Particle();
      p.x      = x || W / 2;
      p.y      = y || H / 2;
      p.vx     = (Math.random() - 0.5) * 3;
      p.vy     = (Math.random() - 0.5) * 3;
      p.isData = true;
      p.life   = 0;
      p.maxLife = 80;
      particles.push(p);
    }
    // Keep total count in check
    while (particles.length > PARTICLE_COUNT + 60) {
      particles.shift();
    }
  };

})();

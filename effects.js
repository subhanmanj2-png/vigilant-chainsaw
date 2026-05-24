/* ============================================================
   SUBHAN MANJ — DIGITAL CONSCIOUSNESS
   effects.js — Glitch & Interference Engine
   ============================================================ */

(function () {

  /* ── STATE ──────────────────────────────────────────────── */
  const state = {
    glitching:   false,
    flickering:  false,
    lastGlitch:  0,
    intensity:   0,      // 0–1, rises when AI is "thinking"
  };

  /* ── GLITCH CANVAS OVERLAY ──────────────────────────────── */
  const glitchCanvas = document.createElement('canvas');
  glitchCanvas.id    = 'glitch-canvas';
  Object.assign(glitchCanvas.style, {
    position:      'fixed',
    inset:         '0',
    zIndex:        '6',
    pointerEvents: 'none',
    opacity:       '0',
  });
  document.body.appendChild(glitchCanvas);
  const gc = glitchCanvas.getContext('2d');

  function resizeGlitch() {
    glitchCanvas.width  = window.innerWidth;
    glitchCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeGlitch);
  resizeGlitch();

  /* ── DRAW A GLITCH FRAME ────────────────────────────────── */
  function drawGlitchFrame(intensity = 0.5) {
    const W = glitchCanvas.width;
    const H = glitchCanvas.height;
    gc.clearRect(0, 0, W, H);

    const sliceCount = Math.floor(3 + intensity * 10);

    for (let i = 0; i < sliceCount; i++) {
      const y      = Math.random() * H;
      const height = Math.random() * 6 + 1;
      const offset = (Math.random() - 0.5) * 30 * intensity;
      const alpha  = Math.random() * 0.25 * intensity;

      // Horizontal slice shift
      gc.save();
      gc.fillStyle = `rgba(0, 200, 255, ${alpha})`;
      gc.fillRect(0, y, W, height);

      // RGB split ghost
      gc.fillStyle = `rgba(0, 255, 200, ${alpha * 0.5})`;
      gc.fillRect(offset, y, W, height);
      gc.fillStyle = `rgba(0, 100, 255, ${alpha * 0.5})`;
      gc.fillRect(-offset, y, W, height);
      gc.restore();
    }

    // Occasional full-width bright flash line
    if (Math.random() < 0.3 * intensity) {
      const y = Math.random() * H;
      gc.save();
      gc.fillStyle = `rgba(0, 220, 255, ${0.08 * intensity})`;
      gc.fillRect(0, y, W, 1);
      gc.restore();
    }

    // Noise block
    if (Math.random() < 0.2 * intensity) {
      const bx = Math.random() * W * 0.8;
      const by = Math.random() * H * 0.8;
      const bw = Math.random() * 80 + 20;
      const bh = Math.random() * 20 + 4;
      gc.save();
      gc.fillStyle = `rgba(0, 180, 255, ${0.06 * intensity})`;
      gc.fillRect(bx, by, bw, bh);
      gc.restore();
    }
  }

  /* ── TRIGGER A GLITCH BURST ─────────────────────────────── */
  function triggerGlitch(duration = 300, intensity = 0.7) {
    if (state.glitching) return;
    state.glitching = true;
    glitchCanvas.style.opacity = '1';

    // Glitch the face
    const glitchLayer = document.getElementById('face-glitch-layer');
    if (glitchLayer) {
      glitchLayer.classList.remove('glitch');
      void glitchLayer.offsetWidth; // reflow
      glitchLayer.classList.add('glitch');
    }

    const frames  = Math.floor(duration / 40);
    let   current = 0;

    const interval = setInterval(() => {
      drawGlitchFrame(intensity * (1 - current / frames));
      current++;
      if (current >= frames) {
        clearInterval(interval);
        gc.clearRect(0, 0, glitchCanvas.width, glitchCanvas.height);
        glitchCanvas.style.opacity = '0';
        state.glitching = false;
      }
    }, 40);
  }

  /* ── SCREEN FLICKER ─────────────────────────────────────── */
  function flicker(times = 3, speed = 60) {
    const iface = document.getElementById('interface');
    if (!iface) return;

    let count = 0;
    const interval = setInterval(() => {
      iface.style.opacity = count % 2 === 0 ? '0.85' : '1';
      count++;
      if (count >= times * 2) {
        clearInterval(interval);
        iface.style.opacity = '1';
      }
    }, speed);
  }

  /* ── CHROMATIC ABERRATION PULSE ─────────────────────────── */
  function chromaticPulse(element, duration = 200) {
    if (!element) return;
    const orig = element.style.filter;
    element.style.filter = 'drop-shadow(2px 0 0 rgba(0,255,200,0.6)) drop-shadow(-2px 0 0 rgba(0,100,255,0.6))';
    element.style.transform = 'translateX(2px)';
    setTimeout(() => {
      element.style.filter = orig || '';
      element.style.transform = '';
    }, duration);
  }

  /* ── STATUS DISPLAY SCRAMBLE ────────────────────────────── */
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*><';

  function scrambleText(element, finalText, duration = 600) {
    if (!element) return;
    const steps = Math.floor(duration / 50);
    let   step  = 0;

    const interval = setInterval(() => {
      const progress = step / steps;
      let   display  = '';

      for (let i = 0; i < finalText.length; i++) {
        if (finalText[i] === ' ') {
          display += ' ';
        } else if (i / finalText.length < progress) {
          display += finalText[i];
        } else {
          display += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      element.textContent = display;
      step++;

      if (step >= steps) {
        clearInterval(interval);
        element.textContent = finalText;
      }
    }, 50);
  }

  /* ── TYPING EFFECT FOR CHAT MESSAGES ────────────────────── */
  function typeText(element, text, speed = 22, callback) {
    if (!element) return;
    element.textContent = '';
    let i = 0;

    const interval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text[i];
        i++;
        // Random micro-pause for realism
        if (Math.random() < 0.08) {
          clearInterval(interval);
          setTimeout(() => {
            const resume = setInterval(() => {
              if (i < text.length) {
                element.textContent += text[i];
                i++;
              } else {
                clearInterval(resume);
                if (callback) callback();
              }
            }, speed);
          }, Math.random() * 120 + 40);
        }
      } else {
        clearInterval(interval);
        if (callback) callback();
      }
    }, speed);
  }

  /* ── FAKE CPU / DIAGNOSTICS ANIMATION ──────────────────── */
  function animateDiagnostics() {
    const cpuEl    = document.getElementById('fake-cpu');
    const memEl    = document.getElementById('memory-depth');
    const stateEl  = document.getElementById('analysis-state');

    setInterval(() => {
      if (cpuEl) {
        const base = 12 + Math.floor(Math.random() * 8);
        const spike = state.intensity > 0.5 ? Math.floor(state.intensity * 60) : 0;
        cpuEl.textContent = Math.min(99, base + spike);
      }
    }, 800);

    // Analysis state cycling
    const states = ['PASSIVE', 'SCANNING', 'ANALYZING', 'PROFILING', 'PASSIVE', 'PASSIVE'];
    let   si     = 0;
    setInterval(() => {
      if (stateEl && state.intensity > 0.3) {
        si = (si + 1) % states.length;
        scrambleText(stateEl, states[si], 300);
      }
    }, 3000);
  }

  /* ── CLOCK ──────────────────────────────────────────────── */
  function startClock() {
    const el = document.getElementById('clock');
    if (!el) return;
    setInterval(() => {
      const now = new Date();
      const h   = String(now.getHours()).padStart(2, '0');
      const m   = String(now.getMinutes()).padStart(2, '0');
      const s   = String(now.getSeconds()).padStart(2, '0');
      el.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }

  /* ── UPTIME COUNTER ─────────────────────────────────────── */
  function startUptime() {
    const el    = document.getElementById('uptime');
    let   secs  = 0;
    setInterval(() => {
      secs++;
      const h = String(Math.floor(secs / 3600)).padStart(2, '0');
      const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      if (el) el.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }

  /* ── RANDOM AMBIENT GLITCHES ────────────────────────────── */
  function scheduleAmbientGlitches() {
    function next() {
      const delay = 4000 + Math.random() * 8000;
      setTimeout(() => {
        // Small passive glitch
        triggerGlitch(150, 0.25 + Math.random() * 0.2);

        // Occasional status bar scramble
        if (Math.random() < 0.4) {
          const statusEl = document.getElementById('status-text');
          const texts    = [
            'NEURAL LINK ACTIVE',
            'BEHAVIORAL ANALYSIS',
            'PATTERN RECOGNITION',
            'MEMORY INDEXING',
            'NEURAL LINK ACTIVE',
          ];
          if (statusEl) {
            scrambleText(statusEl, texts[Math.floor(Math.random() * texts.length)], 400);
          }
        }

        next();
      }, delay);
    }
    next();
  }

  /* ── INTENSITY CONTROL (used by ai.js) ─────────────────── */
  function setIntensity(val) {
    state.intensity = Math.max(0, Math.min(1, val));
  }

  /* ── INIT ───────────────────────────────────────────────── */
  function init() {
    startClock();
    startUptime();
    animateDiagnostics();

    // Start ambient glitches after boot
    setTimeout(scheduleAmbientGlitches, 5000);
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── EXPOSE GLOBALLY ────────────────────────────────────── */
  window.FX = {
    glitch:          triggerGlitch,
    flicker:         flicker,
    chromatic:       chromaticPulse,
    scramble:        scrambleText,
    typeText:        typeText,
    setIntensity:    setIntensity,
  };

})();
  

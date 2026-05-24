/* ============================================================
   SUBHAN MANJ — DIGITAL CONSCIOUSNESS
   boot.js — Cinematic Startup Sequence
   ============================================================ */

(function () {

  /* ── OPENING LINES ──────────────────────────────────────── */
  const FIRST_TIME_LINES = [
    'Connection established.',
    'Identity recognized.',
    'Proceed.',
  ];

  const RETURN_LINES = [
    'You have returned.',
    'I anticipated this.',
    'Proceed.',
  ];

  /* ── MAIN BOOT SEQUENCE ─────────────────────────────────── */
  function runBoot() {
    const overlay = document.getElementById('boot-overlay');
    const iface   = document.getElementById('interface');
    const lines   = document.querySelectorAll('.boot-line');

    if (!overlay || !iface) return;

    // Remove hidden from interface early (invisible but laid out)
    iface.classList.remove('hidden');

    // Step 1: Show boot lines with staggered delays
    lines.forEach(line => {
      const delay = parseInt(line.dataset.delay || 0);
      setTimeout(() => {
        line.classList.add('visible');
      }, delay);
    });

    // Step 2: Particle burst at center (if particles ready)
    setTimeout(() => {
      if (window.particleBurst) {
        particleBurst(window.innerWidth / 2, window.innerHeight / 2, 30);
      }
    }, 1200);

    // Step 3: Play boot sound on first interaction
    setTimeout(() => {
      if (window.SFX) {
        SFX.init();
        SFX.startAmbient();
        SFX.boot();
      }
    }, 500);

    // Step 4: Fade out overlay
    setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 900);
    }, 3600);

    // Step 5: Fade in interface
    setTimeout(() => {
      iface.classList.add('visible');
    }, 3800);

    // Step 6: Face reconstruction effect
    setTimeout(() => {
      const face = document.getElementById('face-reconstruction');
      if (face) {
        face.classList.add('reconstructing');
        setTimeout(() => face.classList.remove('reconstructing'), 1600);
      }

      // Glitch burst during reconstruction
      if (window.FX)  FX.glitch(600, 0.9);
      if (window.SFX) SFX.glitch();
    }, 4000);

    // Step 7: Particle burst on face reveal
    setTimeout(() => {
      const panel = document.getElementById('avatar-panel');
      if (panel && window.particleBurst) {
        const rect = panel.getBoundingClientRect();
        particleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 25);
      }
    }, 4400);

    // Step 8: Screen flicker
    setTimeout(() => {
      if (window.FX) FX.flicker(4, 80);
    }, 4200);

    // Step 9: Deliver opening lines
    setTimeout(() => {
      deliverOpeningLines();
    }, 5000);
  }

  /* ── DELIVER OPENING LINES ──────────────────────────────── */
  function deliverOpeningLines() {
    const isReturning = window.MEM && MEM.getCount() > 0;
    const greeting    = window.MEM ? MEM.getGreeting() : null;

    // Choose line set
    let lines = isReturning ? RETURN_LINES : FIRST_TIME_LINES;

    // If memory has a custom greeting, use it as 2nd line
    if (isReturning && greeting) {
      lines = [RETURN_LINES[0], greeting];
    }

    let delay = 0;

    lines.forEach((line, i) => {
      const pauseAfter = i === 0 ? 900 : 700;
      setTimeout(() => {
        displayOpeningLine(line, i === lines.length - 1);
      }, delay);
      delay += pauseAfter;
    });
  }

  /* ── DISPLAY SINGLE OPENING LINE ───────────────────────────*/
  function displayOpeningLine(text, isLast) {
    // Add to chat
    if (window.appendAIMessage) {
      window.appendAIMessage(text);
    }

    // Glitch on each line
    if (window.FX) FX.glitch(200, 0.4);

    // Small particle burst
    if (window.particleBurst) {
      particleBurst(
        window.innerWidth * 0.25 + Math.random() * 100,
        window.innerHeight * 0.5,
        8
      );
    }

    // Last line: subtle flicker + focus input
    if (isLast) {
      setTimeout(() => {
        if (window.FX) FX.flicker(2, 120);
        const input = document.getElementById('user-input');
        if (input) input.focus();
      }, 600);
    }
  }

  /* ── WAIT FOR DOM ───────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBoot);
  } else {
    runBoot();
  }

})();
                   

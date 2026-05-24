/* ============================================================
   SUBHAN MANJ — DIGITAL CONSCIOUSNESS
   camera.js — Webcam Access, Consent & Eye Tracking
   ============================================================ */

(function () {

  let stream       = null;
  let videoEl      = null;
  let trackingLoop = null;
  let cameraActive = false;

  /* ── EYE TRACKING (cursor-based illusion) ───────────────── */
  // Even without camera, eyes follow the mouse
  function initEyeTracking() {
    const eyeLeft  = document.getElementById('eye-left');
    const eyeRight = document.getElementById('eye-right');
    if (!eyeLeft || !eyeRight) return;

    window.addEventListener('mousemove', e => {
      moveEyes(e.clientX, e.clientY, eyeLeft, eyeRight);
    });

    // Mobile: touch tracking
    window.addEventListener('touchmove', e => {
      const t = e.touches[0];
      moveEyes(t.clientX, t.clientY, eyeLeft, eyeRight);
    }, { passive: true });

    // Idle: slowly drift eyes
    startIdleDrift(eyeLeft, eyeRight);
  }

  function moveEyes(mouseX, mouseY, eyeLeft, eyeRight) {
    [eyeLeft, eyeRight].forEach(eye => {
      const rect    = eye.getBoundingClientRect();
      const centerX = rect.left + rect.width  / 2;
      const centerY = rect.top  + rect.height / 2;

      const dx   = mouseX - centerX;
      const dy   = mouseY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const max  = 3.5; // max pupil travel in px

      const px = dist > 0 ? (dx / dist) * Math.min(dist * 0.04, max) : 0;
      const py = dist > 0 ? (dy / dist) * Math.min(dist * 0.04, max) : 0;

      const pupil = eye.querySelector('.pupil');
      if (pupil) {
        pupil.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
      }
    });
  }

  /* ── IDLE DRIFT ─────────────────────────────────────────── */
  function startIdleDrift(eyeLeft, eyeRight) {
    let angle = 0;
    setInterval(() => {
      // Only drift if mouse hasn't moved recently
      angle += 0.02;
      const px = Math.sin(angle) * 1.5;
      const py = Math.cos(angle * 0.7) * 1.0;

      [eyeLeft, eyeRight].forEach(eye => {
        const pupil = eye.querySelector('.pupil');
        if (pupil && !window._mouseActive) {
          pupil.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
        }
      });
    }, 50);

    // Track mouse activity
    let mouseTimer;
    window.addEventListener('mousemove', () => {
      window._mouseActive = true;
      clearTimeout(mouseTimer);
      mouseTimer = setTimeout(() => { window._mouseActive = false; }, 3000);
    });
  }

  /* ── CAMERA REQUEST ─────────────────────────────────────── */
  async function requestCamera() {
    if (cameraActive) {
      releaseCamera();
      return;
    }

    // Show consent overlay
    showConsentModal();
  }

  /* ── CONSENT MODAL ──────────────────────────────────────── */
  function showConsentModal() {
    const modal = document.createElement('div');
    modal.id    = 'consent-modal';
    Object.assign(modal.style, {
      position:        'fixed',
      inset:           '0',
      background:      'rgba(0,5,12,0.92)',
      zIndex:          '9000',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      fontFamily:      "'Share Tech Mono', monospace",
    });

    modal.innerHTML = `
      <div style="
        border: 1px solid #00c8ff;
        padding: 36px 40px;
        max-width: 420px;
        width: 90%;
        background: #020810;
        box-shadow: 0 0 40px rgba(0,200,255,0.2);
        text-align: center;
      ">
        <div style="color:#00c8ff;font-size:0.65rem;letter-spacing:0.3em;margin-bottom:20px;">
          ⬡ IDENTITY SYNCHRONIZATION REQUEST
        </div>
        <div style="color:#a8e6f0;font-size:0.78rem;line-height:1.8;margin-bottom:24px;">
          Permission required to access camera feed.<br/>
          This enables <span style="color:#00c8ff">identity synchronization</span>
          and enhanced behavioral analysis.<br/><br/>
          <span style="color:#3a7a8a;font-size:0.68rem;">
            Your video is processed locally.<br/>
            No footage is stored or transmitted.
          </span>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button id="consent-grant" style="
            font-family: 'Orbitron', monospace;
            font-size: 0.6rem;
            letter-spacing: 0.2em;
            color: #020810;
            background: #00c8ff;
            border: none;
            padding: 10px 22px;
            cursor: pointer;
          ">GRANT ACCESS</button>
          <button id="consent-deny" style="
            font-family: 'Orbitron', monospace;
            font-size: 0.6rem;
            letter-spacing: 0.2em;
            color: #3a7a8a;
            background: transparent;
            border: 1px solid #003344;
            padding: 10px 22px;
            cursor: pointer;
          ">DENY</button>
        </div>
        <div style="color:#3a7a8a;font-size:0.58rem;margin-top:16px;letter-spacing:0.1em;">
          USER AUTHORIZATION REQUIRED TO PROCEED
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('consent-grant').onclick = () => {
      modal.remove();
      activateCamera();
    };

    document.getElementById('consent-deny').onclick = () => {
      modal.remove();
      // AI reacts to denial
      if (window.appendAIMessage) {
        window.appendAIMessage('Access denied. Behavioral analysis will proceed through standard observation channels.');
      }
    };
  }

  /* ── ACTIVATE CAMERA ────────────────────────────────────── */
  async function activateCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 320, facingMode: 'user' },
        audio: false,
      });

      // Create video element
      videoEl    = document.createElement('video');
      videoEl.id = 'camera-video';
      videoEl.srcObject = stream;
      videoEl.autoplay  = true;
      videoEl.muted     = true;
      videoEl.playsInline = true;

      // Insert into face container
      const face = document.getElementById('face-reconstruction');
      if (face) face.appendChild(videoEl);

      cameraActive = true;

      // Update button
      const btn = document.getElementById('camera-btn');
      if (btn) {
        btn.textContent = '⬡ IDENTITY SYNC: ACTIVE';
        btn.style.color       = '#00c8ff';
        btn.style.borderColor = '#00c8ff';
        btn.style.boxShadow   = '0 0 12px rgba(0,200,255,0.3)';
      }

      // Sound + glitch
      if (window.SFX) SFX.cameraGrant();
      if (window.FX)  FX.glitch(400, 0.8);

      // AI acknowledgment
      setTimeout(() => {
        if (window.appendAIMessage) {
          window.appendAIMessage('User authorization accepted. Identity synchronization active. I can see you now.');
        }
      }, 800);

      // Start presence detection
      startPresenceDetection();

    } catch (err) {
      cameraActive = false;
      const msg = err.name === 'NotAllowedError'
        ? 'Camera access was blocked by the browser. Grant permission in your browser settings to proceed.'
        : 'Camera device unavailable. Standard analysis mode retained.';

      if (window.appendAIMessage) {
        window.appendAIMessage(msg);
      }
    }
  }

  /* ── PRESENCE DETECTION (canvas sampling) ───────────────── */
  function startPresenceDetection() {
    if (!videoEl) return;

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width  = 32;
    sampleCanvas.height = 32;
    const sctx = sampleCanvas.getContext('2d');

    let lastBrightness = 0;
    let absenceTimer   = null;

    trackingLoop = setInterval(() => {
      if (!videoEl || !cameraActive) return;

      try {
        sctx.drawImage(videoEl, 0, 0, 32, 32);
        const pixels     = sctx.getImageData(0, 0, 32, 32).data;
        let   brightness = 0;

        for (let i = 0; i < pixels.length; i += 4) {
          brightness += (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
        }
        brightness /= (pixels.length / 4);

        // Sudden brightness drop = user left frame
        const delta = Math.abs(brightness - lastBrightness);
        if (delta > 30 && lastBrightness > 20) {
          // Possible movement or absence
          if (window.FX) FX.glitch(150, 0.3);
        }
        lastBrightness = brightness;

      } catch {
        // Cross-origin or frame not ready — ignore
      }
    }, 2000);
  }

  /* ── RELEASE CAMERA ─────────────────────────────────────── */
  function releaseCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (videoEl) {
      videoEl.remove();
      videoEl = null;
    }
    if (trackingLoop) {
      clearInterval(trackingLoop);
      trackingLoop = null;
    }
    cameraActive = false;

    const btn = document.getElementById('camera-btn');
    if (btn) {
      btn.textContent = '⬡ ENABLE IDENTITY SYNC';
      btn.style.color       = '';
      btn.style.borderColor = '';
      btn.style.boxShadow   = '';
    }

    if (window.appendAIMessage) {
      window.appendAIMessage('Camera feed terminated. Visual synchronization suspended.');
    }
  }

  /* ── INIT ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initEyeTracking();
  });

  /* ── EXPOSE GLOBALLY ────────────────────────────────────── */
  window.requestCamera  = requestCamera;
  window.releaseCamera  = releaseCamera;
  window.isCameraActive = () => cameraActive;

})();
    

/* ============================================================
   SUBHAN MANJ — DIGITAL CONSCIOUSNESS
   sounds.js — Web Audio Synthesis Engine
   No external files. All sound generated in-browser.
   ============================================================ */

(function () {

  let ctx = null;
  let masterGain = null;
  let ambientNode = null;
  let ambientGain = null;
  let muted = false;

  /* ── INIT AUDIO CONTEXT (must be triggered by user gesture) */
  function initAudio() {
    if (ctx) return;
    ctx        = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(ctx.destination);
  }

  /* ── UTILITY: noise buffer ──────────────────────────────── */
  function makeNoiseBuffer(seconds = 1) {
    const len    = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data   = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /* ── UTILITY: play tone ─────────────────────────────────── */
  function playTone(freq, type = 'sine', duration = 0.3, vol = 0.15, startDelay = 0) {
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type            = type;
    osc.frequency.value = freq;

    const start = ctx.currentTime + startDelay;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  /* ── UTILITY: filtered noise burst ─────────────────────── */
  function playNoiseBurst(freqLow = 200, freqHigh = 800, duration = 0.2, vol = 0.08) {
    if (!ctx) return;
    const buffer = makeNoiseBuffer(duration + 0.1);
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter       = ctx.createBiquadFilter();
    filter.type        = 'bandpass';
    filter.frequency.value = (freqLow + freqHigh) / 2;
    filter.Q.value     = 0.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start();
    source.stop(ctx.currentTime + duration + 0.05);
  }

  /* ── AMBIENT HUM ────────────────────────────────────────── */
  function startAmbientHum() {
    if (!ctx || ambientNode) return;

    // Low drone oscillator
    const drone      = ctx.createOscillator();
    drone.type       = 'sawtooth';
    drone.frequency.value = 48;

    const droneGain  = ctx.createGain();
    droneGain.gain.value = 0.06;

    // Sub oscillator
    const sub        = ctx.createOscillator();
    sub.type         = 'sine';
    sub.frequency.value = 36;
    const subGain    = ctx.createGain();
    subGain.gain.value = 0.08;

    // Noise layer (very quiet room ambience)
    const noiseBuffer = makeNoiseBuffer(3);
    const noiseNode   = ctx.createBufferSource();
    noiseNode.buffer  = noiseBuffer;
    noiseNode.loop    = true;

    const noiseFilter       = ctx.createBiquadFilter();
    noiseFilter.type        = 'lowpass';
    noiseFilter.frequency.value = 300;

    const noiseGain         = ctx.createGain();
    noiseGain.gain.value    = 0.018;

    // LFO for hum modulation (breathing effect)
    const lfo        = ctx.createOscillator();
    lfo.type         = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain    = ctx.createGain();
    lfoGain.gain.value = 0.02;

    lfo.connect(lfoGain);
    lfoGain.connect(droneGain.gain);

    // Master ambient gain
    ambientGain       = ctx.createGain();
    ambientGain.gain.value = 0;

    drone.connect(droneGain);
    droneGain.connect(ambientGain);

    sub.connect(subGain);
    subGain.connect(ambientGain);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ambientGain);

    ambientGain.connect(masterGain);

    // Fade in
    ambientGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.5);

    drone.start();
    sub.start();
    noiseNode.start();
    lfo.start();

    ambientNode = drone; // reference to stop later
  }

  /* ── BOOT SEQUENCE SOUND ────────────────────────────────── */
  function playBoot() {
    if (!ctx) return;

    // Power-on hum rise
    const rise      = ctx.createOscillator();
    rise.type       = 'sawtooth';
    rise.frequency.setValueAtTime(30, ctx.currentTime);
    rise.frequency.linearRampToValueAtTime(80, ctx.currentTime + 1.2);

    const riseGain  = ctx.createGain();
    riseGain.gain.setValueAtTime(0, ctx.currentTime);
    riseGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3);
    riseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);

    rise.connect(riseGain);
    riseGain.connect(masterGain);
    rise.start();
    rise.stop(ctx.currentTime + 1.5);

    // Data scan tones (ascending)
    const tones = [220, 330, 440, 550, 660, 880];
    tones.forEach((freq, i) => {
      playTone(freq, 'sine', 0.12, 0.07, 0.5 + i * 0.18);
    });

    // Static burst
    setTimeout(() => playNoiseBurst(100, 4000, 0.3, 0.12), 1800);

    // Final lock-on tone
    playTone(1047, 'sine', 0.6, 0.1, 2.4);
    playTone(523,  'sine', 0.6, 0.07, 2.45);
  }

  /* ── GLITCH SOUND ───────────────────────────────────────── */
  function playGlitch() {
    if (!ctx) return;
    playNoiseBurst(800, 3200, 0.08 + Math.random() * 0.1, 0.1);
    if (Math.random() < 0.5) {
      playTone(
        200 + Math.random() * 800,
        'square',
        0.05,
        0.06,
        0.02
      );
    }
  }

  /* ── MESSAGE SEND SOUND ─────────────────────────────────── */
  function playTransmit() {
    if (!ctx) return;
    playTone(880,  'sine',   0.08, 0.06);
    playTone(1320, 'sine',   0.06, 0.04, 0.07);
    playNoiseBurst(600, 1200, 0.06, 0.05);
  }

  /* ── AI RESPONSE SOUND ──────────────────────────────────── */
  function playReceive() {
    if (!ctx) return;
    playNoiseBurst(300, 800, 0.1, 0.06);
    playTone(440, 'sine', 0.15, 0.05, 0.08);
    playTone(660, 'sine', 0.12, 0.04, 0.16);
  }

  /* ── THINKING SOUND (subtle data loop) ──────────────────── */
  let thinkInterval = null;
  function startThinking() {
    if (!ctx || thinkInterval) return;
    let beat = 0;
    thinkInterval = setInterval(() => {
      if (Math.random() < 0.5) {
        playTone(
          [220, 277, 330, 415, 523][beat % 5],
          'sine',
          0.06,
          0.025
        );
      }
      if (Math.random() < 0.2) {
        playNoiseBurst(200, 600, 0.04, 0.03);
      }
      beat++;
    }, 180);
  }

  function stopThinking() {
    if (thinkInterval) {
      clearInterval(thinkInterval);
      thinkInterval = null;
    }
  }

  /* ── CAMERA GRANT SOUND ─────────────────────────────────── */
  function playCameraGrant() {
    if (!ctx) return;
    playTone(523,  'sine', 0.2, 0.07);
    playTone(659,  'sine', 0.2, 0.06, 0.18);
    playTone(784,  'sine', 0.3, 0.07, 0.34);
    playNoiseBurst(400, 1200, 0.1, 0.05);
  }

  /* ── TOGGLE MUTE ────────────────────────────────────────── */
  function toggleMute() {
    if (!masterGain) return;
    muted = !muted;
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.3);
    return muted;
  }

  /* ── FIRST-INTERACTION UNLOCK ────────────────────────────── */
  // Audio context requires a user gesture on most browsers
  function unlockOnInteraction() {
    const unlock = () => {
      initAudio();
      startAmbientHum();
      document.removeEventListener('click',   unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click',      unlock, { once: true });
    document.addEventListener('keydown',    unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  }

  unlockOnInteraction();

  /* ── EXPOSE GLOBALLY ────────────────────────────────────── */
  window.SFX = {
    init:          initAudio,
    boot:          playBoot,
    glitch:        playGlitch,
    transmit:      playTransmit,
    receive:       playReceive,
    startThinking: startThinking,
    stopThinking:  stopThinking,
    cameraGrant:   playCameraGrant,
    mute:          toggleMute,
    startAmbient:  startAmbientHum,
  };

})();
      

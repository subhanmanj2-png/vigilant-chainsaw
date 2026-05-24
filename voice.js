/* ============================================================
   SUBHAN MANJ — DIGITAL CONSCIOUSNESS
   voice.js — Speech Synthesis Engine
   Deep, synthetic, cinematic voice output
   ============================================================ */

(function () {

  const synth   = window.speechSynthesis;
  let   enabled = true;
  let   voice   = null;
  let   speaking = false;

  /* ── VOICE SETTINGS ─────────────────────────────────────── */
  const VOICE_CONFIG = {
    rate:   0.82,    // Slower = more deliberate and unsettling
    pitch:  0.6,     // Lower = deeper, more synthetic
    volume: 0.92,
  };

  // Preferred voice names (in priority order)
  const PREFERRED_VOICES = [
    'Google UK English Male',
    'Microsoft David Desktop',
    'Microsoft Mark',
    'Alex',
    'Daniel',
    'Google US English',
  ];

  /* ── LOAD VOICES ────────────────────────────────────────── */
  function loadVoices() {
    const available = synth.getVoices();
    if (!available.length) return;

    // Try preferred voices first
    for (const name of PREFERRED_VOICES) {
      const match = available.find(v =>
        v.name.toLowerCase().includes(name.toLowerCase())
      );
      if (match) { voice = match; return; }
    }

    // Fallback: first English male-ish voice
    voice = available.find(v => v.lang.startsWith('en')) || available[0];
  }

  // Voices load async in most browsers
  loadVoices();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }

  /* ── SPEAK ──────────────────────────────────────────────── */
  function speak(text, onStart, onEnd) {
    if (!enabled || !synth) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel any current speech
    synth.cancel();

    // Strip markdown-style symbols for cleaner speech
    const clean = text
      .replace(/[*_`#>]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .trim();

    if (!clean) { if (onEnd) onEnd(); return; }

    // Split long text into sentences for smoother delivery
    const sentences = splitSentences(clean);
    speakSequence(sentences, onStart, onEnd);
  }

  /* ── SPLIT INTO SENTENCES ───────────────────────────────── */
  function splitSentences(text) {
    // Split on sentence-ending punctuation
    const raw = text.match(/[^.!?]+[.!?]*/g) || [text];
    return raw
      .map(s => s.trim())
      .filter(s => s.length > 1);
  }

  /* ── SPEAK SEQUENCE ─────────────────────────────────────── */
  function speakSequence(sentences, onStart, onEnd) {
    let index = 0;
    speaking  = true;

    const next = () => {
      if (index >= sentences.length) {
        speaking = false;
        onSpeakEnd();
        if (onEnd) onEnd();
        return;
      }

      const sentence = sentences[index];
      index++;

      const utt         = new SpeechSynthesisUtterance(sentence);
      utt.rate          = VOICE_CONFIG.rate + (Math.random() * 0.06 - 0.03); // tiny variation
      utt.pitch         = VOICE_CONFIG.pitch;
      utt.volume        = VOICE_CONFIG.volume;
      if (voice) utt.voice = voice;

      utt.onstart = () => {
        if (index === 1 && onStart) onStart();
        onSpeakStart();
      };

      utt.onend   = () => {
        // Brief pause between sentences
        setTimeout(next, 120 + Math.random() * 80);
      };

      utt.onerror = () => {
        speaking = false;
        if (onEnd) onEnd();
      };

      synth.speak(utt);
    };

    next();
  }

  /* ── VISUAL: SPEAKING ANIMATIONS ───────────────────────── */
  function onSpeakStart() {
    // Voice indicator bars
    const indicator = document.getElementById('voice-indicator');
    if (indicator) indicator.classList.add('speaking');

    // Mouth movement
    const mouth = document.getElementById('face-mouth');
    if (mouth) mouth.classList.add('speaking');

    // Eye glow intensifies
    document.querySelectorAll('.eye').forEach(eye => {
      eye.style.boxShadow = '0 0 16px #00eeff, 0 0 32px #00ccff, 0 0 60px rgba(0,220,255,0.9)';
    });
  }

  function onSpeakEnd() {
    // Stop voice bars
    const indicator = document.getElementById('voice-indicator');
    if (indicator) indicator.classList.remove('speaking');

    // Stop mouth
    const mouth = document.getElementById('face-mouth');
    if (mouth) mouth.classList.remove('speaking');

    // Eyes return to normal
    document.querySelectorAll('.eye').forEach(eye => {
      eye.style.boxShadow = '';
    });
  }

  /* ── STOP ───────────────────────────────────────────────── */
  function stop() {
    synth.cancel();
    speaking = false;
    onSpeakEnd();
  }

  /* ── TOGGLE ─────────────────────────────────────────────── */
  function toggle() {
    enabled = !enabled;
    if (!enabled) stop();
    return enabled;
  }

  /* ── ADD VOICE TOGGLE BUTTON ────────────────────────────── */
  function addVoiceToggle() {
    const bar = document.getElementById('top-bar');
    if (!bar) return;

    const btn = document.createElement('button');
    btn.id    = 'voice-toggle-btn';
    btn.textContent = '◉ VOICE: ON';
    Object.assign(btn.style, {
      fontFamily:   "'Orbitron', monospace",
      fontSize:     '0.55rem',
      letterSpacing:'0.15em',
      color:        '#00c8ff',
      background:   'transparent',
      border:       '1px solid #005f7a',
      padding:      '4px 10px',
      cursor:       'pointer',
      transition:   'all 0.3s',
    });

    btn.onclick = () => {
      const on = toggle();
      btn.textContent = on ? '◉ VOICE: ON' : '◎ VOICE: OFF';
      btn.style.color = on ? '#00c8ff' : '#3a7a8a';
    };

    // Insert before status-right
    const statusRight = document.getElementById('status-right');
    if (statusRight) bar.insertBefore(btn, statusRight);
  }

  /* ── INIT ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    addVoiceToggle();
  });

  /* ── EXPOSE GLOBALLY ────────────────────────────────────── */
  window.VOICE = {
    speak:    speak,
    stop:     stop,
    toggle:   toggle,
    isActive: () => speaking,
    isEnabled:() => enabled,
  };

})();
      

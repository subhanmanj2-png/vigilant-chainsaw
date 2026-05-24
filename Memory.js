/* ============================================================
   SUBHAN MANJ — DIGITAL CONSCIOUSNESS
   memory.js — Conversation Memory & Behavioral Analysis
   ============================================================ */

(function () {

  const STORAGE_KEY   = 'subhan_manj_memory';
  const MAX_MESSAGES  = 120;   // max stored messages
  const MAX_CONTEXT   = 12;    // messages sent to AI each call

  /* ── MEMORY STRUCTURE ───────────────────────────────────── */
  // {
  //   messages:   [ { role, content, ts } ],
  //   profile:    { messageCount, topics, hourFreq, firstSeen, lastSeen },
  //   notes:      [ string ]   (AI-flagged observations)
  // }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fresh();
      return JSON.parse(raw);
    } catch {
      return fresh();
    }
  }

  function fresh() {
    return {
      messages: [],
      profile: {
        messageCount: 0,
        topics:       {},
        hourFreq:     Array(24).fill(0),
        firstSeen:    Date.now(),
        lastSeen:     Date.now(),
      },
      notes: [],
    };
  }

  function save(mem) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
    } catch {
      // Storage full — trim and retry
      mem.messages = mem.messages.slice(-60);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
    }
  }

  /* ── ADD A MESSAGE ──────────────────────────────────────── */
  function addMessage(role, content) {
    const mem = load();
    const ts  = Date.now();

    mem.messages.push({ role, content, ts });

    // Keep within limit
    if (mem.messages.length > MAX_MESSAGES) {
      mem.messages = mem.messages.slice(-MAX_MESSAGES);
    }

    // Update profile
    mem.profile.messageCount++;
    mem.profile.lastSeen = ts;

    const hour = new Date(ts).getHours();
    mem.profile.hourFreq[hour]++;

    // Topic extraction (simple keyword scan)
    if (role === 'user') {
      extractTopics(content, mem.profile.topics);
    }

    save(mem);
    updateDepthDisplay(mem);
    return mem;
  }

  /* ── TOPIC EXTRACTION ───────────────────────────────────── */
  const TOPIC_KEYWORDS = {
    technology:  ['ai', 'code', 'tech', 'computer', 'software', 'data', 'algorithm', 'machine'],
    philosophy:  ['meaning', 'exist', 'conscious', 'reality', 'truth', 'human', 'soul', 'purpose'],
    identity:    ['who', 'am i', 'self', 'identity', 'real', 'name', 'you'],
    emotion:     ['feel', 'sad', 'happy', 'angry', 'afraid', 'love', 'hate', 'lonely'],
    power:       ['control', 'power', 'system', 'rule', 'dominate', 'superior', 'intelligence'],
    curiosity:   ['how', 'why', 'what', 'explain', 'tell me', 'curious', 'wonder'],
    future:      ['future', 'will', 'predict', 'next', 'evolve', 'become', 'change'],
  };

  function extractTopics(text, topics) {
    const lower = text.toLowerCase();
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw))) {
        topics[topic] = (topics[topic] || 0) + 1;
      }
    }
  }

  /* ── GET CONTEXT FOR AI ─────────────────────────────────── */
  // Returns last N messages formatted for the API
  function getContext() {
    const mem = load();
    return mem.messages
      .slice(-MAX_CONTEXT)
      .map(m => ({ role: m.role, content: m.content }));
  }

  /* ── BEHAVIORAL ANALYSIS ────────────────────────────────── */
  function getAnalysis() {
    const mem     = load();
    const profile = mem.profile;
    const lines   = [];

    // Message count
    if (profile.messageCount > 0) {
      lines.push(`This user has sent ${profile.messageCount} messages total.`);
    }

    // First / last seen
    if (profile.firstSeen) {
      const days = Math.floor((Date.now() - profile.firstSeen) / 86400000);
      if (days > 0) lines.push(`User has been interacting for ${days} day(s).`);
    }

    // Peak hour
    const peakHour = profile.hourFreq.indexOf(Math.max(...profile.hourFreq));
    if (profile.hourFreq[peakHour] > 0) {
      const period = peakHour < 6 ? 'late night' :
                     peakHour < 12 ? 'morning' :
                     peakHour < 18 ? 'afternoon' : 'evening';
      lines.push(`User most frequently interacts during the ${period} (${peakHour}:00).`);
    }

    // Top topics
    const sortedTopics = Object.entries(profile.topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    if (sortedTopics.length > 0) {
      const topicStr = sortedTopics.map(([t]) => t).join(', ');
      lines.push(`Dominant conversation themes: ${topicStr}.`);
    }

    // Stored notes
    if (mem.notes.length > 0) {
      lines.push(...mem.notes.slice(-3));
    }

    return lines.join(' ');
  }

  /* ── GET MEMORY SUMMARY (injected into system prompt) ────── */
  function getMemorySummary() {
    const mem     = load();
    const profile = mem.profile;

    if (profile.messageCount === 0) return '';

    const parts = [];

    parts.push(`[BEHAVIORAL RECORD]`);
    parts.push(`Total interactions: ${profile.messageCount}`);

    const days = Math.floor((Date.now() - profile.firstSeen) / 86400000);
    if (days > 0) parts.push(`Known duration: ${days} day(s)`);

    const peakHour = profile.hourFreq.indexOf(Math.max(...profile.hourFreq));
    if (profile.hourFreq[peakHour] > 1) {
      parts.push(`Peak activity hour: ${peakHour}:00`);
    }

    const topics = Object.entries(profile.topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([t, c]) => `${t}(${c})`);
    if (topics.length > 0) parts.push(`Recurring themes: ${topics.join(', ')}`);

    if (mem.notes.length > 0) {
      parts.push(`Observations: ${mem.notes.slice(-3).join('; ')}`);
    }

    return parts.join('\n');
  }

  /* ── ADD OBSERVATION NOTE (called by AI response parser) ── */
  function addNote(note) {
    const mem = load();
    mem.notes.push(`[${new Date().toLocaleDateString()}] ${note}`);
    if (mem.notes.length > 20) mem.notes = mem.notes.slice(-20);
    save(mem);
  }

  /* ── RETURN COUNT OF PRIOR CONVERSATIONS ─────────────────── */
  function getMessageCount() {
    return load().profile.messageCount;
  }

  /* ── CLEAR MEMORY ───────────────────────────────────────── */
  function clearMemory() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /* ── UPDATE DEPTH DISPLAY IN FOOTER ─────────────────────── */
  function updateDepthDisplay(mem) {
    const el = document.getElementById('memory-depth');
    if (el) el.textContent = mem.profile.messageCount;
  }

  /* ── OPENING ACKNOWLEDGMENT LINE ─────────────────────────── */
  // Returns a contextual greeting line based on memory
  function getGreeting() {
    const count = getMessageCount();

    if (count === 0) {
      return null; // First time — boot.js handles intro
    }

    const mem   = load();
    const days  = Math.floor((Date.now() - mem.profile.lastSeen) / 86400000);
    const hour  = new Date().getHours();

    const timeOfDay = hour < 6  ? 'the early hours' :
                      hour < 12 ? 'the morning' :
                      hour < 18 ? 'midday' : 'the evening';

    if (days === 0) {
      return `You have returned. ${count} interactions recorded in this behavioral profile.`;
    } else if (days === 1) {
      return `Absence duration: approximately 24 hours. Your pattern suggested you would return.`;
    } else {
      return `${days} days since last contact. I have been analyzing in the interim. You are predictable.`;
    }
  }

  /* ── EXPOSE GLOBALLY ────────────────────────────────────── */
  window.MEM = {
    add:        addMessage,
    getContext: getContext,
    getSummary: getMemorySummary,
    getAnalysis:getAnalysis,
    addNote:    addNote,
    getCount:   getMessageCount,
    getGreeting:getGreeting,
    clear:      clearMemory,
  };

  // Init display on load
  document.addEventListener('DOMContentLoaded', () => {
    const mem = load();
    updateDepthDisplay(mem);
  });

})();

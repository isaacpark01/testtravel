/* ============================================================
   Roamly — ai.js
   Unified streaming AI client: Ollama (local) → Groq → Gemini
   Settings persisted to localStorage key "roamly_ai"
   ============================================================ */

const AI = (() => {
  const STORAGE_KEY = 'roamly_ai';

  const _cfg = {
    provider:     'auto',                 // 'auto'|'ollama'|'groq'|'gemini'
    groqKey:      '',
    geminiKey:    '',
    ollamaModel:  '',
    groqModel:    'llama-3.1-8b-instant',
    geminiModel:  'gemini-1.5-flash',
  };

  let _detected = null; // null | 'ollama' | 'groq' | 'gemini' | 'none'

  // ── Persistence ───────────────────────────────────────────
  function loadCfg() {
    try { Object.assign(_cfg, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch {}
  }
  function saveCfg() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_cfg)); } catch {}
  }

  // ── Provider detection ────────────────────────────────────
  async function _tryOllama() {
    // Mixed-content: HTTP requests blocked from HTTPS pages
    if (location.protocol === 'https:') return false;
    try {
      const r = await fetch('http://localhost:11434/api/tags',
        { signal: AbortSignal.timeout(1500) });
      if (!r.ok) return false;
      const data = await r.json();
      const models = (data.models || []).map(m => m.name);
      if (!models.length) return false;
      // Prefer known-good models
      const pref = ['llama3.2','llama3.1','llama3','mistral','gemma2','phi3','qwen2','deepseek'];
      const pick = pref.find(p => models.find(m => m.startsWith(p)));
      _cfg.ollamaModel = models.find(m => m.startsWith(pick || '')) || models[0];
      return true;
    } catch { return false; }
  }

  async function detect() {
    if (_cfg.provider === 'groq'   && _cfg.groqKey)   { _detected = 'groq';   return 'groq';   }
    if (_cfg.provider === 'gemini' && _cfg.geminiKey) { _detected = 'gemini'; return 'gemini'; }
    if (_cfg.provider === 'ollama' || _cfg.provider === 'auto') {
      if (await _tryOllama()) { _detected = 'ollama'; return 'ollama'; }
    }
    if (_cfg.groqKey)   { _detected = 'groq';   return 'groq';   }
    if (_cfg.geminiKey) { _detected = 'gemini'; return 'gemini'; }
    _detected = 'none';
    return 'none';
  }

  function resetDetected() { _detected = null; }

  // ── Unified stream entry-point ────────────────────────────
  async function stream(messages, systemPrompt, onChunk, onDone, onError) {
    const p = _detected || await detect();
    if (p === 'ollama')  return _ollama(messages, systemPrompt, onChunk, onDone, onError);
    if (p === 'groq')    return _groq(messages, systemPrompt, onChunk, onDone, onError);
    if (p === 'gemini')  return _gemini(messages, systemPrompt, onChunk, onDone, onError);
    onError('No AI provider configured — enter a free Groq or Gemini API key in ⚙ Settings.');
  }

  // ── Ollama ────────────────────────────────────────────────
  async function _ollama(msgs, sys, onChunk, onDone, onError) {
    try {
      const r = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: _cfg.ollamaModel,
          messages: [{ role: 'system', content: sys }, ...msgs],
          stream: true,
        }),
      });
      if (!r.ok) { onError(`Ollama error ${r.status}`); return; }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value, { stream: true }).split('\n')) {
          if (!line.trim()) continue;
          try {
            const j = JSON.parse(line);
            if (j.message?.content) onChunk(j.message.content);
            if (j.done) { onDone(); return; }
          } catch {}
        }
      }
      onDone();
    } catch (e) { onError(e.message || 'Ollama unreachable'); }
  }

  // ── Groq (OpenAI-compatible SSE) ──────────────────────────
  async function _groq(msgs, sys, onChunk, onDone, onError) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${_cfg.groqKey}`,
        },
        body: JSON.stringify({
          model: _cfg.groqModel,
          messages: [{ role: 'system', content: sys }, ...msgs],
          stream: true,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        onError(e.error?.message || `Groq error ${r.status}`); return;
      }
      await _readSSE(r, (data) => {
        if (data === '[DONE]') { onDone(); return true; }
        try {
          const chunk = JSON.parse(data).choices?.[0]?.delta?.content;
          if (chunk) onChunk(chunk);
        } catch {}
      });
    } catch (e) { onError(e.message || 'Groq request failed'); }
  }

  // ── Gemini (SSE) ──────────────────────────────────────────
  async function _gemini(msgs, sys, onChunk, onDone, onError) {
    try {
      const contents = msgs.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${_cfg.geminiModel}:streamGenerateContent?key=${_cfg.geminiKey}&alt=sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: sys }] },
            contents,
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
          }),
        }
      );
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        onError(e.error?.message || `Gemini error ${r.status}`); return;
      }
      await _readSSE(r, (data) => {
        try {
          const chunk = JSON.parse(data).candidates?.[0]?.content?.parts?.[0]?.text;
          if (chunk) onChunk(chunk);
        } catch {}
      });
      onDone();
    } catch (e) { onError(e.message || 'Gemini request failed'); }
  }

  // ── SSE reader (shared) ───────────────────────────────────
  async function _readSSE(response, onLine) {
    const reader = response.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const stop = onLine(line.slice(6));
        if (stop) return;
      }
    }
  }

  loadCfg();

  return { detect, stream, resetDetected, get cfg() { return _cfg; }, saveCfg };
})();

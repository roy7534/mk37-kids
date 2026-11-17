// Voice: plays a parent's own recording if one exists, otherwise the neural-voice clip, otherwise device TTS.
(function () {
  const V = { gender: 'f', on: true, buffers: {}, recBuffers: {} };
  const DB = 'noti-voice', STORE = 'rec';

  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  async function idb(mode, fn) {
    const d = await db();
    return new Promise((res, rej) => { const tx = d.transaction(STORE, mode); const q = fn(tx.objectStore(STORE)); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); });
  }

  V.text = (key) => { const p = (window.PHRASES || {})[key]; return p ? p[V.gender === 'm' ? 1 : 0] : ''; };
  V.keys = () => Object.keys(window.PHRASES || {});

  // Load the clips for the chosen gender + any parent recordings.
  V.init = async function (gender) {
    V.gender = gender || 'f'; V.buffers = {};
    const keys = V.keys();
    await Promise.all(keys.map(async (k) => {
      try {
        const r = await fetch(`voice/${V.gender}/${k}.mp3`);
        if (r.ok) V.buffers[k] = await Audio2.decode(await r.arrayBuffer());
      } catch (e) {}
    }));
    try {
      const all = await idb('readonly', (s) => s.getAllKeys());
      for (const k of all || []) {
        const blob = await idb('readonly', (s) => s.get(k));
        if (blob) V.recBuffers[k] = await Audio2.decode(await blob.arrayBuffer());
      }
    } catch (e) {}
  };

  // Speak a phrase by key. Returns duration in seconds (approx).
  V.say = function (key) {
    if (!V.on) return 0;
    const buf = V.recBuffers[key] || V.buffers[key];
    if (buf) return Audio2.playBuffer(buf, 1);
    const t = V.text(key); if (!t) return 0;
    Audio2.say(t);
    return t.length * 0.08;
  };
  V.sayOne = (keys) => V.say(keys[Math.floor(Math.random() * keys.length)]);

  // ----- Parent recordings -----
  let rec = null, chunks = [], stream = null;
  V.hasRec = (k) => !!V.recBuffers[k];
  V.startRec = async function () {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    chunks = [];
    rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.start();
  };
  V.stopRec = function (key) {
    return new Promise((res) => {
      if (!rec) return res(false);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/mp4' });
        rec = null;
        try {
          V.recBuffers[key] = await Audio2.decode(await blob.arrayBuffer());
          await idb('readwrite', (s) => s.put(blob, key));
          res(true);
        } catch (e) { res(false); }
      };
      rec.stop();
    });
  };
  V.deleteRec = async function (key) { delete V.recBuffers[key]; try { await idb('readwrite', (s) => s.delete(key)); } catch (e) {} };

  window.Voice = V;
})();

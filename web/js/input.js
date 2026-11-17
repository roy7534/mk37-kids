// Note input from the real organ: Web MIDI, native iOS wrapper (CoreMIDI bridge), or microphone pitch detection.
(function () {
  const I = { listeners: [], midiOk: false, micOk: false, lastMic: null, level: 0, micSensitivity: 0.5 };
  I.onNote = (fn) => I.listeners.push(fn);
  function emit(type, midi, src) { I.listeners.forEach((fn) => fn(type, midi, src)); }
  I.emit = emit;

  // ---------- MIDI ----------
  I.midiStatus = 'לא מחובר';
  function handleMidi(status, d1, d2) {
    const cmd = status & 0xf0;
    if (cmd === 0x90 && d2 > 0) { I.midiOk = true; emit('on', d1, 'midi'); }
    else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) emit('off', d1, 'midi');
  }
  // Called by the native iOS wrapper (see ios/ folder).
  window.nativeMidi = function (status, d1, d2) { I.midiStatus = 'מחובר (USB)'; handleMidi(status, d1, d2); };
  window.nativeMidiStatus = function (text) { I.midiStatus = text; I.midiOk = /מחובר|connected/i.test(text); };

  I.startMidi = async function () {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.midi) {
      window.webkit.messageHandlers.midi.postMessage('start');
      return true;
    }
    if (!navigator.requestMIDIAccess) return false;
    try {
      const access = await navigator.requestMIDIAccess();
      const bind = () => {
        let n = 0;
        access.inputs.forEach((inp) => { inp.onmidimessage = (e) => handleMidi(e.data[0], e.data[1], e.data[2]); n++; });
        I.midiStatus = n ? 'מחובר (' + n + ')' : 'לא נמצא אורגן';
        I.midiOk = n > 0;
      };
      bind(); access.onstatechange = bind;
      return true;
    } catch (e) { return false; }
  };

  // ---------- Microphone pitch detection (YIN) ----------
  let analyser, buf, micTimer, stream;
  let state = { cand: null, count: 0, current: null, lastRms: 0, silentFrames: 0 };
  I.startMic = async function () {
    if (I.micOk) return true;
    const ctx = Audio2.ctx();
    if (!ctx || !navigator.mediaDevices) return false;
    try {
      try { if (navigator.audioSession) navigator.audioSession.type = 'play-and-record'; } catch (e) {}
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const src = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
      src.connect(analyser);
      buf = new Float32Array(analyser.fftSize);
      micTimer = setInterval(processMic, 30);
      I.micOk = true;
      return true;
    } catch (e) { console.warn('mic', e); return false; }
  };
  I.stopMic = function () {
    clearInterval(micTimer); I.micOk = false;
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };

  function yin(data, sr) {
    const half = Math.floor(data.length / 2), d = new Float32Array(half);
    const minTau = Math.floor(sr / 1500), maxTau = Math.min(half - 1, Math.floor(sr / 75));
    for (let tau = 1; tau <= maxTau; tau++) {
      let s = 0;
      for (let i = 0; i < half; i++) { const x = data[i] - data[i + tau]; s += x * x; }
      d[tau] = s;
    }
    // cumulative mean normalised difference
    let run = 0; d[0] = 1;
    for (let tau = 1; tau <= maxTau; tau++) { run += d[tau]; d[tau] = d[tau] * tau / (run || 1); }
    const thr = 0.15;
    let tau = -1;
    for (let t = minTau; t <= maxTau; t++) {
      if (d[t] < thr) { while (t + 1 <= maxTau && d[t + 1] < d[t]) t++; tau = t; break; }
    }
    if (tau < 0) return null;
    // parabolic interpolation
    const x0 = d[tau - 1], x1 = d[tau], x2 = d[tau + 1] ?? x1;
    const denom = 2 * (2 * x1 - x2 - x0);
    const better = denom ? tau + (x2 - x0) / denom : tau;
    return { f: sr / better, clarity: 1 - x1 };
  }

  function processMic() {
    analyser.getFloatTimeDomainData(buf);
    let rms = 0; for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / buf.length);
    I.level = rms;
    const gate = 0.004 + (1 - I.micSensitivity) * 0.04;
    // Ignore our own sounds (demos, rewards, speech).
    if (Audio2.isBusy()) { state.current = null; state.cand = null; state.lastRms = rms; return; }
    if (rms < gate) {
      state.silentFrames++;
      if (state.silentFrames > 3 && state.current != null) { emit('off', state.current, 'mic'); state.current = null; }
      state.cand = null; state.lastRms = rms; return;
    }
    state.silentFrames = 0;
    const r = yin(buf, Audio2.ctx().sampleRate);
    if (!r || r.clarity < 0.8) { state.lastRms = rms; return; }
    const midi = Math.round(69 + 12 * Math.log2(r.f / 440));
    I.lastMic = midi;
    const attack = rms > state.lastRms * 1.6 && rms > gate * 2; // a new key strike on the same note
    if (midi === state.cand) state.count++; else { state.cand = midi; state.count = 1; }
    if (state.count >= 2 && (midi !== state.current || attack)) {
      if (state.current != null) emit('off', state.current, 'mic');
      state.current = midi;
      emit('on', midi, 'mic');
    }
    state.lastRms = rms * 0.6 + state.lastRms * 0.4;
  }

  window.Input = I;
})();

// Web Audio engine: synth voices (MK37-like sound categories), rhythm styles, metronome, SFX and speech.
(function () {
  const A = {};
  let ctx, master, dry, wet, noiseBuf;
  let busyUntil = 0; // mic input is ignored while the app itself is making sound
  A.volume = 0.8;
  A.sustain = false;
  A.soundNum = 1;

  // ---- Sound categories, numbered exactly like the MK37 panel ----
  const SOUND_CATS = [
    { from: 1, to: 15, name: 'PIANO', he: 'פסנתר', patch: 'piano' },
    { from: 16, to: 30, name: 'E.PIANO', he: 'פסנתר חשמלי', patch: 'epiano' },
    { from: 31, to: 47, name: 'CHROMATIC', he: 'פעמונים', patch: 'bell' },
    { from: 48, to: 60, name: 'ORGAN', he: 'עוגב', patch: 'organ' },
    { from: 61, to: 65, name: 'ACCORDION', he: 'אקורדיון', patch: 'accordion' },
    { from: 66, to: 82, name: 'GUITAR', he: 'גיטרה', patch: 'guitar' },
    { from: 83, to: 96, name: 'BASS', he: 'בס', patch: 'bass' },
    { from: 97, to: 121, name: 'STRINGS', he: 'כלי מיתר', patch: 'strings' },
    { from: 122, to: 137, name: 'BRASS', he: 'כלי נשיפה ממתכת', patch: 'brass' },
    { from: 138, to: 154, name: 'WOODWIND', he: 'חליל', patch: 'wood' },
    { from: 155, to: 180, name: 'SYNTH', he: 'סינתיסייזר', patch: 'synth' },
    { from: 181, to: 188, name: 'ETHNIC', he: 'עולמי', patch: 'ethnic' },
    { from: 189, to: 197, name: 'SFX', he: 'אפקטים', patch: 'sfx' },
    { from: 198, to: 200, name: 'DRUMS', he: 'תופים', patch: 'drums' }
  ];
  const STYLE_CATS = [
    { from: 1, to: 18, name: 'BEAT & POP', he: 'פופ', tempo: [96, 120], pat: 'pop' },
    { from: 19, to: 37, name: 'ROCK', he: 'רוק', tempo: [104, 140], pat: 'rock' },
    { from: 38, to: 53, name: 'DANCE', he: 'דאנס', tempo: [118, 132], pat: 'dance' },
    { from: 54, to: 64, name: 'SOUL & FUNK', he: 'פאנק', tempo: [88, 112], pat: 'funk' },
    { from: 65, to: 80, name: 'JAZZ', he: "ג'אז", tempo: [96, 150], pat: 'jazz' },
    { from: 81, to: 86, name: 'COUNTRY', he: 'קאנטרי', tempo: [100, 130], pat: 'country' },
    { from: 87, to: 102, name: 'LATIN', he: 'לטיני', tempo: [96, 126], pat: 'latin' },
    { from: 103, to: 111, name: 'TRADITIONAL', he: 'מסורתי', tempo: [90, 120], pat: 'waltz' },
    { from: 112, to: 120, name: 'PIANIST', he: 'פסנתרן', tempo: [70, 100], pat: 'pianist' }
  ];
  A.SOUND_CATS = SOUND_CATS;
  A.STYLE_CATS = STYLE_CATS;
  A.soundCat = (n) => SOUND_CATS.find((c) => n >= c.from && n <= c.to) || SOUND_CATS[0];
  A.styleCat = (n) => STYLE_CATS.find((c) => n >= c.from && n <= c.to) || STYLE_CATS[0];

  A.init = function () {
    if (ctx) { if (ctx.state !== 'running') ctx.resume(); return; }
    // Let audio play even when the iPad's silent switch is on (Safari 16.4+).
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    master = ctx.createGain();
    master.gain.value = A.volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    dry = ctx.createGain(); dry.connect(master);
    wet = ctx.createGain(); wet.gain.value = 0.18;
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(1.8);
    wet.connect(conv).connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // iOS unlock blip
    const o = ctx.createOscillator(), g = ctx.createGain(); g.gain.value = 0.0001;
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.05);
  };
  A.ctx = () => ctx;
  A.setVolume = (v) => { A.volume = v; if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05); };
  A.isBusy = () => ctx && ctx.currentTime < busyUntil;
  A.markBusy = (sec) => { if (ctx) busyUntil = Math.max(busyUntil, ctx.currentTime + sec); };

  function makeImpulse(sec) {
    const len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return buf;
  }
  function out(node, reverb = 1) {
    node.connect(dry);
    if (reverb) { const s = ctx.createGain(); s.gain.value = reverb; node.connect(s).connect(wet); }
  }
  function osc(type, f, t, det = 0) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; o.start(t); return o;
  }

  // ---- Voices ----
  // Returns a handle {stop(when)}; percussive voices ignore stop unless sustain is off and key released.
  A.noteOn = function (midi, vel = 0.8, num = A.soundNum) {
    if (!ctx) return { stop() {} };
    const cat = A.soundCat(num);
    const v = (num - cat.from) / Math.max(1, cat.to - cat.from); // 0..1 variant inside category
    const t = ctx.currentTime + 0.005;
    const f = Music.freq(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    const vol = 0.32 * vel;
    let oscs = [], release = 0.25, decaying = false, filt;
    const lp = (fc, q = 0.7) => { filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = fc; filt.Q.value = q; filt.connect(g); return filt; };
    switch (cat.patch) {
      case 'piano': {
        const fl = lp(Math.min(9000, f * 8 + 1500));
        fl.frequency.setTargetAtTime(f * 3 + 600, t, 0.4);
        oscs = [osc('triangle', f, t), osc('sine', f * 2, t, 3 + v * 6), osc('sawtooth', f, t, -4)];
        const gs = [0.9, 0.35, 0.12].map((x) => { const m = ctx.createGain(); m.gain.value = x; return m; });
        oscs.forEach((o, i) => o.connect(gs[i]).connect(fl));
        g.gain.linearRampToValueAtTime(vol, t + 0.005);
        g.gain.setTargetAtTime(0, t + 0.01, A.sustain ? 1.6 : 0.9 * (1 - (midi - 48) / 80));
        decaying = true; release = A.sustain ? 1.2 : 0.18;
        break;
      }
      case 'epiano': {
        const mod = osc('sine', f * (v > 0.5 ? 14 : 1), t), mg = ctx.createGain();
        mg.gain.setValueAtTime(f * 1.2, t); mg.gain.setTargetAtTime(f * 0.1, t, 0.15);
        const car = osc('sine', f, t); mod.connect(mg).connect(car.frequency);
        car.connect(g); oscs = [mod, car];
        g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.setTargetAtTime(0, t + 0.02, 1.2);
        decaying = true; release = A.sustain ? 1 : 0.3;
        break;
      }
      case 'bell': {
        oscs = [osc('sine', f, t), osc('sine', f * (2.76 + v), t), osc('sine', f * 5.4, t)];
        const gs = [1, 0.4, 0.15];
        oscs.forEach((o, i) => { const m = ctx.createGain(); m.gain.value = gs[i]; o.connect(m).connect(g); });
        g.gain.linearRampToValueAtTime(vol * 0.9, t + 0.002); g.gain.setTargetAtTime(0, t + 0.01, 0.6);
        decaying = true; release = 1.5;
        break;
      }
      case 'organ': {
        const bars = v < 0.5 ? [1, 0.6, 0.4, 0.25] : [1, 0.8, 0, 0.5, 0.3];
        bars.forEach((b, i) => { if (!b) return; const o = osc('sine', f * (i + 1), t); const m = ctx.createGain(); m.gain.value = b * 0.35; o.connect(m).connect(g); oscs.push(o); });
        g.gain.linearRampToValueAtTime(vol, t + 0.02); release = 0.08;
        break;
      }
      case 'accordion': {
        const fl = lp(2400);
        oscs = [osc('sawtooth', f, t, -8), osc('sawtooth', f, t, 9), osc('square', f, t)];
        oscs.forEach((o) => o.connect(fl));
        const lfo = osc('sine', 5.5, t), lg = ctx.createGain(); lg.gain.value = vol * 0.1; lfo.connect(lg).connect(g.gain); oscs.push(lfo);
        g.gain.linearRampToValueAtTime(vol * 0.45, t + 0.06); release = 0.12;
        break;
      }
      case 'guitar': case 'ethnic': {
        const fl = lp(f * 10, cat.patch === 'ethnic' ? 8 : 1);
        fl.frequency.setTargetAtTime(f * 1.5, t, 0.12 + v * 0.1);
        oscs = [osc('sawtooth', f, t), osc('triangle', f * 2, t, 5)];
        oscs.forEach((o) => o.connect(fl));
        g.gain.linearRampToValueAtTime(vol * 0.8, t + 0.003); g.gain.setTargetAtTime(0, t + 0.01, 0.55);
        decaying = true; release = A.sustain ? 0.8 : 0.15;
        break;
      }
      case 'bass': {
        const fb = f / 2, fl = lp(fb * 6);
        fl.frequency.setTargetAtTime(fb * 2, t, 0.2);
        oscs = [osc('triangle', fb, t), osc('sawtooth', fb, t)];
        oscs.forEach((o) => o.connect(fl));
        g.gain.linearRampToValueAtTime(vol * 1.1, t + 0.005); g.gain.setTargetAtTime(vol * 0.5, t + 0.05, 0.4);
        release = 0.1;
        break;
      }
      case 'strings': case 'brass': {
        const brass = cat.patch === 'brass';
        const fl = lp(brass ? 600 : 2800);
        if (brass) fl.frequency.linearRampToValueAtTime(f * 6 + 800, t + 0.08);
        oscs = [osc('sawtooth', f, t, -7 - v * 6), osc('sawtooth', f, t, 7 + v * 6)];
        oscs.forEach((o) => o.connect(fl));
        g.gain.linearRampToValueAtTime(vol * 0.5, t + (brass ? 0.05 : 0.18)); release = brass ? 0.15 : 0.5;
        break;
      }
      case 'wood': {
        const fl = lp(f * 4);
        const o = osc(v < 0.5 ? 'triangle' : 'square', f, t);
        const lfo = osc('sine', 5, t), lg = ctx.createGain(); lg.gain.value = 6; lfo.connect(lg).connect(o.detune);
        o.connect(fl); oscs = [o, lfo];
        g.gain.linearRampToValueAtTime(vol * 0.7, t + 0.06); release = 0.1;
        break;
      }
      case 'synth': {
        const fl = lp(1800 + v * 4000, 4);
        oscs = [osc(v < 0.5 ? 'square' : 'sawtooth', f, t, -10), osc('sawtooth', f, t, 10)];
        oscs.forEach((o) => o.connect(fl));
        g.gain.linearRampToValueAtTime(vol * 0.4, t + 0.01); release = 0.3;
        break;
      }
      case 'sfx': {
        const o = osc('sine', f, t); o.frequency.exponentialRampToValueAtTime(f * (v < 0.5 ? 3 : 0.3), t + 0.4);
        o.connect(g); oscs = [o];
        g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.setTargetAtTime(0, t + 0.2, 0.15);
        decaying = true; release = 0.2;
        break;
      }
      case 'drums': {
        A.drum(['kick', 'snare', 'hat', 'clap', 'tom', 'ohat', 'tom2'][(midi - 48) % 7], t, vel);
        return { stop() {} };
      }
    }
    out(g, 1);
    A.markBusy(decaying ? 1.2 : 0.5);
    let stopped = false;
    return {
      stop() {
        if (stopped) return; stopped = true;
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), now);
        g.gain.setTargetAtTime(0, now, release / 3);
        oscs.forEach((o) => { try { o.stop(now + release * 2 + 0.1); } catch (e) {} });
        A.markBusy(release + 0.2);
      }
    };
  };

  // Play a note for a fixed duration (used by demos and SFX).
  A.play = function (midi, dur = 0.4, vel = 0.8, num = A.soundNum) {
    const h = A.noteOn(midi, vel, num);
    setTimeout(() => h.stop(), dur * 1000);
    A.markBusy(dur + 0.4);
    return h;
  };

  // ---- Drums ----
  A.drum = function (kind, t, vel = 0.8) {
    if (!ctx) return;
    t = t || ctx.currentTime;
    const g = ctx.createGain(); g.connect(master);
    const noise = (hp, dur, lpF) => {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = lpF ? 'bandpass' : 'highpass'; f.frequency.value = hp;
      s.connect(f).connect(g); s.start(t); s.stop(t + dur);
    };
    switch (kind) {
      case 'kick': {
        const o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
        o.connect(g); o.start(t); o.stop(t + 0.35);
        g.gain.setValueAtTime(vel * 0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        break;
      }
      case 'snare': case 'clap': {
        noise(kind === 'clap' ? 1200 : 1800, 0.2, kind === 'clap');
        if (kind === 'snare') { const o = ctx.createOscillator(); o.frequency.value = 190; o.connect(g); o.start(t); o.stop(t + 0.1); }
        g.gain.setValueAtTime(vel * 0.45, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        break;
      }
      case 'hat': case 'ohat': {
        const len = kind === 'ohat' ? 0.25 : 0.05;
        noise(7000, len);
        g.gain.setValueAtTime(vel * 0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
        break;
      }
      case 'tom': case 'tom2': {
        const o = ctx.createOscillator(); const b = kind === 'tom' ? 160 : 110;
        o.frequency.setValueAtTime(b, t); o.frequency.exponentialRampToValueAtTime(b * 0.6, t + 0.2);
        o.connect(g); o.start(t); o.stop(t + 0.3);
        g.gain.setValueAtTime(vel * 0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        break;
      }
      case 'click': case 'clickHi': {
        const o = ctx.createOscillator(); o.frequency.value = kind === 'clickHi' ? 1760 : 1100;
        o.connect(g); o.start(t); o.stop(t + 0.04);
        g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        break;
      }
    }
  };

  // ---- Rhythm styles (16 steps). K=kick S=snare H=hat O=open hat C=clap ----
  const PATS = {
    pop: ['K...H...S...H...', 'K.H.H.H.S.H.K.H.'],
    rock: ['K.H.S.H.K.K.S.H.', 'KHHHSHHHKHKHSHHO'],
    dance: ['K.H.K.H.K.H.K.H.', 'K.O.KCO.K.O.KCO.'],
    funk: ['K..HS.HKK.H.S..H', 'K.HKS.HKK.HKS.KH'],
    jazz: ['H..HH..HH..HH..H', 'K..HS..HK..HS..H'],
    country: ['K.H.S.H.K.H.S.H.', 'K.HHS.HHK.HHS.HH'],
    latin: ['K..K..K.K..K..K.', 'K.HKH.KHK.HKH.KH'],
    waltz: ['K...H...H...', 'K.H.S.H.S.H.'],
    pianist: ['H.......H.......', 'K...H...K...H...']
  };
  const style = { on: false, num: 1, ab: 0, tempo: 110, step: 0, next: 0, timer: null, chordRoot: null, metro: false };
  A.style = style;
  A.setStyle = function (n) { style.num = n; const c = A.styleCat(n); const v = (n - c.from) / Math.max(1, c.to - c.from); style.tempo = Math.round(c.tempo[0] + v * (c.tempo[1] - c.tempo[0])); };
  A.startStyle = function () {
    if (!ctx) return; if (style.timer) return;
    style.on = true; style.step = 0; style.next = ctx.currentTime + 0.06;
    style.timer = setInterval(tick, 25);
  };
  A.stopStyle = function () { style.on = false; if (!style.metro) { clearInterval(style.timer); style.timer = null; } };
  A.setMetronome = function (on) {
    style.metro = on;
    if (on && !style.timer) { style.step = 0; style.next = ctx.currentTime + 0.06; style.timer = setInterval(tick, 25); }
    if (!on && !style.on) { clearInterval(style.timer); style.timer = null; }
  };
  A.setChordRoot = (m) => { style.chordRoot = m; };
  function tick() {
    const cat = A.styleCat(style.num);
    const pat = PATS[cat.pat][style.ab];
    const stepDur = 60 / style.tempo / 4;
    while (style.next < ctx.currentTime + 0.12) {
      const s = style.step % pat.length, t = style.next;
      if (style.on) {
        const ch = pat[s];
        if (ch === 'K') A.drum('kick', t); if (ch === 'S') A.drum('snare', t); if (ch === 'H') A.drum('hat', t, 0.6);
        if (ch === 'O') A.drum('ohat', t); if (ch === 'C') A.drum('clap', t);
        // Auto-bass + chord following the lowest key held in the left octave (CHORD mode).
        if (style.chordRoot != null && s % (pat.length / 2) === 0) {
          const r = style.chordRoot, when = (t - ctx.currentTime) * 1000;
          setTimeout(() => { A.play(r - 12, stepDur * 3, 0.6, 85); [0, 4, 7].forEach((i) => A.play(r + 12 + i, stepDur * 6, 0.25, 50)); }, Math.max(0, when));
        }
      }
      if (style.metro && s % 4 === 0) A.drum(s === 0 ? 'clickHi' : 'click', t);
      style.step++; style.next += stepDur;
    }
  }

  // ---- Feedback sounds ----
  A.sfx = function (name) {
    if (!ctx) return;
    const seq = {
      pop: [[84, 0.06], [91, 0.08]],
      good: [[76, 0.08], [83, 0.12]],
      wrong: [[52, 0.18]],
      star: [[88, 0.06], [91, 0.06], [96, 0.14]],
      fanfare: [[72, 0.12], [76, 0.12], [79, 0.12], [84, 0.5]],
      gift: [[79, 0.1], [83, 0.1], [86, 0.1], [91, 0.1], [95, 0.3]]
    }[name] || [];
    let t = 0;
    seq.forEach(([n, d]) => { setTimeout(() => A.play(n, d + 0.1, name === 'wrong' ? 0.25 : 0.5, name === 'wrong' ? 49 : 35), t * 1000); t += d; });
    if (name === 'fanfare') setTimeout(() => [72, 76, 79, 84].forEach((n) => A.play(n, 0.9, 0.3, 125)), t * 1000);
    A.markBusy(t + 0.6);
  };

  // ---- Pre-recorded clips (voice phrases / parent recordings) ----
  let clipSrc = null;
  A.playBuffer = function (buf, vol = 1) {
    if (!ctx || !buf) return 0;
    try { clipSrc && clipSrc.stop(); } catch (e) {}
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf; g.gain.value = vol * 1.4;
    s.connect(g).connect(master); s.start();
    clipSrc = s;
    A.markBusy(buf.duration + 0.25);
    return buf.duration;
  };
  A.decode = (arrayBuf) => new Promise((res, rej) => ctx.decodeAudioData(arrayBuf, res, rej));

  // ---- Fallback: device Hebrew voice ----
  let heVoice = null;
  function pickVoice() {
    const vs = speechSynthesis.getVoices();
    heVoice = vs.find((v) => /^he/i.test(v.lang) && /carmit/i.test(v.name)) || vs.find((v) => /^he/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  A.speechOn = true;
  A.say = function (text) {
    if (!A.speechOn || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL'; if (heVoice) u.voice = heVoice;
    u.rate = 0.95; u.pitch = 1.25; u.volume = 1;
    A.markBusy(text.length * 0.09 + 0.6);
    u.onend = () => A.markBusy(0.25);
    speechSynthesis.speak(u);
  };

  window.Audio2 = A;
})();

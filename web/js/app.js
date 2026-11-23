// MK37 Kids — screens, MK37 panel logic, keyboard, game modes, rewards, editor, parent area.
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const M = Music, AU = Audio2, V = Voice;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rnd = (a) => a[Math.floor(Math.random() * a.length)];
  const today = () => new Date().toISOString().slice(0, 10);
  const CKEY = { 0: 'do', 2: 're', 4: 'mi', 5: 'fa', 7: 'sol', 9: 'la', 11: 'si' };
  const ckey = (m) => CKEY[M.pc(m)] || CKEY[M.pc(m) - 1];

  // ================= State =================
  const KEY = 'mk37kids-v2';
  const DEF = {
    name: '', gender: 'f', levelStars: {}, songStars: {}, stickers: [], custom: [], lastGift: '',
    settings: { input: 'auto', micSens: 0.5, volume: 0.8, strict: false, voice: true, voicePack: 'mom', timeLimit: 0, lowKey: 48, touchPlay: false }
  };
  let S;
  try { S = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); S.settings = Object.assign({}, DEF.settings, S.settings); }
  catch (e) { S = JSON.parse(JSON.stringify(DEF)); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const sessionStart = Date.now();
  const totalStars = () => [...Object.values(S.levelStars), ...Object.values(S.songStars)].reduce((a, b) => a + b, 0);
  const notiAcc = (stars = totalStars()) => Art.notiAcc.filter(([n]) => stars >= n).map(([, a]) => a);

  // ================= Content =================
  const W4 = [60, 62, 64, 65, 67, 69, 71];
  const LEVELS = [
    { type: 'find', pool: [60], rounds: 4, title: 'הקליד האדום' },
    { type: 'find', pool: [60, 62], rounds: 6, title: 'אדום וכתום' },
    { type: 'find', pool: [60, 62, 64], rounds: 8, title: 'שלושה צבעים' },
    { type: 'echo', pool: [60, 62, 64], len: 2, rounds: 4, title: 'הציפור שרה' },
    { type: 'song', song: 'hotcross' },
    { type: 'find', pool: [60, 62, 64, 65, 67], rounds: 8, title: 'חמישה צבעים' },
    { type: 'song', song: 'mary' },
    { type: 'echo', pool: [60, 62, 64, 65, 67], len: 3, rounds: 4, title: 'הד מוזיקלי' },
    { type: 'song', song: 'yonatan' },
    { type: 'find', pool: W4, rounds: 10, title: 'כל הקשת', hint: 2500 },
    { type: 'song', song: 'twinkle' },
    { type: 'song', song: 'ode' },
    { type: 'echo', pool: W4, len: 4, rounds: 4, title: 'הד ארוך' },
    { type: 'song', song: 'jacob' },
    { type: 'song', song: 'farm' },
    { type: 'song', song: 'london' },
    { type: 'song', song: 'bells' },
    { type: 'song', song: 'boat' },
    { type: 'song', song: 'lullaby' },
    { type: 'song', song: 'birthday' }
  ];
  LEVELS.forEach((L) => { if (L.song) L.notesPreview = M.SONGS.find((s) => s.id === L.song).notes; });
  const unlocked = () => { let i = 0; while (i < LEVELS.length && S.levelStars[i]) i++; return Math.min(i, LEVELS.length - 1); };
  const allSongs = () => M.SONGS.concat(S.custom.map((c) => Object.assign({}, c, { seq: M.parse(c.notes) })));
  const songIdx = (id) => allSongs().findIndex((s) => s.id === id);

  // ================= Panel (the MK37 controls) =================
  const P = { mode: 'sound', sound: 1, style: 1, song: 1, entry: '', chord: false, ab: 0, sustain: false, metro: false, playing: false, selSong: 1 };
  let panel;
  let current = 'splash';

  function panelSync() {
    if (!panel) return;
    let led = '  -', mode = null, chart = null;
    if (P.entry) led = P.entry.padStart(3, '-');
    else if (current === 'home') led = ' HI';
    else if (current === 'map') led = String(unlocked() + 1).padStart(3, '0');
    else if (current === 'songs') { led = String(P.selSong).padStart(3, '0'); mode = 'song'; chart = ['song', P.selSong]; }
    else if (current === 'game' && Game.ctx) {
      if (Game.ctx.kind === 'song') { const n = songIdx(Game.ctx.id) + 1; led = String(n).padStart(3, '0'); mode = 'song'; chart = ['song', n]; }
      else led = 'L' + String(Game.ctx.idx + 1).padStart(2, '0');
    } else if (current === 'free') { led = String(P[P.mode]).padStart(3, '0'); mode = P.mode; chart = [P.mode, P[P.mode]]; }
    else if (current === 'album') led = String(S.stickers.length).padStart(3, '0');
    panel.led(led, !P.entry);
    panel.mode(mode);
    panel.chart(chart ? chart[0] : '', chart ? chart[1] : -1);
    ['song', 'style', 'sound'].forEach((b) => panel.lit(b, mode === b));
    panel.lit('chord', P.chord); panel.lit('ab', !!P.ab); panel.lit('sustain', P.sustain); panel.lit('metro', P.metro);
    panel.knob(AU.volume);
  }

  let holdT, knobDrag = null;
  function onPanel(b, phase, e) {
    if (b === 'knob') {
      if (phase === 'down') { knobDrag = { y: e.clientY, v: AU.volume }; }
      return;
    }
    if (b === 'power') {
      const ring = document.querySelector('.power-ring');
      if (phase === 'down') {
        ring.classList.add('holding');
        holdT = setTimeout(() => { holdT = null; ring.classList.remove('holding'); openParent(); }, 1800);
      } else if (holdT) {
        clearTimeout(holdT); holdT = null; ring.classList.remove('holding');
        if (phase === 'up' && current !== 'splash') go('home');
      }
      return;
    }
    if (phase !== 'down') return;
    AU.init();
    if (current === 'splash') { if (b === 'play') start(); return; }
    if (b[0] === 'd') return digit(+b.slice(1));
    AU.sfx('click');
    switch (b) {
      case 'song': go('songs'); break;
      case 'style': P.mode = 'style'; AU.setStyle(P.style); go('free'); break;
      case 'sound': P.mode = 'sound'; go('free'); break;
      case 'prev': case 'next': step(b === 'next' ? 1 : -1); break;
      case 'play': playButton(); break;
      case 'chord': P.chord = !P.chord; if (!P.chord) AU.setChordRoot(null); break;
      case 'ab': P.ab = 1 - P.ab; AU.style.ab = P.ab; break;
      case 'sustain': P.sustain = !P.sustain; AU.sustain = P.sustain; break;
      case 'metro': P.metro = !P.metro; AU.setMetronome(P.metro); break;
    }
    if (current === 'free') Free.render();
    panelSync();
  }
  window.addEventListener('pointermove', (e) => {
    if (!knobDrag) return;
    const v = Math.max(0, Math.min(1, knobDrag.v + (knobDrag.y - e.clientY) / 120));
    AU.setVolume(v); S.settings.volume = v; panel.knob(v);
  });
  window.addEventListener('pointerup', () => { if (knobDrag) { knobDrag = null; save(); } });

  let entryT;
  function digit(d) {
    AU.sfx('click');
    P.entry += d; clearTimeout(entryT);
    panelSync();
    const apply = () => { const n = parseInt(P.entry, 10) || 0; P.entry = ''; applyNumber(n); panelSync(); };
    if (P.entry.length >= 3) apply(); else entryT = setTimeout(apply, 1200);
  }
  function applyNumber(n) {
    if (current === 'home') { if (n === 1) go('map'); if (n === 2) go('songs'); if (n === 3) go('free'); return; }
    if (current === 'songs') { const max = allSongs().length; P.selSong = Math.max(1, Math.min(max, n)); Songs.select(); return; }
    if (current === 'map') { if (n >= 1 && n - 1 <= unlocked()) Game.startLevel(n - 1); return; }
    if (current === 'free') { const max = { sound: 200, style: 120, song: 100 }[P.mode]; P[P.mode] = Math.max(1, Math.min(max, n)); if (P.mode === 'style') AU.setStyle(P.style); Free.render(); }
  }
  function step(d) {
    if (current === 'songs') { const max = allSongs().length; P.selSong = ((P.selSong - 1 + d + max) % max) + 1; Songs.select(); }
    if (current === 'free') { const max = { sound: 200, style: 120, song: 100 }[P.mode]; P[P.mode] = ((P[P.mode] - 1 + d + max) % max) + 1; if (P.mode === 'style') AU.setStyle(P.style); Free.render(); }
  }
  function playButton() {
    if (!$('#reward').classList.contains('hidden')) { if (!$('#reward-actions').classList.contains('hidden')) $('#reward-next').click(); return; }
    if (current === 'home' || current === 'map') return Game.startLevel(unlocked());
    if (current === 'songs') return Game.startSong(allSongs()[P.selSong - 1].id);
    if (current === 'game') return Game.watch();
    if (current === 'free') return Free.play();
  }

  // ================= Screens =================
  function go(name) {
    if (current === 'game') Game.stop();
    if (current === 'free') Free.leave();
    if (current === 'editor') Editor.leave();
    P.entry = '';
    $$('.scr').forEach((s) => s.classList.toggle('active', s.id === 's-' + name));
    current = name;
    KB.clearTarget();
    ({ home: renderHome, map: renderMap, songs: () => Songs.render(), album: renderAlbum, free: () => Free.enter() })[name]?.();
    panelSync();
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-go]'); if (t) { AU.sfx('pop'); go(t.dataset.go); }
    if (e.target.closest('.back')) go('home');
  });
  $$('[data-icon]').forEach((el) => (el.innerHTML = Art.icon[el.dataset.icon]));
  $$('.star-ic').forEach((el) => (el.innerHTML = Art.star()));

  // ================= Keyboard =================
  const KB = {
    el: $('#kb'), keys: {}, low: 48, high: 84, target: null,
    build() {
      this.low = S.settings.lowKey; this.high = this.low + 36;
      this.el.innerHTML = ''; this.keys = {};
      const whites = []; for (let m = this.low; m <= this.high; m++) if (!M.isBlack(m)) whites.push(m);
      whites.forEach((m) => {
        const k = document.createElement('div'); k.className = 'wk'; k.dataset.m = m;
        k.innerHTML = `<span class="stk" style="background:${M.colorOf(m)}"></span>`;
        this.el.appendChild(k); this.keys[m] = k;
      });
      for (let m = this.low; m <= this.high; m++) if (M.isBlack(m)) {
        const i = whites.indexOf(m - 1); if (i < 0) continue;
        const w = 60 / whites.length, k = document.createElement('div');
        k.className = 'bk'; k.dataset.m = m; k.style.width = w + '%'; k.style.left = ((i + 1) / whites.length * 100 - w / 2) + '%';
        this.el.appendChild(k); this.keys[m] = k;
      }
    },
    fit(m) { while (m < this.low) m += 12; while (m > this.high) m -= 12; return m; },
    setTarget(m) {
      this.clearTarget(); if (m == null) return;
      const k = this.keys[this.fit(m)]; if (!k) return;
      k.style.setProperty('--tc', M.colorOf(m)); k.classList.add('target');
      k.insertAdjacentHTML('beforeend', Art.pin(M.colorOf(m)));
      this.target = k;
    },
    clearTarget() { if (this.target) { this.target.classList.remove('target'); this.target.querySelector('.pin')?.remove(); this.target = null; } },
    flash(m, cls) { const k = this.keys[this.fit(m)]; if (!k) return; k.classList.remove(cls); void k.offsetWidth; k.classList.add(cls); setTimeout(() => k.classList.remove(cls), 450); },
    demo(m, ms) { const k = this.keys[this.fit(m)]; if (!k) return; k.style.setProperty('--tc', M.colorOf(m)); k.classList.add('demo'); setTimeout(() => k.classList.remove('demo'), ms); },
    press(m, on) { const k = this.keys[this.fit(m)]; if (k) k.classList.toggle('down', on); }
  };

  // Screen keys: an instrument in free play / editor; in games they only count in parent test mode.
  const ptr = new Map(), voices = {};
  const touchAllowed = () => current === 'free' || current === 'editor' || S.settings.touchPlay;
  const keyAt = (x, y) => { const el = document.elementFromPoint(x, y); const k = el && el.closest('.wk,.bk'); return k ? +k.dataset.m : null; };
  let noteT;
  function keysNote(text) { const n = $('#keys-note'); n.textContent = text; n.classList.add('show'); clearTimeout(noteT); noteT = setTimeout(() => n.classList.remove('show'), 2200); }
  function touchOn(m) {
    if (m == null) return;
    if (!touchAllowed()) { KB.flash(m, 'bad'); keysNote('לוחצים על האורגן האמיתי!'); return; }
    voices[m]?.stop(); voices[m] = AU.noteOn(m, 0.8, current === 'free' ? P.sound : 1);
    Input.emit('on', m, 'touch');
  }
  function touchOff(m) { if (m == null || !voices[m]) return; voices[m].stop(); delete voices[m]; Input.emit('off', m, 'touch'); }
  KB.el.addEventListener('pointerdown', (e) => { e.preventDefault(); AU.init(); const m = keyAt(e.clientX, e.clientY); ptr.set(e.pointerId, m); touchOn(m); });
  KB.el.addEventListener('pointermove', (e) => {
    if (!ptr.has(e.pointerId) || !touchAllowed()) return;
    const m = keyAt(e.clientX, e.clientY), old = ptr.get(e.pointerId);
    if (m !== old) { touchOff(old); ptr.set(e.pointerId, m); touchOn(m); }
  });
  ['pointerup', 'pointercancel'].forEach((ev) => window.addEventListener(ev, (e) => { if (!ptr.has(e.pointerId)) return; touchOff(ptr.get(e.pointerId)); ptr.delete(e.pointerId); }));

  // ================= Note routing =================
  let calibrating = false;
  Input.onNote((type, m, src) => {
    if (type === 'off') { KB.press(m, false); return; }
    KB.press(m, true);
    if (src !== 'touch') setTimeout(() => KB.press(m, false), src === 'mic' ? 250 : 4000);
    if (src === 'midi' && Input.micOk && S.settings.input === 'auto') Input.stopMic();
    if (calibrating && src !== 'touch') { calibrating = false; S.settings.lowKey = m; save(); KB.build(); fillParent(); AU.sfx('good'); return; }
    $('#p-last').textContent = M.nameHe(m) + ' (' + M.nameEn(m) + ')';
    if (current === 'game') Game.onNote(m, src);
    else if (current === 'free') Free.noteOn(m);
    else if (current === 'editor') Editor.onNote(m);
  });
  const matches = (m, t, src) => (src === 'mic' || !S.settings.strict) ? M.pc(m) === M.pc(t) : m === KB.fit(t);

  function statusHTML() {
    const test = S.settings.touchPlay ? ' · מצב בדיקה' : '';
    if (Input.midiOk) return `<span class="dot"></span><span class="ic">${Art.icon.organChip}</span>האורגן מחובר · מנגנים על האורגן${test}`;
    if (Input.micOk) return `<span class="dot"></span><span class="ic" style="width:20px">${Art.icon.mic}</span>מקשיב לאורגן${test}`;
    return `<span class="dot"></span>לא שומע את האורגן · קוראים להורים${test}`;
  }
  function updateStatus() {
    ['#status-home', '#status-game'].forEach((id) => { const el = $(id); el.innerHTML = statusHTML(); el.classList.toggle('warn', !Input.midiOk && !Input.micOk); });
  }
  setInterval(updateStatus, 1000);

  // ================= Talking =================
  function setNoti(sel, color, mood) { $(sel).innerHTML = Art.noti(color, notiAcc(), mood); }
  function talk(key, bubbleSel = '#guide-bubble', speak = true) {
    $(bubbleSel).textContent = V.text(key);
    const n = bubbleSel === '#guide-bubble' ? $('#guide-noti') : null;
    if (n) { n.classList.remove('jump'); void n.offsetWidth; n.classList.add('jump'); }
    return speak ? V.say(key) : 0;
  }
  const PRAISE = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
  function praise(speak) {
    Game.combo++;
    const c = Game.combo;
    $('#combo').textContent = c >= 3 ? c + ' ברצף!' : '';
    if (c % 6 === 0) { talk('streak', '#guide-bubble', true); Confetti.burst(innerWidth / 2, innerHeight * 0.45, 70); }
    else talk(rnd(PRAISE), '#guide-bubble', speak);
  }
  function mistake(m, target) {
    Game.combo = 0; $('#combo').textContent = '';
    Game.mistakes++; Game.wrongRow++;
    KB.flash(m, 'bad'); KB.setTarget(target);
    setNoti('#guide-noti', M.colorOf(target), 'wow');
    if (Game.wrongRow >= 2) { Game.wrongRow = 0; talk('find_' + ckey(target)); }
    else talk('almost', '#guide-bubble', false);
  }

  // ================= Game engine =================
  const Game = {
    mode: null, combo: 0, mistakes: 0, wrongRow: 0, token: 0, ctx: null,
    stop() { this.token++; this.mode = null; KB.clearTarget(); },
    startLevel(i) { this.ctx = { kind: 'level', idx: i }; this.run(LEVELS[i]); },
    startSong(id) { this.ctx = { kind: 'song', id }; this.run({ type: 'song', song: id }); },
    run(L) {
      go('game');
      this.token++; this.combo = 0; this.mistakes = 0; this.wrongRow = 0; this.L = L;
      $('#stage').innerHTML = ''; $('#combo').textContent = ''; $('#guide-bubble').textContent = '';
      $('#game-title').classList.toggle('hidden', L.type !== 'song');
      setNoti('#guide-noti', '#ff4d5e');
      updateStatus();
      this.mode = ({ find: Find, echo: Echo, song: Song })[L.type];
      this.mode.start(L, this.token);
      panelSync();
    },
    score(done, total) { $('#game-score').innerHTML = `${Art.star()} ${done} / ${total}`; },
    onNote(m, src) { if (this.mode) this.mode.onNote(m, src); },
    watch() { if (this.mode === Song) Song.watch(); else if (this.mode === Echo && Echo.phase === 'play') Echo.listen(); else if (this.mode === Find) Find.hint(); },
    finish() {
      const total = this.total || 1;
      const stars = this.mistakes <= 1 ? 3 : this.mistakes <= Math.max(2, total * 0.3) ? 2 : 1;
      const before = notiAcc();
      let first;
      if (this.ctx.kind === 'level') { first = !S.levelStars[this.ctx.idx]; S.levelStars[this.ctx.idx] = Math.max(S.levelStars[this.ctx.idx] || 0, stars); }
      else { first = !S.songStars[this.ctx.id]; S.songStars[this.ctx.id] = Math.max(S.songStars[this.ctx.id] || 0, stars); }
      save();
      const gained = notiAcc().filter((a) => !before.includes(a));
      this.mode = null; KB.clearTarget();
      showReward({ stars, gift: first || Math.random() < 0.35, unlock: gained[0] });
    }
  };
  $('#game-exit').addEventListener('click', () => go(Game.ctx && Game.ctx.kind === 'song' ? 'songs' : 'map'));

  async function playSeq(seq, tempo, token, from = 0, to = seq.length, onStep) {
    const beat = 60 / tempo;
    for (let i = from; i < to; i++) {
      if (token !== Game.token) return false;
      const n = seq[i], dur = n.d * beat;
      KB.demo(n.n, dur * 900);
      AU.play(KB.fit(n.n), dur * 0.9, 0.7, 1);
      onStep && onStep(i);
      await sleep(dur * 1000);
    }
    return token === Game.token;
  }

  // ---- Find the colour ----
  const Find = {
    start(L, tok) {
      this.L = L; this.round = 0; this.tok = tok; this.last = null; Game.total = L.rounds;
      $('#stage').innerHTML = '<div class="basket" id="basket"></div><div class="orb-wrap"><div class="orb" id="orb"></div></div>';
      Game.score(0, L.rounds);
      this.next();
    },
    next() {
      const pool = this.L.pool.length > 1 ? this.L.pool.filter((p) => p !== this.last) : this.L.pool;
      this.t = rnd(pool); this.last = this.t; this.busy = false;
      const o = $('#orb'); o.className = 'orb'; o.style.background = M.colorOf(this.t); o.textContent = M.nameHe(this.t);
      setNoti('#guide-noti', M.colorOf(this.t));
      talk((this.round < 2 ? 'find_' : 'now_') + ckey(this.t));
      clearTimeout(this.hintT);
      if (this.L.hint) { KB.clearTarget(); const tok = this.tok; this.hintT = setTimeout(() => tok === Game.token && KB.setTarget(this.t), this.L.hint); }
      else KB.setTarget(this.t);
    },
    hint() { KB.setTarget(this.t); talk('find_' + ckey(this.t)); },
    onNote(m, src) {
      if (this.busy) return;
      if (!matches(m, this.t, src)) return mistake(m, this.t);
      this.busy = true; Game.wrongRow = 0; clearTimeout(this.hintT);
      KB.flash(m, 'good'); KB.clearTarget();
      const o = $('#orb'), r = o.getBoundingClientRect();
      o.classList.add('pop'); Confetti.burst(r.left + r.width / 2, r.top + r.height / 2, 40, M.colorOf(this.t));
      $('#basket').insertAdjacentHTML('beforeend', `<i style="background:${M.colorOf(this.t)}"></i>`);
      praise(false);
      this.round++; Game.score(this.round, this.L.rounds);
      const tok = this.tok;
      setTimeout(() => { if (tok !== Game.token) return; this.round >= this.L.rounds ? Game.finish() : this.next(); }, 1000);
    }
  };

  // ---- Echo ----
  const Echo = {
    start(L, tok) {
      this.L = L; this.round = 0; this.tok = tok; Game.total = L.rounds * L.len;
      $('#stage').innerHTML = `<div class="echo"><div class="bird" id="bird">${Art.icon.bird}</div><div class="bubbles" id="bubbles"></div></div>`;
      Game.score(0, L.rounds);
      this.newRound();
    },
    newRound() {
      const p = this.L.pool, seq = [];
      let i = Math.floor(Math.random() * p.length);
      for (let k = 0; k < this.L.len; k++) { seq.push({ n: p[i], d: 1 }); i = Math.max(0, Math.min(p.length - 1, i + rnd([-1, 1, 1, 0, 2, -2]))); }
      this.seq = seq;
      $('#bubbles').innerHTML = seq.map(() => '<div class="ebub"></div>').join('');
      this.listen();
    },
    async listen() {
      this.phase = 'listen'; this.idx = 0; KB.clearTarget();
      const bs = $$('#bubbles .ebub');
      bs.forEach((b) => { b.classList.remove('lit'); b.style.background = ''; b.style.borderColor = ''; });
      const d = talk('listen');
      await sleep(d * 1000 + 300);
      if (this.tok !== Game.token) return;
      $('#bird').classList.add('sing');
      const ok = await playSeq(this.seq, 80, this.tok, 0, this.seq.length, (i) => {
        bs[i].classList.add('lit'); bs[i].style.background = M.colorOf(this.seq[i].n);
        setTimeout(() => { bs[i].classList.remove('lit'); bs[i].style.background = ''; }, 600);
      });
      $('#bird')?.classList.remove('sing');
      if (!ok) return;
      await sleep(300);
      this.phase = 'play';
      bs.forEach((b, i) => (b.style.borderColor = M.colorOf(this.seq[i].n)));
      talk('echo_you');
      setNoti('#guide-noti', M.colorOf(this.seq[0].n));
      KB.setTarget(this.seq[0].n);
    },
    onNote(m, src) {
      if (this.phase !== 'play') return;
      const t = this.seq[this.idx].n;
      if (!matches(m, t, src)) { mistake(m, t); this.phase = 'wait'; setTimeout(() => this.tok === Game.token && this.listen(), 1800); return; }
      Game.wrongRow = 0; KB.flash(m, 'good');
      const b = $$('#bubbles .ebub')[this.idx]; b.style.background = M.colorOf(t); b.classList.add('lit');
      this.idx++;
      if (this.idx < this.seq.length) { KB.setTarget(this.seq[this.idx].n); setNoti('#guide-noti', M.colorOf(this.seq[this.idx].n)); return; }
      KB.clearTarget(); praise(true); this.round++; Game.score(this.round, this.L.rounds);
      this.phase = 'wait';
      const tok = this.tok;
      setTimeout(() => { if (tok !== Game.token) return; this.round >= this.L.rounds ? Game.finish() : this.newRound(); }, 1400);
    }
  };

  // ---- Song step by step, shown as a bead necklace ----
  const Song = {
    async start(L, tok) {
      const songs = allSongs(), i = songs.findIndex((s) => s.id === L.song);
      this.song = songs[i]; this.tok = tok; this.idx = 0; this.phase = 'demo';
      if (!this.song || !this.song.seq.length) return go('songs');
      Game.total = this.song.seq.length;
      $('#game-title').innerHTML = `<span class="num">${String(i + 1).padStart(3, '0')}</span> ${this.song.title}`;
      $('#stage').innerHTML = '<svg class="necklace" id="necklace"></svg>';
      this.draw();
      const d = talk('watch');
      await sleep(d * 1000 + 300);
      const ok = await playSeq(this.song.seq, this.song.tempo || 100, tok, 0, Math.min(8, this.song.seq.length), (k) => this.draw(k));
      if (ok) this.begin();
    },
    begin() {
      this.phase = 'play'; this.draw();
      const t = this.song.seq[this.idx].n;
      setNoti('#guide-noti', M.colorOf(t));
      talk('yourturn');
      KB.setTarget(t);
    },
    draw(cur = this.idx) {
      const svg = $('#necklace'); if (!svg) return;
      const seq = this.song.seq, W = svg.clientWidth || 800, H = svg.clientHeight || 160;
      // Leave room above the beads for the "play this one" arrow.
      // Arrow needs ~120px above the bead centre (radius + gap + arrow + bounce).
      const gap = 70, y0 = Math.max(H / 2 + 20, Math.min(124, H - 46));
      const pts = seq.map((_, i) => [i * gap, y0 + Math.sin(i * 0.7) * Math.min(16, H / 9)]);
      const shift = W / 2 - cur * gap;
      let h = `<defs><radialGradient id="gloss" cx="35%" cy="30%"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><g style="transform:translateX(${shift}px);transition:transform .45s cubic-bezier(.34,1.56,.64,1)">`;
      h += `<path d="${pts.map((p, i) => (i ? 'L' : 'M') + p.join(' ')).join(' ')}" stroke="#d9b7c6" stroke-width="4" fill="none" stroke-dasharray="1 9" stroke-linecap="round"/>`;
      seq.forEach((n, i) => {
        const [x, y] = pts[i], isCur = i === cur, r = isCur ? 38 : n.d >= 2 ? 26 : 22, c = M.colorOf(n.n), done = i < this.idx && !isCur;
        if (isCur && this.phase === 'play') h += `<circle cx="${x}" cy="${y}" r="${r + 10}" fill="none" stroke="${c}" stroke-width="4"><animate attributeName="r" values="${r + 6};${r + 16};${r + 6}" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".6;0;.6" dur="1.2s" repeatCount="indefinite"/></circle>`;
        if (isCur) h += `<circle cx="${x}" cy="${y}" r="${r + 5}" fill="#fff" opacity=".95"/>`;
        h += `<g opacity="${done ? 0.3 : isCur ? 1 : 0.85}"><circle cx="${x}" cy="${y + 4}" r="${r}" fill="${Art.shade(c, 0.7)}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#gloss)"/>`;
        h += `<text x="${x}" y="${y + (isCur ? 8 : 5)}" text-anchor="middle" font-size="${isCur ? 22 : 13}" font-weight="700" fill="#fff" font-family="Fredoka" style="paint-order:stroke" stroke="${Art.shade(c, 0.6)}" stroke-width="3">${M.nameHe(n.n)}</text>`;
        if (done) h += `<path d="${Art.STAR}" transform="translate(${x + 6} ${y - r - 14}) scale(.7)" fill="#ffc93c" stroke="#f0a020"/>`;
        h += '</g>';
      });
      // Big bouncing arrow above the bead to play now (drawn last so it sits on top).
      if (seq[cur]) {
        const [x, y] = pts[cur], c = M.colorOf(seq[cur].n);
        h += `<g transform="translate(${x} ${y - 38 - 8}) scale(1.25)"><g><animateTransform attributeName="transform" type="translate" values="0 -9;0 0;0 -9" dur=".8s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>
          <path d="M-14 -46 H14 V-22 H26 L0 0 L-26 -22 H-14 Z" fill="${c}" stroke="#fff" stroke-width="4" stroke-linejoin="round" style="filter:drop-shadow(0 3px 3px rgba(42,37,80,.3))"/>
          <path d="M-7 -40 V-26" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/></g></g>`;
      }
      svg.innerHTML = h + '</g>';
      Game.score(this.idx, seq.length);
    },
    async watch() {
      if (this.phase !== 'play') return;
      this.phase = 'demo'; KB.clearTarget();
      const tok = ++Game.token; this.tok = tok;
      const ok = await playSeq(this.song.seq, this.song.tempo || 100, tok, this.idx, this.song.seq.length, (k) => this.draw(k));
      if (ok) this.begin();
    },
    onNote(m, src) {
      if (this.phase !== 'play') return;
      const seq = this.song.seq, t = seq[this.idx].n;
      if (!matches(m, t, src)) return mistake(m, t);
      Game.wrongRow = 0; KB.flash(m, 'good');
      this.idx++;
      if (this.idx % 4 === 0) praise(false); else { Game.combo++; $('#combo').textContent = Game.combo >= 3 ? Game.combo + ' ברצף!' : ''; }
      if (this.idx >= seq.length) { this.phase = 'done'; KB.clearTarget(); this.draw(seq.length - 1); Confetti.rain(80); setTimeout(() => Game.finish(), 700); return; }
      const nt = seq[this.idx].n;
      this.draw(); KB.setTarget(nt); setNoti('#guide-noti', M.colorOf(nt));
      // Name the next colour now and then, without flooding the microphone.
      if (this.idx % 4 === 0 && Input.midiOk) V.say('now_' + ckey(nt));
    }
  };

  // ================= Reward =================
  let rewardNext = null;
  function showReward({ stars, gift, title, unlock }) {
    $('#reward').classList.remove('hidden');
    $('#reward-title').textContent = title || ('כל הכבוד' + (S.name ? ', ' + S.name : '') + '!');
    $('#reward-stars').innerHTML = stars ? [0, 1, 2].map((i) => Art.star(i < stars)).join('') : '';
    const acc = unlock && Art.notiAcc.find(([, a]) => a === unlock);
    $('#reward-sub').textContent = acc ? `נוטי קיבל ${acc[2]} חדש!` : stars && Game.mistakes === 0 ? 'בלי אף טעות!' : stars ? 'כל כוכב ממלא את הצנצנת' : '';
    $('#reward-gift').innerHTML = Art.icon.gift;
    $('#reward-gift').classList.toggle('hidden', !gift);
    $('#reward-sticker').classList.add('hidden');
    $('#reward-actions').classList.toggle('hidden', !!gift);
    $('#reward-again').classList.toggle('hidden', !stars);
    AU.sfx('fanfare'); Confetti.rain(160);
    $$('#reward-stars svg').forEach((s, i) => setTimeout(() => { s.classList.add('show'); if (i < stars) AU.sfx('star'); }, 500 + i * 420));
    setTimeout(() => {
      const d = stars ? V.say('stars' + stars) : V.say('daily');
      if (gift && stars) setTimeout(() => V.say('gift'), d * 1000 + 300);
    }, stars ? 1900 : 400);
  }
  $('#reward-gift').addEventListener('click', () => {
    const missing = Art.STICKERS.filter((s) => !S.stickers.includes(s.id));
    let s;
    if (missing.length) {
      const golds = missing.filter((x) => x.gold), normals = missing.filter((x) => !x.gold);
      s = golds.length && (Math.random() < 0.12 || !normals.length) ? rnd(golds) : rnd(normals);
      S.stickers.push(s.id); save();
    } else s = rnd(Art.STICKERS);
    $('#reward-gift').classList.add('hidden');
    const r = $('#reward-sticker'); r.classList.remove('hidden');
    r.innerHTML = Art.sticker(s, 180) + `<span>${s.name}${s.gold ? ' · מדבקת זהב!' : ''}</span>`;
    AU.sfx('gift'); Confetti.burst(innerWidth / 2, innerHeight / 2, 90);
    V.say('sticker');
    $('#reward-actions').classList.remove('hidden');
  });
  $('#reward-again').addEventListener('click', () => { $('#reward').classList.add('hidden'); const c = Game.ctx; c.kind === 'level' ? Game.startLevel(c.idx) : Game.startSong(c.id); });
  $('#reward-next').addEventListener('click', () => {
    $('#reward').classList.add('hidden');
    if (rewardNext) { const f = rewardNext; rewardNext = null; return f(); }
    if (checkBreak()) return;
    const c = Game.ctx;
    if (c && c.kind === 'level' && c.idx + 1 < LEVELS.length) Game.startLevel(c.idx + 1);
    else go(c && c.kind === 'song' ? 'songs' : 'map');
  });
  function checkBreak() {
    const lim = +S.settings.timeLimit;
    if (lim > 0 && Date.now() - sessionStart > lim * 60000) {
      go('home'); $('#break').classList.remove('hidden');
      $('#break-noti').innerHTML = Art.noti('#8e7cf0', notiAcc(), 'sleep'); V.say('break');
      return true;
    }
    return false;
  }

  // ================= Home / Map / Album =================
  function renderHome() {
    const ts = totalStars(), acc = notiAcc(ts);
    setNoti('#home-noti', '#ff4d5e');
    const next = Art.notiAcc.find(([n]) => ts < n), prev = [...Art.notiAcc].reverse().find(([n]) => ts >= n);
    const from = prev ? prev[0] : 0, fill = next ? (ts - from) / (next[0] - from) : 1;
    $('#jar').innerHTML = Art.jar(fill);
    $('#jar-count').textContent = ts;
    $('#home-level').textContent = `שלב ${unlocked() + 1} מתוך ${LEVELS.length}`;
    $('#home-songs').textContent = `${allSongs().length} שירים`;
    $('#home-bubble').textContent = 'היי' + (S.name ? ' ' + S.name : '') + '! ' + (next ? `עוד ${next[0] - ts} כוכבים ואקבל ${next[2]}!` : 'יש לי את כל הבגדים!');
    const g = $('#daily-gift'); g.innerHTML = Art.icon.gift; g.classList.toggle('hidden', S.lastGift === today());
    updateStatus();
  }
  $('#home-noti').addEventListener('click', () => { AU.sfx('pop'); V.say(rnd(['jar', 'hello', 'p3'])); const n = $('#home-noti'); n.classList.remove('jump'); void n.offsetWidth; n.classList.add('jump'); });
  $('#daily-gift').addEventListener('click', () => { S.lastGift = today(); save(); rewardNext = () => go('home'); showReward({ stars: 0, gift: true, title: 'מתנה של היום!' }); });

  function renderMap() {
    const u = unlocked(), n = LEVELS.length, gap = 150;
    const box = $('#map'), h = box.clientHeight || 300, w = n * gap + 160;
    $$('.stars-total').forEach((e) => (e.textContent = totalStars()));
    const pts = LEVELS.map((_, i) => [w - 100 - i * gap, h * 0.55 + Math.sin(i * 0.9) * h * 0.2]);
    box.innerHTML = `<div class="map-inner" style="width:${w}px"><svg width="${w}" height="${h}"><path d="${pts.map((p, i) => (i ? 'L' : 'M') + p.join(' ')).join(' ')}" stroke="#fff" stroke-width="16" fill="none" stroke-linecap="round" stroke-dasharray="2 26"/></svg>${
      LEVELS.map((L, i) => { const st = S.levelStars[i] || 0;
        return `<button class="node${i > u ? ' locked' : ''}${i === u ? ' current' : ''}" data-i="${i}" style="left:${pts[i][0]}px;top:${pts[i][1]}px">${Art.levelGlyph(L)}<span class="num">${i + 1}</span><span class="st">${st ? [0, 1, 2].map((k) => Art.star(k < st)).join('') : ''}</span></button>`; }).join('')}</div>`;
    box.scrollLeft = Math.max(0, pts[u][0] - box.clientWidth / 2);
    $$('#map .node').forEach((b) => b.addEventListener('click', () => { const i = +b.dataset.i; if (i > u) return AU.sfx('wrong'); AU.sfx('pop'); Game.startLevel(i); }));
  }

  function renderAlbum() {
    $('#album-count').textContent = `${S.stickers.length} / ${Art.STICKERS.length}`;
    $('#album').innerHTML = Art.STICKERS.map((s) => { const have = S.stickers.includes(s.id); return `<div class="slot${have ? '' : ' miss'}">${Art.sticker(s, 86)}<span>${s.name}</span></div>`; }).join('');
  }

  // ================= Songs =================
  const beadsMini = (seq) => `<svg class="beads" viewBox="0 0 110 40">${seq.slice(0, 4).map((n, i) => `<circle cx="${16 + i * 26}" cy="${24 - (i % 2) * 8}" r="11" fill="${M.colorOf(n.n)}" stroke="#fff" stroke-width="2.5"/>`).join('')}</svg>`;
  const Songs = {
    render() {
      const songs = allSongs();
      P.selSong = Math.min(P.selSong, songs.length);
      $('#song-list').innerHTML = songs.map((s, i) => { const st = S.songStars[s.id] || 0;
        return `<button class="song" data-n="${i + 1}">${s.builtIn ? '' : `<span class="del" data-del="${s.id}">✕</span>`}<span class="num">${String(i + 1).padStart(3, '0')}</span>${beadsMini(s.seq)}<span>${s.title}</span><span class="st">${[0, 1, 2].map((k) => Art.star(k < st)).join('')}</span></button>`; }).join('') +
        '<button class="song add" id="add-song"><b>+</b>שיר חדש</button>';
      $$('#song-list .song[data-n]').forEach((c) => c.addEventListener('click', (e) => {
        const del = e.target.dataset.del;
        if (del) { if (confirm('למחוק את השיר?')) { S.custom = S.custom.filter((x) => x.id !== del); save(); this.render(); } return; }
        AU.sfx('pop'); P.selSong = +c.dataset.n; Game.startSong(allSongs()[P.selSong - 1].id);
      }));
      $('#add-song').addEventListener('click', () => Editor.open());
      this.select(true);
    },
    select(quiet) {
      $$('#song-list .song[data-n]').forEach((c) => c.classList.toggle('sel', +c.dataset.n === P.selSong));
      $(`#song-list .song[data-n="${P.selSong}"]`)?.scrollIntoView({ behavior: quiet ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
      panelSync();
    }
  };

  // ================= Free organ =================
  const Free = {
    songTok: 0,
    enter() { AU.init(); setNoti('#free-noti', '#38c6f4'); this.render(); },
    leave() { this.songTok++; AU.stopStyle(); AU.setChordRoot(null); P.playing = false; },
    render() {
      const m = P.mode;
      let name, en, label;
      if (m === 'sound') { const c = AU.soundCat(P.sound); name = c.he; en = c.name; label = 'SOUND · צליל ' + P.sound; AU.soundNum = P.sound; }
      else if (m === 'style') { const c = AU.styleCat(P.style); name = 'קצב ' + c.he; en = `${c.name} · ${AU.style.tempo} BPM`; label = 'STYLE · קצב ' + P.style; }
      else { const s = this.song(); name = s.title; en = 'SONG ' + String(P.song).padStart(3, '0'); label = 'SONG · שיר ' + P.song; }
      $('#free-mode').textContent = label; $('#free-name').textContent = name; $('#free-en').textContent = en;
      $('#free-flags').innerHTML = [[P.playing, '▶ PLAY'], [P.chord, 'CHORD'], [P.ab, P.ab ? 'B' : 'A'], [P.sustain, 'SUSTAIN'], [P.metro, 'METRONOME']].filter(([on]) => on).map(([, t]) => `<span>${t}</span>`).join('');
      $('#free-noti').classList.toggle('dance', P.playing);
    },
    song() { const s = allSongs(); return s[(P.song - 1) % s.length]; },
    async play() {
      if (P.mode === 'song') {
        if (P.playing) { this.songTok++; P.playing = false; return this.render(); }
        P.playing = true; this.render();
        const tok = ++this.songTok, s = this.song(), beat = 60 / (s.tempo || 100);
        for (const n of s.seq) {
          if (tok !== this.songTok) return;
          KB.demo(n.n, n.d * beat * 900); AU.play(KB.fit(n.n), n.d * beat * 0.9, 0.7, P.sound);
          await sleep(n.d * beat * 1000);
        }
        if (tok === this.songTok) { P.playing = false; this.render(); }
        return;
      }
      P.playing = !P.playing; AU.setStyle(P.style);
      P.playing ? AU.startStyle() : AU.stopStyle();
      this.render(); panelSync();
    },
    noteOn(m) {
      if (P.chord && P.playing && m < KB.low + 12) AU.setChordRoot(48 + M.pc(m));
      const k = KB.keys[KB.fit(m)]; if (!k) return;
      const r = k.getBoundingClientRect(), c = M.colorOf(m);
      const n = document.createElement('div'); n.className = 'fnote';
      n.innerHTML = `<svg viewBox="0 0 40 50"><path d="M24 2v32a9 7 -20 1 1 -4 -5V2z" fill="${c}" stroke="#fff" stroke-width="2"/></svg>`;
      n.style.left = r.left + r.width / 2 - 15 + 'px'; n.style.top = r.top - 40 + 'px';
      document.body.appendChild(n);
      requestAnimationFrame(() => { n.style.transform = `translate(${(Math.random() - 0.5) * 90}px, -${150 + Math.random() * 120}px) rotate(${(Math.random() - 0.5) * 60}deg)`; n.style.opacity = '0'; });
      setTimeout(() => n.remove(), 1500);
    }
  };

  // ================= Song editor =================
  const Editor = {
    notes: [], rec: false, lastT: 0, playTok: 0,
    open() { this.notes = []; $('#ed-title').value = ''; $('#ed-text').value = ''; this.rec = false; this.sync(); go('editor'); },
    leave() { this.rec = false; this.playTok++; $('#ed-rec').classList.remove('on'); $('#ed-rec').textContent = '● הקלטה'; },
    onNote(m) {
      if (!this.rec) return;
      const now = performance.now(), beat = 600;
      if (this.notes.length) { const last = this.notes[this.notes.length - 1]; last.d = Math.max(0.5, Math.min(4, Math.round((now - this.lastT) / beat * 2) / 2)); }
      this.lastT = now; this.notes.push({ n: m, d: 1 }); this.sync();
    },
    sync(fromText) {
      if (!fromText) $('#ed-text').value = M.stringify(this.notes);
      $('#ed-beads').innerHTML = this.notes.map((n, i) => `<circle cx="${22 + i * 30}" cy="30" r="${n.d >= 2 ? 14 : 11}" fill="${M.colorOf(n.n)}" stroke="#fff" stroke-width="2.5"/>`).join('');
      $('#ed-beads').setAttribute('viewBox', `0 0 ${Math.max(1000, this.notes.length * 30 + 40)} 60`);
    }
  };
  $('#ed-text').addEventListener('input', () => { Editor.notes = M.parse($('#ed-text').value); Editor.sync(true); });
  $('#ed-rec').addEventListener('click', () => { Editor.rec = !Editor.rec; $('#ed-rec').classList.toggle('on', Editor.rec); $('#ed-rec').textContent = Editor.rec ? '■ עצור' : '● הקלטה'; });
  $('#ed-undo').addEventListener('click', () => { Editor.notes.pop(); Editor.sync(); });
  $('#ed-clear').addEventListener('click', () => { Editor.notes = []; Editor.sync(); });
  $('#ed-play').addEventListener('click', async () => {
    const tok = ++Editor.playTok;
    for (const n of Editor.notes) { if (tok !== Editor.playTok) return; KB.demo(n.n, n.d * 540); AU.play(KB.fit(n.n), n.d * 0.54, 0.7, 1); await sleep(n.d * 600); }
  });
  $('#ed-save').addEventListener('click', () => {
    if (!Editor.notes.length) return AU.sfx('wrong');
    S.custom.push({ id: 'c' + Date.now(), title: $('#ed-title').value.trim() || 'השיר שלי', tempo: 100, notes: M.stringify(Editor.notes) });
    save(); AU.sfx('fanfare'); P.selSong = allSongs().length; go('songs');
  });
  $('#ed-back').addEventListener('click', () => go('songs'));

  // ================= Parent area =================
  let meterTimer;
  function openParent() {
    $('#break').classList.add('hidden');
    $('#parent').classList.remove('hidden'); fillParent(); renderRecList();
    meterTimer = setInterval(() => {
      $('#p-meter').style.width = Math.min(100, Input.level * 800) + '%';
      $('#p-status').textContent = `כבל: ${Input.midiStatus} · מיקרופון: ${Input.micOk ? 'פועל' : 'כבוי'}` + (calibrating ? ' · לוחצים עכשיו על הקליד הכי שמאלי באורגן' : '');
    }, 80);
  }
  function fillParent() {
    const st = S.settings;
    $('#p-name').value = S.name; $('#p-gender').value = S.gender; $('#p-time').value = st.timeLimit;
    $('#p-input').value = st.input; $('#p-sens').value = st.micSens; $('#p-strict').checked = st.strict; $('#p-touch').checked = st.touchPlay;
    $('#p-voice').checked = st.voice; $('#p-pack').value = st.voicePack; $('#p-vol').value = st.volume;
    $('#p-lowkey').textContent = M.nameEn(st.lowKey) + ' (MIDI ' + st.lowKey + ')';
  }
  function renderRecList() {
    $('#rec-list').innerHTML = V.keys().map((k) => `<div class="rec-row${V.hasRec(k) ? ' mine' : ''}" data-k="${k}"><span>${V.text(k)}</span><button class="r" title="הקלטה">●</button><button class="p" title="השמעה">▶</button>${V.hasRec(k) ? '<button class="x" title="מחיקת ההקלטה">✕</button>' : ''}</div>`).join('');
  }
  let recKey = null;
  $('#rec-list').addEventListener('click', async (e) => {
    const row = e.target.closest('.rec-row'); if (!row) return;
    const k = row.dataset.k, btn = e.target;
    if (btn.classList.contains('p')) V.say(k);
    if (btn.classList.contains('x')) { await V.deleteRec(k); renderRecList(); }
    if (btn.classList.contains('r')) {
      if (recKey === k) { recKey = null; btn.classList.remove('on'); await V.stopRec(k); renderRecList(); V.say(k); }
      else if (!recKey) { try { await V.startRec(); recKey = k; btn.classList.add('on'); } catch (err) { alert('אין גישה למיקרופון'); } }
    }
  });
  $('#p-close').addEventListener('click', () => { $('#parent').classList.add('hidden'); clearInterval(meterTimer); calibrating = false; if (current === 'home') renderHome(); });
  $('#p-name').addEventListener('input', (e) => { S.name = e.target.value.trim(); save(); });
  $('#p-gender').addEventListener('change', async (e) => { S.gender = e.target.value; save(); await V.init(S.gender, S.settings.voicePack); renderRecList(); });
  $('#p-pack').addEventListener('change', async (e) => { S.settings.voicePack = e.target.value; save(); await V.init(S.gender, S.settings.voicePack); V.say('hello'); });
  $('#p-time').addEventListener('change', (e) => { S.settings.timeLimit = Math.max(0, +e.target.value || 0); save(); });
  $('#p-input').addEventListener('change', (e) => { S.settings.input = e.target.value; save(); startInputs(); });
  $('#p-sens').addEventListener('input', (e) => { S.settings.micSens = +e.target.value; Input.micSensitivity = +e.target.value; save(); });
  $('#p-strict').addEventListener('change', (e) => { S.settings.strict = e.target.checked; save(); });
  $('#p-touch').addEventListener('change', (e) => { S.settings.touchPlay = e.target.checked; save(); updateStatus(); });
  $('#p-voice').addEventListener('change', (e) => { S.settings.voice = e.target.checked; V.on = e.target.checked; save(); });
  $('#p-vol').addEventListener('input', (e) => { S.settings.volume = +e.target.value; AU.setVolume(+e.target.value); panelSync(); save(); });
  $('#p-calib').addEventListener('click', () => { calibrating = true; });
  $('#p-songs').addEventListener('click', () => { $('#p-close').click(); Editor.open(); });
  $('#p-unlock').addEventListener('click', () => { LEVELS.forEach((_, i) => { if (!S.levelStars[i]) S.levelStars[i] = 1; }); save(); AU.sfx('good'); });
  $('#p-reset').addEventListener('click', () => {
    if (!confirm('לאפס את כל ההתקדמות, הכוכבים והמדבקות? (שירים והקלטות קול יישארו)')) return;
    S.levelStars = {}; S.songStars = {}; S.stickers = []; S.lastGift = ''; save(); AU.sfx('pop');
  });

  // ================= Confetti =================
  const Confetti = (() => {
    const cv = $('#confetti'), cx = cv.getContext('2d'); let parts = [], running = false;
    const COLS = Object.values(M.COLORS);
    const size = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    addEventListener('resize', size); size();
    const star = new Path2D(Art.STAR);
    function loop() {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.min(1, p.life / 30); cx.fillStyle = p.c;
        if (p.star) { cx.scale(p.s / 14, p.s / 14); cx.translate(-12, -12); cx.fillStyle = '#ffc93c'; cx.fill(star); }
        else if (p.round) { cx.beginPath(); cx.arc(0, 0, p.s / 2, 0, 7); cx.fill(); }
        else cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        cx.restore();
      }
      if (parts.length) requestAnimationFrame(loop); else running = false;
    }
    const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
    const mk = (o) => Object.assign({ r: 0, vr: Math.random() * 0.3, s: 7 + Math.random() * 9, star: Math.random() < 0.15, round: Math.random() < 0.3 }, o);
    return {
      burst(x, y, n, color) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 3 + Math.random() * 7; parts.push(mk({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, c: color && Math.random() < 0.6 ? color : rnd(COLS), life: 60 + Math.random() * 40 })); } kick(); },
      rain(n) { for (let i = 0; i < n; i++) parts.push(mk({ x: Math.random() * innerWidth, y: -20 - Math.random() * 300, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, c: rnd(COLS), life: 170 })); kick(); }
    };
  })();

  // ================= Boot =================
  async function startInputs() {
    const mode = S.settings.input;
    Input.micSensitivity = S.settings.micSens;
    if (mode === 'midi' || mode === 'auto') await Input.startMidi();
    if (mode === 'mic') await Input.startMic();
    if (mode === 'auto') { await sleep(900); if (!Input.midiOk) await Input.startMic(); }
    if (mode === 'midi') Input.stopMic();
    updateStatus();
  }
  let started = false;
  async function start() {
    if (started) return; started = true;
    AU.init(); AU.setVolume(S.settings.volume); V.on = S.settings.voice;
    go('home');
    await V.init(S.gender, S.settings.voicePack);
    V.say('hello');
    startInputs();
  }
  panel = Art.buildPanel($('#panel'), onPanel);
  KB.build();
  $('#splash-noti').innerHTML = Art.noti('#ff4d5e', notiAcc());
  $('#btn-start').addEventListener('click', start);
  panelSync();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && started) AU.init(); });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();

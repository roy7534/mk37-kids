// Song library + note helpers. Classic script (no modules) so it also runs from file:// in the iOS wrapper.
(function () {
  const NAMES_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NAMES_HE = ['דו', 'דו#', 'רה', 'רה#', 'מי', 'פה', 'פה#', 'סול', 'סול#', 'לה', 'לה#', 'סי'];
  // Sticker colours (one per white key). Black keys get the colour of the note below, darker.
  const COLORS = {
    0: '#ff4d5e', // C  red
    2: '#ff9a2e', // D  orange
    4: '#ffd23f', // E  yellow
    5: '#3ddc84', // F  green
    7: '#38c6f4', // G  light blue
    9: '#5b6cff', // A  blue
    11: '#b65cff' // B  purple
  };
  const COLOR_NAMES = { 0: 'אדום', 2: 'כתום', 4: 'צהוב', 5: 'ירוק', 7: 'תכלת', 9: 'כחול', 11: 'סגול' };
  const ANIMALS = { 0: '🐞', 2: '🦊', 4: '🐥', 5: '🐸', 7: '🐳', 9: '🦋', 11: '🦄' };

  const pc = (m) => ((m % 12) + 12) % 12;
  const isBlack = (m) => [1, 3, 6, 8, 10].includes(pc(m));
  const colorOf = (m) => COLORS[pc(m)] || COLORS[pc(m) - 1];
  const nameHe = (m) => NAMES_HE[pc(m)];
  const nameEn = (m) => NAMES_EN[pc(m)] + (Math.floor(m / 12) - 1);
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // Parse "E4 D4 C4/2 G#4/0.5" -> [{n:64,d:1},...]. Bare letters default to octave 4.
  const HE_MAP = { 'דו': 'C', 'רה': 'D', 'מי': 'E', 'פה': 'F', 'פא': 'F', 'סול': 'G', 'לה': 'A', 'סי': 'B' };
  function parse(str) {
    const out = [];
    for (let tok of str.trim().split(/[\s,|]+/)) {
      if (!tok) continue;
      let dur = 1;
      const slash = tok.indexOf('/');
      if (slash > 0) { dur = parseFloat(tok.slice(slash + 1)) || 1; tok = tok.slice(0, slash); }
      // Hebrew solfege support: "דו", "רה5", "סול#"
      for (const he in HE_MAP) if (tok.startsWith(he)) { tok = HE_MAP[he] + tok.slice(he.length); break; }
      const m = /^([A-Ga-g])([#b]?)(\d?)$/.exec(tok);
      if (!m) continue;
      let n = NAMES_EN.indexOf(m[1].toUpperCase());
      if (m[2] === '#') n += 1;
      if (m[2] === 'b') n -= 1;
      const oct = m[3] ? parseInt(m[3], 10) : 4;
      out.push({ n: (oct + 1) * 12 + n, d: dur });
    }
    return out;
  }
  function stringify(notes) {
    return notes.map((x) => nameEn(x.n) + (x.d !== 1 ? '/' + +x.d.toFixed(2) : '')).join(' ');
  }

  // Public-domain / traditional melodies, kept mostly within C4..C5 white keys.
  const SONGS = [
    { id: 'mary', title: 'למרי היה כבש קטן', emoji: '🐑', tempo: 100,
      notes: 'E4 D4 C4 D4 E4 E4 E4/2 D4 D4 D4/2 E4 G4 G4/2 E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4/4' },
    { id: 'hotcross', title: 'לחמניות חמות', emoji: '🥐', tempo: 96,
      notes: 'E4 D4 C4/2 E4 D4 C4/2 C4/0.5 C4/0.5 C4/0.5 C4/0.5 D4/0.5 D4/0.5 D4/0.5 D4/0.5 E4 D4 C4/2' },
    { id: 'twinkle', title: 'נצנץ נצנץ כוכב קטן', emoji: '⭐', tempo: 100,
      notes: 'C4 C4 G4 G4 A4 A4 G4/2 F4 F4 E4 E4 D4 D4 C4/2 G4 G4 F4 F4 E4 E4 D4/2 G4 G4 F4 F4 E4 E4 D4/2 C4 C4 G4 G4 A4 A4 G4/2 F4 F4 E4 E4 D4 D4 C4/2' },
    { id: 'yonatan', title: 'יונתן הקטן', emoji: '🌳', tempo: 110,
      notes: 'G4 E4 E4/2 F4 D4 D4/2 C4 D4 E4 F4 G4 G4 G4/2 G4 E4 E4/2 F4 D4 D4/2 C4 E4 G4 G4 C4/4' },
    { id: 'ode', title: 'שיר השמחה', emoji: '🎉', tempo: 104,
      notes: 'E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4/1.5 D4/0.5 D4/2 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4/1.5 C4/0.5 C4/2' },
    { id: 'jacob', title: 'האם אתה ישן, אחי יעקב', emoji: '🔔', tempo: 108,
      notes: 'C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4/2 E4 F4 G4/2 G4/0.5 A4/0.5 G4/0.5 F4/0.5 E4 C4 G4/0.5 A4/0.5 G4/0.5 F4/0.5 E4 C4 C4 G3 C4/2 C4 G3 C4/2' },
    { id: 'boat', title: 'שוטה שוטה סירה', emoji: '⛵', tempo: 100,
      notes: 'C4/1.5 C4/1.5 C4 D4/0.5 E4/1.5 E4 D4/0.5 E4 F4/0.5 G4/3 C5/0.5 C5/0.5 C5/0.5 G4/0.5 G4/0.5 G4/0.5 E4/0.5 E4/0.5 E4/0.5 C4/0.5 C4/0.5 C4/0.5 G4 F4/0.5 E4 D4/0.5 C4/3' },
    { id: 'farm', title: 'לדוד משה הייתה חווה', emoji: '🐮', tempo: 112,
      notes: 'G4 G4 G4 D4 E4 E4 D4/2 B4 B4 A4 A4 G4/3 D4 G4 G4 G4 D4 E4 E4 D4/2 B4 B4 A4 A4 G4/3' },
    { id: 'london', title: 'גשר לונדון', emoji: '🌉', tempo: 108,
      notes: 'G4/1.5 A4/0.5 G4 F4 E4 F4 G4/2 D4 E4 F4/2 E4 F4 G4/2 G4/1.5 A4/0.5 G4 F4 E4 F4 G4/2 D4/2 G4 E4 C4/2' },
    { id: 'bells', title: 'פעמוני חג', emoji: '🛷', tempo: 120,
      notes: 'E4 E4 E4/2 E4 E4 E4/2 E4 G4 C4/1.5 D4/0.5 E4/4 F4 F4 F4/1.5 F4/0.5 F4 E4 E4 E4/0.5 E4/0.5 E4 D4 D4 E4 D4/2 G4/2' },
    { id: 'birthday', title: 'יום הולדת שמח', emoji: '🎂', tempo: 96,
      notes: 'G4/0.75 G4/0.25 A4 G4 C5 B4/2 G4/0.75 G4/0.25 A4 G4 D5 C5/2 G4/0.75 G4/0.25 G5 E5 C5 B4 A4/2 F5/0.75 F5/0.25 E5 C5 D5 C5/3' },
    { id: 'lullaby', title: 'שיר ערש', emoji: '🌙', tempo: 84,
      notes: 'E4/0.5 E4/0.5 G4/2 E4/0.5 E4/0.5 G4/2 E4/0.5 G4/0.5 C5 B4/1.5 A4/0.5 A4 G4/2 D4/0.5 E4/0.5 F4 D4 D4/0.5 E4/0.5 F4/2 D4/0.5 F4/0.5 B4/0.5 A4/0.5 G4 B4 C5/3' }
  ];
  SONGS.forEach((s) => { s.seq = parse(s.notes); s.builtIn = true; });

  window.Music = { NAMES_EN, NAMES_HE, COLORS, COLOR_NAMES, ANIMALS, pc, isBlack, colorOf, nameHe, nameEn, freq, parse, stringify, SONGS };
})();

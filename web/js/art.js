// Hand-made SVG art: Noti mascot, stars, sticker creatures, icons, and the MK37 control panel.
(function () {
  const Art = {};
  const COLORS = Music.COLORS;
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
    return `rgb(${c(16)},${c(8)},${c(0)})`;
  }
  Art.shade = shade;
  Art.STAR = 'M12 1.8l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 16.6 6.1 19.9l1.3-6.6L2.5 8.7l6.6-.8z';
  Art.star = (lit = true) => `<svg viewBox="0 0 24 24"><path d="${Art.STAR}" fill="${lit ? '#ffc93c' : '#e7dbe3'}" stroke="${lit ? '#f0a020' : '#d6c6d0'}" stroke-width="1.4" stroke-linejoin="round"/>${lit ? '<path d="M8.6 8.8l2.3-.3 1-2.2" stroke="#fff" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".8"/>' : ''}</svg>`;

  // ---------- Noti: an eighth-note character. acc = list of unlocked accessories ----------
  Art.notiAcc = [[5, 'bow', 'פפיון'], [15, 'phones', 'אוזניות'], [30, 'crown', 'כתר'], [50, 'glow', 'הילה זוהרת'], [80, 'cape', 'גלימה']];
  Art.noti = function (color = '#ff4d5e', acc = [], mood = 'happy') {
    const d = shade(color, 0.72);
    const has = (a) => acc.includes(a);
    let s = '';
    if (has('glow')) s += `<circle cx="80" cy="110" r="96" fill="url(#notiGlow)"/><defs><radialGradient id="notiGlow"><stop offset=".55" stop-color="#fff6a8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6a8" stop-opacity="0"/></radialGradient></defs>`;
    if (has('cape')) s += `<path d="M22 150 C10 186 40 200 70 196 C100 200 128 188 122 150 Z" fill="#e24a7b"/><path d="M22 150 C40 160 100 160 122 150" stroke="#ffc93c" stroke-width="4" fill="none"/>`;
    s += `<path d="M118 16 C152 26 162 58 142 92 C150 64 138 48 118 46 Z" fill="${d}"/>
      <rect x="110" y="14" width="13" height="118" rx="6.5" fill="${d}"/>
      <ellipse cx="88" cy="190" rx="14" ry="7" fill="${d}"/><ellipse cx="46" cy="192" rx="14" ry="7" fill="${d}"/>
      <ellipse cx="70" cy="142" rx="62" ry="47" transform="rotate(-18 70 142)" fill="${color}"/>
      <ellipse cx="46" cy="114" rx="20" ry="9" transform="rotate(-24 46 114)" fill="#fff" opacity=".35"/>`;
    if (mood === 'sleep') s += `<path d="M40 142 q10 8 20 0 M78 130 q10 8 20 0" stroke="#2a2550" stroke-width="4" fill="none" stroke-linecap="round"/><text x="120" y="110" font-size="26" font-family="Fredoka" font-weight="700" fill="#8e7cf0">z</text><text x="136" y="88" font-size="18" font-family="Fredoka" font-weight="700" fill="#8e7cf0">z</text>`;
    else s += `<ellipse cx="50" cy="140" rx="13" ry="15" fill="#fff"/><ellipse cx="88" cy="128" rx="13" ry="15" fill="#fff"/>
      <circle cx="53" cy="143" r="7.5" fill="#2a2550"/><circle cx="91" cy="131" r="7.5" fill="#2a2550"/>
      <circle cx="56" cy="139" r="2.6" fill="#fff"/><circle cx="94" cy="127" r="2.6" fill="#fff"/>`;
    s += `<ellipse cx="34" cy="160" rx="9" ry="5" fill="#ff8fab" opacity=".6"/><ellipse cx="106" cy="146" rx="9" ry="5" fill="#ff8fab" opacity=".6"/>`;
    s += mood === 'wow' ? `<ellipse cx="74" cy="160" rx="9" ry="11" fill="#2a2550"/><ellipse cx="74" cy="164" rx="5" ry="4" fill="#ff8fab"/>`
      : `<path d="M60 160 Q74 172 88 154" stroke="#2a2550" stroke-width="4.5" stroke-linecap="round" fill="none"/>`;
    if (has('bow')) s += `<g transform="translate(118 50) rotate(15)"><path d="M0 0 L-18 -12 L-18 12 Z M0 0 L18 -12 L18 12 Z" fill="#ff7eb6" stroke="#e24a7b" stroke-width="2" stroke-linejoin="round"/><circle r="6" fill="#e24a7b"/></g>`;
    if (has('phones')) s += `<path d="M18 128 C18 70 122 58 128 116" stroke="#2a2550" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="6" y="122" width="20" height="30" rx="9" fill="#38c6f4" stroke="#2a2550" stroke-width="3"/><rect x="118" y="108" width="20" height="30" rx="9" fill="#38c6f4" stroke="#2a2550" stroke-width="3"/>`;
    if (has('crown')) s += `<g transform="translate(36 72) rotate(-14)"><path d="M0 30 L4 4 L18 18 L30 0 L42 18 L56 4 L60 30 Z" fill="#ffc93c" stroke="#e09612" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="20" r="4" fill="#e24a7b"/></g>`;
    return `<svg viewBox="-20 -10 200 220" class="noti-svg">${s}</svg>`;
  };

  // ---------- Sticker creatures (parametric, original) ----------
  const SHAPES = {
    blob: 'M100 30 C150 30 172 70 170 110 C168 155 135 175 100 175 C60 175 30 152 30 108 C30 66 55 30 100 30Z',
    drop: 'M100 22 C125 60 168 90 168 128 C168 160 140 180 100 180 C60 180 32 160 32 128 C32 90 75 60 100 22Z',
    cloud: 'M52 160 C24 160 18 120 44 110 C36 76 76 60 96 78 C108 44 160 50 158 92 C184 96 186 160 150 160Z',
    square: 'M50 40 H150 Q170 40 170 60 V158 Q170 176 150 176 H50 Q30 176 30 158 V60 Q30 40 50 40Z',
    heart: 'M100 176 C40 136 22 106 30 76 C38 46 80 38 100 70 C120 38 162 46 170 76 C178 106 160 136 100 176Z',
    tall: 'M100 22 C138 22 152 60 152 104 C152 150 132 180 100 180 C68 180 48 150 48 104 C48 60 62 22 100 22Z'
  };
  const ACCS = {
    none: '',
    ears: (c) => `<path d="M48 58 L56 10 L90 40Z M152 58 L144 10 L110 40Z" fill="${c}"/><path d="M58 46 L62 24 L78 40Z M142 46 L138 24 L122 40Z" fill="#ffb3c8"/>`,
    horn: () => `<path d="M90 36 L100 -6 L110 36Z" fill="#ffd84d" stroke="#e8a21a" stroke-width="3" stroke-linejoin="round"/><path d="M93 26 L107 22 M95 14 L105 11" stroke="#e8a21a" stroke-width="3"/>`,
    antenna: () => `<path d="M100 34 V6" stroke="#2a2550" stroke-width="5" stroke-linecap="round"/><path d="M100 6 C116 8 120 20 112 30 C116 20 110 14 100 14Z" fill="#2a2550"/><ellipse cx="94" cy="10" rx="9" ry="7" transform="rotate(-20 94 10)" fill="#2a2550"/>`,
    leaf: () => `<path d="M100 34 C96 18 104 8 100 0" stroke="#3a8a4a" stroke-width="5" fill="none"/><path d="M100 14 C120 0 140 8 142 14 C130 26 112 26 100 14Z" fill="#3ddc84"/>`,
    bow: () => `<g transform="translate(140 52) rotate(20)"><path d="M0 0 L-20 -13 L-20 13Z M0 0 L20 -13 L20 13Z" fill="#ff7eb6" stroke="#e24a7b" stroke-width="2"/><circle r="6" fill="#e24a7b"/></g>`,
    crown: () => `<g transform="translate(70 4)"><path d="M0 34 L4 6 L18 22 L30 2 L42 22 L56 6 L60 34Z" fill="#ffc93c" stroke="#e09612" stroke-width="3" stroke-linejoin="round"/></g>`,
    phones: () => `<path d="M34 104 C30 40 170 40 166 104" stroke="#2a2550" stroke-width="8" fill="none"/><rect x="20" y="96" width="24" height="38" rx="10" fill="#ff9a2e" stroke="#2a2550" stroke-width="3"/><rect x="156" y="96" width="24" height="38" rx="10" fill="#ff9a2e" stroke="#2a2550" stroke-width="3"/>`
  };
  const FACES = {
    happy: `<ellipse cx="78" cy="104" rx="11" ry="13" fill="#fff"/><ellipse cx="122" cy="104" rx="11" ry="13" fill="#fff"/><circle cx="80" cy="107" r="6.5" fill="#2a2550"/><circle cx="124" cy="107" r="6.5" fill="#2a2550"/><circle cx="82" cy="103" r="2.2" fill="#fff"/><circle cx="126" cy="103" r="2.2" fill="#fff"/><path d="M88 128 Q100 140 112 128" stroke="#2a2550" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    wink: `<path d="M68 106 q10 -8 20 0" stroke="#2a2550" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="122" cy="104" rx="11" ry="13" fill="#fff"/><circle cx="124" cy="107" r="6.5" fill="#2a2550"/><circle cx="126" cy="103" r="2.2" fill="#fff"/><path d="M86 126 Q100 142 114 126 Z" fill="#2a2550"/><path d="M93 133 Q100 138 107 133" fill="#ff8fab"/>`,
    sing: `<circle cx="80" cy="104" r="7" fill="#2a2550"/><circle cx="120" cy="104" r="7" fill="#2a2550"/><circle cx="82" cy="101" r="2.2" fill="#fff"/><circle cx="122" cy="101" r="2.2" fill="#fff"/><ellipse cx="100" cy="132" rx="10" ry="12" fill="#2a2550"/><ellipse cx="100" cy="137" rx="6" ry="4" fill="#ff8fab"/>`,
    sleepy: `<path d="M68 104 q10 8 20 0 M112 104 q10 8 20 0" stroke="#2a2550" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M92 128 Q100 134 108 128" stroke="#2a2550" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    cool: `<rect x="62" y="94" width="34" height="20" rx="8" fill="#2a2550"/><rect x="104" y="94" width="34" height="20" rx="8" fill="#2a2550"/><path d="M96 102 H104" stroke="#2a2550" stroke-width="4"/><path d="M70 98 l8 -2" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M86 128 Q100 140 116 126" stroke="#2a2550" stroke-width="5" fill="none" stroke-linecap="round"/>`
  };
  const NAMES = ['בובו', 'לולי', 'פיצי', 'זומי', 'טוטי', 'מימי', 'דודו', 'קיקי', 'פופו', 'ננה', 'שושי', 'גוגו', 'ריקי', 'טיפי', 'בילי', 'צ׳יקי', 'מומו', 'לאלא', 'פינקי', 'דיבי', 'רוני', 'ג׳וג׳ו', 'סופי', 'בוני'];
  const PAL = ['#ff7a8a', '#ffad5c', '#ffd84d', '#5fe0a0', '#5cc8f5', '#7b86ff', '#c07bff', '#ff8fd0', '#8ad8c9', '#f5a3a3', '#a0d468', '#ffb6e1'];
  const shapeKeys = Object.keys(SHAPES), accKeys = Object.keys(ACCS), faceKeys = Object.keys(FACES);
  Art.STICKERS = [];
  for (let i = 0; i < 24; i++) {
    Art.STICKERS.push({ id: i, name: NAMES[i], shape: shapeKeys[i % 6], color: PAL[(i * 5) % PAL.length], acc: accKeys[(i * 3 + 1) % accKeys.length], face: faceKeys[(i * 2) % faceKeys.length], gold: false });
  }
  ['כוכבית הזהב', 'נסיך הזהב', 'נסיכת הקשת', 'דרקוני', 'קסמי', 'פיית הצלילים'].forEach((n, k) => {
    Art.STICKERS.push({ id: 24 + k, name: n, shape: shapeKeys[(k * 2 + 1) % 6], color: k % 2 ? 'rainbow' : 'gold', acc: ['crown', 'horn', 'crown', 'horn', 'antenna', 'bow'][k], face: ['happy', 'cool', 'wink', 'sing', 'happy', 'wink'][k], gold: true });
  });
  Art.sticker = function (s, size = 120) {
    const id = 'g' + s.id + Math.random().toString(36).slice(2, 6);
    let fill = s.color, defs = '';
    if (s.color === 'gold') { defs = `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a0"/><stop offset=".5" stop-color="#ffc93c"/><stop offset="1" stop-color="#e89a10"/></linearGradient>`; fill = `url(#${id})`; }
    if (s.color === 'rainbow') { defs = `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${['#ff4d5e', '#ff9a2e', '#ffd23f', '#3ddc84', '#38c6f4', '#b65cff'].map((c, i) => `<stop offset="${i / 5}" stop-color="${c}"/>`).join('')}</linearGradient>`; fill = `url(#${id})`; }
    const path = SHAPES[s.shape], base = s.color.startsWith('#') ? s.color : '#ffc93c';
    const acc = ACCS[s.acc] ? (typeof ACCS[s.acc] === 'function' ? ACCS[s.acc](shade(base, 0.85)) : '') : '';
    return `<svg viewBox="-14 -20 228 228" width="${size}" height="${size}" class="sticker-svg"><defs>${defs}</defs>
      <g stroke="#fff" stroke-width="16" stroke-linejoin="round" fill="#fff"><path d="${path}"/>${acc.replace(/fill="[^"]*"/g, 'fill="#fff"').replace(/stroke="(?!#fff)[^"]*"/g, 'stroke="#fff"')}</g>
      <path d="${path}" fill="${fill}"/>
      <path d="${path}" fill="none" stroke="${shade(base, 0.8)}" stroke-width="3" opacity=".5"/>
      <ellipse cx="72" cy="66" rx="18" ry="9" transform="rotate(-25 72 66)" fill="#fff" opacity=".45"/>
      <ellipse cx="62" cy="128" rx="10" ry="6" fill="#ff6f91" opacity=".45"/><ellipse cx="138" cy="128" rx="10" ry="6" fill="#ff6f91" opacity=".45"/>
      ${FACES[s.face]}${acc}
      ${s.gold ? '<path d="M176 30 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z M20 150 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#fff6a8" stroke="#e8a21a" stroke-width="1.5"/>' : ''}
    </svg>`;
  };

  // ---------- Icons ----------
  Art.icon = {
    map: `<svg viewBox="0 0 120 110"><path d="M14 92 C30 60 70 96 66 60 S100 40 104 18" fill="none" stroke="#e8b04a" stroke-width="7" stroke-dasharray="2 12" stroke-linecap="round"/><circle cx="14" cy="92" r="11" fill="#ff4d5e"/><circle cx="62" cy="66" r="11" fill="#ffd23f"/><circle cx="90" cy="34" r="11" fill="#38c6f4"/><path d="M104 6 v34" stroke="#6b5a3a" stroke-width="4" stroke-linecap="round"/><path d="M106 6 l20 8 l-20 8z" fill="#5b6cff"/></svg>`,
    songs: `<svg viewBox="0 0 120 110"><g stroke="#e3a9bd" stroke-width="2.5"><line x1="6" y1="34" x2="114" y2="34"/><line x1="6" y1="48" x2="114" y2="48"/><line x1="6" y1="62" x2="114" y2="62"/><line x1="6" y1="76" x2="114" y2="76"/></g><ellipse cx="30" cy="76" rx="11" ry="8" transform="rotate(-20 30 76)" fill="#ff4d5e"/><rect x="38" y="30" width="4" height="46" rx="2" fill="#2a2550"/><ellipse cx="62" cy="62" rx="11" ry="8" transform="rotate(-20 62 62)" fill="#ffd23f"/><rect x="70" y="16" width="4" height="46" rx="2" fill="#2a2550"/><ellipse cx="94" cy="48" rx="11" ry="8" transform="rotate(-20 94 48)" fill="#38c6f4"/><rect x="102" y="4" width="4" height="44" rx="2" fill="#2a2550"/><path d="M42 30 L74 16 L74 24 L42 38Z" fill="#2a2550"/></svg>`,
    organ: `<svg viewBox="0 0 120 110"><rect x="4" y="22" width="112" height="72" rx="12" fill="#3b3f4c"/><rect x="14" y="30" width="34" height="16" rx="3" fill="#0c0d10"/><text x="18" y="43" font-size="12" font-family="Arial" font-weight="700" fill="#ff2d2d">001</text><circle cx="96" cy="38" r="6" fill="#f7a234"/><g fill="#f6f6f3"><rect x="12" y="54" width="12" height="34" rx="2"/><rect x="26" y="54" width="12" height="34" rx="2"/><rect x="40" y="54" width="12" height="34" rx="2"/><rect x="54" y="54" width="12" height="34" rx="2"/><rect x="68" y="54" width="12" height="34" rx="2"/><rect x="82" y="54" width="12" height="34" rx="2"/><rect x="96" y="54" width="12" height="34" rx="2"/></g><g fill="#111"><rect x="20" y="54" width="8" height="20" rx="1"/><rect x="34" y="54" width="8" height="20" rx="1"/><rect x="62" y="54" width="8" height="20" rx="1"/><rect x="76" y="54" width="8" height="20" rx="1"/><rect x="90" y="54" width="8" height="20" rx="1"/></g></svg>`,
    album: `<svg viewBox="0 0 30 30"><rect x="3" y="3" width="24" height="24" rx="5" fill="#8e7cf0"/><rect x="15" y="3" width="3" height="24" fill="#6a58d0"/><circle cx="10" cy="12" r="4" fill="#ffd23f"/><circle cx="10" cy="21" r="3" fill="#ff7ea8"/></svg>`,
    organChip: `<svg viewBox="0 0 40 24"><rect x="1" y="2" width="38" height="20" rx="4" fill="#3b3f4c"/><g fill="#fff"><rect x="4" y="10" width="4" height="10"/><rect x="9" y="10" width="4" height="10"/><rect x="14" y="10" width="4" height="10"/><rect x="19" y="10" width="4" height="10"/><rect x="24" y="10" width="4" height="10"/><rect x="29" y="10" width="4" height="10"/></g><rect x="4" y="4" width="10" height="4" rx="1" fill="#ff2d2d"/></svg>`,
    mic: `<svg viewBox="0 0 24 24"><rect x="8" y="2" width="8" height="13" rx="4" fill="#e24a7b"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8" stroke="#2a2550" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    gift: `<svg viewBox="0 0 120 120"><rect x="14" y="52" width="92" height="62" rx="8" fill="#ff7eb6"/><rect x="8" y="36" width="104" height="24" rx="7" fill="#ff98c6"/><rect x="52" y="36" width="16" height="78" fill="#ffd23f"/><path d="M60 36 C40 6 14 18 30 34 Z M60 36 C80 6 106 18 90 34 Z" fill="#ffd23f" stroke="#e8a21a" stroke-width="3" stroke-linejoin="round"/><rect x="14" y="60" width="92" height="6" fill="rgba(0,0,0,.08)"/></svg>`,
    bird: `<svg viewBox="0 0 120 110"><ellipse cx="60" cy="64" rx="40" ry="34" fill="#38c6f4"/><ellipse cx="70" cy="76" rx="22" ry="14" fill="#bfe8ff"/><path d="M28 58 C10 50 8 70 26 72Z" fill="#1d9fd6"/><circle cx="74" cy="54" r="6" fill="#2a2550"/><circle cx="76" cy="52" r="2" fill="#fff"/><path d="M96 58 L114 54 L98 66Z" fill="#ff9a2e"/><path d="M50 30 C46 20 54 14 60 18" stroke="#1d9fd6" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`
  };
  Art.pin = (c) => `<svg class="pin" viewBox="0 0 46 60"><path d="M23 58 C10 40 2 30 2 21 a21 21 0 0 1 42 0 c0 9 -8 19 -21 37z" fill="${c}" stroke="#fff" stroke-width="3"/><circle cx="23" cy="21" r="9" fill="#fff"/></svg>`;
  Art.jar = function (fill /* 0..1 */, count) {
    const pos = [[34, 100], [56, 102], [76, 96], [44, 86], [66, 84], [30, 72], [52, 70], [74, 68], [40, 56], [62, 54], [48, 40], [70, 40]];
    const n = Math.round(fill * pos.length);
    return `<svg viewBox="0 0 100 124"><rect x="26" y="4" width="48" height="14" rx="5" fill="#d9a46a"/><path d="M22 20 h56 q12 0 12 14 v74 q0 12 -12 12 h-56 q-12 0 -12 -12 v-74 q0 -14 12 -14z" fill="rgba(255,255,255,.55)" stroke="#fff" stroke-width="3"/>
      ${pos.slice(0, n).map(([x, y], i) => `<path d="${Art.STAR}" transform="translate(${x - 9} ${y - 9}) scale(.78) rotate(${i * 23} 12 12)" fill="#ffc93c" stroke="#f0a020" stroke-width="1.2"/>`).join('')}
      <path d="M22 30 q-4 30 0 74" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".8"/></svg>`;
  };
  // Level node glyph for the journey map
  Art.levelGlyph = function (L) {
    if (L.type === 'find') return `<svg viewBox="0 0 60 60">${L.pool.slice(0, 4).map((n, i, a) => `<circle cx="${30 + (i - (a.length - 1) / 2) * 13}" cy="30" r="${a.length === 1 ? 16 : 9}" fill="${Music.colorOf(n)}" stroke="#fff" stroke-width="2"/>`).join('')}</svg>`;
    if (L.type === 'echo') return `<svg viewBox="0 0 120 110" style="width:70%">${Art.icon.bird.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>`;
    const seq = Music.parse(L.notesPreview || 'C4 E4 G4');
    return `<svg viewBox="0 0 60 60"><path d="M10 40 Q30 20 50 36" stroke="#d9b7c6" stroke-width="3" fill="none" stroke-dasharray="1 6" stroke-linecap="round"/>${seq.slice(0, 3).map((n, i) => `<circle cx="${12 + i * 18}" cy="${38 - i * 6}" r="8" fill="${Music.colorOf(n.n)}" stroke="#fff" stroke-width="2"/>`).join('')}</svg>`;
  };

  // ---------- MK37 control panel (functional SVG) ----------
  Art.buildPanel = function (svg, onButton) {
    const ranges = {
      SONG: [['001-008', 'CLASSIC'], ['009-026', 'STANDARD'], ['027-052', 'FOLK'], ['053-100', 'PIANO']],
      STYLE: [['001-018', 'BEAT & POP'], ['019-037', 'ROCK'], ['038-053', 'DANCE'], ['054-064', 'SOUL & FUNK'], ['065-080', 'JAZZ'], ['081-086', 'COUNTRY'], ['087-102', 'LATIN'], ['103-111', 'TRADITIONAL'], ['112-120', 'PIANIST']],
      SOUND: [['001-015', 'PIANO'], ['016-030', 'E.PIANO'], ['031-047', 'CHROMATIC'], ['048-060', 'ORGAN'], ['061-065', 'ACCORDION'], ['066-082', 'GUITAR'], ['083-096', 'BASS'], ['097-121', 'STRINGS'], ['122-137', 'BRASS'], ['138-154', 'WOODWIND'], ['155-180', 'SYNTH'], ['181-188', 'ETHNIC'], ['189-197', 'SFX'], ['198-200', 'DRUMS']]
    };
    const chart = (x, w, title, colW) => {
      let h = `<rect x="${x}" y="22" width="${w}" height="13" fill="#9ea3b0"/><text x="${x + w / 2}" y="32" text-anchor="middle" fill="#2c2f38" font-size="9.5" font-weight="700">${title}</text>`;
      ranges[title].forEach((r, i) => {
        const col = colW ? Math.floor(i / 7) : 0, row = colW ? i % 7 : i;
        const rx = x + 2 + col * (colW || 0), ry = 50 + row * 14;
        const [a, b] = r[0].split('-').map(Number);
        h += `<g data-chart="${title.toLowerCase()}" data-a="${a}" data-b="${b}"><rect class="hl" x="${rx - 2}" y="${ry - 9}" width="${colW ? colW - 6 : w}" height="12" rx="2" fill="transparent"/><text x="${rx}" y="${ry}">${r[0]}</text><text x="${rx + 38}" y="${ry}">${r[1]}</text></g>`;
      });
      return h;
    };
    const F1 = [['CHORD', 437, 'chord'], ['A/B', 487, 'ab'], ['SUSTAIN', 541, 'sustain'], ['SONG', 593, 'song'], ['STYLE', 645, 'style'], ['SOUND', 697, 'sound']];
    svg.setAttribute('viewBox', '0 0 1556 300');
    svg.innerHTML = `
      <defs>
        <radialGradient id="pKnob" cx="35%" cy="30%"><stop offset="0" stop-color="#4a4a4d"/><stop offset="1" stop-color="#0c0c0d"/></radialGradient>
        <radialGradient id="pDigit" cx="35%" cy="30%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cfd0d3"/></radialGradient>
        <radialGradient id="pOrange" cx="35%" cy="30%"><stop offset="0" stop-color="#ffc56a"/><stop offset="1" stop-color="#f39a1e"/></radialGradient>
        <linearGradient id="pFbtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34363d"/><stop offset="1" stop-color="#16171b"/></linearGradient>
        <filter id="pGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <text x="150" y="30" text-anchor="middle" font-size="12" fill="#b9bdc8" letter-spacing="1">VOLUME</text>
      <g class="pbtn knob" data-b="knob"><circle cx="150" cy="82" r="38" fill="transparent"/><circle cx="150" cy="82" r="36" fill="#0a0a0b"/><circle cx="150" cy="80" r="33" fill="url(#pKnob)"/><line class="knob-tick" x1="150" y1="80" x2="150" y2="52" stroke="#e0a85c" stroke-width="4" stroke-linecap="round"/></g>
      <g transform="translate(150 196)" fill="none" stroke="#b9bdc8" stroke-width="2" stroke-linecap="round"><path d="M-6 -4 A8 8 0 1 0 6 -4"/><line x1="0" y1="-9" x2="0" y2="-1"/></g>
      <g class="pbtn" data-b="power"><circle cx="150" cy="238" r="26" fill="transparent"/><circle cx="150" cy="238" r="20" fill="#0a0a0b"/><circle cx="150" cy="236" r="17" fill="#1d1e22"/><circle class="power-ring" cx="150" cy="237" r="23" fill="none" stroke="#f7a234" stroke-width="3" stroke-dasharray="145" stroke-dashoffset="145"/></g>
      <rect x="237" y="22" width="500" height="150" rx="6" fill="#0c0d10"/>
      <g class="led" transform="translate(266 56) scale(.68)" filter="url(#pGlow)"></g>
      <g font-size="10" fill="#80848f" letter-spacing=".5"><text x="268" y="140" data-mode="song">SONG</text><text x="314" y="140" data-mode="style">STYLE</text><text x="363" y="140" data-mode="sound">SOUND</text></g>
      <g font-size="10" fill="#b9bdc8" text-anchor="middle" letter-spacing=".5">${F1.map(([l, x]) => `<text x="${x}" y="38">${l}</text>`).join('')}</g>
      ${F1.map(([, x, b]) => `<g class="pbtn" data-b="${b}"><rect x="${x - 22}" y="40" width="44" height="64" fill="transparent"/><rect x="${x - 17}" y="48" width="34" height="50" rx="13" fill="#000"/><rect class="face" x="${x - 17}" y="46" width="34" height="48" rx="13" fill="url(#pFbtn)"/></g>`).join('')}
      <text x="437" y="120" font-size="9.5" fill="#b9bdc8" text-anchor="middle">AUTO</text><path d="M454 118 l6 -8 l3 2 l-6 8 z" fill="#b9bdc8"/>
      ${[[541, 'metro'], [593, 'prev'], [645, 'next']].map(([x, b]) => `<g class="pbtn" data-b="${b}"><circle cx="${x}" cy="133" r="24" fill="transparent"/><circle cx="${x}" cy="134" r="17" fill="#000"/><circle class="face" cx="${x}" cy="132" r="16" fill="url(#pFbtn)"/></g>`).join('')}
      <g class="pbtn" data-b="play"><circle cx="697" cy="133" r="25" fill="transparent"/><circle cx="697" cy="134" r="18" fill="#b8650c"/><circle cx="697" cy="132" r="17" fill="url(#pOrange)"/></g>
      <g font-size="10" fill="#b9bdc8" text-anchor="middle"><text x="549" y="166" letter-spacing=".5">METRONOME</text><text x="593" y="166">‹</text><text x="645" y="166">›</text><text x="697" y="166">▶/■</text></g>
      ${Array.from({ length: 10 }, (_, d) => { const x = 252 + d * 52.3; return `<text x="${x}" y="206" font-size="12" fill="#b9bdc8" text-anchor="middle">${d}</text><g class="pbtn" data-b="d${d}"><circle cx="${x}" cy="235" r="25" fill="transparent"/><circle cx="${x}" cy="236" r="17" fill="#8d8f94"/><circle cx="${x}" cy="234" r="16" fill="url(#pDigit)"/></g>`; }).join('')}
      <g font-size="7.8" fill="#b9bdc8">${chart(765, 92, 'SONG')}${chart(893, 92, 'STYLE')}${chart(1020, 196, 'SOUND', 100)}</g>
      ${Array.from({ length: 11 }, (_, i) => `<rect x="1245" y="${30 + i * 19}" width="244" height="9" rx="4.5" fill="#15161a"/><rect x="1245" y="${39 + i * 19}" width="244" height="1.5" fill="rgba(255,255,255,.06)"/>`).join('')}
      <text x="1318" y="285" font-size="21" fill="#a9aeba" letter-spacing="5" font-weight="500">MEDELI</text>
      <text x="1450" y="285" font-size="22" fill="#c7cbd5" font-style="italic" font-weight="800" letter-spacing="1">MK37</text>`;

    const SEG = { a: ['h', 4, 4, 44], b: ['v', 44, 4, 42], c: ['v', 44, 42, 80], d: ['h', 80, 4, 44], e: ['v', 4, 42, 80], f: ['v', 4, 4, 42], g: ['h', 42, 4, 44] };
    const DIG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '', H: 'bcefg', I: 'bc', P: 'abefg', L: 'def', A: 'abcefg', Y: 'bcdfg', E: 'adefg', n: 'ceg', o: 'cdeg', S: 'afgcd', t: 'defg', d: 'bcdeg' };
    const poly = ([t, p, s, e]) => t === 'h'
      ? `${s + 4},${p} ${s + 8},${p - 4} ${e - 8},${p - 4} ${e - 4},${p} ${e - 8},${p + 4} ${s + 8},${p + 4}`
      : `${p},${s + 4} ${p + 4},${s + 8} ${p + 4},${e - 8} ${p},${e - 4} ${p - 4},${e - 8} ${p - 4},${s + 8}`;
    const ledG = svg.querySelector('.led');
    const api = {
      led(str, dot = true) {
        str = String(str).padStart(3, ' ').slice(-3);
        ledG.innerHTML = [...str].map((ch, i) => {
          const on = DIG[ch] ?? '';
          let h = `<g transform="translate(${i * 60} 0) skewX(-6)">`;
          for (const k in SEG) h += `<polygon points="${poly(SEG[k])}" fill="${on.includes(k) ? '#ff2d2d' : '#3a1010'}"/>`;
          if (i === 2) h += `<circle cx="54" cy="80" r="4.5" fill="${dot ? '#ff2d2d' : '#3a1010'}"/>`;
          return h + '</g>';
        }).join('');
      },
      mode(m) { svg.querySelectorAll('[data-mode]').forEach((t) => t.setAttribute('fill', t.dataset.mode === m ? '#ff2d2d' : '#80848f')); },
      chart(mode, n) {
        svg.querySelectorAll('[data-chart]').forEach((g) => {
          const on = g.dataset.chart === mode && n >= +g.dataset.a && n <= +g.dataset.b;
          g.querySelector('.hl').setAttribute('fill', on ? '#ff2d2d' : 'transparent');
          g.querySelectorAll('text').forEach((t) => t.setAttribute('fill', on ? '#fff' : '#b9bdc8'));
        });
      },
      lit(b, on) { const f = svg.querySelector(`[data-b="${b}"] .face`); if (f) f.setAttribute('stroke', on ? '#ff2d2d' : 'none'), f.setAttribute('stroke-width', on ? 2.5 : 0); },
      knob(v) { svg.querySelector('.knob-tick').setAttribute('transform', `rotate(${-135 + v * 270} 150 80)`); },
      flash(b) { const g = svg.querySelector(`[data-b="${b}"]`); if (!g) return; g.classList.remove('press'); void g.getBBox(); g.classList.add('press'); setTimeout(() => g.classList.remove('press'), 160); }
    };
    svg.querySelectorAll('.pbtn').forEach((g) => {
      g.addEventListener('pointerdown', (e) => { e.preventDefault(); api.flash(g.dataset.b); onButton(g.dataset.b, 'down', e); });
      g.addEventListener('pointerup', (e) => onButton(g.dataset.b, 'up', e));
      g.addEventListener('pointerleave', (e) => onButton(g.dataset.b, 'leave', e));
    });
    return api;
  };

  window.Art = Art;
})();

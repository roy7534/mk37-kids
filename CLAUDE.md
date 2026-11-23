# MK37 Kids — piano game for a 4-year-old, iPad

What it is: a web app (PWA) that teaches Roy's 4-year-old daughter to play her real Medeli MK37 organ
(37 mini keys, colour stickers on the white keys). The whole iPad screen looks like the MK37 panel; the game runs in a
"magic window" in the middle; 37 mini keys at the bottom. Personal use only — no App Store.

## Live
- Site: https://roy7534.github.io/mk37-kids/ (GitHub Pages, branch `gh-pages` = contents of `web/`)
- Repo: github.com/roy7534/mk37-kids (public — required for free Pages; mom's voice clips are public there, user approved 2026-11-23)
- Deploy (ask the user before pushing anything new that is personal):
  1. bump `CACHE` in `web/sw.js` (currently `mk37kids-v3`) so iPads pick up the update
  2. commit on `main`, `git push origin main`
  3. `git branch -D gh-pages; git subtree split --prefix web -b gh-pages && git push -f origin gh-pages`
  4. wait ~1 min, check the live URL loads (curl a changed file)
- Local run: `.claude/launch.json` → `piano-web` (python http.server on port 5180, absolute path to `web/`).
  Browser pane blocks the mic; test input by calling `window.nativeMidi(0x90, note, 90)` in the console.

## Structure
- `web/index.html`, `web/css/style.css` — UI (Fredoka font, claymorphism cards inside the organ body)
- `web/js/app.js` — screens, MK37 panel logic, games, rewards, song editor, parent area, settings (localStorage `mk37kids-v2`)
- `web/js/art.js` — all art as SVG: Noti (eighth-note mascot) + accessories unlocked by stars, 30 sticker creatures
  (6 gold/rainbow), icons, the functional MK37 panel with a drawn 7-segment LED
- `web/js/audio.js` — Web Audio synth (200 sounds in MK37 numbering, 120 styles, chord auto-bass, metronome, SFX), `playBuffer`
- `web/js/voice.js` — voice priority: parent in-app recording (IndexedDB) > `voice/mom/*.m4a` > `voice/{f,m}/*.mp3` (Hila) > device TTS
- `web/js/input.js` — MIDI (Web MIDI + native bridge `window.nativeMidi`) and mic pitch detection (YIN); mic is ignored
  while the app itself makes sound (`Audio2.markBusy`)
- `web/js/songs.js` — 12 public-domain songs; `web/js/phrases.js` — 39 phrase texts (generated)
- `web/stickers.html` — printable colour stickers; `web/design-preview.html` — the approved design mockup (not used by the app)
- `ios/NotiPiano/*.swift` — optional native WKWebView shell with CoreMIDI for the USB-C cable. Not built (no Xcode on this Mac).
- `מדריך התקנה.md` — Hebrew install guide for the user

## Voice tools (`tools/`)
- `make_voice.py` — regenerates Hila clips + `phrases.js` with edge-tts (`python3 -m venv .venv && .venv/bin/pip install edge-tts`).
  Phrase keys and their order are defined there.
- `split_segments.py file.wav 0.7` + `cut_clips.py` — how mom's recording was turned into clips: convert with
  `afconvert -f WAVE -d LEI16@44100 -c 1 in.mp3 out.wav`, split on silences ≥0.7 s (must give exactly 39 segments in key
  order), cut with padding/fades/normalise, encode `afconvert -f m4af -d aac -b 96000`. No ffmpeg on this Mac.
  Sanity check used: segment lengths vs Hila clip lengths (correlation was 0.95).
- To replace single sentences: record → same pipeline for that file → overwrite `web/voice/mom/<key>.m4a`.

## Decisions
- Games accept only the real organ (mic or MIDI). Screen keys count only in parent "test mode"; in free play/editor they
  are an instrument.
- Parent area: long-press (1.8 s) the power button ⏻ on the panel (short press = home). Settings there: name, girl/boy
  wording, time limit, input mode, mic sensitivity, calibration, strict octave, test mode, voice on/off, voice
  (mom / Hila), per-sentence parent recording, stickers sheet, add song, unlock all, reset.
- Panel buttons work like the real MK37: SONG → song list (digits select, orange ▶ starts), SOUND/STYLE → free organ.
- Note matching is by pitch class (octave-free) unless "strict octave" + MIDI.
- 20 journey levels (find colour → echo → songs), 3-star scoring, gift on first win + ~35% surprise gifts, daily gift.
- No emojis anywhere — all art is original SVG. User wants Hebrew UI and Hebrew replies.

## Status / next
- Done: full app on the MK37 design, Hila voice, mom's voice (default) live on the site — 2026-11-23.
- Tested only in the desktop browser (simulated MIDI). NOT yet verified: real iPad, mic recognition with the real organ,
  USB-C cable, Safari home-screen install.
- Next: user installs on the iPad (Safari → Add to Home Screen), runs the live hearing test in the parent area and reports
  what "תו אחרון שנשמע" shows → tune mic detection (`input.js`: gate, clarity 0.8, 2 stable frames) if needed.
- Ideas not started: voice cloning via ElevenLabs (needs user's account), native app build with Xcode for MIDI over cable.

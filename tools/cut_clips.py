"""Cut a WAV into clips with padding, fades and peak normalisation.
Usage: cut.py src.wav segs.json out_dir key1,key2,...   (segs.json from split_segments.py)"""
import sys, wave, array, json, os

src, segs_path, out_dir, keys = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].split(',')
w = wave.open(src); sr = w.getframerate()
data = array.array('h', w.readframes(w.getnframes()))
segs = json.load(open(segs_path))['segs']
assert len(segs) == len(keys), (len(segs), len(keys))
os.makedirs(out_dir, exist_ok=True)
for key, (a, b) in zip(keys, segs):
    s = max(0, int((a - 0.12) * sr)); e = min(len(data), int((b + 0.22) * sr))
    clip = [float(x) for x in data[s:e]]
    peak = max(1.0, max(abs(x) for x in clip))
    g = 0.89 * 32767 / peak
    n = len(clip); fi = int(0.03 * sr); fo = int(0.08 * sr)
    for i in range(n):
        f = min(1.0, i / fi, (n - 1 - i) / fo)
        clip[i] = max(-32767, min(32767, clip[i] * g * f))
    o = wave.open(os.path.join(out_dir, key + '.wav'), 'w')
    o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr)
    o.writeframes(array.array('h', (int(x) for x in clip)).tobytes()); o.close()
    print(key, round((e - s) / sr, 2))

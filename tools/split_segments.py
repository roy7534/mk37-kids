"""Find speech segments in a mono 16-bit WAV by silence detection. Usage: segments.py file.wav [min_gap_sec] [thr_ratio]"""
import sys, wave, array, math, json

path = sys.argv[1]
min_gap = float(sys.argv[2]) if len(sys.argv) > 2 else 0.6
ratio = float(sys.argv[3]) if len(sys.argv) > 3 else 0.06
w = wave.open(path)
sr = w.getframerate()
data = array.array('h', w.readframes(w.getnframes()))
hop = int(sr * 0.02)
rms = [math.sqrt(sum(x * x for x in data[i:i + hop]) / hop) for i in range(0, len(data) - hop, hop)]
loud = sorted(rms)[int(len(rms) * 0.95)]
thr = max(loud * ratio, 150)
voiced = [r > thr for r in rms]
segs, start, last = [], None, None
gap_frames = int(min_gap / 0.02)
for i, v in enumerate(voiced):
    if v:
        if start is None:
            start = i
        last = i
    elif start is not None and i - last > gap_frames:
        segs.append((start, last)); start = None
if start is not None:
    segs.append((start, last))
segs = [(a * 0.02, (b + 1) * 0.02) for a, b in segs if (b - a) * 0.02 > 0.18]
print(json.dumps({"thr": round(thr), "loud": round(loud), "n": len(segs), "segs": [[round(a, 2), round(b, 2)] for a, b in segs]}))

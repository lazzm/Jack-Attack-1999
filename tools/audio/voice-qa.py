#!/usr/bin/env python3
"""Quality check for recorded voice clips, and the repair for stray bursts at their edges.

  voice-qa.py check DIR [--json FILE]     report; exit 1 if any clip fails
  voice-qa.py fix SRC DST                 write repaired copies of failing clips into DST (SRC is never changed)

A batch recording is cut into clips at its silences. A cut in the wrong place leaves the next line's first sound
after the clip's real ending: speech, about a third of a second of silence, then a loud burst up to the last
sample. Players hear that as a sudden crackle. Same in reverse at a clip's start. Also checked: an ending or start
that isn't at rest (a click), clipping, and level.
"""
import argparse, glob, json, os, subprocess, sys, tempfile
import numpy as np

SR = 48000
WIN = int(.01 * SR)
SILENT_DB = -50.0      # a window this quiet counts as silence
MIN_GAP = .08          # silence needed between the real speech and a stray burst (s)
MAX_BURST = .28        # longest sound treated as stray (s); longer may be a real word, so it's only reported
EDGE_DB = -38.0        # the final or first 10 ms must be quieter than this
FADE_OUT, FADE_IN, PAD = .025, .004, .06


def load(path):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).copy()


def env(a):
    n = len(a) // WIN
    if not n:
        return np.array([-120.0])
    frames = a[:n * WIN].reshape(n, WIN)
    return 20 * np.log10(np.maximum(np.sqrt((frames ** 2).mean(axis=1)), 1e-6))


def stray(e):
    """(burst start window, gap windows) if the end of envelope e is sound, then silence, then more speech before it."""
    i = len(e) - 1
    while i >= 0 and e[i] < SILENT_DB:
        i -= 1
    burst_end = i
    while i >= 0 and e[i] >= SILENT_DB:
        i -= 1
    burst_start = i + 1
    gap_end = i
    while i >= 0 and e[i] < SILENT_DB:
        i -= 1
    gap = gap_end - i
    if i < 0 or burst_end < 0:
        return None
    return burst_start, gap, (burst_end - burst_start + 1) * WIN / SR


def inspect(a):
    e = env(a)
    problems = []
    tail, head = stray(e), stray(e[::-1])
    # A real short word after a pause dies away; a stray burst is still loud at the very edge of the clip.
    if tail and e[-1] > EDGE_DB and tail[1] * WIN / SR >= MIN_GAP and tail[2] <= MAX_BURST:
        problems.append('tail-burst')
    if head and e[0] > EDGE_DB and head[1] * WIN / SR >= MIN_GAP and head[2] <= MAX_BURST:
        problems.append('head-burst')
    if e[-1] > EDGE_DB:
        problems.append('hard-end')
    if e[0] > EDGE_DB:
        problems.append('hard-start')
    peak = float(np.abs(a).max()) if len(a) else 0
    if peak >= .995:
        problems.append('clipped')
    speech = e[e > SILENT_DB]
    level = float(np.median(speech)) if len(speech) else -120.0
    if level < -36:
        problems.append('quiet')
    return {'dur': round(len(a) / SR, 3), 'peak': round(peak, 3), 'level': round(level, 1), 'endDb': round(float(e[-1]), 1), 'startDb': round(float(e[0]), 1), 'problems': problems}


def repair(a):
    """Remove stray bursts, then come to rest smoothly. Never touches the middle of a line."""
    for _ in range(2):
        e = env(a)
        t = stray(e)
        if t and e[-1] > EDGE_DB and t[1] * WIN / SR >= MIN_GAP and t[2] <= MAX_BURST:
            a = a[:max(0, t[0] - t[1] // 2) * WIN]
    for _ in range(2):
        e = env(a)
        h = stray(e[::-1])
        if h and e[0] > EDGE_DB and h[1] * WIN / SR >= MIN_GAP and h[2] <= MAX_BURST:
            cut = (len(e) - 1 - (h[0] - h[1] // 2)) * WIN
            a = a[max(0, cut):]
    a = a.copy()
    fo, fi = int(FADE_OUT * SR), int(FADE_IN * SR)
    if len(a) > fo + fi:
        a[-fo:] *= .5 + .5 * np.cos(np.linspace(0, np.pi, fo))
        a[:fi] *= .5 - .5 * np.cos(np.linspace(0, np.pi, fi))
    return np.concatenate([np.zeros(int(.012 * SR), dtype=np.float32), a, np.zeros(int(PAD * SR), dtype=np.float32)])


def save(a, path):
    with tempfile.NamedTemporaryFile(suffix='.f32') as t:
        t.write(a.astype(np.float32).tobytes())
        t.flush()
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', t.name, '-c:a', 'libmp3lame', '-q:a', '4', path], check=True)


def clips(root):
    return sorted(glob.glob(os.path.join(root, '**', '*.mp3'), recursive=True))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mode', choices=['check', 'fix'])
    ap.add_argument('src')
    ap.add_argument('dst', nargs='?')
    ap.add_argument('--json')
    args = ap.parse_args()
    rows, fixed = {}, 0
    for path in clips(args.src):
        rel = os.path.relpath(path, args.src)
        a = load(path)
        info = inspect(a)
        rows[rel] = info
        if args.mode == 'fix' and info['problems']:
            out = os.path.join(args.dst, rel)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            save(repair(a), out)
            fixed += 1
    bad = {k: v for k, v in rows.items() if v['problems']}
    tally = {}
    for v in bad.values():
        for p in v['problems']:
            tally[p] = tally.get(p, 0) + 1
    print(f'{len(rows)} clips, {len(bad)} with problems: {tally}' + (f'; repaired {fixed}' if args.mode == 'fix' else ''))
    for k, v in sorted(bad.items())[:60]:
        print(' ', k, v['problems'], f"end {v['endDb']} start {v['startDb']} dur {v['dur']}")
    if args.json:
        json.dump(rows, open(args.json, 'w'), indent=0)
    return 1 if bad and args.mode == 'check' else 0


if __name__ == '__main__':
    sys.exit(main())

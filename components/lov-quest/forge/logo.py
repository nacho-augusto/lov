"""LOV QUEST pixel wordmark: 'LA OTRA' + half-sun mark / 'VERTIENTE'."""
import math
import numpy as np
from pal import *  # noqa
from props import G


def word(text, gap=2, space=6):
    cols = []
    h = 12
    for i, ch in enumerate(text):
        if ch == " ":
            cols.append(np.zeros((h, space), dtype=bool))
            continue
        g = G[ch]
        a = np.array([[c == "#" for c in row] for row in g], dtype=bool)
        cols.append(a)
        if i < len(text) - 1 and text[i + 1] != " ":
            cols.append(np.zeros((h, gap), dtype=bool))
    return np.concatenate(cols, axis=1)


def sun_mark(r=11):
    """Half sun (orange) behind black snow-capped peaks, like the club logo (45deg pixel slopes)."""
    w, h = 30, 15
    a = np.full((h, w), T, dtype=np.int16)
    cx, cy, rr = 16.0, 15.0, 14.2
    for y in range(h):
        for x in range(w):
            dx, dy = x + 0.5 - cx, y + 0.5 - cy
            if dx * dx + dy * dy <= rr * rr:
                a[y, x] = ORANGE
    peaks = [(10, 5, 3), (19, 8, 2), (25, 11, 1)]  # apex x, apex y, snow rows
    for (ax, ay, snow) in peaks:
        for y in range(ay, h):
            half = y - ay
            for x in range(ax - half, ax + half + 1):
                if 0 <= x < w:
                    a[y, x] = INK
    for (ax, ay, snow) in peaks:
        for y in range(ay, ay + snow + 1):
            half = y - ay
            for x in range(ax - half, ax + half + 1):
                if not (0 <= x < w):
                    continue
                last = (y == ay + snow)
                if last and ((x - ax) % 2 != 0):
                    continue
                if y == ay + snow and abs(x - ax) == half:
                    continue
                a[y, x] = WHITE
    return a


def build():
    top = word("LA OTRA")
    bot = word("VERTIENTE")
    W = max(top.shape[1], bot.shape[1])
    gap = 3
    H = 12 * 2 + gap
    mask = np.zeros((H, W), dtype=bool)
    mask[0:12, 0:top.shape[1]] = top
    mask[12 + gap:, 0:bot.shape[1]] = bot

    ext = 2  # extrusion depth (down-right)
    pad = 2
    out = np.full((H + ext + pad * 2, W + ext + pad * 2), T, dtype=np.int16)
    oy = ox = pad
    # extrusion
    for d in range(ext, 0, -1):
        col = DEEP if d == ext else ORANGE
        ys, xs = np.nonzero(mask)
        for y, x in zip(ys, xs):
            out[oy + y + d, ox + x + d] = col
    ys, xs = np.nonzero(mask)
    for y, x in zip(ys, xs):
        out[oy + y, ox + x] = WHITE
    # subtle top highlight: mist on the last row of each stroke? keep crisp white
    # add the sun mark to the right of 'LA OTRA'
    sm = sun_mark(10)
    sx = ox + top.shape[1] + 4
    sy = oy + 12 - sm.shape[0] + 1
    if sx + sm.shape[1] > out.shape[1]:
        grow = sx + sm.shape[1] - out.shape[1] + 1
        out = np.concatenate([out, np.full((out.shape[0], grow), T, dtype=np.int16)], axis=1)
    blit(out, sm, sx, sy)
    out = outline(out, INK, diagonal=False)
    # trim fully transparent columns/rows
    m = out != T
    ys, xs = np.nonzero(m)
    out = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return out

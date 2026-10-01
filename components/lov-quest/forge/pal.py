"""Shared palette + pixel helpers for the LOV QUEST asset forge."""
import numpy as np
from PIL import Image

HEX = [
    "0e0c15",  # 0 INK
    "1d1a35",  # 1 NIGHT
    "433c6b",  # 2 DUSK
    "8f8aa6",  # 3 STONE
    "c7e3f0",  # 4 MIST
    "fbf7ef",  # 5 WHITE
    "1f5a8f",  # 6 SEA
    "57a0db",  # 7 SKY
    "2a5c47",  # 8 PINE
    "5b9c4c",  # 9 LEAF
    "7b4b32",  # a EARTH
    "d7a266",  # b SAND
    "c2470c",  # c DEEP
    "f26b1d",  # d ORANGE
    "ff8a3d",  # e LIGHT
    "ffd166",  # f GOLD
]
RGB = np.array([[int(h[i:i + 2], 16) for i in (0, 2, 4)] for h in HEX], dtype=np.uint8)

INK, NIGHT, DUSK, STONE, MIST, WHITE, SEA, SKY, PINE, LEAF, EARTH, SAND, DEEP, ORANGE, LIGHT, GOLD = range(16)
T = -1  # transparent


def parse(rows):
    """ASCII rows -> int array. '.' or ' ' transparent, hex digit = palette index."""
    h = len(rows)
    w = max(len(r) for r in rows)
    a = np.full((h, w), T, dtype=np.int16)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch in ". ":
                continue
            a[y, x] = int(ch, 16)
    return a


def outline(a, color=INK, diagonal=False):
    """Add a 1px outline around opaque pixels (grows the canvas by 1 on each side)."""
    h, w = a.shape
    out = np.full((h + 2, w + 2), T, dtype=np.int16)
    out[1:-1, 1:-1] = a
    mask = out != T
    grown = mask.copy()
    shifts = [(0, 1), (0, -1), (1, 0), (-1, 0)]
    if diagonal:
        shifts += [(1, 1), (1, -1), (-1, 1), (-1, -1)]
    for dy, dx in shifts:
        grown |= np.roll(np.roll(mask, dy, 0), dx, 1)
    out[(grown) & (~mask)] = color
    return out


def to_rgba(a):
    h, w = a.shape
    img = np.zeros((h, w, 4), dtype=np.uint8)
    m = a != T
    img[m, :3] = RGB[a[m]]
    img[m, 3] = 255
    return Image.fromarray(img, "RGBA")


def preview(a, scale=8, bg=(40, 40, 60)):
    im = to_rgba(a)
    big = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
    canvas = Image.new("RGBA", big.size, bg + (255,))
    canvas.alpha_composite(big)
    return canvas


def blit(dst, src, x, y):
    """Paste src onto dst (int arrays) honoring transparency."""
    h, w = src.shape
    H, W = dst.shape
    for yy in range(h):
        ty = y + yy
        if ty < 0 or ty >= H:
            continue
        for xx in range(w):
            tx = x + xx
            if tx < 0 or tx >= W:
                continue
            v = src[yy, xx]
            if v != T:
                dst[ty, tx] = v


def flip(a):
    return a[:, ::-1].copy()


def recolor(a, mapping):
    b = a.copy()
    for k, v in mapping.items():
        b[a == k] = v
    return b

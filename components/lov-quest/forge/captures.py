"""Turn the real club photos into 16-colour ordered-dither 'captures' + mosaic levels.

Outputs to public/lov-quest/caps/:
  <id>-8bit.png   96x96, palette + Bayer 8x8 ordered dithering (default tile state)
  <id>-m1.png     12x12 full-colour mosaic
  <id>-m2.png     24x24 full-colour mosaic
  <id>-m3.png     48x48 full-colour mosaic
"""
import os
from pathlib import Path
import re
import numpy as np
from PIL import Image, ImageEnhance
from pal import RGB

ROOT = str(Path(__file__).resolve().parents[3])
OUT = os.path.join(ROOT, "public/lov-quest/caps")
os.makedirs(OUT, exist_ok=True)

# focus point (fx, fy in 0..1) for the square crop, per photo id (default centre)
FOCUS = {
    "ronda-101-meta": (0.55, 0.62),
    "premios-mesa": (0.5, 0.55),
    "premios-playa": (0.5, 0.5),
    "san-anton-dorsales": (0.5, 0.45),
    "omd-finishers": (0.55, 0.55),
    "ronda-tajo": (0.5, 0.5),
    "san-anton-noche": (0.55, 0.5),
}

BAYER8 = np.array([
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
], dtype=np.float32) / 64.0 - 0.5


def square(im, pid):
    w, h = im.size
    s = min(w, h)
    fx, fy = FOCUS.get(pid, (0.5, 0.5))
    cx, cy = fx * w, fy * h
    x0 = int(max(0, min(w - s, cx - s / 2)))
    y0 = int(max(0, min(h - s, cy - s / 2)))
    return im.crop((x0, y0, x0 + s, y0 + s))


def dither(im, size=64, spread=46.0):
    im = im.resize((size, size), Image.LANCZOS)
    im = ImageEnhance.Contrast(im).enhance(1.12)
    im = ImageEnhance.Color(im).enhance(1.15)
    a = np.asarray(im.convert("RGB"), dtype=np.float32)
    th = np.tile(BAYER8, (size // 8 + 1, size // 8 + 1))[:size, :size]
    a = a + th[..., None] * spread
    pal = RGB.astype(np.float32)
    # weighted distance (rough perceptual weights)
    wts = np.array([0.30, 0.59, 0.11], dtype=np.float32) * 3
    d = ((a[:, :, None, :] - pal[None, None, :, :]) ** 2 * wts).sum(-1)
    idx = d.argmin(-1)
    out = RGB[idx]
    return Image.fromarray(out.astype(np.uint8), "RGB")


def main():
    src = open(os.path.join(ROOT, "content/photos.ts")).read()
    items = re.findall(r'id: "([^"]+)",\s*src: "([^"]+)"', src)
    for pid, rel in items:
        im = Image.open(os.path.join(ROOT, "public" + rel)).convert("RGB")
        sq = square(im, pid)
        d = dither(sq, 96, 40.0)
        d.quantize(colors=16, method=Image.Quantize.FASTOCTREE).save(os.path.join(OUT, f"{pid}-8bit.png"), optimize=True)
        for lvl, n in (("m1", 12), ("m2", 24), ("m3", 48)):
            m = sq.resize((n, n), Image.BOX)
            m.save(os.path.join(OUT, f"{pid}-{lvl}.png"), optimize=True)
    print(len(items), "photos")


if __name__ == "__main__":
    main()

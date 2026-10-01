"""Procedural pixel rig for the LOV QUEST runner (club kit), rendered into frames.

Side view facing right. Limbs are rasterised from joint angles; head and torso are
hand-made bitmaps. A 1px INK outline is added around the whole silhouette.
"""
import math
import numpy as np
from pal import *  # noqa

W, H = 26, 32
GROUND = 31  # last row (shoe soles)

# ---------------- bitmaps ----------------
HEAD = {
    "cap": parse([
        "..ddddd...",
        ".dddddddddd",
        ".aabbbbb..",
        ".abbbb0b..",
        "..bbbbbb..",
        "...bbb....",
    ]),
    "lamp": parse([
        "..ddddd...",
        ".ddd00ffd.",
        ".aabbbbb..",
        ".abbbb0b..",
        "..bbbbbb..",
        "...bbb....",
    ]),
    "hair": parse([
        "..aaaa....",
        ".aaaaaaa..",
        ".aabbbbb..",
        ".abbbb0b..",
        "..bbbbbb..",
        "...bbb....",
    ]),
    "hurt": parse([
        "..ddddd...",
        ".dddddddddd",
        ".aabbbbb..",
        ".abb0b0b..",
        "..bb00bb..",
        "...bbb....",
    ]),
}

TORSO = {
    # white top, orange shoulders, black lower half with orange half-sun + white peaks
    "tee": parse([
        ".ddddd.",
        "dd555dd",
        "5555555",
        "5555555",
        "5ddddd5",
        "dd5d5dd",
        "0000000",
        "0000000",
        "0000000",
    ]),
    "singlet": parse([
        ".55.55.",
        "d5555d.",
        "5555555",
        "5555555",
        "5ddddd5",
        "dd5d5dd",
        "0000000",
        "0000000",
        "0000000",
    ]),
    "jacket": parse([
        ".ddddd.",
        "ddddddd",
        "dd555dd",
        "d55555d",
        "5ddddd5",
        "dd5d5dd",
        "0000000",
        "0000000",
        "0000000",
    ]),
}

# ---------------- geometry ----------------

def vec(angle_deg, length):
    a = math.radians(angle_deg)
    return math.sin(a) * length, math.cos(a) * length


def seg_dist(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy
    t = 0.0 if L2 == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L2))
    cx, cy = ax + t * dx, ay + t * dy
    return math.hypot(px - cx, py - cy), t


def draw_seg(img, a, b, width, colors):
    """colors: list of (t_end, color) along the segment."""
    ax, ay = a
    bx, by = b
    x0, x1 = int(min(ax, bx) - width - 1), int(max(ax, bx) + width + 1)
    y0, y1 = int(min(ay, by) - width - 1), int(max(ay, by) + width + 1)
    for y in range(max(0, y0), min(H, y1 + 1)):
        for x in range(max(0, x0), min(W, x1 + 1)):
            d, t = seg_dist(x + 0.5, y + 0.5, ax, ay, bx, by)
            if d <= width / 2:
                col = colors[-1][1]
                for t_end, c in colors:
                    if t <= t_end:
                        col = c
                        break
                img[y, x] = col


def draw_shoe(img, ankle, shin_angle, color, sole):
    # Toe points perpendicular to the shin, forward.
    ax, ay = ankle
    fx, fy = vec(shin_angle + 90, 1.0)  # forward direction
    # foot as a short thick segment from heel to toe
    heel = (ax - fx * 0.8, ay - fy * 0.8 + 0.6)
    toe = (ax + fx * 3.2, ay + fy * 3.2 + 0.6)
    draw_seg(img, heel, toe, 2.2, [(1.0, color)])


def leg(img, hip, thigh, flex, back, shorts=True):
    skin = EARTH if back else SAND
    shoe = DEEP if back else ORANGE
    knee = (hip[0] + vec(thigh, 5.2)[0], hip[1] + vec(thigh, 5.2)[1])
    shin_a = thigh - flex
    ank = (knee[0] + vec(shin_a, 5.0)[0], knee[1] + vec(shin_a, 5.0)[1])
    draw_seg(img, hip, knee, 2.6, [(0.55, INK if shorts else skin), (1.0, skin)])
    draw_seg(img, knee, ank, 2.1, [(0.8, skin), (1.0, WHITE if not back else STONE)])
    draw_shoe(img, ank, shin_a, shoe, WHITE)
    return ank


def arm(img, shoulder, upper, flex, back, sleeve):
    skin = EARTH if back else SAND
    sl = sleeve
    if sl is not None and back:
        sl = DEEP if sl == ORANGE else sl
    elbow = (shoulder[0] + vec(upper, 3.6)[0], shoulder[1] + vec(upper, 3.6)[1])
    fore_a = upper + flex
    hand = (elbow[0] + vec(fore_a, 3.4)[0], elbow[1] + vec(fore_a, 3.4)[1])
    if sl is None:
        draw_seg(img, shoulder, elbow, 2.0, [(1.0, skin)])
        draw_seg(img, elbow, hand, 1.9, [(1.0, skin)])
    elif sl == "long":
        c = DEEP if back else ORANGE
        draw_seg(img, shoulder, elbow, 2.1, [(1.0, c)])
        draw_seg(img, elbow, hand, 1.9, [(0.75, c), (1.0, skin)])
    else:
        draw_seg(img, shoulder, elbow, 2.1, [(0.6, sl), (1.0, skin)])
        draw_seg(img, elbow, hand, 1.9, [(1.0, skin)])
    return hand


def foot_low(thigh, flex, hip_y):
    knee_y = hip_y + vec(thigh, 5.2)[1]
    ank_y = knee_y + vec(thigh - flex, 5.0)[1]
    return ank_y + 1.6


# Run cycle: (thigh, knee flex) of the near leg per frame; far leg is shifted by 4.
RUN = [(24, 6), (6, 30), (-12, 22), (-30, 12), (-42, 62), (-16, 112), (34, 100), (44, 48)]
BOB = [0, 1, 0, -1, 0, 1, 0, -1]


def compose(pose, variant="tee", head="cap"):
    """pose: dict with legs [(thigh, flex) near, far], arms [(upper, flex) near, far], bob, lean."""
    img = np.full((H, W), T, dtype=np.int16)
    hip_x = 10.5
    (nt, nf), (ft, ff) = pose["legs"]
    # find hip y so the lowest foot touches the ground
    low = max(foot_low(nt, nf, 0), foot_low(ft, ff, 0))
    hip_y = GROUND + 0.4 - low + pose.get("lift", 0)
    hip_y = round(hip_y * 2) / 2
    hip = (hip_x, hip_y)
    tor = TORSO["jacket" if variant == "jacket" else ("singlet" if variant == "singlet" else "tee")]
    tx = int(round(hip_x - 3.5 + pose.get("lean", 1)))
    ty = int(round(hip_y - 9))
    shoulder_near = (tx + 5.0 + (1 if pose.get("lean",0)>0 else 0), ty + 1.8)
    shoulder_far = (tx + 3.0 + (1 if pose.get("lean",0)>0 else 0), ty + 1.8)
    sleeve = None if variant == "singlet" else ("long" if variant == "jacket" else ORANGE)
    (nu, nef), (fu, fef) = pose["arms"]

    arm(img, shoulder_far, fu, fef, True, sleeve)
    leg(img, (hip_x - 0.3, hip_y - 0.5), ft, ff, True)
    if pose.get("lean", 0) > 0:
        top = tor[:4]
        bot = tor[4:]
        blit(img, bot, tx, ty + 4)
        blit(img, top, tx + 1, ty)
    else:
        blit(img, tor, tx, ty)
    # shorts
    for y in range(int(hip_y) - 1, int(hip_y) + 2):
        for x in range(tx, tx + 7):
            if 0 <= y < H and 0 <= x < W:
                img[y, x] = INK
    leg(img, (hip_x + 0.6, hip_y - 0.5), nt, nf, False)
    hd = HEAD[head]
    hx = tx + pose.get("head_dx", 0)
    hy = ty - hd.shape[0] + 1
    blit(img, hd, hx, hy)
    hand = arm(img, shoulder_near, nu, nef, False, sleeve)
    out = outline(img)
    return out[1:-1, 1:-1] if False else out, hand


def run_frame(i, variant="tee", head="cap"):
    nt, nf = RUN[i]
    ft, ff = RUN[(i + 4) % 8]
    # arms swing opposite to the same-side leg
    nu = -0.95 * nt - 5
    fu = -0.95 * ft - 5
    pose = {
        "legs": [(nt, nf), (ft, ff)],
        "arms": [(nu, 95), (fu, 95)],
        "lift": -BOB[i] * 0.0 + (1 if i in (3, 7) else 0),
        "lean": 1,
        "head_dx": 1,
    }
    return compose(pose, variant, head)


def jump_frame(variant="tee", head="cap"):
    pose = {"legs": [(58, 105), (-28, 40)], "arms": [(-50, 80), (60, 70)], "lift": 0, "lean": 1, "head_dx": 1}
    return compose(pose, variant, head)


def fall_frame(variant="tee", head="cap"):
    pose = {"legs": [(30, 40), (-14, 50)], "arms": [(120, 30), (-70, 40)], "lift": 0, "lean": 1, "head_dx": 1}
    return compose(pose, variant, head)


def hurt_frame(variant="tee"):
    pose = {"legs": [(30, 12), (6, 34)], "arms": [(118, 35), (96, 40)], "lift": 0, "lean": 0, "head_dx": -1}
    return compose(pose, variant, "hurt")


def idle_frame(variant="tee", head="cap"):
    pose = {"legs": [(4, 4), (-4, 4)], "arms": [(-6, 20), (8, 20)], "lift": 0, "lean": 0, "head_dx": 0}
    return compose(pose, variant, head)


def cheer_frame(variant="tee", head="cap"):
    pose = {"legs": [(12, 4), (-12, 4)], "arms": [(112, -35), (238, 30)], "lift": 0, "lean": 0, "head_dx": 0}
    return compose(pose, variant, head)

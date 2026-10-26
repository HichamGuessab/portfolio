"""Generate responsive portrait variants from pp.png.

Usage: python -I make_portraits.py <pp.png> <out images dir>
"""
import os
import sys

from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
base = Image.open(src).convert("RGB")
assert base.size == (1024, 1024), base.size

# width: (avif quality, webp quality, unsharp mask or None)
PLAN = {
    768: (72, 84, None),
    576: (72, 84, None),
    384: (74, 85, (0.6, 30, 1)),
    192: (76, 86, (0.6, 45, 1)),
}

for w, (qa, qw, usm) in PLAN.items():
    im = base.resize((w, w), Image.LANCZOS)
    if usm:
        im = im.filter(ImageFilter.UnsharpMask(radius=usm[0], percent=usm[1], threshold=usm[2]))
    p_avif = os.path.join(out, f"portrait-{w}.avif")
    p_webp = os.path.join(out, f"portrait-{w}.webp")
    im.save(p_avif, "AVIF", quality=qa, speed=0, subsampling="4:2:0", advanced={"tune": "iq"})
    im.save(p_webp, "WEBP", quality=qw, method=6)
    print(p_avif, os.path.getsize(p_avif))
    print(p_webp, os.path.getsize(p_webp))
    if w == 768:
        p_jpg = os.path.join(out, "portrait-768.jpg")
        im.save(p_jpg, "JPEG", quality=80, progressive=True, optimize=True, subsampling="4:2:0")
        print(p_jpg, os.path.getsize(p_jpg))

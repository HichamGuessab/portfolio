"""Render favicon / app icons, optimise them, and write favicon.ico.

Usage: python -I make_icons.py <favicon.png> <candidates dir> [--install <src dir>]
Without --install only candidates + metrics are produced.
"""
import io
import os
import shutil
import struct
import sys

import imagequant
import numpy as np
import oxipng
from PIL import Image, ImageFilter

src_path, cand = sys.argv[1], sys.argv[2]
install = sys.argv[sys.argv.index("--install") + 1] if "--install" in sys.argv else None
os.makedirs(cand, exist_ok=True)

DARK = (0x04, 0x0D, 0x39)
FACE = (965, 1060)
PAD = 800  # padding (px) added around the 1900 source so sample boxes never leave the image


def load_source(path):
    """Portrait composited over its ring colour (no white fringe), padded."""
    src = Image.open(path).convert("RGBA")
    a = np.asarray(src).astype(np.float64)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.hypot(xx + 0.5 - w / 2, yy + 0.5 - h / 2) / (w / 2)
    ring = (r > 0.88) & (r < 0.97) & (a[..., 3] == 255)
    fill = tuple(int(round(v)) for v in a[ring][:, :3].mean(0))
    opaque = Image.new("RGB", (w + 2 * PAD, h + 2 * PAD), fill)
    flat = Image.new("RGB", src.size, fill)
    flat.paste(src, (0, 0), src)
    opaque.paste(flat, (PAD, PAD))
    return opaque, src.size[0]


def circle_mask(size, diameter, ss=16):
    """Anti-aliased disc (coverage via ss x ss supersampling), centred in a size x size canvas."""
    n = size * ss
    c = n / 2
    yy, xx = np.mgrid[0:n, 0:n]
    inside = (np.hypot(xx + 0.5 - c, yy + 0.5 - c) <= diameter * ss / 2).astype(np.float64)
    cov = inside.reshape(size, ss, size, ss).mean(axis=(1, 3))
    return Image.fromarray(np.clip(cov * 255 + 0.5, 0, 255).astype(np.uint8), "L")


def render(opaque, src_w, size, diameter, zoom=1.0, center=None, usm=None, bg=None):
    """Return RGBA (bg=None) or RGB (bg given) icon of `size` px with the portrait in a
    circle of `diameter` px. zoom>1 crops tighter around `center` (source px)."""
    cx, cy = center if center else (src_w / 2, src_w / 2)
    src_diam = src_w / zoom                 # source px spanned by the circle diameter
    scale = src_diam / diameter             # source px per output px
    half = size / 2 * scale
    box = (PAD + cx - half, PAD + cy - half, PAD + cx + half, PAD + cy + half)
    rgb = opaque.resize((size, size), Image.LANCZOS, box=box)
    if usm:
        rgb = rgb.filter(ImageFilter.UnsharpMask(radius=usm[0], percent=usm[1], threshold=usm[2]))
    mask = circle_mask(size, diameter)
    if bg is None:
        out = rgb.convert("RGBA")
        out.putalpha(mask)
        return out
    canvas = Image.new("RGB", (size, size), bg)
    canvas.paste(rgb, (0, 0), mask)
    return canvas


opaque, W = load_source(src_path)

SPECS = {
    # name: (size, diameter, kwargs)
    "favicon-16": (16, 16, dict(zoom=1.2, center=FACE, usm=(0.5, 60, 0))),
    "favicon-32": (32, 32, dict(zoom=1.2, center=FACE, usm=(0.6, 50, 0))),
    "favicon-48": (48, 48, dict(zoom=1.2, center=FACE, usm=(0.7, 40, 1))),
    "apple-touch-icon": (180, 156, dict(usm=(0.6, 30, 1), bg=DARK)),        # 12 px = 6.7 % padding
    "icon-192": (192, 192, dict(usm=(0.6, 30, 1))),
    "icon-512": (512, 512, dict(usm=(0.8, 20, 2))),
    "icon-maskable-512": (512, 390, dict(usm=(0.8, 20, 2), bg=DARK)),      # 76.2 % diameter
}


def png_bytes(im):
    b = io.BytesIO()
    im.save(b, "PNG")
    return b.getvalue()


def oxi(data, keep_rgba=False):
    kw = dict(level=6, strip=oxipng.StripChunks.all(), optimize_alpha=True,
              deflate=oxipng.Deflaters.zopfli(15))
    if keep_rgba:
        kw.update(color_type_reduction=False, palette_reduction=False,
                  bit_depth_reduction=False, grayscale_reduction=False)
    return oxipng.optimize_from_memory(data, **kw)


def quantize(im, colors=256):
    rgba = im.convert("RGBA")
    return imagequant.quantize_pil_image(rgba, dithering_level=1.0, max_colors=colors, min_quality=0, max_quality=100)


def err(a, b):
    """Max/mean abs error on premultiplied RGB (so invisible transparent RGB is ignored)."""
    x = np.asarray(a.convert("RGBA")).astype(float)
    y = np.asarray(b.convert("RGBA")).astype(float)
    px = x[..., :3] * x[..., 3:] / 255
    py = y[..., :3] * y[..., 3:] / 255
    d = np.abs(px - py)
    da = np.abs(x[..., 3] - y[..., 3])
    return d.max(), d.mean(), da.max()


results = {}
for name, (size, diam, kw) in SPECS.items():
    im = render(opaque, W, size, diam, **kw)
    lossless = oxi(png_bytes(im), keep_rgba=(name.startswith("favicon-48")))
    q = quantize(im)
    quant = oxi(png_bytes(q))
    open(os.path.join(cand, f"{name}.lossless.png"), "wb").write(lossless)
    open(os.path.join(cand, f"{name}.quant.png"), "wb").write(quant)
    qi = Image.open(io.BytesIO(quant))
    e = err(im, qi)
    results[name] = (im, lossless, quant)
    print(f"{name:18} {im.mode:4} {size}px  lossless={len(lossless):7d} B  quant256={len(quant):7d} B  "
          f"quant err max={e[0]:.0f} mean={e[1]:.2f} alpha max={e[2]:.0f}")


def write_ico(frames, path):
    """frames: list of (size, png bytes). PNG-compressed ICO entries, 32 bpp."""
    out = io.BytesIO()
    out.write(struct.pack("<HHH", 0, 1, len(frames)))
    offset = 6 + 16 * len(frames)
    for size, data in frames:
        out.write(struct.pack("<BBBBHHII", size if size < 256 else 0, size if size < 256 else 0,
                              0, 0, 1, 32, len(data), offset))
        offset += len(data)
    for _, data in frames:
        out.write(data)
    open(path, "wb").write(out.getvalue())
    return len(out.getvalue())


# ICO frames: RGBA (colour type 6) PNGs so every ICO consumer is happy.
ico_frames = []
for name, s in (("favicon-16", 16), ("favicon-32", 32), ("favicon-48", 48)):
    ico_frames.append((s, oxi(png_bytes(results[name][0]), keep_rgba=True)))
ico_cand = os.path.join(cand, "favicon.ico")
print("favicon.ico", write_ico(ico_frames, ico_cand), "B", [len(d) for _, d in ico_frames])

if install:
    CHOICE = {  # chosen after visual review: lossless vs quant
        "favicon-16": "quant", "favicon-32": "quant",
        "apple-touch-icon": os.environ.get("ATI", "quant"),
        "icon-192": os.environ.get("I192", "quant"),
        "icon-512": os.environ.get("I512", "quant"),
        "icon-maskable-512": os.environ.get("IM512", "quant"),
    }
    icons_dir = os.path.join(install, "assets", "icons")
    os.makedirs(icons_dir, exist_ok=True)
    for name, kind in CHOICE.items():
        dst = os.path.join(icons_dir, f"{name}.png")
        shutil.copyfile(os.path.join(cand, f"{name}.{kind}.png"), dst)
        print("installed", dst, kind, os.path.getsize(dst))
    shutil.copyfile(ico_cand, os.path.join(install, "favicon.ico"))
    print("installed", os.path.join(install, "favicon.ico"), os.path.getsize(os.path.join(install, "favicon.ico")))

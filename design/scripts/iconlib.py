"""Round-portrait icon rendering helpers."""
import numpy as np
from PIL import Image, ImageFilter

PAD = 800  # padding (px) added around the 1900 source so sample boxes never leave the image


def load_source(path):
    src = Image.open(path).convert("RGBA")
    a = np.asarray(src).astype(np.float64)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.hypot(xx + 0.5 - w / 2, yy + 0.5 - h / 2) / (w / 2)
    ring = (r > 0.88) & (r < 0.97) & (a[..., 3] == 255)
    fill = tuple(int(round(v)) for v in a[ring][:, :3].mean(0))
    opaque = Image.new("RGB", (w + 2 * PAD, h + 2 * PAD), fill)
    flat = Image.new("RGB", src.size, fill)
    flat.paste(src, (0, 0), src)  # composite over the ring colour -> no white fringe
    opaque.paste(flat, (PAD, PAD))
    return opaque, src.size[0], fill


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

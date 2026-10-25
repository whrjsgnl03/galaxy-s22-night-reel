"""Prepare S22 product imagery for the site.

1. Remove the flat white studio background from the press shots (flood fill
   from the borders, so the white phone body is never keyed out).
2. Auto-crop to the product, pad uniformly.
3. Export optimized .webp photos and transparent .png cutouts.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

SRC = Path("assets/source")  # 원본 프레스컷 (배포 대상 아님)
OUT = Path("public/images")

# file -> (max width, mode)
PHOTOS = {
    "s22-hero.jpg": 1600,
    "s22-series.jpg": 1600,
}


def cutout(src: Path, dst_stem: str, max_width: int = 1100, thresh: int = 26) -> Image.Image:
    im = Image.open(src).convert("RGB")
    rgb = im.copy()

    # Flood fill the background from a grid of border seeds (a single corner can
    # be trapped by the phone's shadow or the frame edge).
    key = (255, 0, 255)
    seeds = []
    w, h = im.size
    for x in range(0, w, max(1, w // 24)):
        seeds += [(x, 0), (x, h - 1)]
    for y in range(0, h, max(1, h // 24)):
        seeds += [(0, y), (w - 1, y)]

    filled = rgb.copy()
    for seed in seeds:
        try:
            if filled.getpixel(seed) == key:
                continue
            ImageDraw.floodfill(filled, seed, key, thresh=thresh)
        except Exception:
            pass

    # Everything painted with the key colour becomes transparent.
    import numpy as np

    arr = np.asarray(filled)
    hit = np.all(arr == np.array(key, dtype=arr.dtype), axis=-1)
    mask = Image.fromarray((hit * 255).astype("uint8"), "L")

    # Slight erosion-ish feather so no white fringe survives the downsample.
    inner = mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    alpha = Image.eval(inner, lambda v: 255 - v)
    # Blurring shrinks coverage a touch; push near-opaque pixels back to solid.
    alpha = alpha.point(lambda v: 255 if v > 200 else (0 if v < 12 else v))

    out = im.convert("RGBA")
    out.putalpha(alpha)

    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)

    if out.width > max_width:
        ratio = max_width / out.width
        out = out.resize((max_width, round(out.height * ratio)), Image.LANCZOS)

    # 알파를 유지하면서 PNG(≈1MB)보다 훨씬 가벼운 WebP로 내보낸다
    out.save(OUT / f"{dst_stem}.webp", "WEBP", quality=90, method=6)
    return out


def photo(src: Path, dst_stem: str, max_width: int) -> None:
    im = Image.open(src).convert("RGB")
    if im.width > max_width:
        ratio = max_width / im.width
        im = im.resize((max_width, round(im.height * ratio)), Image.LANCZOS)
    im.save(OUT / f"{dst_stem}.webp", "WEBP", quality=88, method=6)


if __name__ == "__main__":
    for name, width in PHOTOS.items():
        p = SRC / name
        if p.exists():
            photo(p, p.stem, width)
            print(f"photo  {p.stem}.webp  {width}px")

    for name, stem in [
        ("s22-pink-gold.jpg", "cut-pink"),
        ("s22-phantom-black.jpg", "cut-black"),
        ("s22-phantom-white.jpg", "cut-white"),
    ]:
        p = SRC / name
        if p.exists():
            im = cutout(p, stem)
            print(f"cutout {stem}.webp  {im.width}x{im.height}")

#!/usr/bin/env python3
"""
Minimal dependency-free PNG sprite pipeline.

Purpose:
- Convert ChatGPT-generated preview sheets into implementation-ready sprite sheets.
- Remove simple dark/gradient backgrounds.
- Detect separated colored assets.
- Trim, resize, and align frames into a horizontal sheet.

This intentionally uses only the Python standard library so it works before
Pillow/OpenCV/ImageMagick are available.
"""

from __future__ import annotations

import argparse
import json
import os
import struct
import sys
import zlib
from collections import deque
from dataclasses import dataclass
from typing import Iterable

PNG_SIG = b"\x89PNG\r\n\x1a\n"


@dataclass
class ImageRGBA:
    width: int
    height: int
    pixels: list[tuple[int, int, int, int]]


@dataclass
class Component:
    pixels: list[int]
    x0: int
    y0: int
    x1: int
    y1: int

    @property
    def area(self) -> int:
        return len(self.pixels)


def _read_chunks(data: bytes) -> Iterable[tuple[bytes, bytes]]:
    if not data.startswith(PNG_SIG):
        raise ValueError("Not a PNG file")
    offset = len(PNG_SIG)
    while offset < len(data):
        length = struct.unpack(">I", data[offset : offset + 4])[0]
        kind = data[offset + 4 : offset + 8]
        chunk = data[offset + 8 : offset + 8 + length]
        yield kind, chunk
        offset += 12 + length
        if kind == b"IEND":
            break


def read_png_rgba(path: str) -> ImageRGBA:
    data = open(path, "rb").read()
    width = height = bit_depth = color_type = interlace = None
    compressed = bytearray()

    for kind, chunk in _read_chunks(data):
        if kind == b"IHDR":
            width, height, bit_depth, color_type, _, _, interlace = struct.unpack(">IIBBBBB", chunk)
        elif kind == b"IDAT":
            compressed.extend(chunk)

    if width is None or height is None:
        raise ValueError("PNG missing IHDR")
    if bit_depth != 8 or interlace != 0:
        raise ValueError("Only 8-bit non-interlaced PNG is supported")
    if color_type not in (2, 6):
        raise ValueError("Only RGB/RGBA PNG is supported")

    channels = 4 if color_type == 6 else 3
    stride = width * channels
    raw = zlib.decompress(bytes(compressed))
    rows: list[bytearray] = []
    offset = 0

    for _ in range(height):
        filter_type = raw[offset]
        offset += 1
        row = bytearray(raw[offset : offset + stride])
        offset += stride
        prev = rows[-1] if rows else bytearray(stride)
        recon = bytearray(stride)
        for i, value in enumerate(row):
            left = recon[i - channels] if i >= channels else 0
            up = prev[i]
            up_left = prev[i - channels] if i >= channels else 0
            if filter_type == 0:
                recon[i] = value
            elif filter_type == 1:
                recon[i] = (value + left) & 255
            elif filter_type == 2:
                recon[i] = (value + up) & 255
            elif filter_type == 3:
                recon[i] = (value + ((left + up) >> 1)) & 255
            elif filter_type == 4:
                p = left + up - up_left
                pa = abs(p - left)
                pb = abs(p - up)
                pc = abs(p - up_left)
                predictor = left if pa <= pb and pa <= pc else up if pb <= pc else up_left
                recon[i] = (value + predictor) & 255
            else:
                raise ValueError(f"Unsupported PNG filter {filter_type}")
        rows.append(recon)

    pixels: list[tuple[int, int, int, int]] = []
    for row in rows:
        for x in range(width):
            base = x * channels
            r, g, b = row[base], row[base + 1], row[base + 2]
            a = row[base + 3] if channels == 4 else 255
            pixels.append((r, g, b, a))
    return ImageRGBA(width, height, pixels)


def write_png_rgba(image: ImageRGBA, path: str) -> None:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    raw = bytearray()
    for y in range(image.height):
        raw.append(0)
        start = y * image.width
        for r, g, b, a in image.pixels[start : start + image.width]:
            raw.extend((r, g, b, a))

    def chunk(kind: bytes, payload: bytes) -> bytes:
        crc = zlib.crc32(kind + payload) & 0xFFFFFFFF
        return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", image.width, image.height, 8, 6, 0, 0, 0)
    data = PNG_SIG + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    open(path, "wb").write(data)


def initial_foreground_mask(image: ImageRGBA, chroma_threshold: int, brightness_threshold: int) -> list[bool]:
    mask = []
    for r, g, b, a in image.pixels:
        high = max(r, g, b)
        low = min(r, g, b)
        chroma = high - low
        is_colored = chroma >= chroma_threshold and high >= brightness_threshold
        is_bright = high >= 210 and chroma >= max(18, chroma_threshold // 2)
        mask.append(a > 0 and (is_colored or is_bright))
    return mask


def dilate(mask: list[bool], width: int, height: int, iterations: int) -> list[bool]:
    current = mask[:]
    for _ in range(iterations):
        nxt = current[:]
        for y in range(height):
            for x in range(width):
                idx = y * width + x
                if current[idx]:
                    continue
                found = False
                for dy in (-1, 0, 1):
                    yy = y + dy
                    if yy < 0 or yy >= height:
                        continue
                    for dx in (-1, 0, 1):
                        xx = x + dx
                        if xx < 0 or xx >= width:
                            continue
                        if current[yy * width + xx]:
                            found = True
                            break
                    if found:
                        break
                nxt[idx] = found
        current = nxt
    return current


def connected_components(mask: list[bool], width: int, height: int, min_area: int) -> list[Component]:
    seen = [False] * len(mask)
    components: list[Component] = []
    for idx, active in enumerate(mask):
        if not active or seen[idx]:
            continue
        q = deque([idx])
        seen[idx] = True
        pixels: list[int] = []
        x0 = width
        y0 = height
        x1 = y1 = 0
        while q:
            cur = q.popleft()
            pixels.append(cur)
            x = cur % width
            y = cur // width
            x0 = min(x0, x)
            y0 = min(y0, y)
            x1 = max(x1, x)
            y1 = max(y1, y)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                xx = x + dx
                yy = y + dy
                if xx < 0 or yy < 0 or xx >= width or yy >= height:
                    continue
                nxt = yy * width + xx
                if mask[nxt] and not seen[nxt]:
                    seen[nxt] = True
                    q.append(nxt)
        if len(pixels) >= min_area:
            components.append(Component(pixels, x0, y0, x1, y1))
    return components


def crop_component(image: ImageRGBA, component: Component, mask: list[bool], padding: int) -> ImageRGBA:
    x0 = max(0, component.x0 - padding)
    y0 = max(0, component.y0 - padding)
    x1 = min(image.width - 1, component.x1 + padding)
    y1 = min(image.height - 1, component.y1 + padding)
    out_w = x1 - x0 + 1
    out_h = y1 - y0 + 1
    pixels: list[tuple[int, int, int, int]] = []
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            idx = y * image.width + x
            r, g, b, a = image.pixels[idx]
            pixels.append((r, g, b, a if mask[idx] else 0))
    return ImageRGBA(out_w, out_h, pixels)


def resize_nearest(image: ImageRGBA, width: int, height: int) -> ImageRGBA:
    pixels: list[tuple[int, int, int, int]] = []
    for y in range(height):
        src_y = min(image.height - 1, int((y + 0.5) * image.height / height))
        for x in range(width):
            src_x = min(image.width - 1, int((x + 0.5) * image.width / width))
            pixels.append(image.pixels[src_y * image.width + src_x])
    return ImageRGBA(width, height, pixels)


def fit_frame(image: ImageRGBA, frame_size: int, occupancy: float) -> ImageRGBA:
    max_size = max(1, int(frame_size * occupancy))
    scale = min(max_size / image.width, max_size / image.height)
    new_w = max(1, round(image.width * scale))
    new_h = max(1, round(image.height * scale))
    resized = resize_nearest(image, new_w, new_h)
    pixels = [(0, 0, 0, 0)] * (frame_size * frame_size)
    ox = (frame_size - new_w) // 2
    oy = (frame_size - new_h) // 2
    for y in range(new_h):
        for x in range(new_w):
            pixels[(oy + y) * frame_size + (ox + x)] = resized.pixels[y * new_w + x]
    return ImageRGBA(frame_size, frame_size, pixels)


def make_sheet(frames: list[ImageRGBA], frame_size: int) -> ImageRGBA:
    out_w = frame_size * len(frames)
    out_h = frame_size
    pixels = [(0, 0, 0, 0)] * (out_w * out_h)
    for i, frame in enumerate(frames):
        for y in range(frame_size):
            for x in range(frame_size):
                pixels[y * out_w + i * frame_size + x] = frame.pixels[y * frame_size + x]
    return ImageRGBA(out_w, out_h, pixels)


def process(args: argparse.Namespace) -> dict:
    image = read_png_rgba(args.input)
    seed = initial_foreground_mask(image, args.chroma_threshold, args.brightness_threshold)
    mask = dilate(seed, image.width, image.height, args.dilate)
    components = connected_components(mask, image.width, image.height, args.min_area)
    components = sorted(components, key=lambda c: c.area, reverse=True)[: args.frames]
    components = sorted(components, key=lambda c: (c.x0 + c.x1) / 2)

    if len(components) != args.frames:
        raise SystemExit(f"Expected {args.frames} components, found {len(components)}. Try --dilate/--min-area/threshold options.")

    frames = [
        fit_frame(crop_component(image, component, mask, args.padding), args.frame_size, args.occupancy)
        for component in components
    ]
    sheet = make_sheet(frames, args.frame_size)
    write_png_rgba(sheet, args.output)
    metadata = {
        "input": args.input,
        "output": args.output,
        "width": sheet.width,
        "height": sheet.height,
        "frameWidth": args.frame_size,
        "frameHeight": args.frame_size,
        "frameCount": args.frames,
        "components": [
            {"x0": c.x0, "y0": c.y0, "x1": c.x1, "y1": c.y1, "area": c.area}
            for c in components
        ],
    }
    if args.metadata:
        os.makedirs(os.path.dirname(args.metadata) or ".", exist_ok=True)
        with open(args.metadata, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
    return metadata


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert generated PNG preview into a horizontal sprite sheet.")
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--frames", type=int, default=5)
    parser.add_argument("--frame-size", type=int, default=64)
    parser.add_argument("--chroma-threshold", type=int, default=34)
    parser.add_argument("--brightness-threshold", type=int, default=42)
    parser.add_argument("--dilate", type=int, default=10)
    parser.add_argument("--padding", type=int, default=8)
    parser.add_argument("--min-area", type=int, default=1000)
    parser.add_argument("--occupancy", type=float, default=0.92)
    parser.add_argument("--metadata")
    args = parser.parse_args()
    metadata = process(args)
    print(json.dumps(metadata, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

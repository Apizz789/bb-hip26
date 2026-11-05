"""Pixel comparison of captured screenshots. Usage: python3 compare.py <outDir>
Reports page height difference and percentage of pixels whose channel difference exceeds 24/255."""
import sys, os
from PIL import Image, ImageChops
S = sys.argv[1]
routes = ['home', 'services', 'wellness', 'goals', 'contact', 'playground']
widths = [390, 430, 768, 1000, 1440]
print(f"{'width':>6} {'route':<11} {'proto_h':>8} {'react_h':>8} {'h_diff':>7} {'diff%':>7}")
worst = 0.0
for w in widths:
    for r in routes:
        a = Image.open(os.path.join(S, 'proto', f'{r}_{w}.png')).convert('RGB')
        b = Image.open(os.path.join(S, 'react', f'{r}_{w}.png')).convert('RGB')
        H = max(a.height, b.height)
        A = Image.new('RGB', (w, H), (255, 255, 255)); A.paste(a, (0, 0))
        B = Image.new('RGB', (w, H), (255, 255, 255)); B.paste(b, (0, 0))
        px = ImageChops.difference(A, B).convert('L').load()
        diff = sum(1 for y in range(H) for x in range(w) if px[x, y] > 24)
        pct = round(100 * diff / (w * H), 2)
        worst = max(worst, pct)
        print(f"{w:>6} {r:<11} {a.height:>8} {b.height:>8} {a.height - b.height:>7} {pct:>7}")
print(f"worst diff%: {worst}")

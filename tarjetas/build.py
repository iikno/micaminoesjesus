"""Genera 4 propuestas de tarjeta MCJ (90x50 mm + 3 mm de sangrado) como SVG/PDF vectoriales.

Uso:  PYTHONPATH=<carpeta con segno, opencv, svgpathtools> python tarjetas/build.py
Requiere: segno, svgpathtools, pymupdf, pillow, numpy (+ opencv-python-headless para decodificar el QR),
fuentes Space Grotesk y Manrope instaladas y Microsoft Edge (para el PDF con texto vivo).
"""
import math, os, re, subprocess, sys, tempfile, xml.etree.ElementTree as ET
from pathlib import Path

import numpy as np, pymupdf, segno
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from svgpathtools import parse_path

ROOT = Path(__file__).resolve().parent
LOGOS = ROOT.parent / "src" / "assets" / "logos"
FONTS = Path.home() / "AppData/Local/Microsoft/Windows/Fonts"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
TMP = Path(os.environ.get("MCJ_TMP", tempfile.gettempdir()))

NAVY, INK, RED, GOLD, CREAM, SAND, WHITE = "#072f48", "#14293A", "#9c1f1e", "#be982d", "#FAF6EF", "#EBDDBF", "#FFFFFF"
PT = 25.4 / 72
W, H, BL = 96.0, 56.0, 3.0           # pagina con sangrado, sangrado
TX0, TY0, TX1, TY1 = BL, BL, W - BL, H - BL   # trim 3..93 x 3..53
SX0, SY0, SX1, SY1 = TX0 + 5, TY0 + 5, TX1 - 5, TY1 - 5  # zona segura 8..88 x 8..48
SG, MN = "Space Grotesk", "Manrope"
FONTFILE = {(SG, 500): "SpaceGrotesk-Medium", (SG, 600): "SpaceGrotesk-SemiBold", (SG, 700): "SpaceGrotesk-Bold",
            (MN, 400): "Manrope-Regular", (MN, 500): "Manrope-Medium", (MN, 600): "Manrope-SemiBold",
            (MN, 700): "Manrope-Bold", (MN, 800): "Manrope-ExtraBold"}
DATA = dict(nombre="Nombre Apellido", cargo="Cargo o ministerio", whatsapp="222 000 0000",
            correo="hola@micaminoesjesus.org", instagram="@micaminoesjesus", sitio="micaminoesjesus.org")
VCARD = chr(10).join(["BEGIN:VCARD", "VERSION:3.0", "N:Apellido;Nombre", "FN:Nombre Apellido", "ORG:Mi Camino es Jesús",
                    "TEL:+522220000000", "EMAIL:hola@micaminoesjesus.org", "END:VCARD"])
QR_MODULE = 0.42  # mm por modulo (minimo exigido 0.33)

# ---------------------------------------------------------------- logos
def load_logo(name):
    t = (LOGOS / name).read_text("utf8")
    css = {k: v.upper() for k, v in re.findall(r"\.(cls-\d+)\s*\{\s*fill:\s*(#[0-9a-fA-F]+)", t)}
    css = {k: ("#FFFFFF" if v == "#FFF" else v) for k, v in css.items()}
    return [(css[c], d) for c, d in re.findall(r'<path class="([^"]+)" d="([^"]+)"', t)]

R7, R8, R12, R13 = (load_logo(f"Recurso {n}.svg") for n in (7, 8, 12, 13))
VBW, VBH7, VBH8 = 440.91, 320.73, 401.21
assert (len(R7), len(R8), len(R12), len(R13)) == (5, 39, 39, 5)
SYMBOL = R13[2:]          # cruz + 3 curvas (oro, oro, rojo), sin "MC" (solo fondo/grafico)
MARK8, MARK12 = R8[34:], R12[34:]

def path_tags(paths, fill=None, extra=""):
    return "".join(f'<path d="{d}" fill="{fill or c}"{extra}/>' for c, d in paths)

def optical(paths, vbw, vbh):
    """Centro optico en unidades del logo: promedio del centro de la caja y del centroide de masa."""
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vbw} {vbh}" width="{vbw}" height="{vbh}">'
           f'<rect width="{vbw}" height="{vbh}" fill="#fff"/>{path_tags(paths, "#000")}</svg>')
    pdf = pymupdf.open("pdf", pymupdf.open(stream=svg.encode(), filetype="svg").convert_to_pdf())
    pm = pdf[0].get_pixmap(dpi=36)
    a = 255 - np.frombuffer(pm.samples, np.uint8).reshape(pm.h, pm.w, pm.n)[..., 0].astype(float)
    ys, xs = np.mgrid[0:pm.h, 0:pm.w]
    cx, cy = (a * xs).sum() / a.sum() * vbw / pm.w, (a * ys).sum() / a.sum() * vbh / pm.h
    return (cx + vbw / 2) / 2, (cy + vbh / 2) / 2

OPT = {"8": optical(R8, VBW, VBH8), "12": optical(R12, VBW, VBH8), "7": optical(R7, VBW, VBH7)}

def logo(gid, paths, vbh, h, cx=None, cy=None, left=None, right=None, top=None, opt=None):
    """Logo en bloque con transform; se coloca por centro optico (cx,cy) o por bordes."""
    s = h / vbh
    ox, oy = opt if opt else (VBW / 2, vbh / 2)
    x = cx - ox * s if cx is not None else (left if left is not None else right - VBW * s)
    y = cy - oy * s if cy is not None else top
    return f'<g id="{gid}" transform="translate({x:.3f} {y:.3f}) scale({s:.5f})">{path_tags(paths)}</g>', (x, y, VBW * s, vbh * s)

def symbol(gid, s, x, y, fills=None, stroke=None, sw=0.25, patch=None):
    """Cruz + curvas ampliadas (solo fondo). Coordenadas del logo -> x + u*s."""
    out = []
    for i, (c, d) in enumerate(SYMBOL):
        c = fills[i] if fills else c
        a = f'fill="{c}"' if not stroke else f'fill="none" stroke="{stroke[i] if isinstance(stroke, list) else stroke}" stroke-width="{sw/s:.4f}" stroke-linejoin="round"'
        out.append(f'<path d="{d}" {a}/>')
    if patch: out.insert(2, f'<path d="{patch[0]}" fill="{patch[1]}"/>')
    return f'<g id="{gid}" transform="translate({x:.3f} {y:.3f}) scale({s:.5f})">{"".join(out)}</g>'

# ---------------------------------------------------------------- texto
TEXTS = []  # (archivo, id, x0, y0, x1, y1, pt) para el self-check
_fc = {}
def _font(fam, wt):
    k = (fam, wt)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(str(FONTS / (FONTFILE[k] + ".ttf")), 1000)
    return _fc[k]

def text(tid, s, x, y, pt, fam, wt, fill, anchor="start", cur=None):
    """<text> vivo; x se corrige por el sidebearing para alinear la tinta al borde."""
    f = _font(fam, wt); k = pt * PT / 1000
    l, t_, r, b = f.getbbox(s, anchor="ls")
    adv = f.getlength(s)
    if anchor == "start": x0 = x - l * k; tx = x0
    elif anchor == "end": tx = x + (adv - r) * k; x0 = tx - adv * k
    else: tx = x; x0 = x - adv * k / 2
    TEXTS.append((cur or "", tid, x0 + l * k, y + t_ * k, x0 + r * k, y + b * k, pt))
    return (f'<text id="{tid}" x="{tx:.3f}" y="{y:.3f}" font-family="{fam}" font-weight="{wt}" '
            f'font-size="{pt * PT:.3f}" fill="{fill}"' + (f' text-anchor="{anchor}"' if anchor != "start" else "") + f'>{s}</text>')

def capy(top, pt, fam, wt):
    """Baseline para que la altura de versal 'H' empiece en y=top."""
    f = _font(fam, wt); return top - f.getbbox("H", anchor="ls")[1] * pt * PT / 1000

# ---------------------------------------------------------------- iconos (trazo, rejilla 24)
ICONS = {
    "whatsapp": '<path d="M3.5 20.5l1.3-4.7a8.5 8.5 0 1 1 3.3 3.2z"/><path d="M9.3 8.7c-.3.5-.3 1.1 0 1.7.9 1.7 2.2 3 3.9 3.9.6.3 1.2.3 1.7-.1l.6-.6c.2-.2.2-.5 0-.7l-1.2-.9c-.2-.2-.5-.1-.7.1l-.4.4a5 5 0 0 1-1.7-1.7l.4-.4c.2-.2.3-.5.1-.7l-.9-1.2c-.2-.2-.5-.2-.7 0z"/>',
    "correo": '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.8 7.4 12 13.4l8.2-6"/>',
    "instagram": '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".5"/>',
    "sitio": '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M4.4 7.5h15.2M4.4 16.5h15.2"/>',
}
def icon(kind, cx, cy, size, color, sw):
    s = size / 24
    return (f'<g id="icono-{kind}" transform="translate({cx - size / 2:.3f} {cy - size / 2:.3f}) scale({s:.5f})" fill="none" '
            f'stroke="{color}" stroke-width="{sw / s:.3f}" stroke-linecap="round" stroke-linejoin="round">{ICONS[kind]}</g>')

# ---------------------------------------------------------------- QR
QR = segno.make(VCARD, error="l", boost_error=False, micro=False, encoding="utf-8")
NMOD = QR.symbol_size(border=0)[0]
def qr_layer(right, bottom, dark, tile_fill, tile_rx=0.0, tile=True):
    """Camino unico del QR; (right,bottom) = borde visible (sin zona de silencio). Devuelve (svg, (x,y,lado,tile_x,tile_y,tile_lado))."""
    side = NMOD * QR_MODULE; x, y = right - side, bottom - side; q = 4 * QR_MODULE
    d = []
    for r, row in enumerate(QR.matrix):
        c = 0
        while c < NMOD:
            if row[c]:
                e = c
                while e < NMOD and row[e]: e += 1
                d.append(f"M{x + c * QR_MODULE:.3f} {y + r * QR_MODULE:.3f}h{(e - c) * QR_MODULE:.3f}v{QR_MODULE:.3f}h-{(e - c) * QR_MODULE:.3f}z")
                c = e
            else: c += 1
    t = "" if not tile else f'<rect id="qr-fondo" x="{x - q:.3f}" y="{y - q:.3f}" width="{side + 2 * q:.3f}" height="{side + 2 * q:.3f}" rx="{tile_rx}" fill="{tile_fill}"/>'
    return t + f'<path id="qr-vcard" d="{"".join(d)}" fill="{dark}"/>', (x, y, side, x - q, y - q, side + 2 * q)

# ---------------------------------------------------------------- SVG
def guias():
    r = lambda i, x, y, w, h, c, extra="": f'<rect id="{i}" x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{c}" stroke-width="0.15"{extra}/>'
    return (r("guia-sangrado", 0, 0, W, H, "#e6007e") + r("guia-corte", TX0, TY0, 90, 50, "#00a0e3") +
            r("guia-troquel-redondeado", TX0, TY0, 90, 50, "#00a0e3", ' rx="3" stroke-dasharray="1 0.8"') +
            r("guia-seguridad", SX0, SY0, 80, 40, "#00a651", ' stroke-dasharray="0.6 0.6"'))

def svg_doc(bg, fondo="", grafico="", logo_="", textos="", qr="", cur=""):
    L = lambda i, c, a="": f'<g id="{i}"{a}>{c}</g>'
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" width="96mm" height="56mm" viewBox="0 0 96 56">\n'
            + L("Fondo", f'<rect id="fondo-color" x="0" y="0" width="96" height="56" fill="{bg}"/>{fondo}') + "\n"
            + L("Grafico", grafico) + "\n" + L("Logo", logo_) + "\n" + L("Textos", textos) + "\n" + L("QR", qr) + "\n"
            + L("Guias", guias(), ' display="none"') + "\n</svg>\n")

# ---------------------------------------------------------------- geometria derivada de las curvas
def sample_subpaths(d, n=500):
    out = []
    for sp in parse_path(d).continuous_subpaths():
        pts = [sp.point(t) for t in np.linspace(0, 1, n)]
        out.append(np.array([[p.real, p.imag] for p in pts]))
    return out

def crescent(d, n=80):
    """Creciente (curva roja): (eje, borde1, borde2) entre las puntas superior e inferior; el eje es el promedio de los bordes."""
    sp = max(sample_subpaths(d, 4000), key=len)[:-1]
    top, bot = sp[:, 1].argmin(), sp[:, 1].argmax()
    idx = np.roll(np.arange(len(sp)), -top); sp = sp[idx]; b = int(np.where(idx == bot)[0][0])
    def rs(p):
        s = np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]; u = np.linspace(0, s[-1], n)
        return np.c_[np.interp(u, s, p[:, 0]), np.interp(u, s, p[:, 1])]
    e1, e2 = rs(sp[:b + 1]), rs(np.r_[sp[b:], sp[:1]][::-1])
    return (e1 + e2) / 2, e1, e2

def centerline(d, n=80): return crescent(d, n)[0]

CRES = crescent(R13[4][1], 160)
def ribbon(off, wscale, t0=0.0, t1=1.0, n=90):
    """Cinta afilada en las dos puntas (derivada del eje y el ancho reales de la curva roja), desplazada `off` unidades por la normal."""
    cl, e1, e2 = CRES; N = len(cl); w = np.hypot(*(e1 - e2).T)
    tg = np.gradient(cl, axis=0); tg /= np.hypot(*tg.T)[:, None]; nr = np.c_[-tg[:, 1], tg[:, 0]]
    g = lambda a, u: np.c_[np.interp(u, np.arange(N), a[:, 0]), np.interp(u, np.arange(N), a[:, 1])]
    pos = np.linspace(t0, t1, n) * (N - 1); prof = np.interp(np.linspace(0, 1, n) * (N - 1), np.arange(N), w) * wscale
    c, nn = g(cl, pos), g(nr, pos)
    L, R = c + nn * (off + prof[:, None] / 2), c + nn * (off - prof[:, None] / 2)
    return smooth_d(L) + smooth_d(R[::-1], move=False) + "z"

def subpath_points(d, step_units):
    out = []
    for sp in parse_path(d).continuous_subpaths():
        n = max(20, int(sp.length() / step_units)); out.append(np.array([[p.real, p.imag] for p in (sp.point(t) for t in np.linspace(0, 1, n))]))
    return out

def runs_where(P, keep):
    runs, cur = [], []
    for p, k in zip(P, keep):
        if k: cur.append(p)
        elif cur: runs.append(cur); cur = []
    if cur: runs.append(cur)
    return [r for r in runs if len(r) > 2]

def in_ellipse(P, cx, cy, rx, ry): return ((P[:, 0] - cx) / rx) ** 2 + ((P[:, 1] - cy) / ry) ** 2 < 1
def on_page(P, m=1.5): return (P[:, 0] > -m) & (P[:, 0] < W + m) & (P[:, 1] > -m) & (P[:, 1] < H + m)

def smooth_d(pts, move=True):
    """Polilinea suavizada -> cubicas Catmull-Rom."""
    p = pts; d = f"M{p[0][0]:.2f} {p[0][1]:.2f}" if move else ""
    for i in range(len(p) - 1):
        a, b, c, e = p[max(i - 1, 0)], p[i], p[i + 1], p[min(i + 2, len(p) - 1)]
        c1, c2 = b + (c - a) / 6, c - (e - b) / 6
        d += f"C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {c[0]:.2f} {c[1]:.2f}"
    return d

# ================================================================ PROPUESTAS
def A():
    lg, _ = logo("logo-recurso8", R8, VBH8, 27, cx=W / 2, cy=H / 2, opt=OPT["8"])
    f = svg_doc(NAVY, logo_=lg, cur="A/frente")
    lg, (lx, ly, lw, lh) = logo("logo-recurso13", R13, VBH7, 11, right=SX1, top=SY0)
    ink_top = SY0
    n = text("nombre", DATA["nombre"], SX0, capy(ink_top, 13, SG, 500), 13, SG, 500, NAVY, cur="A/vuelta")
    c = text("cargo", DATA["cargo"], SX0, capy(ink_top, 13, SG, 500) + 5.1, 7.5, MN, 600, RED, cur="A/vuelta")
    ys = {"sitio": 48 - 0.0, "instagram": 43.8, "correo": 37.0, "whatsapp": 32.8}
    info = "".join(text(k, DATA[k], SX0, y, 7, MN, 500, INK, cur="A/vuelta") for k, y in ys.items())
    q, _ = qr_layer(SX1, SY1, INK, CREAM)
    return f, svg_doc(CREAM, logo_=lg, textos=n + c + info, qr=q)

TONE = "#10456a"
B_FRONT = dict(s=0.32, x=-91.0, y=-6.4)
def B():
    # frente: cruz+curvas gigantes en azul tonal (curva roja real) recortadas por arriba/izq/abajo
    s = B_FRONT["s"]
    g = symbol("grafico-cruz-curvas", s, B_FRONT["x"], B_FRONT["y"], fills=[TONE, TONE, RED], patch=("M351 118.5H372L351 134z", TONE))  # parche: tapa el hueco del cruce brazo/curva
    lg, _ = logo("logo-recurso8", R8, VBH8, 25, cx=70.5, cy=28, opt=OPT["8"])
    f = svg_doc(NAVY, grafico=g, logo_=lg, cur="B/frente")
    # vuelta
    bg = "#FBF8F1"
    # panel navy a sangre (x 63..96) con las curvas tonales del frente; se coloca para que nada pase de x=63 (sin clipPath)
    s = 0.30
    ds = [ribbon(24, 0.85, 0.0, 0.85), ribbon(-25, 0.78, 0.04, 1.0), R13[4][1]]  # cinta izquierda acortada para que su cola no pase de x=63
    xmin = min(P[:, 0].min() for d in ds for P in sample_subpaths(d, 400))
    tx = 63.6 - xmin * s; ty = 30 - 130 * s
    gv = (f'<g id="grafico-curvas" transform="translate({tx:.3f} {ty:.3f}) scale({s})"><path d="{ds[0]}" fill="{TONE}"/>'
          f'<path d="{ds[2]}" fill="{RED}"/><path d="{ds[1]}" fill="{TONE}"/></g>')
    panel = f'<rect id="panel-navy" x="63" y="0" width="33" height="56" fill="{NAVY}"/>'
    side = NMOD * QR_MODULE; qz = 4 * QR_MODULE
    nb = capy(SY0, 14, SG, 700)
    n = text("nombre", DATA["nombre"].upper(), SX0, nb, 14, SG, 700, NAVY, cur="B/vuelta")
    c = text("cargo", DATA["cargo"], SX0, nb + 5.2, 7.5, MN, 600, RED, cur="B/vuelta")
    bx, by, bw, bh = SX0, 24.0, 33.0, 12.5
    box = f'<rect id="caja-whatsapp" x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="none" stroke="{NAVY}" stroke-width="0.25"/>'
    lab = text("whatsapp-titulo", "WhatsApp", bx + 3, by + 4.6, 6.5, MN, 700, RED, cur="B/vuelta")
    num = text("whatsapp", DATA["whatsapp"], bx + 3, by + 9.9, 10, MN, 800, NAVY, cur="B/vuelta")
    oth = "".join(text(k, DATA[k], SX0, y, 7, MN, 500, INK, cur="B/vuelta") for k, y in
                  {"correo": 41.2, "instagram": 44.6, "sitio": 48.0}.items())
    q, _ = qr_layer(78 + side / 2, SY1 - qz, INK, CREAM, tile_rx=1.4)  # tile centrado en 63..93, borde inferior en el margen de 5 mm
    return f, svg_doc(bg, fondo=panel, grafico=gv, textos=box + n + c + lab + num + oth, qr=q)

def C():
    lg, (lx, ly, lw, lh) = logo("logo-recurso8", R8, VBH8, 24, cx=W / 2, cy=25.5, opt=OPT["8"])
    lcx = lx + lw / 2; ucx, ucy = lcx, 46.6   # URL centrada con el eje del logo (la leyenda esta centrada bajo la marca)
    # patron: copias desplazadas del eje de la curva roja; se omiten tramos alrededor del logo y la URL (elipses)
    cl = centerline(R13[4][1], 200); cl = cl - cl.mean(0)
    s = 0.34; lines = []
    for k in range(-26, 50):
        p = cl * s + np.array([48 + k * 1.9 - 22, 28])
        sg = np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]; u = np.arange(0, sg[-1], 0.35)
        P = np.c_[np.interp(u, sg, p[:, 0]), np.interp(u, sg, p[:, 1])]
        keep = on_page(P) & ~in_ellipse(P, lcx, ly + lh / 2, lw / 2 + 5, lh / 2 + 4.5) & ~in_ellipse(P, ucx, ucy, 17.5, 5.2)
        for r in runs_where(P, keep):
            if len(r) < 14: continue  # descarta restos cortos junto a los claros (~5 mm)
            r = np.array(r)[::6].tolist() + [r[-1]]; lines.append(f'<path d="{smooth_d(np.array(r))}"/>')
    patt = f'<g id="patron-lineas" fill="none" stroke="#124a68" stroke-width="0.17" stroke-linecap="round">{"".join(lines)}</g>'
    url = text("sitio", DATA["sitio"], ucx, 47.6, 7, MN, 600, CREAM, "middle", cur="C/frente")
    f = svg_doc(NAVY, grafico=patt, logo_=lg, textos=url, cur="C/frente")
    # vuelta
    X = 10.0
    nb = capy(SY0, 12, SG, 700); cb = nb + 4.9
    tab = f'<rect id="pestana" x="0" y="{SY0}" width="5.5" height="{cb - SY0:.2f}" fill="{NAVY}"/>'
    n = text("nombre", DATA["nombre"], X, nb, 12, SG, 700, NAVY, cur="C/vuelta")
    c = text("cargo", DATA["cargo"], X, cb, 7, MN, 600, RED, cur="C/vuelta")
    rule = f'<path id="regla-oro" d="M{X} 20.2h8" stroke="{GOLD}" stroke-width="0.4" fill="none"/>'
    rows, ics = "", ""
    for i, k in enumerate(["whatsapp", "correo", "instagram", "sitio"]):
        ty = 24.6 + i * 6.0; cyc = ty + 2.3
        rows += f'<rect id="tile-{k}" x="{X}" y="{ty}" width="4.6" height="4.6" rx="1" fill="{NAVY}"/>'
        ics += icon(k, X + 2.3, cyc, 2.9, WHITE, 0.26)
        rows += text(k, DATA[k], X + 7.0, cyc + 0.95, 7, MN, 500, INK, cur="C/vuelta")
    cap = f'<rect id="capsula" x="60" y="{SY0}" width="60" height="16" rx="8" fill="{NAVY}"/>'
    lg, _ = logo("logo-recurso7", R7, VBH7, 9.0, cx=C_LOGO[0], cy=C_LOGO[1])
    q, _ = qr_layer(SX1, SY1, INK, WHITE)
    return f, svg_doc(WHITE, fondo=tab + cap, grafico="", logo_=lg, textos=n + c + rule + rows + ics, qr=q)
C_LOGO = (77.0, SY0 + 8)

D_S, D_X, D_Y = 0.30, -27.0, -14.0
D_RIBBONS = [(24, 0.85, 0.0, 0.97, GOLD), (-25, 0.78, 0.04, 1.0, GOLD)]  # (desplazamiento, ancho, t0, t1, color)
def D():
    gold = [f'<path d="{ribbon(o, w, a, b)}" fill="{c}"/>' for o, w, a, b, c in D_RIBBONS]
    g = (f'<g id="grafico-curvas" transform="translate({D_X} {D_Y}) scale({D_S})">{gold[0]}'
         f'<path d="{R13[4][1]}" fill="{RED}"/>{gold[1]}</g>')
    lg, _ = logo("logo-recurso12", R12, VBH8, 25, left=TX0 + 12.5, top=TY0 + 12.5)
    f = svg_doc(CREAM, grafico=g, logo_=lg, cur="D/frente")
    # vuelta
    nb = capy(SY0, 13, SG, 500)
    n = text("nombre", DATA["nombre"], SX0, nb, 13, SG, 500, CREAM, cur="D/vuelta")
    c = text("cargo", DATA["cargo"], SX0, nb + 5.1, 7.5, MN, 600, GOLD, cur="D/vuelta")
    tx, ics = "", ""
    for i, k in enumerate(["whatsapp", "correo", "instagram", "sitio"]):
        cyc = 25.4 + i * 5.7
        ics += icon(k, SX0 + 1.6, cyc, 3.2, GOLD, 0.2)
        tx += text(k, DATA[k], SX0 + 5.4, cyc + 0.95, 7, MN, 500, CREAM, cur="D/vuelta")
    lg, _ = logo("logo-recurso7", R7, VBH7, 7.0, right=SX1, top=SY0)
    q, _ = qr_layer(SX1 - 4 * QR_MODULE, SY1 - 4 * QR_MODULE, INK, CREAM, tile_rx=1.4)
    return f, svg_doc(NAVY, logo_=lg, textos=n + c + tx + ics, qr=q)

PROPS = {"A-sereno": A, "B-camino": B, "C-credencial": C, "D-estela": D}

# ================================================================ SALIDA
MM = 72 / 25.4
def write_svgs():
    for name, fn in PROPS.items():
        (ROOT / name).mkdir(exist_ok=True)
        f, v = fn()
        (ROOT / name / "frente.svg").write_text(f, "utf8"); (ROOT / name / "vuelta.svg").write_text(v, "utf8")

def make_pdf(name):
    body = "".join(f'<div class="p">{re.sub(r"^<\?xml[^>]*>", "", (ROOT / name / f"{s}.svg").read_text("utf8"))}</div>' for s in ("frente", "vuelta"))
    html = TMP / f"{name}.html"
    html.write_text('<!doctype html><meta charset="utf-8"><style>@page{size:96mm 56mm;margin:0}html,body{margin:0;padding:0}'
                    '.p{width:96mm;height:56mm;overflow:hidden;break-after:page;position:relative}.p:last-child{break-after:auto}'
                    'svg{display:block;width:96mm;height:56mm}</style>' + body, "utf8")
    raw = TMP / f"{name}-raw.pdf"
    subprocess.run([EDGE, "--headless=new", "--disable-gpu", "--no-pdf-header-footer", f"--user-data-dir={TMP / 'edge'}",
                    f"--print-to-pdf={raw}", html.as_uri()], check=True, capture_output=True, timeout=120)
    d = pymupdf.open(raw)
    for p in d:
        # Chromium redondea el papel (95.93x56.13 mm): se fija el tamano exacto anclado arriba-izquierda (solo cambia sangrado)
        ph = p.mediabox.height; p.set_mediabox(pymupdf.Rect(0, ph - H * MM, W * MM, ph))
    d = pymupdf.open("pdf", d.tobytes())  # recarga para que las cajas nuevas valgan como MediaBox
    for p in d:  # cajas en coordenadas PDF (origen abajo-izquierda), dentro del MediaBox
        y0 = p.mediabox.y0
        box = lambda a, b, c, e: "[%.3f %.3f %.3f %.3f]" % (a * MM, y0 + b * MM, c * MM, y0 + e * MM)
        d.xref_set_key(p.xref, "TrimBox", box(BL, BL, W - BL, H - BL)); d.xref_set_key(p.xref, "BleedBox", box(0, 0, W, H))
    d.save(ROOT / name / "tarjeta.pdf", garbage=3, deflate=True); d.close()

def render_cards(name, width_px):
    """Frente y vuelta recortados al corte (sin sangrado), desde el PDF final."""
    d = pymupdf.open(ROOT / name / "tarjeta.pdf"); z = width_px / (90 * MM); out = []
    for p in d:
        pm = p.get_pixmap(matrix=pymupdf.Matrix(z, z), clip=pymupdf.Rect(BL * MM, BL * MM, (W - BL) * MM, (H - BL) * MM), alpha=False)
        out.append(Image.frombytes("RGB", (pm.w, pm.h), pm.samples))
    return out

def rounded(img, r_mm=3):
    k = 4; r = int(r_mm / 90 * img.width) * k
    m = Image.new("L", (img.width * k, img.height * k), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, m.width - 1, m.height - 1), r, fill=255)
    img = img.convert("RGBA"); img.putalpha(m.resize(img.size, Image.LANCZOS)); return img

def shadowed(canvas, card, xy, blur_px):
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    a = Image.new("L", card.size, 70); a.putalpha = None
    sh.paste((20, 25, 35, 255), (xy[0], xy[1] + blur_px // 2), card.getchannel("A").point(lambda v: v * 0.30))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(blur_px)))
    canvas.alpha_composite(card, xy)

def lab_font(sz, w="SemiBold"): return ImageFont.truetype(str(FONTS / f"Manrope-{w}.ttf"), sz)
BG = (236, 233, 227, 255)

def previews():
    (ROOT / "preview").mkdir(exist_ok=True)
    for name in PROPS:
        fr, vu = (rounded(i) for i in render_cards(name, 1600))
        m = 90; c = Image.new("RGBA", (1600 + 2 * m, 2 * 900 + 3 * m + 40), BG)
        shadowed(c, fr, (m, m + 40), 28); shadowed(c, vu, (m, 2 * m + 40 + fr.height), 28)
        ImageDraw.Draw(c).text((m, 26), f"MCJ  {name}   frente / vuelta   90 x 50 mm", font=lab_font(30), fill=(60, 64, 70))
        c.convert("RGB").save(ROOT / "preview" / f"{name[0]}.png")
    cw, mx, gx = 1050, 90, 120
    imgs = {n: [rounded(i) for i in render_cards(n, cw)] for n in PROPS}
    ch = imgs["A-sereno"][0].height; rowh = 70 + 2 * ch + 40 + 90
    sheet = Image.new("RGBA", (2400, 150 + 2 * rowh), BG); dr = ImageDraw.Draw(sheet)
    dr.text((mx, 50), "Mi Camino es Jesús  ·  tarjetas de presentación  ·  4 propuestas  ·  90 x 50 mm", font=lab_font(34, "Bold"), fill=(40, 44, 52))
    for i, (n, (fr, vu)) in enumerate(imgs.items()):
        x = mx + (i % 2) * (cw + gx); y = 150 + (i // 2) * rowh
        dr.text((x, y), n.replace("-", "  ·  ").upper(), font=lab_font(28, "Bold"), fill=(40, 44, 52))
        shadowed(sheet, fr, (x, y + 60), 18); shadowed(sheet, vu, (x, y + 60 + ch + 40), 18)
    sheet.convert("RGB").save(ROOT / "propuestas.png")

# ================================================================ CHEQUEOS
BAD = ("<style", "filter", "mask", "clipPath", "foreignObject", "<image", "class=", "var(", "<use", "<pattern", "gradient")
def check():
    ok = lambda c, m: (print(("OK   " if c else "FAIL ") + m), c)[1]
    allok = True
    for name in PROPS:
        for s in ("frente", "vuelta"):
            p = ROOT / name / f"{s}.svg"; t = p.read_text("utf8"); root = ET.fromstring(t)
            ids = [g.get("id") for g in root if g.tag.endswith("g")]
            allok &= ok(ids == ["Fondo", "Grafico", "Logo", "Textos", "QR", "Guias"], f"{name}/{s}: capas {ids}")
            allok &= ok(not [b for b in BAD if b in t] and root.get("width") == "96mm" and root.get("viewBox") == "0 0 96 56", f"{name}/{s}: sin style/filter/mask/raster, 96x56")
            allok &= ok(root[-1].get("display") == "none", f"{name}/{s}: Guias oculta")
    for cur, tid, x0, y0, x1, y1, pt in TEXTS:
        if cur.endswith("frente") and cur[0] in "CD" and tid != "sitio": continue
        inside = SX0 - 0.02 <= x0 and x1 <= SX1 + 0.02 and SY0 - 0.15 <= y0 and y1 <= SY1 + 0.7  # 0.7: descendentes pueden pasar la linea base de seguridad
        allok &= ok(inside and pt >= 6.5, f"texto {cur}/{tid} {pt}pt tinta x {x0:.1f}-{x1:.1f} y {y0:.1f}-{y1:.1f} dentro de zona segura")
    allok &= ok(QR_MODULE >= 0.33, f"QR v{QR.version} {NMOD} modulos, {QR_MODULE} mm/modulo, visible {NMOD * QR_MODULE:.1f} mm, con silencio {(NMOD + 8) * QR_MODULE:.1f} mm")
    for name in PROPS:
        d = pymupdf.open(ROOT / name / "tarjeta.pdf"); fonts = {f[3] for p in d for f in p.get_fonts()}
        txt = "".join(p.get_text() for p in d)
        w, h = d[0].rect.width / MM, d[0].rect.height / MM
        allok &= ok(len(d) == 2 and abs(w - 96) < 0.1 and abs(h - 56) < 0.1, f"{name}: PDF {len(d)} paginas {w:.2f}x{h:.2f} mm")
        allok &= ok(all(f[-1] != "n/a" for p in d for f in p.get_fonts(full=True)) and len(fonts) >= 2, f"{name}: fuentes incrustadas {sorted(fonts)}")
        allok &= ok(all(DATA[k] in txt or DATA[k].upper() in txt for k in DATA if k != "cargo") and "Cargo" in txt, f"{name}: texto extraible")
        allok &= ok(not any(p.get_images() for p in d), f"{name}: sin imagenes raster")
        allok &= ok(all(abs(p.trimbox.width / MM - 90) < 0.01 and abs(p.trimbox.height / MM - 50) < 0.01 for p in d), f"{name}: TrimBox 90x50")
    try:
        import cv2
        for name in PROPS:
            img = np.array(render_cards(name, 1600)[1].convert("RGB"))[..., ::-1].copy()
            val, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
            allok &= ok(val == VCARD, f"{name}: QR decodificado del PNG = vCard" if val == VCARD else f"{name}: QR decodificado '{val[:30]}'")
    except ImportError:
        print("SIN VERIFICAR: opencv no disponible, QR no decodificado")
    print("TODO OK" if allok else "HAY FALLOS"); return allok

if __name__ == "__main__":
    write_svgs()
    for n in PROPS: make_pdf(n)
    previews()
    check()

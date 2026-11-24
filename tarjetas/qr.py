"""QR vCard para las tarjetas de Mi Camino es Jesús (SVG vectorial, un solo camino).

Solo requiere:  pip install segno

Ejemplos:
  python qr.py --nombre Juan --apellido "Pérez López" --tel "222 123 4567" -o qr-juan.svg
  python qr.py --nombre Ana --apellido Ruiz --tel 2221234567 --cargo "Coordinadora" --color "#112d31"
  python qr.py --test        (autoprueba)

Mismas reglas que las tarjetas: vCard 3.0, corrección de errores L, módulo de 0.42 mm, zona de silencio de 4 módulos.
build.py importa este archivo, así que hay una sola implementación.
"""
import argparse, re, sys
import segno

MODULE = 0.42        # mm por módulo
MAX_MODULES = 49     # más que esto: el QR queda muy denso; quitar datos (p. ej. --cargo)
ORG = "Mi Camino es Jesús"
EMAIL = "hola@micaminoesjesus.org"
BS, NL = chr(92), chr(10)


def esc(s):
    """Escapa los caracteres especiales de vCard: \\ ; ,"""
    if NL in s or chr(13) in s:
        raise ValueError("los datos no pueden tener saltos de linea")
    return s.replace(BS, BS + BS).replace(";", BS + ";").replace(",", BS + ",")


def telefono(s):
    d = re.sub(r"[\s\-().]", "", s)
    if d.startswith("+52"):
        d = d[3:]
    if not re.fullmatch(r"\d{10}", d):
        raise ValueError("el telefono debe tener 10 digitos (ej. 222 123 4567)")
    return d


def vcard(nombre, apellido, tel, correo=EMAIL, cargo=None):
    if not nombre.strip() or not apellido.strip():
        raise ValueError("nombre y apellido son obligatorios")
    if "@" not in correo:
        raise ValueError("correo no valido")
    n, a = nombre.strip(), apellido.strip()
    lineas = ["BEGIN:VCARD", "VERSION:3.0", f"N:{esc(a)};{esc(n)}", f"FN:{esc(n)} {esc(a)}", f"ORG:{esc(ORG)}"]
    if cargo:
        lineas.append(f"TITLE:{esc(cargo.strip())}")
    lineas += [f"TEL:+52{telefono(tel)}", f"EMAIL:{esc(correo.strip())}", "END:VCARD"]
    return NL.join(lineas)


def make(payload):
    return segno.make(payload, error="l", boost_error=False, micro=False, encoding="utf-8")


def path_d(qr, x, y, module=MODULE):
    """Camino único (corridas horizontales de módulos oscuros) con la esquina superior izquierda en (x, y) mm."""
    d = []
    for r, row in enumerate(qr.matrix):
        c, n = 0, len(row)
        while c < n:
            if row[c]:
                e = c
                while e < n and row[e]:
                    e += 1
                d.append(f"M{x + c * module:.3f} {y + r * module:.3f}h{(e - c) * module:.3f}v{module:.3f}h-{(e - c) * module:.3f}z")
                c = e
            else:
                c += 1
    return "".join(d)


def svg(qr, color="#14293A", fondo="#FAF6EF"):
    n = qr.symbol_size(border=0)[0]
    q = 4 * MODULE
    lado = n * MODULE + 2 * q
    bg = f'<rect id="qr-fondo" width="{lado:.3f}" height="{lado:.3f}" fill="{fondo}"/>' if fondo != "none" else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{lado:.3f}mm" height="{lado:.3f}mm" viewBox="0 0 {lado:.3f} {lado:.3f}">'
            f'<g id="QR">{bg}<path id="qr-vcard" d="{path_d(qr, q, q)}" fill="{color}"/></g></svg>')


def selftest():
    assert esc("a;b,c" + BS + "d") == "a" + BS + ";b" + BS + ",c" + BS + BS + "d"
    assert telefono("222 123-4567") == "2221234567" and telefono("+52 (222) 123 4567") == "2221234567"
    for malo in ("12345", "222 123 45678", "abc"):
        try:
            telefono(malo)
        except ValueError:
            continue
        raise AssertionError("telefono invalido aceptado: " + malo)
    v = vcard("Nombre", "Apellido", "2220000000")
    assert v.splitlines()[2] == "N:Apellido;Nombre" and "TEL:+522220000000" in v and "TITLE" not in v
    q = make(v)
    assert q.symbol_size(border=0)[0] == 45, "el placeholder debe dar 45 modulos (version 7)"
    assert svg(q).count("<path") == 1
    try:
        import cv2, numpy as np, io
        from PIL import Image
        import segno as _s
        buf = io.BytesIO(); q.save(buf, kind="png", scale=8, border=4); buf.seek(0)
        img = np.array(Image.open(buf).convert("RGB"))[..., ::-1].copy()
        assert cv2.QRCodeDetector().detectAndDecode(img)[0] == v, "el QR no decodifica a la vCard"
        print("decodificacion OK")
    except ImportError:
        print("(decodificacion no verificada: falta opencv-python-headless)")
    print("qr.py: autoprueba OK")


def main(argv=None):
    ap = argparse.ArgumentParser(description="QR vCard de tarjeta MCJ")
    ap.add_argument("--nombre"); ap.add_argument("--apellido"); ap.add_argument("--tel", help="10 digitos")
    ap.add_argument("--correo", default=EMAIL); ap.add_argument("--cargo", help="opcional (agrega modulos)")
    ap.add_argument("--color", default="#14293A", help="color de los módulos (oscuro)")
    ap.add_argument("--fondo", default="#FAF6EF", help="color del tile claro o 'none'")
    ap.add_argument("-o", "--salida", default="qr.svg"); ap.add_argument("--test", action="store_true")
    a = ap.parse_args(argv)
    if a.test:
        return selftest()
    if not (a.nombre and a.apellido and a.tel):
        ap.error("faltan --nombre, --apellido y --tel")
    try:
        q = make(vcard(a.nombre, a.apellido, a.tel, a.correo, a.cargo))
    except ValueError as e:
        sys.exit(f"error: {e}")
    n = q.symbol_size(border=0)[0]
    if n > MAX_MODULES:
        print(f"AVISO: {n} módulos (> {MAX_MODULES}): QR denso a {MODULE} mm; quita el cargo u otros datos.", file=sys.stderr)
    open(a.salida, "w", encoding="utf8").write(svg(q, a.color, a.fondo))
    print(f"{a.salida}: {n} módulos, {n * MODULE:.1f} mm visibles, {(n + 8) * MODULE:.1f} mm con zona de silencio")


if __name__ == "__main__":
    main()

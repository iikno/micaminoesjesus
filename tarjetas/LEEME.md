# Tarjetas de presentación MCJ — guía rápida

Carpeta `final/`: tres familias (`mcj`, `peregrinos`, `xp-lev`). Cada una trae:

- `frente.svg`, `vuelta.svg`, `vuelta-nombre-largo.svg` (editables)
- `tarjeta.pdf` (frente + vuelta) y `tarjeta-nombre-largo.pdf` (frente + vuelta con nombre en 2 líneas)

Los datos que ves son de ejemplo ("Nombre Apellido", "222 000 0000"...). Hay que cambiarlos por los de cada persona.

## Fuentes (instalarlas antes de abrir nada)

- **Space Grotesk** (Medium): nombre.
- **Manrope** (Medium, SemiBold): cargo y datos de contacto.

Sin ellas, Illustrator y Canva cambian la letra. El emblema de `xp-lev` ya viene en contornos: no necesita Cinzel.

## Medidas e impresión

- Tarjeta: **90 x 50 mm**. Cada archivo mide **96 x 56 mm** porque incluye **3 mm de sangrado** por lado.
- Esquinas redondeadas de **3 mm**: se hacen con el troquel, no están en el arte. Todo el fondo llega al borde del sangrado.
- Margen de seguridad: nada de texto a menos de 5 mm del corte.
- Los archivos están en **RGB**. Pide a la imprenta la conversión a CMYK y una prueba de color, sobre todo del navy `#072f48`, el dorado `#be982d` y el café del emblema de Peregrinos.
- Capa `Guias` (oculta): trae sangrado, corte, troquel y zona segura. Muéstrala para revisar y vuelve a ocultarla antes de exportar.

## Illustrator

1. Abre el `.svg` (Archivo > Abrir). Las capas son `Fondo`, `Grafico`, `Logo`, `Textos`, `QR` y `Guias`.
2. Edita cada línea con la herramienta Texto: `nombre`, `cargo`, `whatsapp`, `correo`, `instagram`, `sitio`. En el nombre largo son `nombre-1` y `nombre-2`.
3. No toques `Logo` ni `Grafico`.
4. Exporta PDF con sangrado: Archivo > Guardar como > PDF, marca "Usar marcas de corte y sangrado" con 3 mm. Si tu artboard ya es de 96 x 56 mm, basta con exportar el artboard completo.

## Canva

1. Crea un diseño personalizado de 96 x 56 mm (o importa el `tarjeta.pdf`: el texto se puede editar y queda un frente y una vuelta).
2. Instala las fuentes en Canva (Kit de marca > Fuentes) si no se ven bien.
3. Cambia el texto. Para el QR, borra el grupo viejo y sube el SVG nuevo (ver abajo) en esa misma esquina, a la misma medida.
4. Descarga como **PDF para impresión** con sangrado.

## Hacer el QR de una persona

Solo necesitas Python y `pip install segno`:

```
python qr.py --nombre Ana --apellido "Pérez López" --tel "222 123 4567" -o qr-ana.svg
```

- Opciones: `--correo` (por defecto hola@micaminoesjesus.org), `--cargo` (opcional, agrega módulos), `--color "#112d31"` (módulos; usa el color de la familia: navy `#14293A`, café `#241912`, verde `#112d31`), `--fondo none` si quieres QR sin tile.
- Valida que el teléfono tenga 10 dígitos y escapa comas y punto y coma.
- Mide ~19 mm con 4 módulos de silencio (22.3 mm). Si avisa que pasa de 49 módulos, quita el cargo.
- Reemplazar en Illustrator o Canva: borra el grupo `QR`, coloca el nuevo SVG con el borde derecho a 5 mm del corte (x = 88 mm) y la base a 48 mm (y). No lo reduzcas: cada módulo debe medir al menos 0.33 mm.
- Prueba siempre con un celular antes de imprimir.

## Nombres largos

Usa `vuelta-nombre-largo.svg` o `tarjeta-nombre-largo.pdf`: el nombre baja a dos líneas de 12 pt (unos 28 caracteres por línea). Para el cargo y datos no hay cambios. Ejemplo que cabe: "Pbro. Lic. Cristopher" / "Cortés Pliego".

## Regenerar todo desde cero

`python build.py final` (requiere segno, svgpathtools, pymupdf, pillow, numpy, fonttools, opencv-python-headless, Microsoft Edge y las fuentes). Genera SVG, PDF, vistas previas y corre las comprobaciones.

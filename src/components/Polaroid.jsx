// Foto de persona con marco inclinado y cinta dorada (lenguaje C).
export default function Polaroid({ foto, nombre, rol, alt }) {
  return (
    <figure className="p">
      <div className="ph">{foto && <img src={foto} alt={alt || nombre} loading="lazy" />}</div>
      <figcaption><b>{nombre}</b>{rol}</figcaption>
    </figure>
  );
}

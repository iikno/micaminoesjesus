// Foto de persona con marco inclinado y cinta dorada (lenguaje C).
export default function Polaroid({ foto, nombre, rol }) {
  return (
    <figure className="p">
      <div className="ph"><img src={foto} alt={nombre} loading="lazy" /></div>
      <figcaption><b>{nombre}</b>{rol}</figcaption>
    </figure>
  );
}

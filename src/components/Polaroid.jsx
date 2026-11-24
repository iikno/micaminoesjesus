// Foto de persona en marco tipo polaroid con cinta crema.
export default function Polaroid({ foto, nombre, rol, alt }) {
  return (
    <figure className="p">
      <div className="ph">{foto && <img src={foto} alt={alt || nombre} loading="lazy" />}</div>
      <figcaption><b>{nombre}</b>{rol}</figcaption>
    </figure>
  );
}

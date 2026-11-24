// Decorative scrolling strip. The label carries the content for assistive tech; the moving copy is hidden from it.
// With prefers-reduced-motion the CSS shows a single static, wrapped set.
export default function Marquee({ items, label }) {
  return (
    <div className="marq" role="img" aria-label={label}>
      <div className="track" aria-hidden="true">
        {[0, 1].map((n) => (
          <div key={n} className={`set${n ? ' dup' : ''}`}>
            {items.map((m, i) => <span key={i} style={{ '--dot': m.color }}>{m.text}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}

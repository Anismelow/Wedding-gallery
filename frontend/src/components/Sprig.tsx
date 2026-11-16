// Dos ramas de olivo que se encuentran en el centro: el único adorno.
// Las hojas se calculan con un bucle en vez de dibujarlas una a una.

const LEAF = "M0 0C5-5 13-5 18 0C13 5 5 5 0 0Z";

function Branch({ mirrored = false }: { mirrored?: boolean }) {
  const leaves = Array.from({ length: 6 }, (_, i) => {
    const t = (i + 1) / 7;
    // Punto sobre la curva del tallo (Bézier cuadrática).
    const x = 2 * (1 - t) * t * 50 + t * t * 104;
    const y = (1 - t) * (1 - t) * 30 + 2 * (1 - t) * t * 14 + t * t * 30;
    const up = i % 2 === 0;
    return { x, y, angle: up ? -52 + t * 20 : 128 - t * 20 };
  });

  return (
    <g transform={mirrored ? "translate(240 0) scale(-1 1)" : undefined}>
      <path d="M0 30Q50 14 104 30" />
      {leaves.map((leaf, i) => (
        <path
          key={i}
          d={LEAF}
          transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.angle + 180})`}
        />
      ))}
    </g>
  );
}

export function Sprig({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 56"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Branch />
      <Branch mirrored />
      <circle cx="120" cy="30" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

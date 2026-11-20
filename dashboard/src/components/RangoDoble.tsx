interface Props {
  min: number
  max: number
  valor: [number, number]
  onCambiar: (v: [number, number]) => void
  desactivado?: boolean
}

// Barra con dos controles (mínimo y máximo) hecha con dos input range superpuestos.
export default function RangoDoble({ min, max, valor, onCambiar, desactivado = false }: Props) {
  const [bajo, alto] = valor
  const total = Math.max(max - min, 1)
  const izquierda = ((bajo - min) / total) * 100
  const derecha = ((alto - min) / total) * 100

  return (
    <div className={`relative h-6 ${desactivado ? 'opacity-50' : ''}`}>
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-neutral-700" />
      <div
        className={`absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full ${desactivado ? 'bg-neutral-500' : 'bg-bermellon-500'}`}
        style={{ left: `${izquierda}%`, width: `${derecha - izquierda}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={bajo}
        disabled={desactivado}
        aria-label="Edad mínima"
        onChange={(e) => onCambiar([Math.min(Number(e.target.value), alto), alto])}
        className="rango-doble absolute inset-0 h-6 w-full"
        // Si el mínimo llega al tope, queda encima para poder moverlo de regreso.
        style={{ zIndex: bajo >= max - 1 ? 4 : 3 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={alto}
        disabled={desactivado}
        aria-label="Edad máxima"
        onChange={(e) => onCambiar([bajo, Math.max(Number(e.target.value), bajo)])}
        className="rango-doble absolute inset-0 h-6 w-full"
        style={{ zIndex: 3 }}
      />
    </div>
  )
}

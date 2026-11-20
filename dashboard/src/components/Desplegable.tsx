import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props {
  etiqueta: string
  resumen: ReactNode
  children: ReactNode
  ancho?: string
}

// Botón con panel desplegable; se cierra al hacer clic fuera o con Escape.
export default function Desplegable({ etiqueta, resumen, children, ancho = 'w-64' }: Props) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const alClic = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', alClic)
    document.addEventListener('keydown', alTecla)
    return () => {
      document.removeEventListener('mousedown', alClic)
      document.removeEventListener('keydown', alTecla)
    }
  }, [abierto])

  return (
    <div ref={ref} className="relative">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400">{etiqueta}</span>
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="flex w-full min-w-[11rem] items-center justify-between gap-2 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-left text-sm text-neutral-200 shadow-sm hover:border-neutral-500"
      >
        <span className="flex min-w-0 items-center gap-1 truncate">{resumen}</span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true">
          <path d="M5.2 7.2a.75.75 0 0 1 1.06 0L10 10.94l3.74-3.74a.75.75 0 1 1 1.06 1.06l-4.27 4.27a.75.75 0 0 1-1.06 0L5.2 8.26a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
      {abierto && (
        <div className={`absolute left-0 z-30 mt-1 ${ancho} rounded-md border border-neutral-800 bg-neutral-900 p-2 shadow-lg`}>{children}</div>
      )}
    </div>
  )
}

interface CasillaProps {
  marcada: boolean
  onCambiar: () => void
  children: ReactNode
}

export function Casilla({ marcada, onCambiar, children }: CasillaProps) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 text-sm hover:bg-neutral-800/60">
      <input type="checkbox" checked={marcada} onChange={onCambiar} className="mt-0.5 h-4 w-4 accent-bermellon-500" />
      <span className="min-w-0">{children}</span>
    </label>
  )
}

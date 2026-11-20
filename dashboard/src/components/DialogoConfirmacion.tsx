import { useEffect, useRef } from 'react'

interface Props {
  titulo: string
  mensaje: string
  textoConfirmar: string
  onConfirmar: () => void
  onCancelar: () => void
}

export default function DialogoConfirmacion({ titulo, mensaje, textoConfirmar, onConfirmar, onCancelar }: Props) {
  const cancelar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelar.current?.focus() // el foco inicia en la opción segura
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelar()
    }
    document.addEventListener('keydown', alTecla)
    return () => document.removeEventListener('keydown', alTecla)
  }, [onCancelar])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onCancelar}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-mensaje"
        className="w-full max-w-md rounded-lg bg-neutral-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="dialogo-titulo" className="text-lg font-bold text-neutral-50">
          {titulo}
        </h3>
        <p id="dialogo-mensaje" className="mt-2 text-sm text-neutral-400">
          {mensaje}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelar}
            type="button"
            onClick={onCancelar}
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800/60"
          >
            Cancelar
          </button>
          <button type="button" onClick={onConfirmar} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

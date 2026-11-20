import { useCallback, useEffect, useMemo, useState } from 'react'
import { compararJugadores, type GrupoJugador, type RespuestaComparar } from '../api'
import Comparacion, { COLORES } from '../components/Comparacion'
import DialogoConfirmacion from '../components/DialogoConfirmacion'
import { formatear } from '../formato'
import type { Guardados as GuardadosHook } from '../hooks/useGuardados'

interface Props {
  guardados: GuardadosHook
  onIrAlBuscador: () => void
}

const MAX_COMPARAR = COLORES.length

const TITULOS: Record<GrupoJugador, string> = {
  qb: 'Quarterbacks',
  rec: 'Receptores (RB, FB, WR, TE)',
  ol: 'Línea ofensiva (T, G, C)',
}

export default function Guardados({ guardados, onIrAlBuscador }: Props) {
  const { guardados: lista, alternar, limpiar } = guardados
  const [datos, setDatos] = useState<RespuestaComparar | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<number[]>([])
  const [confirmando, setConfirmando] = useState(false)

  const ids = useMemo(() => lista.map((g) => g.nflId), [lista])

  useEffect(() => {
    if (ids.length === 0) {
      setDatos(null)
      return
    }
    let vigente = true
    setError(null)
    compararJugadores(ids)
      .then((r) => vigente && setDatos(r))
      .catch((e: Error) => vigente && setError(e.message))
    return () => {
      vigente = false
    }
  }, [ids])

  // Si un jugador deja de estar guardado, también sale de la comparación.
  useEffect(() => {
    setSeleccion((prev) => prev.filter((id) => ids.includes(id)))
  }, [ids])

  const cancelar = useCallback(() => setConfirmando(false), [])

  const jugadores = datos?.jugadores ?? []
  const grupoSeleccion = jugadores.find((j) => j.nflId === seleccion[0])?.grupo
  const comparados = seleccion
    .map((id) => jugadores.find((j) => j.nflId === id))
    .filter((j): j is NonNullable<typeof j> => j !== undefined)

  function alternarSeleccion(id: number) {
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_COMPARAR ? [...prev, id] : prev))
  }

  if (lista.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-bold text-neutral-50">Jugadores guardados</h2>
        <div className="mt-4 rounded-lg border border-dashed border-neutral-700 bg-neutral-900 p-8 text-center">
          <p className="text-neutral-400">Aún no has guardado jugadores.</p>
          <p className="mt-1 text-sm text-neutral-400">En el buscador, usa el icono de marcador antes del nombre para guardar a un jugador.</p>
          <button
            type="button"
            onClick={onIrAlBuscador}
            className="mt-4 rounded-md bg-bermellon-500 px-4 py-2 text-sm font-semibold text-white hover:bg-bermellon-600"
          >
            Ir al buscador
          </button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-neutral-50">Jugadores guardados</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {lista.length} {lista.length === 1 ? 'jugador guardado' : 'jugadores guardados'}. Marca de 2 a {MAX_COMPARAR} jugadores de la misma
            posición para compararlos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="rounded-md border border-red-500/40 bg-neutral-900 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
        >
          Limpiar registro
        </button>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-500/10 p-4 text-sm text-red-300">No se pudieron cargar las estadísticas: {error}</p>}
      {!datos && !error && <p className="mt-4 text-neutral-400">Cargando…</p>}

      {datos &&
        (Object.keys(TITULOS) as GrupoJugador[]).map((grupo) => {
          const delGrupo = jugadores.filter((j) => j.grupo === grupo)
          if (delGrupo.length === 0) return null
          const stats = datos.estadisticas[grupo].filter((e) => e.predeterminada)
          const bloqueado = grupoSeleccion !== undefined && grupoSeleccion !== grupo
          return (
            <div key={grupo} className="mt-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">{TITULOS[grupo]}</h3>
              <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900 shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="text-xs uppercase text-neutral-400">
                    <tr className="border-b-2 border-neutral-800">
                      <th scope="col" className="px-3 py-2 text-left">Comparar</th>
                      <th scope="col" className="px-3 py-2 text-left">Nombre</th>
                      <th scope="col" className="px-3 py-2 text-left">Equipo</th>
                      <th scope="col" className="px-3 py-2 text-right">Edad</th>
                      {stats.map((e) => (
                        <th key={e.clave} scope="col" className="whitespace-nowrap px-3 py-2 text-right" title={e.descripcion}>
                          {e.etiqueta}
                        </th>
                      ))}
                      <th scope="col" className="px-3 py-2">
                        <span className="sr-only">Quitar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {delGrupo.map((j) => {
                      const marcado = seleccion.includes(j.nflId)
                      const lleno = !marcado && seleccion.length >= MAX_COMPARAR
                      const indice = seleccion.indexOf(j.nflId)
                      return (
                        <tr key={j.nflId} className={`border-t border-neutral-800 ${marcado ? 'bg-bermellon-500/10' : 'hover:bg-neutral-800/60'}`}>
                          <td className="px-3 py-1.5">
                            <label className="flex items-center gap-2" title={bloqueado ? 'Solo se comparan jugadores de la misma posición' : lleno ? `Máximo ${MAX_COMPARAR} jugadores` : 'Agregar a la comparación'}>
                              <input
                                type="checkbox"
                                checked={marcado}
                                disabled={bloqueado || lleno}
                                onChange={() => alternarSeleccion(j.nflId)}
                                aria-label={`Comparar a ${j.nombre}`}
                                className="h-4 w-4 accent-bermellon-500 disabled:opacity-40"
                              />
                              {marcado && <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORES[indice] }} aria-hidden="true" />}
                            </label>
                          </td>
                          <td className="whitespace-nowrap px-3 py-1.5 text-neutral-50">
                            {j.nombre} <span className="text-xs font-medium text-bermellon-400">{j.posicion}</span>
                          </td>
                          <td className="px-3 py-1.5 text-neutral-300">{j.equipo}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-neutral-300">{formatear('edad', j.edad)}</td>
                          {stats.map((e) => (
                            <td key={e.clave} className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-neutral-200">
                              {formatear(e.clave, j[e.clave])}
                            </td>
                          ))}
                          <td className="px-3 py-1.5 text-right">
                            <button
                              type="button"
                              onClick={() => alternar(j)}
                              aria-label={`Quitar a ${j.nombre} de guardados`}
                              title="Quitar de guardados"
                              className="rounded p-1 text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

      <div className="mt-8">
        {comparados.length >= 2 && grupoSeleccion ? (
          <Comparacion key={grupoSeleccion} jugadores={comparados} catalogo={datos?.estadisticas[grupoSeleccion] ?? []} />
        ) : (
          datos && (
            <p className="rounded-md border border-dashed border-neutral-700 bg-neutral-900 p-4 text-sm text-neutral-400">
              {comparados.length === 1
                ? 'Marca al menos un jugador más de la misma posición para ver la comparación.'
                : 'Marca jugadores en la columna "Comparar" para ver la comparación con gráficas de barras.'}
            </p>
          )
        )}
      </div>

      {confirmando && (
        <DialogoConfirmacion
          titulo="¿Limpiar el registro?"
          mensaje={`Se quitarán los ${lista.length} jugadores guardados. Esta acción no se puede deshacer.`}
          textoConfirmar="Sí, limpiar"
          onCancelar={cancelar}
          onConfirmar={() => {
            limpiar()
            setSeleccion([])
            setConfirmando(false)
          }}
        />
      )}
    </section>
  )
}

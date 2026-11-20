import { useMemo, useState } from 'react'
import type { Estadistica, Grupo, Jugador } from '../api'
import { formatear } from '../formato'
import type { Guardados } from '../hooks/useGuardados'

interface Props {
  grupo: Grupo
  estadisticas: Estadistica[]
  filas: Jugador[]
  total: Record<string, number | null> | null
  guardados: Guardados
}

interface Orden {
  clave: string
  desc: boolean
}

const FIJAS = [
  { clave: 'nombre', etiqueta: 'Nombre', descripcion: 'Nombre del jugador', izquierda: true },
  { clave: 'equipo', etiqueta: 'Equipo', descripcion: 'Equipo con el que más jugadas tuvo', izquierda: true },
  { clave: 'edad', etiqueta: 'Edad', descripcion: 'Edad al 1 de septiembre de 2021', izquierda: false },
]

function comparar(a: unknown, b: unknown, desc: boolean): number {
  const vacioA = a === null || a === undefined
  const vacioB = b === null || b === undefined
  if (vacioA || vacioB) return vacioA === vacioB ? 0 : vacioA ? 1 : -1 // vacíos siempre al final
  const r = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'es')
  return desc ? -r : r
}

export default function TablaJugadores({ grupo, estadisticas, filas, total, guardados }: Props) {
  const [orden, setOrden] = useState<Orden>({ clave: grupo === 'ol' ? 'blq' : 'yds', desc: true })

  const ordenadas = useMemo(
    () => [...filas].sort((a, b) => comparar(a[orden.clave], b[orden.clave], orden.desc)),
    [filas, orden],
  )

  function ordenarPor(clave: string, menorEsMejor = false) {
    setOrden((o) => (o.clave === clave ? { clave, desc: !o.desc } : { clave, desc: !menorEsMejor && clave !== 'nombre' && clave !== 'equipo' }))
  }

  const encabezado = (clave: string, etiqueta: string, titulo: string, izquierda: boolean, menorEsMejor = false) => {
    const activa = orden.clave === clave
    return (
      <th
        key={clave}
        scope="col"
        aria-sort={activa ? (orden.desc ? 'descending' : 'ascending') : 'none'}
        className={`whitespace-nowrap px-3 py-2 font-semibold ${izquierda ? 'text-left' : 'text-right'} ${activa ? 'bg-bermellon-500/20 text-neutral-50' : ''}`}
      >
        <button
          type="button"
          onClick={() => ordenarPor(clave, menorEsMejor)}
          title={titulo + (menorEsMejor ? ' (menor es mejor)' : '')}
          className="uppercase underline decoration-neutral-600 decoration-dotted underline-offset-4 hover:text-neutral-50"
        >
          {etiqueta}
          {menorEsMejor && <span className="ml-0.5 text-[10px] text-neutral-500" aria-hidden="true">↓</span>}
          {activa && <span className="ml-1" aria-hidden="true">{orden.desc ? '▼' : '▲'}</span>}
        </button>
      </th>
    )
  }

  const celda = (clave: string) => (orden.clave === clave ? 'bg-bermellon-500/10' : '')

  return (
    <div className="max-h-[68vh] overflow-auto rounded-lg border border-neutral-800 bg-neutral-900 shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="sticky top-0 z-10 bg-neutral-900 text-xs text-neutral-400 shadow-[0_1px_0_0_#262626]">
          <tr>
            <th scope="col" className="w-10 px-2 py-2">
              <span className="sr-only">Guardar</span>
            </th>
            {FIJAS.map((f) => encabezado(f.clave, f.etiqueta, f.descripcion, f.izquierda))}
            {estadisticas.map((e) => encabezado(e.clave, e.etiqueta, e.descripcion, e.clave === 'tipo', e.menor_es_mejor))}
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((j) => {
            const guardado = guardados.estaGuardado(j.nflId)
            return (
              <tr key={`${j.nflId}-${j.tipo ?? ''}`} className="border-t border-neutral-800 hover:bg-neutral-800/60">
                <td className="px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => guardados.alternar(j)}
                    aria-pressed={guardado}
                    aria-label={guardado ? `Quitar a ${j.nombre} de guardados` : `Guardar a ${j.nombre}`}
                    title={guardado ? 'Quitar de guardados' : 'Guardar jugador'}
                    className={`rounded p-1 ${guardado ? 'text-bermellon-500' : 'text-neutral-600 hover:text-bermellon-400'}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill={guardado ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinejoin="round" d="M6 4h12v17l-6-4-6 4V4Z" />
                    </svg>
                  </button>
                </td>
                <td className={`whitespace-nowrap px-3 py-1.5 text-neutral-50 ${celda('nombre')}`}>
                  {j.nombre} <span className="text-xs font-medium text-bermellon-400">{j.posicion}</span>
                </td>
                <td className={`px-3 py-1.5 text-neutral-300 ${celda('equipo')}`}>{j.equipo}</td>
                <td className={`px-3 py-1.5 text-right tabular-nums text-neutral-300 ${celda('edad')}`}>{formatear('edad', j.edad)}</td>
                {estadisticas.map((e) => (
                  <td
                    key={e.clave}
                    className={`whitespace-nowrap px-3 py-1.5 tabular-nums text-neutral-200 ${e.clave === 'tipo' ? 'text-left' : 'text-right'} ${celda(e.clave)}`}
                  >
                    {formatear(e.clave, j[e.clave])}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
        {total && ordenadas.length > 1 && (
          <tfoot className="sticky bottom-0 bg-neutral-800/60 font-semibold text-neutral-50 shadow-[0_-1px_0_0_#262626]">
            <tr>
              <td />
              <td className="px-3 py-2" colSpan={3}>
                Total
              </td>
              {estadisticas.map((e) => (
                <td key={e.clave} className={`px-3 py-2 text-right tabular-nums ${celda(e.clave)}`}>
                  {formatear(e.clave, total[e.clave])}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { buscarJugadores, obtenerFiltros, type Filtros, type Grupo, type RespuestaJugadores } from '../api'
import Desplegable, { Casilla } from '../components/Desplegable'
import LogoEquipo from '../components/LogoEquipo'
import RangoDoble from '../components/RangoDoble'
import TablaJugadores from '../components/TablaJugadores'
import { NOMBRES_EQUIPOS } from '../equipos'
import type { Guardados } from '../hooks/useGuardados'

interface Props {
  guardados: Guardados
}

const ETIQUETA = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400'
const CAMPO = 'rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 shadow-sm hover:border-neutral-500'

export default function Buscador({ guardados }: Props) {
  const [filtros, setFiltros] = useState<Filtros | null>(null)
  const [errorFiltros, setErrorFiltros] = useState<string | null>(null)

  const [equipos, setEquipos] = useState<string[]>([])
  const [posicion, setPosicion] = useState('')
  const [columnasPorGrupo, setColumnasPorGrupo] = useState<Partial<Record<Grupo, string[]>>>({})
  // El filtro de edad se activa con un interruptor; apagado = sin mínimo ni máximo.
  const [edadActiva, setEdadActiva] = useState(false)
  const [rango, setRango] = useState<[number, number]>([0, 100])

  const [respuesta, setRespuesta] = useState<RespuestaJugadores | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    obtenerFiltros()
      .then((f) => {
        setFiltros(f)
        setEquipos(f.equipos)
        setRango([f.edad.min, f.edad.max])
      })
      .catch((e: Error) => setErrorFiltros(e.message))
  }, [])

  const [minimo, maximo] = rango

  useEffect(() => {
    if (!filtros || equipos.length === 0) return
    let vigente = true
    const espera = setTimeout(() => {
      setCargando(true)
      setError(null)
      buscarJugadores({
        posicion: posicion || undefined,
        equipos: equipos.length < filtros.equipos.length ? equipos : undefined,
        edadMin: edadActiva ? minimo : undefined,
        edadMax: edadActiva ? maximo : undefined,
      })
        .then((r) => vigente && setRespuesta(r))
        .catch((e: Error) => vigente && setError(e.message))
        .finally(() => vigente && setCargando(false))
    }, 250)
    return () => {
      vigente = false
      clearTimeout(espera)
    }
  }, [filtros, posicion, equipos, edadActiva, minimo, maximo])

  if (errorFiltros) {
    return <p className="rounded-md bg-red-500/10 p-4 text-sm text-red-300">No se pudo conectar con la API: {errorFiltros}</p>
  }
  if (!filtros) return <p className="text-neutral-400">Cargando filtros…</p>

  const grupo: Grupo = filtros.posiciones.find((p) => p.codigo === posicion)?.grupo ?? 'todos'
  const catalogo = filtros.estadisticas[grupo]
  const predeterminadas = catalogo.filter((e) => e.predeterminada).map((e) => e.clave)
  const columnas = columnasPorGrupo[grupo] ?? predeterminadas
  const visibles = catalogo.filter((e) => columnas.includes(e.clave))
  const esPredeterminado = columnasPorGrupo[grupo] === undefined

  const todosLosEquipos = equipos.length === filtros.equipos.length
  const hayFiltros = posicion !== '' || !todosLosEquipos || edadActiva || !esPredeterminado

  function alternarEquipo(eq: string) {
    setEquipos((prev) => (prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]))
  }

  function alternarColumna(clave: string) {
    const nuevas = columnas.includes(clave) ? columnas.filter((c) => c !== clave) : [...columnas, clave]
    if (nuevas.length === 0) return // al menos una estadística visible
    setColumnasPorGrupo((prev) => ({ ...prev, [grupo]: nuevas }))
  }

  function restablecer() {
    if (!filtros) return
    setEquipos(filtros.equipos)
    setPosicion('')
    setEdadActiva(false)
    setRango([filtros.edad.min, filtros.edad.max])
    setColumnasPorGrupo({})
  }

  const resumenEquipos = todosLosEquipos ? (
    'Todos los equipos'
  ) : equipos.length === 0 ? (
    'Ninguno'
  ) : equipos.length <= 4 ? (
    <>
      {equipos.map((eq) => (
        <LogoEquipo key={eq} equipo={eq} tamano="h-5 w-5" />
      ))}
      <span className="ml-1">{equipos.length === 1 ? NOMBRES_EQUIPOS[equipos[0]] ?? equipos[0] : equipos.join(', ')}</span>
    </>
  ) : (
    `${equipos.length} equipos`
  )
  const nombrePosicion = filtros.posiciones.find((p) => p.codigo === posicion)?.nombre

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-neutral-50">Buscador de jugadores ofensivos</h2>
          <p className="mt-1 text-sm text-neutral-400">
            {posicion
              ? `${nombrePosicion} (${posicion}): estadísticas de la temporada 2021, semanas 1 a 8.`
              : 'Sin posición seleccionada: líderes en yardas por pase o por recepción. Elige una posición para ver todas sus estadísticas.'}
          </p>
        </div>
        {hayFiltros && (
          <button type="button" onClick={restablecer} className="text-sm font-medium text-bermellon-400 hover:text-bermellon-300">
            Restablecer filtros
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
        <Desplegable etiqueta="Equipo" resumen={resumenEquipos} ancho="w-[26rem] max-w-[90vw]">
          <Casilla marcada={todosLosEquipos} onCambiar={() => setEquipos(todosLosEquipos ? [] : filtros.equipos)}>
            <span className="font-semibold">Seleccionar todos</span>
          </Casilla>
          <div className="mt-1 grid max-h-80 grid-cols-2 gap-0.5 overflow-y-auto border-t border-neutral-800 pt-1">
            {filtros.equipos.map((eq) => {
              const marcado = equipos.includes(eq)
              return (
                <label
                  key={eq}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm ${marcado ? 'bg-bermellon-500/10' : 'hover:bg-neutral-800/60'}`}
                >
                  <input type="checkbox" checked={marcado} onChange={() => alternarEquipo(eq)} className="h-4 w-4 shrink-0 accent-bermellon-500" />
                  <LogoEquipo equipo={eq} tamano="h-7 w-7" />
                  <span className="min-w-0 leading-tight">
                    <span className="block font-semibold text-neutral-50">{eq}</span>
                    <span className="block truncate text-xs text-neutral-400">{NOMBRES_EQUIPOS[eq] ?? eq}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </Desplegable>

        <label>
          <span className={ETIQUETA}>Posición</span>
          <select value={posicion} onChange={(e) => setPosicion(e.target.value)} className={`${CAMPO} min-w-[13rem]`}>
            <option value="">Todas (líderes en yardas)</option>
            {filtros.posiciones.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </select>
        </label>

        <Desplegable
          etiqueta="Estadísticas"
          resumen={esPredeterminado ? 'Predeterminado' : `${visibles.length} de ${catalogo.length}`}
          ancho="w-80"
        >
          <div className="mb-1 flex gap-2 border-b border-neutral-800 px-2 pb-2">
            <button
              type="button"
              onClick={() => setColumnasPorGrupo((prev) => ({ ...prev, [grupo]: undefined }))}
              className={`rounded px-2 py-1 text-xs font-semibold ${esPredeterminado ? 'bg-bermellon-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
            >
              Predeterminado
            </button>
            <button
              type="button"
              onClick={() => setColumnasPorGrupo((prev) => ({ ...prev, [grupo]: catalogo.map((e) => e.clave) }))}
              className="rounded bg-neutral-800 px-2 py-1 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
            >
              Todas
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {catalogo.map((e) => (
              <Casilla key={e.clave} marcada={columnas.includes(e.clave)} onCambiar={() => alternarColumna(e.clave)}>
                <span className="font-medium">{e.etiqueta}</span>
                <span className="block text-xs text-neutral-400">
                  {e.descripcion}
                  {e.menor_es_mejor ? ' · menor es mejor' : ''}
                </span>
              </Casilla>
            ))}
          </div>
        </Desplegable>

        <fieldset className="w-64">
          <legend className={ETIQUETA}>Rango de edad</legend>
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={edadActiva}
              aria-label="Filtrar por edad"
              onClick={() => setEdadActiva((a) => !a)}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${edadActiva ? 'bg-bermellon-500' : 'bg-neutral-600'}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${edadActiva ? 'translate-x-4' : ''}`}
              />
            </button>
            <span className={`flex-1 text-sm ${edadActiva ? 'font-semibold text-neutral-50' : 'text-neutral-400'}`}>
              {edadActiva ? `${minimo} a ${maximo} años` : 'Sin límite de edad'}
            </span>
          </div>
          <div className="mt-2 px-1">
            <RangoDoble min={filtros.edad.min} max={filtros.edad.max} valor={rango} onCambiar={setRango} desactivado={!edadActiva} />
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>{filtros.edad.min}</span>
              <span>{filtros.edad.max}</span>
            </div>
          </div>
        </fieldset>
      </div>

      <div className="mt-4">
        {equipos.length === 0 ? (
          <p className="rounded-md bg-amber-500/10 p-4 text-sm text-amber-300">Selecciona al menos un equipo.</p>
        ) : error ? (
          <p className="rounded-md bg-red-500/10 p-4 text-sm text-red-300">No se pudieron cargar los jugadores: {error}</p>
        ) : !respuesta ? (
          <p className="text-neutral-400">Cargando jugadores…</p>
        ) : respuesta.filas.length === 0 ? (
          <p className="rounded-md bg-neutral-900 p-4 text-sm text-neutral-400">Ningún jugador cumple con estos filtros.</p>
        ) : (
          <>
            <p className={`mb-2 text-sm text-neutral-400 ${cargando ? 'opacity-60' : ''}`}>
              {respuesta.filas.length} jugadores · haz clic en una columna para ordenar · <span aria-hidden="true">↓</span> = menor es mejor
            </p>
            <div className={cargando ? 'opacity-60 transition-opacity' : ''}>
              <TablaJugadores
                key={respuesta.grupo}
                grupo={respuesta.grupo}
                estadisticas={respuesta.grupo === grupo ? visibles : respuesta.estadisticas.filter((e) => e.predeterminada)}
                filas={respuesta.filas}
                total={respuesta.total}
                guardados={guardados}
              />
            </div>
          </>
        )}
      </div>
    </section>
  )
}

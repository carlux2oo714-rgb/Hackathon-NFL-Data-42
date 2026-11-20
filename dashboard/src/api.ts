// Cliente de la API. Las rutas son relativas y sin diagonal inicial
// para que funcionen cuando la app se publica en una subruta.

export type Grupo = 'qb' | 'rec' | 'ol' | 'todos'

export interface Estadistica {
  clave: string
  etiqueta: string
  descripcion: string
  predeterminada: boolean
  menor_es_mejor: boolean
}

export interface Posicion {
  codigo: string
  nombre: string
  grupo: Exclude<Grupo, 'todos'>
}

export interface Filtros {
  equipos: string[]
  posiciones: Posicion[]
  estadisticas: Record<Grupo, Estadistica[]>
  edad: { min: number; max: number }
  cobertura_receptores: number
}

export interface Jugador {
  nflId: number
  nombre: string
  posicion: string
  equipo: string
  edad: number | null
  [stat: string]: string | number | null
}

export interface RespuestaJugadores {
  grupo: Grupo
  estadisticas: Estadistica[]
  filas: Jugador[]
  total: Record<string, number | null> | null
}

export interface ParametrosBusqueda {
  posicion?: string
  equipos?: string[]
  edadMin?: number
  edadMax?: number
}

async function obtener<T>(ruta: string): Promise<T> {
  const r = await fetch(ruta)
  if (!r.ok) throw new Error(`Error ${r.status} al consultar ${ruta}`)
  return r.json() as Promise<T>
}

export function obtenerFiltros(): Promise<Filtros> {
  return obtener<Filtros>('api/filtros')
}

export type GrupoJugador = Exclude<Grupo, 'todos'>

export interface JugadorComparado extends Jugador {
  grupo: GrupoJugador
}

export interface RespuestaComparar {
  jugadores: JugadorComparado[]
  estadisticas: Record<GrupoJugador, Estadistica[]>
}

export function compararJugadores(ids: number[]): Promise<RespuestaComparar> {
  return obtener<RespuestaComparar>(`api/comparar?ids=${ids.join(',')}`)
}

export function buscarJugadores(p: ParametrosBusqueda): Promise<RespuestaJugadores> {
  const q = new URLSearchParams()
  if (p.posicion) q.set('posicion', p.posicion)
  if (p.equipos && p.equipos.length) q.set('equipos', p.equipos.join(','))
  if (p.edadMin !== undefined) q.set('edad_min', String(p.edadMin))
  if (p.edadMax !== undefined) q.set('edad_max', String(p.edadMax))
  const qs = q.toString()
  return obtener<RespuestaJugadores>(`api/jugadores${qs ? `?${qs}` : ''}`)
}

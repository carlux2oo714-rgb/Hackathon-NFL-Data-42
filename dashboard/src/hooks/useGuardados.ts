import { useCallback, useEffect, useState } from 'react'

// Los jugadores guardados viven en el navegador (localStorage): el servidor es efímero.
export interface JugadorGuardado {
  nflId: number
  nombre: string
  posicion: string
  equipo: string
}

const CLAVE = 'nfl-scout-guardados'

function leer(): JugadorGuardado[] {
  try {
    const texto = localStorage.getItem(CLAVE)
    const valor: unknown = texto ? JSON.parse(texto) : []
    return Array.isArray(valor) ? (valor as JugadorGuardado[]) : []
  } catch {
    return []
  }
}

export function useGuardados() {
  const [guardados, setGuardados] = useState<JugadorGuardado[]>(leer)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(guardados))
    } catch {
      // Sin almacenamiento disponible (modo privado, cuota llena): se conserva solo en memoria.
    }
  }, [guardados])

  const estaGuardado = useCallback((id: number) => guardados.some((g) => g.nflId === id), [guardados])

  const alternar = useCallback((j: JugadorGuardado) => {
    setGuardados((prev) =>
      prev.some((g) => g.nflId === j.nflId)
        ? prev.filter((g) => g.nflId !== j.nflId)
        : [...prev, { nflId: j.nflId, nombre: j.nombre, posicion: j.posicion, equipo: j.equipo }],
    )
  }, [])

  const limpiar = useCallback(() => setGuardados([]), [])

  return { guardados, estaGuardado, alternar, limpiar }
}

export type Guardados = ReturnType<typeof useGuardados>

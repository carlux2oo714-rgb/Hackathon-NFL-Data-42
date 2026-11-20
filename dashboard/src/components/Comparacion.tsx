import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Estadistica, JugadorComparado } from '../api'
import Desplegable, { Casilla } from './Desplegable'
import { formatear } from '../formato'

export const COLORES = ['#e34234', '#38bdf8', '#4ade80', '#c084fc', '#facc15']

interface Props {
  jugadores: JugadorComparado[]
  catalogo: Estadistica[]
}

function mejorValor(e: Estadistica, jugadores: JugadorComparado[]): number | null {
  const valores = jugadores.map((j) => j[e.clave]).filter((v): v is number => typeof v === 'number')
  if (valores.length < 2) return null
  return e.menor_es_mejor ? Math.min(...valores) : Math.max(...valores)
}

export default function Comparacion({ jugadores, catalogo }: Props) {
  const comparables = catalogo.filter((e) => e.clave !== 'juegos')
  const [claves, setClaves] = useState<string[]>(comparables.filter((e) => e.predeterminada).map((e) => e.clave))
  const visibles = comparables.filter((e) => claves.includes(e.clave))

  function alternar(clave: string) {
    setClaves((prev) => (prev.includes(clave) ? (prev.length > 1 ? prev.filter((c) => c !== clave) : prev) : [...prev, clave]))
  }

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-neutral-50">Comparación</h3>
          <div className="mt-1 flex flex-wrap gap-3 text-sm">
            {jugadores.map((j, i) => (
              <span key={j.nflId} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: COLORES[i] }} aria-hidden="true" />
                {j.nombre} <span className="text-xs text-bermellon-400">{j.posicion} · {j.equipo}</span>
              </span>
            ))}
          </div>
        </div>
        <Desplegable etiqueta="Estadísticas a comparar" resumen={`${visibles.length} de ${comparables.length}`} ancho="w-72">
          <div className="max-h-80 overflow-y-auto">
            {comparables.map((e) => (
              <Casilla key={e.clave} marcada={claves.includes(e.clave)} onCambiar={() => alternar(e.clave)}>
                <span className="font-medium">{e.etiqueta}</span>
                <span className="block text-xs text-neutral-400">{e.descripcion}</span>
              </Casilla>
            ))}
          </div>
        </Desplegable>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase text-neutral-400">
            <tr className="border-b-2 border-neutral-800">
              <th scope="col" className="px-3 py-2 text-left">Estadística</th>
              {jugadores.map((j, i) => (
                <th key={j.nflId} scope="col" className="whitespace-nowrap px-3 py-2 text-right" style={{ color: COLORES[i] }}>
                  {j.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[{ clave: 'juegos', etiqueta: 'J', descripcion: 'Juegos jugados', predeterminada: true, menor_es_mejor: false }, ...visibles].map((e) => {
              const mejor = e.clave === 'juegos' ? null : mejorValor(e, jugadores)
              return (
                <tr key={e.clave} className="border-t border-neutral-800">
                  <th scope="row" className="px-3 py-1.5 text-left font-medium text-neutral-300" title={e.descripcion}>
                    {e.etiqueta}
                    {e.menor_es_mejor && <span className="ml-1 text-xs text-neutral-500">↓</span>}
                  </th>
                  {jugadores.map((j) => {
                    const v = j[e.clave]
                    const esMejor = mejor !== null && v === mejor
                    return (
                      <td
                        key={j.nflId}
                        className={`px-3 py-1.5 text-right tabular-nums ${esMejor ? 'bg-emerald-500/15 font-bold text-emerald-400' : 'text-neutral-200'}`}
                      >
                        {formatear(e.clave, v)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="mt-1 text-xs text-neutral-400">En verde, el mejor valor de cada estadística. ↓ = menor es mejor.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map((e) => {
          const datos = jugadores.map((j, i) => ({
            nombre: j.nombre.split(' ').slice(-1)[0],
            completo: j.nombre,
            valor: typeof j[e.clave] === 'number' ? (j[e.clave] as number) : 0,
            color: COLORES[i],
          }))
          return (
            <figure key={e.clave} className="rounded-md border border-neutral-800 p-3">
              <figcaption className="text-sm font-semibold text-neutral-200">
                {e.etiqueta} <span className="font-normal text-neutral-400">· {e.descripcion}</span>
                {e.menor_es_mejor && <span className="ml-1 text-xs text-neutral-500">(menor es mejor)</span>}
              </figcaption>
              <div className="mt-2 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#a3a3a3' }} stroke="#404040" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#a3a3a3' }} stroke="#404040" />
                    <Tooltip
                      formatter={(v) => [formatear(e.clave, v), e.etiqueta]}
                      labelFormatter={(_, payload) => (payload?.[0]?.payload as { completo?: string } | undefined)?.completo ?? ''}
                      cursor={{ fill: '#262626' }}
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: 6 }}
                      labelStyle={{ color: '#fafafa', fontWeight: 600 }}
                      itemStyle={{ color: '#e5e5e5' }}
                    />
                    <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                      {datos.map((d) => (
                        <Cell key={d.completo} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </figure>
          )
        })}
      </div>
    </div>
  )
}

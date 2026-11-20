import { useEffect, useState, type ReactNode } from 'react'
import { obtenerFiltros, type Filtros, type GrupoJugador } from '../api'
import type { Seccion } from '../components/BarraLateral'

interface Props {
  onIr: (s: Seccion) => void
}

const GRUPOS: { grupo: GrupoJugador; titulo: string; posiciones: string }[] = [
  { grupo: 'qb', titulo: 'Quarterbacks', posiciones: 'QB' },
  { grupo: 'rec', titulo: 'Receptores', posiciones: 'RB, FB, WR, TE' },
  { grupo: 'ol', titulo: 'Línea ofensiva', posiciones: 'T, G, C' },
]

function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bermellon-500 text-sm font-bold text-white">{numero}</span>
      <div className="min-w-0 pt-1">
        <h4 className="font-semibold text-neutral-50">{titulo}</h4>
        <div className="mt-1 space-y-1 text-sm text-neutral-400">{children}</div>
      </div>
    </li>
  )
}

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5 shadow-sm">
      <h3 className="text-lg font-bold text-neutral-50">{titulo}</h3>
      <div className="mt-3">{children}</div>
    </div>
  )
}

export default function ComoFunciona({ onIr }: Props) {
  const [filtros, setFiltros] = useState<Filtros | null>(null)

  useEffect(() => {
    obtenerFiltros().then(setFiltros).catch(() => setFiltros(null))
  }, [])

  return (
    <section className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-50">Cómo funciona la aplicación</h2>
        <p className="mt-1 text-neutral-400">
          Este panel reúne las estadísticas ofensivas de cada jugador para que puedas encontrar, guardar y comparar prospectos en pocos
          clics.
        </p>
      </div>

      <Tarjeta titulo="1. Busca jugadores">
        <ol className="space-y-5">
          <Paso numero={1} titulo="Elige los equipos">
            <p>
              En <strong>Equipo</strong> marca los equipos que quieres revisar. <em>Seleccionar todos</em> marca o desmarca la liga
              completa de una vez.
            </p>
          </Paso>
          <Paso numero={2} titulo="Elige una posición">
            <p>
              En <strong>Posición</strong> elige QB, RB, FB, WR, TE, T, G o C. Cada grupo tiene sus propias estadísticas. Si no eliges
              ninguna, la tabla muestra a los líderes en yardas por pase o por recepción.
            </p>
            <p>
              Los datos son únicamente de jugadas de pase, así que los corredores (RB y FB) no muestran yardas por acarreo: solo sus
              números como receptores.
            </p>
          </Paso>
          <Paso numero={3} titulo="Escoge las estadísticas">
            <p>
              En <strong>Estadísticas</strong> marca las columnas que quieres ver. <em>Predeterminado</em> muestra las más útiles para
              evaluar la posición y <em>Todas</em> las muestra todas.
            </p>
          </Paso>
          <Paso numero={4} titulo="Ajusta el rango de edad">
            <p>
              Enciende el interruptor de <strong>Rango de edad</strong> y arrastra los dos controles de la barra para fijar la edad mínima y
              la máxima. Apaga el interruptor para quitar el filtro y ver a todos los jugadores sin límite de edad.
            </p>
          </Paso>
          <Paso numero={5} titulo="Ordena la tabla">
            <p>
              Haz clic en el encabezado de cualquier columna para ordenar; otro clic invierte el orden. La columna ordenada se resalta en
              azul. Pasa el cursor sobre un encabezado para ver qué significa.
            </p>
            <p>
              Las columnas con <strong>↓</strong> son estadísticas donde un número menor es mejor (intercepciones, capturas, presiones
              permitidas). La fila <strong>Total</strong> suma los conteos y recalcula los promedios.
            </p>
          </Paso>
        </ol>
        <button
          type="button"
          onClick={() => onIr('buscador')}
          className="mt-5 rounded-md bg-bermellon-500 px-4 py-2 text-sm font-semibold text-white hover:bg-bermellon-600"
        >
          Ir al buscador
        </button>
      </Tarjeta>

      <Tarjeta titulo="2. Guarda y compara">
        <ol className="space-y-5">
          <Paso numero={1} titulo="Guarda a un jugador">
            <p>
              En el buscador, haz clic en el marcador
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="mx-1 inline h-4 w-4 text-bermellon-500" aria-hidden="true">
                <path strokeLinejoin="round" d="M6 4h12v17l-6-4-6 4V4Z" />
              </svg>
              antes del nombre. Otro clic lo quita. El número junto a <em>Jugadores guardados</em> en la barra lateral te dice cuántos
              llevas.
            </p>
            <p>Tu lista se guarda en este navegador: sigue ahí aunque cierres la página, pero no se comparte con otras computadoras.</p>
          </Paso>
          <Paso numero={2} titulo="Compara">
            <p>
              En <strong>Jugadores guardados</strong>, marca de 2 a 5 jugadores de la misma posición en la columna <em>Comparar</em>.
              Aparece una tabla lado a lado con el mejor valor en verde y una gráfica de barras por estadística.
            </p>
          </Paso>
          <Paso numero={3} titulo="Limpia el registro">
            <p>
              <em>Limpiar registro</em> quita a todos los guardados. Te pedirá confirmación; para quitar solo a uno usa la ✕ de su fila.
            </p>
          </Paso>
        </ol>
      </Tarjeta>

      <Tarjeta titulo="3. Qué significa cada estadística">
        {!filtros ? (
          <p className="text-sm text-neutral-400">Cargando glosario…</p>
        ) : (
          <div className="space-y-3">
            {GRUPOS.map(({ grupo, titulo, posiciones }) => (
              <details key={grupo} className="group rounded-md border border-neutral-800" open={grupo === 'qb'}>
                <summary className="cursor-pointer select-none px-4 py-2 font-semibold text-neutral-200 hover:bg-neutral-800/60">
                  {titulo} <span className="font-normal text-neutral-400">({posiciones})</span>
                </summary>
                <dl className="grid gap-x-6 gap-y-1 border-t border-neutral-800 px-4 py-3 text-sm sm:grid-cols-2">
                  {filtros.estadisticas[grupo].map((e) => (
                    <div key={e.clave} className="flex gap-2">
                      <dt className="w-20 shrink-0 font-semibold text-neutral-50">{e.etiqueta}</dt>
                      <dd className="text-neutral-400">
                        {e.descripcion}
                        {e.menor_es_mejor && <span className="text-neutral-500"> · menor es mejor</span>}
                        {e.predeterminada && <span className="ml-1 rounded bg-bermellon-500/20 px-1 text-xs text-bermellon-300">predet.</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            ))}
            <p className="text-xs text-neutral-400">
              RTG es el passer rating oficial de la NFL (de 0 a 158.3). YPRR, yardas por ruta corrida, mide cuánto produce un receptor cada
              vez que sale a correr una ruta, le lancen o no. PRES% = (capturas + golpes + presiones permitidas) ÷ jugadas bloqueando.
            </p>
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="4. De dónde salen los datos">
        <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-400">
          <li>
            Datos del <strong>NFL Big Data Bowl</strong>: 122 partidos de la temporada 2021, semanas 1 a 8, con información de Next Gen
            Stats y Pro Football Focus (PFF).
          </li>
          <li>
            Los datos son <strong>únicamente de jugadas de pase</strong>: pases completos e incompletos, intercepciones, capturas y
            scrambles del QB. No incluyen jugadas de carrera.
          </li>
          <li>
            Por eso los corredores (RB y FB) <strong>no muestran yardas por acarreo</strong>. Sus estadísticas son solo como receptores:
            rutas, objetivos, recepciones y yardas recibidas.
          </li>
          <li>
            Las cifras son algo menores que las oficiales porque el dataset no trae todas las jugadas de cada partido. Sirven para comparar
            jugadores entre sí, no para reemplazar la estadística oficial.
          </li>
          <li>Las jugadas anuladas por castigo (“No Play”) no cuentan, igual que en la estadística oficial.</li>
          <li>
            El receptor de cada pase se identifica en la descripción de la jugada, buscando solo entre los jugadores que corrieron ruta.
            {filtros && ` Se identificó al receptor en el ${filtros.cobertura_receptores}% de los pases completos.`}
          </li>
          <li>La edad se calcula al 1 de septiembre de 2021. El equipo es aquel con el que el jugador tuvo más jugadas.</li>
        </ul>
      </Tarjeta>
    </section>
  )
}

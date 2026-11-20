export type Seccion = 'como-funciona' | 'buscador' | 'guardados'

interface Opcion {
  id: Seccion
  titulo: string
  icono: JSX.Element
}

const OPCIONES: Opcion[] = [
  {
    id: 'como-funciona',
    titulo: 'Cómo funciona',
    icono: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14m0 3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    ),
  },
  {
    id: 'buscador',
    titulo: 'Buscador de jugadores ofensivos',
    icono: <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />,
  },
  {
    id: 'guardados',
    titulo: 'Jugadores guardados',
    icono: <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h12v17l-6-4-6 4V4Z" />,
  },
]

interface Props {
  activa: Seccion
  onCambiar: (s: Seccion) => void
  totalGuardados: number
}

export default function BarraLateral({ activa, onCambiar, totalGuardados }: Props) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-neutral-800 bg-neutral-900 text-neutral-100 md:border-l md:sticky md:top-0 md:h-screen md:w-72">
      <div className="border-b border-neutral-800 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-bermellon-400">NFL Scouting</p>
        <h1 className="mt-1 text-lg font-bold leading-tight">Panel de jugadores ofensivos</h1>
        <p className="mt-1 text-xs text-neutral-500">Temporada 2021 · Semanas 1 a 8</p>
      </div>
      <nav className="flex flex-row gap-1 p-3 md:flex-col">
        {OPCIONES.map((o, i) => {
          const seleccionada = o.id === activa
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onCambiar(o.id)}
              aria-current={seleccionada ? 'page' : undefined}
              className={`flex flex-1 items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition-colors md:flex-none ${
                seleccionada ? 'bg-bermellon-500 font-semibold text-white' : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 shrink-0" aria-hidden="true">
                {o.icono}
              </svg>
              <span className="flex-1">
                <span className="mr-1 text-xs opacity-70">{i + 1}.</span>
                {o.titulo}
              </span>
              {o.id === 'guardados' && totalGuardados > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${seleccionada ? 'bg-white text-bermellon-600' : 'bg-bermellon-500 text-white'}`}
                  aria-label={`${totalGuardados} guardados`}
                >
                  {totalGuardados}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

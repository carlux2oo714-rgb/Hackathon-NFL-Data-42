import { useState } from 'react'
import BarraLateral, { type Seccion } from './components/BarraLateral'
import { useGuardados } from './hooks/useGuardados'
import Buscador from './sections/Buscador'
import ComoFunciona from './sections/ComoFunciona'
import Guardados from './sections/Guardados'

export default function App() {
  const [seccion, setSeccion] = useState<Seccion>('buscador')
  const guardados = useGuardados()

  return (
    <div className="flex min-h-screen flex-col-reverse bg-neutral-950 text-neutral-200 md:flex-row">
      <main className="min-w-0 flex-1 p-4 md:p-8">
        {seccion === 'como-funciona' && <ComoFunciona onIr={setSeccion} />}
        {/* El buscador se mantiene montado para conservar los filtros al cambiar de sección. */}
        <div hidden={seccion !== 'buscador'}>
          <Buscador guardados={guardados} />
        </div>
        {seccion === 'guardados' && <Guardados guardados={guardados} onIrAlBuscador={() => setSeccion('buscador')} />}
      </main>
      <BarraLateral activa={seccion} onCambiar={setSeccion} totalGuardados={guardados.guardados.length} />
    </div>
  )
}

import { useState } from 'react'
import { NOMBRES_EQUIPOS } from '../equipos'

interface Props {
  equipo: string
  tamano?: string
}

// Logo servido desde dashboard/public/logos con ruta relativa (sin diagonal inicial).
// Si la imagen no carga, muestra la abreviatura.
export default function LogoEquipo({ equipo, tamano = 'h-6 w-6' }: Props) {
  const [fallo, setFallo] = useState(false)
  const nombre = NOMBRES_EQUIPOS[equipo] ?? equipo

  if (fallo) {
    return (
      <span className={`${tamano} inline-flex shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[9px] font-bold text-neutral-300`} title={nombre}>
        {equipo}
      </span>
    )
  }
  return (
    <img
      src={`logos/${equipo}.png`}
      alt={nombre}
      title={nombre}
      loading="lazy"
      onError={() => setFallo(true)}
      className={`${tamano} shrink-0 rounded-full bg-neutral-100 object-contain p-0.5`}
    />
  )
}

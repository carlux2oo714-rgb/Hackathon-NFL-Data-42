# Panel de scouting: jugadores ofensivos de la NFL

Aplicación web para que un **scout de la NFL** encuentre, guarde y compare jugadores ofensivos con sus estadísticas de la temporada 2021 (semanas 1 a 8), usando los datos del NFL Big Data Bowl.

## Para quién es

Para scouts y analistas que necesitan filtrar rápido a los jugadores por equipo, posición y edad, ver las estadísticas que importan para cada posición y armar una lista corta de prospectos para compararlos lado a lado.

## Hallazgo principal

Las estadísticas de volumen (yardas totales) no siempre señalan al jugador más eficiente. Con métricas por oportunidad, el panel muestra otra lectura:

- **Receptores:** Ja'Marr Chase (780 yardas) y Cooper Kupp (761) lideran en yardas, pero Davante Adams (3.7) y Deebo Samuel (3.6) producen más **yardas por ruta corrida (YPRR)** que ambos (3.3). Rinden más cada vez que salen a correr una ruta.
- **Línea ofensiva:** el centro Creed Humphrey (KC) permitió presión en solo el **2.2%** de sus 313 jugadas bloqueando el pase, la cifra más baja entre los 5 linieros con más jugadas de bloqueo.
- **Quarterbacks:** Tom Brady lidera en yardas por pase (2,291), pero Matthew Stafford tiene mejor passer rating (119.5 contra 108.9) y más yardas por intento (9.4 contra 8.2).

## Qué hace la aplicación

La barra de la derecha tiene tres secciones:

1. **Cómo funciona:** tutorial de uso, glosario de cada estadística y explicación de los datos.
2. **Buscador de jugadores ofensivos:** tabla filtrable por equipo, posición (QB, RB, FB, WR, TE, T, G, C), estadísticas visibles y rango de edad. Las columnas se ordenan con un clic y hay una fila Total. Sin filtros, muestra a los líderes en yardas por pase o por recepción. El icono de marcador antes del nombre guarda al jugador.
3. **Jugadores guardados:** lista de los guardados, opción de limpiar el registro (con confirmación) y comparación de 2 a 5 jugadores de la misma posición con tabla lado a lado y gráficas de barras.

## Cómo se calculan los datos

- Los datos son **únicamente de jugadas de pase** (pases completos e incompletos, intercepciones, capturas y scrambles del QB). No incluyen jugadas de carrera, por eso los corredores (RB y FB) **no muestran yardas por acarreo**: solo sus números como receptores.
- El pasador, los receptores en ruta y los bloqueadores vienen identificados en los datos de PFF. El receptor de cada pase se obtiene de la descripción de la jugada, buscando solo entre los jugadores que corrieron ruta en ella; se identificó en el 99.7% de los pases completos.
- Las jugadas anuladas por castigo ("No Play") no cuentan.
- El passer rating (RTG) usa la fórmula oficial de la NFL.
- Las cifras son algo menores que las oficiales porque el dataset no trae todas las jugadas de cada partido. Sirven para comparar jugadores entre sí.

## Cómo verlo en tu computadora

Requiere haber corrido el setup del evento (`.\.hackathon\setup.cmd`).

Terminal 1, desde la raíz del proyecto (backend):

```powershell
.\.venv\Scripts\uvicorn.exe backend.main:app --reload
```

Terminal 2, desde la raíz del proyecto (dashboard):

```powershell
cd dashboard; $env:PATH = "$PWD\..\.hackathon\.tools\node;" + $env:PATH; npm.cmd run dev
```

Abre http://localhost:5173.

En macOS o Linux, el backend se inicia con `.venv/bin/uvicorn backend.main:app --reload`.

## Pruebas

```powershell
.\.venv\Scripts\python.exe -m pytest backend
```

## Stack

FastAPI, pandas y numpy en el backend (`backend/`); React, Vite, TypeScript, Tailwind CSS y Recharts en el dashboard (`dashboard/`). Las versiones son las fijas del evento.

API:

- `GET /health`
- `GET /api/filtros`: equipos, posiciones, catálogo de estadísticas y rango de edad.
- `GET /api/jugadores?posicion=&equipos=&edad_min=&edad_max=`: jugadores con sus estadísticas y fila Total.
- `GET /api/comparar?ids=`: estadísticas de varios jugadores para compararlos.

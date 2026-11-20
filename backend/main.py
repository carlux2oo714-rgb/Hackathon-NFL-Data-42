"""API del buscador de jugadores ofensivos. Ejecuta: .venv/bin/uvicorn backend.main:app --reload"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query

from backend import stats


@asynccontextmanager
async def lifespan(_app: FastAPI):
    stats.datos()  # Calcula todas las estadísticas una vez al arrancar.
    yield


app = FastAPI(title="Hackathon NFL UNAM", lifespan=lifespan)


def _lista(valor: str | None) -> list[str]:
    return [v.strip() for v in valor.split(",") if v.strip()] if valor else []


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/filtros")
def filtros() -> dict:
    return stats.filtros()


@app.get("/api/jugadores")
def jugadores(
    posicion: str | None = Query(None, description="Código de posición, p. ej. QB"),
    equipos: str | None = Query(None, description="Equipos separados por coma; vacío = todos"),
    edad_min: int | None = Query(None, ge=0, le=100),
    edad_max: int | None = Query(None, ge=0, le=100),
) -> dict:
    if posicion and posicion not in stats.POSICIONES:
        raise HTTPException(status_code=400, detail=f"Posición no válida: {posicion}")
    return stats.jugadores(posicion, _lista(equipos), edad_min, edad_max)


@app.get("/api/comparar")
def comparar(ids: str = Query(..., description="nflId separados por coma")) -> dict:
    try:
        lista = [int(i) for i in _lista(ids)]
    except ValueError:
        raise HTTPException(status_code=400, detail="ids debe ser una lista de números separados por coma")
    return stats.comparar(lista[:100])

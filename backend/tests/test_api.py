from fastapi.testclient import TestClient

from backend.main import app
from backend.stats import _rating

client = TestClient(app)


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_rating_oficial():
    # Rating perfecto y caso conocido: 20/30, 250 yds, 2 TD, 1 INT = 100.7
    assert round(float(_rating(30, 30, 375, 6, 0)), 1) == 158.3
    assert round(float(_rating(20, 30, 250, 2, 1)), 1) == 100.7


def test_filtros():
    r = client.get("/api/filtros").json()
    assert "KC" in r["equipos"]
    assert {p["codigo"] for p in r["posiciones"]} == {"QB", "RB", "FB", "WR", "TE", "T", "G", "C"}
    assert r["cobertura_receptores"] > 98


def test_sin_filtros_ordena_por_yardas():
    filas = client.get("/api/jugadores").json()["filas"]
    yardas = [f["yds"] for f in filas]
    assert yardas == sorted(yardas, reverse=True)


def test_filtro_qb_equipo_y_edad():
    r = client.get("/api/jugadores", params={"posicion": "QB", "equipos": "BAL,KC", "edad_min": 20, "edad_max": 30}).json()
    assert r["filas"]
    for f in r["filas"]:
        assert f["posicion"] == "QB" and f["equipo"] in ("BAL", "KC") and 20 <= f["edad"] <= 30
        assert f["intentos"] >= f["cmp"]
    assert r["total"]["yds"] == sum(f["yds"] for f in r["filas"])


def test_posicion_invalida():
    assert client.get("/api/jugadores", params={"posicion": "XX"}).status_code == 400


def test_comparar():
    filas = client.get("/api/jugadores", params={"posicion": "WR"}).json()["filas"][:2]
    ids = ",".join(str(f["nflId"]) for f in filas)
    r = client.get("/api/comparar", params={"ids": ids}).json()
    assert [j["nflId"] for j in r["jugadores"]] == [f["nflId"] for f in filas]


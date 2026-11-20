"""Cálculo de estadísticas ofensivas por jugador a partir de los datos del Big Data Bowl.

Todo se calcula en memoria al arrancar; no se escribe nada en disco.
"""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
DATOS = RAIZ / "data" / "nfl-big-data-bowl-regional-event-data-main" / "nfl-big-data-bowl-regional-event-data-main" / "data"

# Fecha de referencia para la edad: inicio de la temporada 2021.
FECHA_EDAD = pd.Timestamp("2021-09-01")

POSICIONES = {
    "QB": "Quarterback",
    "RB": "Running back",
    "FB": "Fullback",
    "WR": "Receptor abierto",
    "TE": "Ala cerrada",
    "T": "Tackle",
    "G": "Guardia",
    "C": "Centro",
}
GRUPO_POR_POSICION = {"QB": "qb", "RB": "rec", "FB": "rec", "WR": "rec", "TE": "rec", "T": "ol", "G": "ol", "C": "ol"}

# Catálogo de estadísticas: clave, etiqueta corta, descripción, si es predeterminada,
# si un valor menor es mejor y cómo se agrega en la fila Total ("suma", "max" o "derivada").
CATALOGO = {
    "qb": [
        ("juegos", "J", "Juegos jugados", True, False, "max"),
        ("cmp", "CMP", "Pases completos", False, False, "suma"),
        ("intentos", "INTENTOS", "Intentos de pase", False, False, "suma"),
        ("cmp_pct", "CMP%", "Porcentaje de pases completos", True, False, "derivada"),
        ("yds", "YDS", "Yardas por pase", True, False, "suma"),
        ("avg", "AVG", "Yardas por intento", True, False, "derivada"),
        ("yds_g", "YDS/G", "Yardas por pase por juego", True, False, "derivada"),
        ("largo", "LARGO", "Pase completo más largo", False, False, "max"),
        ("td", "TD", "Pases de touchdown", True, False, "suma"),
        ("int", "INT", "Intercepciones lanzadas", True, True, "suma"),
        ("capt", "CAPT.", "Veces capturado (sacks)", True, True, "suma"),
        ("syl", "SYL", "Yardas perdidas por capturas", False, True, "suma"),
        ("rtg", "RTG", "Passer rating oficial de la NFL", True, False, "derivada"),
        ("scr", "SCR", "Scrambles (corridas del QB)", False, False, "suma"),
        ("scr_yds", "SCR YDS", "Yardas en scrambles", False, False, "suma"),
    ],
    "rec": [
        ("juegos", "J", "Juegos jugados", True, False, "max"),
        ("rutas", "RUTAS", "Rutas corridas", False, False, "suma"),
        ("obj", "OBJ", "Veces que le lanzaron el balón", True, False, "suma"),
        ("rec", "REC", "Recepciones", True, False, "suma"),
        ("rec_pct", "REC%", "Porcentaje de recepción (REC / OBJ)", True, False, "derivada"),
        ("yds", "YDS", "Yardas por recepción", True, False, "suma"),
        ("avg", "AVG", "Yardas por recepción promedio", True, False, "derivada"),
        ("yds_g", "YDS/G", "Yardas recibidas por juego", False, False, "derivada"),
        ("largo", "LARGO", "Recepción más larga", False, False, "max"),
        ("td", "TD", "Touchdowns recibidos", True, False, "suma"),
        ("yprr", "YPRR", "Yardas por ruta corrida", True, False, "derivada"),
    ],
    "ol": [
        ("juegos", "J", "Juegos jugados", True, False, "max"),
        ("blq", "BLQ", "Jugadas bloqueando el pase", True, False, "suma"),
        ("sack_p", "SACK P.", "Capturas permitidas", True, True, "suma"),
        ("hit_p", "HIT P.", "Golpes al QB permitidos", True, True, "suma"),
        ("hurry_p", "HURRY P.", "Presiones (hurries) permitidas", True, True, "suma"),
        ("superado", "SUPERADO", "Veces superado sin causar presión", False, True, "suma"),
        ("pres_pct", "PRES%", "Porcentaje de presión permitida", True, True, "derivada"),
    ],
    # Vista sin posición seleccionada: líderes en yardas (pase o recepción).
    "todos": [
        ("juegos", "J", "Juegos jugados", True, False, "max"),
        ("tipo", "TIPO", "Tipo de yardas: pase o recepción", True, False, "derivada"),
        ("yds", "YDS", "Yardas por pase o recepción", True, False, "suma"),
        ("yds_g", "YDS/G", "Yardas por juego", True, False, "derivada"),
        ("largo", "LARGO", "Jugada más larga", True, False, "max"),
        ("td", "TD", "Touchdowns", True, False, "suma"),
    ],
}

SUFIJOS = {"Jr.", "Sr.", "II", "III", "IV", "V"}


def _div(a, b):
    """División que devuelve NaN cuando el divisor es 0."""
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    with np.errstate(divide="ignore", invalid="ignore"):
        return np.where(b > 0, a / b, np.nan)


def _rating(cmp, att, yds, td, intc):
    """Passer rating oficial de la NFL."""
    a = np.clip((_div(cmp, att) - 0.3) * 5, 0, 2.375)
    b = np.clip((_div(yds, att) - 3) * 0.25, 0, 2.375)
    c = np.clip(_div(td, att) * 20, 0, 2.375)
    d = np.clip(2.375 - _div(intc, att) * 25, 0, 2.375)
    return (a + b + c + d) / 6 * 100


def derivar(grupo: str, df: pd.DataFrame) -> pd.DataFrame:
    """Calcula las estadísticas derivadas a partir de las de conteo."""
    df = df.copy()
    if grupo == "qb":
        df["cmp_pct"] = _div(df["cmp"], df["intentos"]) * 100
        df["avg"] = _div(df["yds"], df["intentos"])
        df["yds_g"] = _div(df["yds"], df["juegos"])
        df["rtg"] = _rating(df["cmp"], df["intentos"], df["yds"], df["td"], df["int"])
    elif grupo == "rec":
        df["rec_pct"] = _div(df["rec"], df["obj"]) * 100
        df["avg"] = _div(df["yds"], df["rec"])
        df["yds_g"] = _div(df["yds"], df["juegos"])
        df["yprr"] = _div(df["yds"], df["rutas"])
    elif grupo == "ol":
        df["pres_pct"] = _div(df["sack_p"] + df["hit_p"] + df["hurry_p"], df["blq"]) * 100
    claves = [c[0] for c in CATALOGO[grupo] if c[0] != "tipo"]
    decimales = {k: 1 for k in claves}
    return df.round(decimales)


def _nombre_corto(display_name: str):
    """Devuelve (inicial, apellido) como aparecen en playDescription, p. ej. ('A', 'St. Brown')."""
    partes = [p for p in str(display_name).split() if p not in SUFIJOS]
    if len(partes) < 2:
        return None
    return partes[0][0], " ".join(partes[1:])


def _segmento_pase(desc: str) -> str:
    """Parte de la descripción donde aparece el receptor: desde 'pass' hasta el tacleador o la intercepción."""
    i = desc.find(" pass ")
    if i < 0:
        return ""
    seg = desc[i:]
    for corte in ("(", "INTERCEPTED"):
        j = seg.find(corte)
        if j >= 0:
            seg = seg[:j]
    return seg


def _a_registros(df: pd.DataFrame) -> list[dict]:
    """Convierte a una lista de dicts apta para JSON (NaN -> null, tipos numpy -> nativos)."""
    return json.loads(df.to_json(orient="records", force_ascii=False))


@lru_cache(maxsize=1)
def datos() -> dict:
    """Carga los CSV y calcula todas las tablas. Se ejecuta una sola vez."""
    plays = pd.read_csv(
        DATOS / "plays.csv",
        usecols=["gameId", "playId", "playDescription", "possessionTeam", "passResult", "prePenaltyPlayResult"],
    )
    scout = pd.read_csv(
        DATOS / "pffScoutingData.csv",
        usecols=["gameId", "playId", "nflId", "pff_role", "pff_beatenByDefender", "pff_hitAllowed",
                 "pff_hurryAllowed", "pff_sackAllowed"],
    )
    players = pd.read_csv(DATOS / "players.csv")

    # Jugadas anuladas por castigo ("No Play") no cuentan, igual que en la estadística oficial.
    plays = plays[~plays["playDescription"].str.contains("No Play", na=False)].copy()
    plays["td"] = plays["playDescription"].str.contains("TOUCHDOWN", na=False)
    plays["yardas"] = plays["prePenaltyPlayResult"].fillna(0)

    ofensiva = scout[scout["pff_role"].isin(["Pass", "Pass Route", "Pass Block"])]
    ofensiva = ofensiva.merge(plays[["gameId", "playId", "possessionTeam"]], on=["gameId", "playId"])

    # Información base del jugador: equipo (el más frecuente), juegos y edad.
    equipo = ofensiva.groupby("nflId")["possessionTeam"].agg(lambda s: s.mode().iat[0])
    juegos = ofensiva.groupby("nflId")["gameId"].nunique()
    nacimiento = pd.to_datetime(players["birthDate"], errors="coerce")
    edad = ((FECHA_EDAD - nacimiento).dt.days // 365.25)
    base = pd.DataFrame({
        "nflId": players["nflId"],
        "nombre": players["displayName"],
        "posicion": players["officialPosition"],
        "edad": edad,
    }).set_index("nflId")
    base["equipo"] = equipo
    base["juegos"] = juegos
    base = base[base["posicion"].isin(POSICIONES) & base["equipo"].notna()]

    # ---------- QB: el pasador viene con su nflId (pff_role = Pass) ----------
    pasador = scout[scout["pff_role"] == "Pass"][["gameId", "playId", "nflId"]].merge(plays, on=["gameId", "playId"])
    r = pasador["passResult"]
    pasador["cmp"] = (r == "C").astype(int)
    pasador["intentos"] = r.isin(["C", "I", "IN"]).astype(int)
    pasador["yds_pase"] = np.where(r == "C", pasador["yardas"], 0)
    pasador["largo_pase"] = np.where(r == "C", pasador["yardas"], np.nan)
    pasador["td_pase"] = ((r == "C") & pasador["td"]).astype(int)
    pasador["int"] = (r == "IN").astype(int)
    pasador["capt"] = (r == "S").astype(int)
    pasador["syl"] = np.where(r == "S", -pasador["yardas"].clip(upper=0), 0)
    pasador["scr"] = (r == "R").astype(int)
    pasador["scr_yds"] = np.where(r == "R", pasador["yardas"], 0)
    qb = pasador.groupby("nflId").agg(
        cmp=("cmp", "sum"), intentos=("intentos", "sum"), yds=("yds_pase", "sum"), largo=("largo_pase", "max"),
        td=("td_pase", "sum"), int=("int", "sum"), capt=("capt", "sum"), syl=("syl", "sum"),
        scr=("scr", "sum"), scr_yds=("scr_yds", "sum"),
    )

    # ---------- Receptores: el nombre sale del texto, pero solo entre quienes corrieron ruta ----------
    rutas_df = scout[scout["pff_role"] == "Pass Route"].merge(plays[["gameId", "playId"]], on=["gameId", "playId"])
    rutas = rutas_df.groupby("nflId").size()
    corredores = rutas_df.groupby(["gameId", "playId"])["nflId"].apply(list).to_dict()
    ofensivos_jugada = ofensiva.groupby(["gameId", "playId"])["nflId"].apply(list).to_dict()

    patrones = {}
    for nfl_id, nombre in players.set_index("nflId")["displayName"].items():
        corto = _nombre_corto(nombre)
        if corto:
            ini, apellido = corto
            patrones[nfl_id] = re.compile(rf"(?:to|for) {re.escape(ini)}[A-Za-z]?\.\s?{re.escape(apellido)}(?![A-Za-z])")

    def buscar_receptor(clave, segmento):
        for candidatos in (corredores.get(clave, []), ofensivos_jugada.get(clave, [])):
            hallados = {c for c in candidatos if c in patrones and patrones[c].search(segmento)}
            if len(hallados) == 1:
                return hallados.pop()
        return None

    lanzamientos = plays[plays["passResult"].isin(["C", "I", "IN"])]
    filas = []
    sin_receptor = 0
    for fila in lanzamientos.itertuples(index=False):
        segmento = _segmento_pase(fila.playDescription)
        if not segmento:
            continue
        receptor = buscar_receptor((fila.gameId, fila.playId), segmento)
        if receptor is None:
            if fila.passResult == "C":
                sin_receptor += 1
            continue
        completo = fila.passResult == "C"
        filas.append((receptor, 1, int(completo), fila.yardas if completo else 0,
                      fila.yardas if completo else np.nan, int(completo and fila.td)))
    objetivos = pd.DataFrame(filas, columns=["nflId", "obj", "rec", "yds", "largo", "td"])
    rec = objetivos.groupby("nflId").agg(obj=("obj", "sum"), rec=("rec", "sum"), yds=("yds", "sum"),
                                         largo=("largo", "max"), td=("td", "sum"))
    rec = rec.reindex(rec.index.union(rutas.index)).fillna({"obj": 0, "rec": 0, "yds": 0, "td": 0})
    rec["rutas"] = rutas.reindex(rec.index).fillna(0)

    # ---------- Linieros: datos de bloqueo de PFF con nflId ----------
    bloqueo = scout[scout["pff_role"] == "Pass Block"].merge(plays[["gameId", "playId"]], on=["gameId", "playId"])
    ol = bloqueo.groupby("nflId").agg(
        blq=("playId", "size"), sack_p=("pff_sackAllowed", "sum"), hit_p=("pff_hitAllowed", "sum"),
        hurry_p=("pff_hurryAllowed", "sum"), superado=("pff_beatenByDefender", "sum"),
    )

    tablas = {}
    for grupo, conteo in (("qb", qb), ("rec", rec), ("ol", ol)):
        posiciones = [p for p, g in GRUPO_POR_POSICION.items() if g == grupo]
        t = base[base["posicion"].isin(posiciones)].join(conteo, how="inner")
        enteros = [c for c, *_, agregado in CATALOGO[grupo] if agregado in ("suma", "max") and c != "largo"]
        t[enteros] = t[enteros].fillna(0).astype(int)
        t["edad"] = t["edad"].astype("Int64")
        tablas[grupo] = derivar(grupo, t).reset_index()

    # Vista "todos": yardas por pase de QB y yardas recibidas de receptores.
    todos = pd.concat([
        tablas["qb"].assign(tipo="Pase")[["nflId", "nombre", "posicion", "edad", "equipo", "juegos", "tipo", "yds", "largo", "td"]],
        tablas["rec"].assign(tipo="Recepción")[["nflId", "nombre", "posicion", "edad", "equipo", "juegos", "tipo", "yds", "largo", "td"]],
    ], ignore_index=True)
    todos["yds_g"] = np.round(_div(todos["yds"], todos["juegos"]), 1)
    tablas["todos"] = todos

    completos = int((plays["passResult"] == "C").sum())
    return {
        "tablas": tablas,
        "cobertura_receptores": round(100 * (1 - sin_receptor / completos), 1) if completos else None,
    }


def catalogo(grupo: str) -> list[dict]:
    return [
        {"clave": c, "etiqueta": e, "descripcion": d, "predeterminada": p, "menor_es_mejor": m}
        for c, e, d, p, m, _ in CATALOGO[grupo]
    ]


def filtros() -> dict:
    tablas = datos()["tablas"]
    todas = pd.concat([tablas["qb"], tablas["rec"], tablas["ol"]])
    edades = todas["edad"].dropna()
    return {
        "equipos": sorted(todas["equipo"].unique().tolist()),
        "posiciones": [{"codigo": k, "nombre": v, "grupo": GRUPO_POR_POSICION[k]} for k, v in POSICIONES.items()],
        "estadisticas": {g: catalogo(g) for g in CATALOGO},
        "edad": {"min": int(edades.min()), "max": int(edades.max())},
        "cobertura_receptores": datos()["cobertura_receptores"],
    }


def _total(grupo: str, df: pd.DataFrame) -> dict | None:
    """Fila Total: suma o máximo de los conteos y recálculo de los promedios sobre esos totales."""
    if grupo == "todos" or df.empty:
        return None
    fila = {}
    for clave, _, _, _, _, agregado in CATALOGO[grupo]:
        if agregado == "suma":
            fila[clave] = df[clave].sum()
        elif agregado == "max":
            fila[clave] = df[clave].max()
    return _a_registros(derivar(grupo, pd.DataFrame([fila])))[0]


def jugadores(posicion: str | None, equipos: list[str] | None, edad_min: int | None, edad_max: int | None) -> dict:
    grupo = GRUPO_POR_POSICION[posicion] if posicion else "todos"
    df = datos()["tablas"][grupo]
    if posicion:
        df = df[df["posicion"] == posicion]
    if equipos:
        df = df[df["equipo"].isin(equipos)]
    if edad_min is not None:
        df = df[df["edad"] >= edad_min]
    if edad_max is not None:
        df = df[df["edad"] <= edad_max]
    orden = "blq" if grupo == "ol" else "yds"
    df = df.sort_values(orden, ascending=False)
    if grupo == "todos":
        df = df[df["yds"] > 0]
    return {
        "grupo": grupo,
        "estadisticas": catalogo(grupo),
        "filas": _a_registros(df),
        "total": _total(grupo, df),
    }


def comparar(ids: list[int]) -> dict:
    tablas = datos()["tablas"]
    salida = []
    for nfl_id in ids:
        for grupo in ("qb", "rec", "ol"):
            t = tablas[grupo]
            fila = t[t["nflId"] == nfl_id]
            if not fila.empty:
                registro = _a_registros(fila)[0]
                registro["grupo"] = grupo
                salida.append(registro)
                break
    return {"jugadores": salida, "estadisticas": {g: catalogo(g) for g in ("qb", "rec", "ol")}}

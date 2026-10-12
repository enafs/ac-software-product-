"""Puxa campeonatos, times e partidas da football-data.org e grava no Postgres.

Uso:  docker compose run --rm api python carga.py
Limite do plano gratuito: 10 req/min -> 2 chamadas por liga x 6 ligas = 12 chamadas,
por isso há uma pausa entre elas.
"""
import os
import sys
import time

import psycopg2
import requests

BASE = "https://api.football-data.org/v4"
TOKEN = os.environ.get("FOOTBALL_DATA_TOKEN")
PAUSA = 7  # segundos entre chamadas (< 10 req/min)

LIGAS = ["BSA", "PL", "PD", "SA", "BL1", "FL1"]


def get(path):
    for tentativa in range(3):
        r = requests.get(f"{BASE}{path}", headers={"X-Auth-Token": TOKEN}, timeout=30)
        if r.status_code == 429:
            print("  limite atingido, aguardando 60s...")
            time.sleep(60)
            continue
        r.raise_for_status()
        time.sleep(PAUSA)
        return r.json()
    raise RuntimeError(f"Falha ao consultar {path}")


def main():
    if not TOKEN:
        sys.exit("Defina FOOTBALL_DATA_TOKEN no .env")

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    for codigo in LIGAS:
        print(f"[{codigo}] times...")
        dados = get(f"/competitions/{codigo}/teams")
        comp = dados["competition"]
        area = dados.get("area") or {}
        cur.execute(
            """
            INSERT INTO campeonatos (id, codigo, nome, pais, emblema_url)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, pais = EXCLUDED.pais,
                                           emblema_url = EXCLUDED.emblema_url
            """,
            (comp["id"], comp["code"], comp["name"], area.get("name"), comp.get("emblem")),
        )
        for t in dados["teams"]:
            cur.execute(
                """
                INSERT INTO times (id, campeonato_id, nome, nome_curto, sigla, escudo_url,
                                   fundacao, estadio, cores, site)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET campeonato_id = EXCLUDED.campeonato_id,
                    nome = EXCLUDED.nome, nome_curto = EXCLUDED.nome_curto,
                    sigla = EXCLUDED.sigla, escudo_url = EXCLUDED.escudo_url,
                    fundacao = EXCLUDED.fundacao, estadio = EXCLUDED.estadio,
                    cores = EXCLUDED.cores, site = EXCLUDED.site
                """,
                (t["id"], comp["id"], t["name"], t.get("shortName"), t.get("tla"),
                 t.get("crest"), t.get("founded"), t.get("venue"), t.get("clubColors"),
                 t.get("website")),
            )
        conn.commit()

        print(f"[{codigo}] partidas...")
        dados = get(f"/competitions/{codigo}/matches")
        n = 0
        for m in dados["matches"]:
            casa, fora = m["homeTeam"].get("id"), m["awayTeam"].get("id")
            if not casa or not fora:
                continue
            temporada = (m.get("season", {}).get("startDate") or "0000")[:4]
            ft = m["score"]["fullTime"]
            cur.execute(
                """
                INSERT INTO partidas (id, campeonato_id, temporada, rodada, data_utc, status,
                                      time_casa_id, time_fora_id, gols_casa, gols_fora)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET rodada = EXCLUDED.rodada,
                    data_utc = EXCLUDED.data_utc, status = EXCLUDED.status,
                    gols_casa = EXCLUDED.gols_casa, gols_fora = EXCLUDED.gols_fora
                """,
                (m["id"], comp["id"], int(temporada), m.get("matchday"), m["utcDate"],
                 m["status"], casa, fora, ft.get("home"), ft.get("away")),
            )
            n += 1
        conn.commit()
        print(f"[{codigo}] {n} partidas gravadas")

    cur.close()
    conn.close()
    print("Carga concluída.")


if __name__ == "__main__":
    main()

from flask import Flask, jsonify, request
from flask_cors import CORS

from db import query

app = Flask(__name__)
CORS(app)


def estatisticas_do_time(time_id):
    """Retrospecto do time na temporada (só partidas finalizadas), calculado no banco."""
    stats = query(
        """
        WITH j AS (
            SELECT CASE WHEN time_casa_id = %(id)s THEN gols_casa ELSE gols_fora END AS pro,
                   CASE WHEN time_casa_id = %(id)s THEN gols_fora ELSE gols_casa END AS contra
            FROM partidas
            WHERE status = 'FINISHED'
              AND gols_casa IS NOT NULL AND gols_fora IS NOT NULL
              AND (time_casa_id = %(id)s OR time_fora_id = %(id)s)
        )
        SELECT COUNT(*)                              AS jogos,
               COUNT(*) FILTER (WHERE pro > contra)  AS vitorias,
               COUNT(*) FILTER (WHERE pro = contra)  AS empates,
               COUNT(*) FILTER (WHERE pro < contra)  AS derrotas,
               COALESCE(SUM(pro), 0)                 AS gols_pro,
               COALESCE(SUM(contra), 0)              AS gols_contra
        FROM j
        """,
        {"id": time_id}, one=True,
    )
    stats["pontos"] = stats["vitorias"] * 3 + stats["empates"]
    stats["saldo_gols"] = stats["gols_pro"] - stats["gols_contra"]
    # aproveitamento = pontos conquistados / pontos possíveis (3 por jogo)
    stats["aproveitamento"] = (
        round(stats["pontos"] * 100 / (stats["jogos"] * 3), 1) if stats["jogos"] else 0.0
    )
    return stats


@app.get("/api/campeonatos")
def campeonatos():
    return jsonify(query("SELECT id, codigo, nome, pais, emblema_url FROM campeonatos ORDER BY nome"))


@app.get("/api/times")
def times():
    busca = request.args.get("busca", "").strip()
    campeonato = request.args.get("campeonato", "").strip()  # id ou código (PL, BSA...)

    sql = """
        SELECT t.id, t.nome, t.nome_curto, t.sigla, t.escudo_url,
               c.id AS campeonato_id, c.codigo AS campeonato_codigo, c.nome AS campeonato
        FROM times t JOIN campeonatos c ON c.id = t.campeonato_id
        WHERE 1=1
    """
    params = []
    if busca:
        sql += " AND (t.nome ILIKE %s OR t.nome_curto ILIKE %s OR t.sigla ILIKE %s)"
        params += [f"%{busca}%"] * 3
    if campeonato:
        if campeonato.isdigit():
            sql += " AND c.id = %s"
            params.append(int(campeonato))
        else:
            sql += " AND c.codigo = %s"
            params.append(campeonato.upper())
    sql += " ORDER BY t.nome"
    return jsonify(query(sql, params))


@app.get("/api/times/<int:time_id>")
def time_detalhe(time_id):
    time = query(
        """
        SELECT t.*, c.codigo AS campeonato_codigo, c.nome AS campeonato
        FROM times t JOIN campeonatos c ON c.id = t.campeonato_id
        WHERE t.id = %s
        """,
        (time_id,), one=True,
    )
    if not time:
        return jsonify({"erro": "Time não encontrado"}), 404
    return jsonify(time)


# Os parênteses no WHERE são essenciais: sem eles o AND dos filtros seguintes
# só valeria para o "OR" da direita.
PARTIDAS_SQL = """
    SELECT p.id, p.rodada, p.data_utc, p.status, p.gols_casa, p.gols_fora,
           p.time_casa_id, tc.nome AS time_casa, tc.escudo_url AS escudo_casa,
           p.time_fora_id, tf.nome AS time_fora, tf.escudo_url AS escudo_fora
    FROM partidas p
    JOIN times tc ON tc.id = p.time_casa_id
    JOIN times tf ON tf.id = p.time_fora_id
    WHERE (p.time_casa_id = %(id)s OR p.time_fora_id = %(id)s)
"""


@app.get("/api/times/<int:time_id>/partidas")
def time_partidas(time_id):
    status = request.args.get("status", "").upper()  # FINISHED | SCHEDULED
    limite = min(request.args.get("limite", 50, type=int), 200)
    sql = PARTIDAS_SQL
    params = {"id": time_id, "limite": limite}
    if status == "FINISHED":
        # só partidas com placar, para a lista bater com as estatísticas do /resumo
        sql += " AND p.status = 'FINISHED' AND p.gols_casa IS NOT NULL AND p.gols_fora IS NOT NULL"
    elif status == "SCHEDULED":
        sql += " AND p.status IN ('SCHEDULED', 'TIMED')"
    sql += " ORDER BY p.data_utc DESC LIMIT %(limite)s"
    return jsonify(query(sql, params))


@app.get("/api/times/<int:time_id>/resumo")
def time_resumo(time_id):
    time = query("SELECT id, nome, escudo_url FROM times WHERE id = %s", (time_id,), one=True)
    if not time:
        return jsonify({"erro": "Time não encontrado"}), 404

    ultimas = query(
        PARTIDAS_SQL + " AND p.status = 'FINISHED' ORDER BY p.data_utc DESC LIMIT 5",
        {"id": time_id},
    )
    proximas = query(
        PARTIDAS_SQL + " AND p.status IN ('SCHEDULED', 'TIMED') ORDER BY p.data_utc ASC LIMIT 5",
        {"id": time_id},
    )
    return jsonify({"time": time, "estatisticas": estatisticas_do_time(time_id),
                    "ultimas_partidas": ultimas, "proximas_partidas": proximas})


@app.get("/api/comparar")
def comparar():
    id1 = request.args.get("time1", type=int)
    id2 = request.args.get("time2", type=int)
    if id1 is None or id2 is None:
        return jsonify({"erro": "Informe time1 e time2 (ids numéricos)"}), 400
    if id1 == id2:
        return jsonify({"erro": "Escolha dois times diferentes"}), 400

    times_dados = []
    for time_id in (id1, id2):
        time = query(
            """
            SELECT t.id, t.nome, t.nome_curto, t.sigla, t.escudo_url,
                   t.campeonato_id, c.nome AS campeonato
            FROM times t JOIN campeonatos c ON c.id = t.campeonato_id
            WHERE t.id = %s
            """,
            (time_id,), one=True,
        )
        if not time:
            return jsonify({"erro": f"Time {time_id} não encontrado"}), 404
        time["estatisticas"] = estatisticas_do_time(time_id)
        times_dados.append(time)

    confrontos = query(
        """
        SELECT p.id, p.rodada, p.data_utc,
               p.time_casa_id, tc.nome AS time_casa,
               p.time_fora_id, tf.nome AS time_fora,
               p.gols_casa, p.gols_fora
        FROM partidas p
        JOIN times tc ON tc.id = p.time_casa_id
        JOIN times tf ON tf.id = p.time_fora_id
        WHERE p.status = 'FINISHED'
          AND p.gols_casa IS NOT NULL AND p.gols_fora IS NOT NULL
          AND ((p.time_casa_id = %(a)s AND p.time_fora_id = %(b)s)
            OR (p.time_casa_id = %(b)s AND p.time_fora_id = %(a)s))
        ORDER BY p.data_utc DESC
        """,
        {"a": id1, "b": id2},
    )

    resumo = {"vitorias_time1": 0, "vitorias_time2": 0, "empates": 0}
    for jogo in confrontos:
        if jogo["gols_casa"] == jogo["gols_fora"]:
            jogo["vencedor_id"] = None
            resumo["empates"] += 1
            continue
        casa_venceu = jogo["gols_casa"] > jogo["gols_fora"]
        jogo["vencedor_id"] = jogo["time_casa_id"] if casa_venceu else jogo["time_fora_id"]
        if jogo["vencedor_id"] == id1:
            resumo["vitorias_time1"] += 1
        else:
            resumo["vitorias_time2"] += 1

    return jsonify({
        "time1": times_dados[0],
        "time2": times_dados[1],
        "mesmo_campeonato": times_dados[0]["campeonato_id"] == times_dados[1]["campeonato_id"],
        "confrontos": confrontos,
        "confrontos_resumo": resumo,
    })


@app.post("/api/buscas")
def registrar_busca():
    dados = request.get_json(silent=True) or {}
    termo = (dados.get("termo") or "").strip()
    if not termo:
        return jsonify({"erro": "Campo 'termo' é obrigatório"}), 400

    time_id = dados.get("time_id")
    campeonato_id = dados.get("campeonato_id")
    # Se não veio time_id, tenta casar o termo com um time pelo nome
    if time_id is None:
        achado = query("SELECT id FROM times WHERE nome ILIKE %s OR nome_curto ILIKE %s LIMIT 1",
                       (termo, termo), one=True)
        time_id = achado["id"] if achado else None

    busca = query(
        """
        INSERT INTO buscas (termo, time_id, campeonato_id)
        VALUES (%s, %s, %s) RETURNING id, termo, time_id, campeonato_id, criado_em
        """,
        (termo, time_id, campeonato_id), one=True, commit=True,
    )
    return jsonify(busca), 201


@app.get("/api/buscas/populares")
def buscas_populares():
    limite = min(request.args.get("limite", 10, type=int), 50)
    return jsonify(query(
        """
        SELECT COALESCE(t.nome, LOWER(b.termo)) AS nome, b.time_id, t.escudo_url,
               COUNT(*) AS total
        FROM buscas b LEFT JOIN times t ON t.id = b.time_id
        GROUP BY COALESCE(t.nome, LOWER(b.termo)), b.time_id, t.escudo_url
        ORDER BY total DESC, nome
        LIMIT %s
        """,
        (limite,),
    ))


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})

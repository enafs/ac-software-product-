"""Testes de ponta a ponta da API (precisa do banco já carregado com carga.py).

Dentro do Docker:   docker compose run --rm api python testes_api.py
Fora do Docker:     set API_BASE=http://localhost:5001/api  &&  python testes_api.py
"""
import os
import sys

import requests

BASE = os.environ.get("API_BASE", "http://api:5000/api")
TERMO_TESTE = "__teste_automatizado__"


def get(caminho):
    return requests.get(BASE + caminho, timeout=10)


def times_da_liga(codigo):
    resposta = get("/times?campeonato=" + codigo)
    assert resposta.status_code == 200, f"/times?campeonato={codigo} devolveu {resposta.status_code}"
    times = resposta.json()
    assert len(times) >= 2, f"liga {codigo} sem times (rodou a carga?)"
    return times


# ----------------------------- testes -----------------------------

def teste_health():
    assert get("/health").json()["status"] == "ok"


def teste_seis_campeonatos():
    lista = get("/campeonatos").json()
    codigos = sorted(c["codigo"] for c in lista)
    assert codigos == ["BL1", "BSA", "FL1", "PD", "PL", "SA"], f"campeonatos encontrados: {codigos}"


def teste_todas_as_ligas_tem_times():
    for codigo in ["BSA", "PL", "PD", "SA", "BL1", "FL1"]:
        times_da_liga(codigo)


def teste_busca_sem_resultado():
    resposta = get("/times?busca=zzzzzzzz")
    assert resposta.status_code == 200
    assert resposta.json() == [], "busca inexistente deveria devolver lista vazia"


def teste_busca_com_resultado():
    time = times_da_liga("BSA")[0]
    achados = get("/times?busca=" + time["sigla"]).json()
    assert time["id"] in [t["id"] for t in achados], "busca pela sigla não achou o time"


def teste_time_detalhe_e_inexistente():
    time = times_da_liga("BSA")[0]
    assert get(f"/times/{time['id']}").status_code == 200
    assert get("/times/999999").status_code == 404
    assert get("/times/999999/resumo").status_code == 404


def teste_resumo_consistente():
    for codigo in ["BSA", "PL"]:
        time = times_da_liga(codigo)[0]
        est = get(f"/times/{time['id']}/resumo").json()["estatisticas"]
        assert est["jogos"] == est["vitorias"] + est["empates"] + est["derrotas"], f"{codigo}: jogos != V+E+D"
        assert est["pontos"] == est["vitorias"] * 3 + est["empates"], f"{codigo}: pontos errados"
        assert 0 <= est["aproveitamento"] <= 100, f"{codigo}: aproveitamento fora de 0-100"


def teste_partidas_finalizadas_tem_placar():
    time = times_da_liga("BSA")[0]
    partidas = get(f"/times/{time['id']}/partidas?status=FINISHED&limite=200").json()
    assert all(p["gols_casa"] is not None and p["gols_fora"] is not None for p in partidas), \
        "há partida finalizada sem placar"
    assert all(time["id"] in (p["time_casa_id"], p["time_fora_id"]) for p in partidas), \
        "veio partida de outro time"
    resumo = get(f"/times/{time['id']}/resumo").json()["estatisticas"]
    assert len(partidas) == resumo["jogos"], \
        f"tabela tem {len(partidas)} partidas e o resumo diz {resumo['jogos']} jogos"


def teste_busca_registrada_e_ranking():
    sem_termo = requests.post(BASE + "/buscas", json={}, timeout=10)
    assert sem_termo.status_code == 400, "POST sem termo deveria dar 400"

    time = times_da_liga("BSA")[0]
    corpo = {"termo": TERMO_TESTE, "time_id": time["id"], "campeonato_id": time["campeonato_id"]}
    criada = requests.post(BASE + "/buscas", json=corpo, timeout=10)
    assert criada.status_code == 201, f"POST /buscas devolveu {criada.status_code}"

    populares = get("/buscas/populares?limite=50").json()
    assert time["id"] in [p["time_id"] for p in populares], "time buscado não apareceu nos populares"


def teste_comparar_mesmo_campeonato():
    a, b = times_da_liga("BSA")[:2]
    dados = get(f"/comparar?time1={a['id']}&time2={b['id']}").json()
    assert dados["mesmo_campeonato"] is True
    for chave in ["jogos", "vitorias", "empates", "derrotas", "gols_pro", "gols_contra", "aproveitamento"]:
        assert chave in dados["time1"]["estatisticas"], f"falta {chave} nas estatísticas"

    resumo = dados["confrontos_resumo"]
    total = resumo["vitorias_time1"] + resumo["vitorias_time2"] + resumo["empates"]
    assert total == len(dados["confrontos"]), "resumo dos confrontos não bate com a lista"
    for jogo in dados["confrontos"]:
        assert {jogo["time_casa_id"], jogo["time_fora_id"]} == {a["id"], b["id"]}, "confronto de outros times"
        assert jogo["gols_casa"] is not None and jogo["gols_fora"] is not None

    # o retrospecto da comparação tem que ser igual ao da página do time
    resumo_a = get(f"/times/{a['id']}/resumo").json()["estatisticas"]
    assert resumo_a == dados["time1"]["estatisticas"], "estatísticas diferentes entre /comparar e /resumo"


def teste_comparar_campeonatos_diferentes():
    a = times_da_liga("BSA")[0]
    b = times_da_liga("PL")[0]
    dados = get(f"/comparar?time1={a['id']}&time2={b['id']}").json()
    assert dados["mesmo_campeonato"] is False
    assert dados["confrontos"] == [], "times de ligas diferentes não deveriam ter confrontos"


def teste_comparar_erros():
    time = times_da_liga("BSA")[0]
    assert get("/comparar").status_code == 400, "sem parâmetros deveria dar 400"
    assert get(f"/comparar?time1={time['id']}").status_code == 400, "faltando time2 deveria dar 400"
    assert get(f"/comparar?time1={time['id']}&time2={time['id']}").status_code == 400, "mesmo time deveria dar 400"
    assert get(f"/comparar?time1={time['id']}&time2=999999").status_code == 404, "time inexistente deveria dar 404"


TESTES = [
    teste_health,
    teste_seis_campeonatos,
    teste_todas_as_ligas_tem_times,
    teste_busca_sem_resultado,
    teste_busca_com_resultado,
    teste_time_detalhe_e_inexistente,
    teste_resumo_consistente,
    teste_partidas_finalizadas_tem_placar,
    teste_busca_registrada_e_ranking,
    teste_comparar_mesmo_campeonato,
    teste_comparar_campeonatos_diferentes,
    teste_comparar_erros,
]


def limpar_busca_de_teste():
    """Apaga a busca criada pelo teste para não sujar o ranking de mais buscados."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        print(f"(aviso) DATABASE_URL ausente: apague manualmente as buscas com termo '{TERMO_TESTE}'")
        return
    import psycopg2
    conn = psycopg2.connect(url)
    with conn, conn.cursor() as cur:
        cur.execute("DELETE FROM buscas WHERE termo = %s", (TERMO_TESTE,))
    conn.close()


def main():
    falhas = 0
    for teste in TESTES:
        nome = teste.__name__.replace("teste_", "").replace("_", " ")
        try:
            teste()
            print(f"[OK]    {nome}")
        except AssertionError as erro:
            falhas += 1
            print(f"[FALHA] {nome}: {erro}")
        except Exception as erro:
            falhas += 1
            print(f"[ERRO]  {nome}: {type(erro).__name__}: {erro}")

    limpar_busca_de_teste()
    print(f"\n{len(TESTES) - falhas}/{len(TESTES)} testes passaram")
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()

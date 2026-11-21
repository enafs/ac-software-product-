# infoTeam

Sistema web para consultar times de futebol, ver o histórico de partidas e **comparar dois times lado a lado**
em seis campeonatos: Brasileirão Série A, Premier League, La Liga, Serie A (Itália), Bundesliga e Ligue 1.

Trabalho acadêmico. Os dados vêm da API gratuita [football-data.org](https://www.football-data.org/).

## Como funciona

```
football-data.org ──(script de carga)──▶ PostgreSQL ◀── API Flask ◀── Front-end (HTML/CSS/JS)
```

- **Script de carga** (`backend/carga.py`): busca campeonatos, times e partidas na football-data.org e grava no banco. Roda sob demanda.
- **API Flask** (`backend/app.py`): só consulta o banco. Não chama a football-data.org, então não consome o limite de 10 requisições por minuto e funciona sem internet.
- **PostgreSQL**: tabelas `campeonatos`, `times`, `partidas` e `buscas` (`db/init.sql`), com dados guardados em volume Docker.
- **Front-end** (`frontend/`): HTML, CSS e JavaScript puro, usando `fetch` nas rotas da API.

## Telas

| Tela | O que faz |
|---|---|
| `index.html` | Busca de times por nome/sigla e filtro por campeonato; lista dos times mais buscados |
| `time.html?id=` | Dados do time, resumo da temporada, histórico de partidas e botão "Comparar com outro time" |
| `comparar.html` | Escolha de dois times e comparação lado a lado: retrospecto (com destaque de quem está melhor em cada item), aproveitamento e confrontos diretos |

## Requisitos

- Docker e Docker Compose
- Token gratuito da football-data.org (https://www.football-data.org/client/register)

## Como rodar

1. Copie o arquivo de variáveis e coloque o seu token:
   ```
   copy .env.example .env
   ```
   Edite o `.env` e preencha `FOOTBALL_DATA_TOKEN`. **Nunca versione o `.env`** (ele deve estar no `.gitignore`).

2. Suba o banco, a API e o front-end:
   ```
   docker compose up -d --build
   ```

3. Carregue os dados da football-data.org (leva cerca de 1,5 minuto por causa do limite de 10 requisições por minuto):
   ```
   docker compose run --rm api python carga.py
   ```

4. Acesse:
   - Sistema: http://localhost:8080
   - API: http://localhost:5001/api/campeonatos

Para parar sem perder nada: `docker compose down`. Para apagar tudo, **inclusive o banco**: `docker compose down -v`.

## Rotas da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/campeonatos` | Lista os campeonatos |
| GET | `/api/times?busca=&campeonato=` | Busca times por nome/sigla; `campeonato` aceita id ou código (`PL`, `BSA`...) |
| GET | `/api/times/<id>` | Dados de um time |
| GET | `/api/times/<id>/partidas?status=&limite=` | Partidas do time (`status`: `FINISHED` ou `SCHEDULED`) |
| GET | `/api/times/<id>/resumo` | Vitórias, empates, derrotas, gols, pontos, aproveitamento, últimas e próximas partidas |
| GET | `/api/comparar?time1=&time2=` | Retrospecto dos dois times, aproveitamento e confrontos diretos |
| POST | `/api/buscas` | Registra uma busca (`{"termo": "...", "time_id": 1, "campeonato_id": 2}`) |
| GET | `/api/buscas/populares?limite=` | Times mais buscados |
| GET | `/api/health` | Verifica se a API está no ar |

**Aproveitamento** = pontos conquistados ÷ pontos possíveis (3 por jogo), em porcentagem.
Na comparação, só há confrontos diretos quando os dois times estão no mesmo campeonato.

## Testes

Testes automáticos da API (precisam do banco já carregado):
```
docker compose up -d --build api
docker compose run --rm api python testes_api.py
```
Eles conferem: os 6 campeonatos, busca com e sem resultado, time inexistente (404), consistência do resumo
(jogos = vitórias + empates + derrotas), registro de buscas, e a rota de comparação (mesmo campeonato,
campeonatos diferentes e parâmetros inválidos). A busca criada pelo teste é apagada ao final.

Roteiro manual do front-end:

1. Busca sem resultado: digite `zzzz` em http://localhost:8080 (aparece "Nenhum time encontrado").
2. Time inexistente: abra `http://localhost:8080/time.html?id=999999`.
3. Comparar pelo botão: abra um time, clique em "Comparar com outro time" e escolha o segundo.
4. Times que não se enfrentaram e times de campeonatos diferentes: confira as mensagens na comparação.
5. API fora do ar: `docker compose stop api`, recarregue as telas (aparece a mensagem de erro) e depois `docker compose start api`.

**Dados persistem após reiniciar o Docker:**
```
docker compose down
docker compose up -d
```
Os times, partidas e buscas continuam lá (o volume `pgdata` não é apagado). Só `docker compose down -v` apaga o banco.

## Estrutura

```
backend/    API Flask, conexão com o banco, script de carga e testes (testes_api.py)
db/         init.sql (criação das tabelas)
frontend/   index.html, time.html, comparar.html, css/ e js/
docker-compose.yml
.env.example
```

## Limitações

- Só a **temporada atual** de cada campeonato (o plano gratuito da football-data.org limita o histórico).
- Os dados são atualizados pela **carga manual** (`carga.py`); não há atualização automática. Placares novos só aparecem depois de rodar a carga de novo.
- Apenas **6 campeonatos**.
- Os confrontos diretos mostram só jogos da temporada atual e só entre times do mesmo campeonato.
- Sem autenticação de usuários.
- O resumo, o histórico e a comparação consideram só partidas finalizadas.

## Problemas comuns

- **"ports are not available" (Windows):** a porta já está em uso ou reservada pelo sistema. Troque a porta da esquerda em `ports:` no `docker-compose.yml` (por exemplo `"5001:5000"`) e ajuste `frontend/js/config.js` se mudar a da API.
- **A tela mostra "Não foi possível carregar os dados":** a API não está no ar. Confira com `docker compose ps`.
- **Listas vazias:** a carga ainda não foi executada (passo 3).
- **Placar de jogo recente não aparece:** rode a carga de novo (`carga.py`).

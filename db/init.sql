CREATE TABLE IF NOT EXISTS campeonatos (
    id          INTEGER PRIMARY KEY,          -- id da football-data.org
    codigo      VARCHAR(10) UNIQUE NOT NULL,  -- BSA, PL, PD, SA, BL1, FL1
    nome        VARCHAR(100) NOT NULL,
    pais        VARCHAR(60),
    emblema_url TEXT
);

CREATE TABLE IF NOT EXISTS times (
    id            INTEGER PRIMARY KEY,        -- id da football-data.org
    campeonato_id INTEGER NOT NULL REFERENCES campeonatos(id),
    nome          VARCHAR(120) NOT NULL,
    nome_curto    VARCHAR(60),
    sigla         VARCHAR(10),
    escudo_url    TEXT,
    fundacao      INTEGER,
    estadio       VARCHAR(120),
    cores         VARCHAR(120),
    site          TEXT
);
CREATE INDEX IF NOT EXISTS idx_times_campeonato ON times(campeonato_id);
CREATE INDEX IF NOT EXISTS idx_times_nome ON times(LOWER(nome));

CREATE TABLE IF NOT EXISTS partidas (
    id            INTEGER PRIMARY KEY,        -- id da football-data.org
    campeonato_id INTEGER NOT NULL REFERENCES campeonatos(id),
    temporada     INTEGER,
    rodada        INTEGER,
    data_utc      TIMESTAMPTZ,
    status        VARCHAR(20),                -- SCHEDULED, TIMED, FINISHED...
    time_casa_id  INTEGER NOT NULL REFERENCES times(id),
    time_fora_id  INTEGER NOT NULL REFERENCES times(id),
    gols_casa     INTEGER,
    gols_fora     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_partidas_casa ON partidas(time_casa_id);
CREATE INDEX IF NOT EXISTS idx_partidas_fora ON partidas(time_fora_id);
CREATE INDEX IF NOT EXISTS idx_partidas_data ON partidas(data_utc);

CREATE TABLE IF NOT EXISTS buscas (
    id            SERIAL PRIMARY KEY,
    termo         VARCHAR(120) NOT NULL,
    time_id       INTEGER REFERENCES times(id),
    campeonato_id INTEGER REFERENCES campeonatos(id),
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_buscas_time ON buscas(time_id);

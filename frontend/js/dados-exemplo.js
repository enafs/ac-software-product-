const campeonatosExemplo = [
  { id: 2013, nome: "Campeonato Brasileiro Série A" },
  { id: 2021, nome: "Premier League" },
  { id: 2014, nome: "La Liga" },
  { id: 2019, nome: "Serie A" },
  { id: 2002, nome: "Bundesliga" },
  { id: 2015, nome: "Ligue 1" }
];

const timesExemplo = [
  {
    id: 1783, nome: "Clube de Regatas do Flamengo", sigla: "FLA", apelido: "Flamengo",
    fundacao: 1895, estadio: "Estádio Jornalista Mário Filho", cores: "Red / Black",
    site: "http://www.flamengo.com.br", id_campeonato: 2013
  },
  {
    id: 1769, nome: "Sociedade Esportiva Palmeiras", sigla: "PAL", apelido: "Palmeiras",
    fundacao: 1914, estadio: "Allianz Parque", cores: "Green / White",
    site: "http://www.palmeiras.com.br", id_campeonato: 2013
  },
  {
    id: 1776, nome: "São Paulo Futebol Clube", sigla: "SAO", apelido: "São Paulo",
    fundacao: 1930, estadio: "Estádio do Morumbi", cores: "Red / White / Black",
    site: "http://www.saopaulofc.net", id_campeonato: 2013
  },
  {
    id: 1766, nome: "Clube Atlético Mineiro", sigla: "CAM", apelido: "Atlético-MG",
    fundacao: 1908, estadio: "Arena MRV", cores: "Black / White",
    site: "http://www.atletico.com.br", id_campeonato: 2013
  },
  {
    id: 1765, nome: "Fluminense Football Club", sigla: "FLU", apelido: "Fluminense",
    fundacao: 1902, estadio: "Estádio Jornalista Mário Filho", cores: "Garnet / Green / White",
    site: "http://www.fluminense.com.br", id_campeonato: 2013
  },
  {
    id: 1770, nome: "Botafogo de Futebol e Regatas", sigla: "BOT", apelido: "Botafogo",
    fundacao: 1904, estadio: "Estádio Olímpico Nilton Santos", cores: "Black / White",
    site: "http://www.botafogo.com.br", id_campeonato: 2013
  },
  {
    id: 64, nome: "Liverpool FC", sigla: "LIV", apelido: "Liverpool",
    fundacao: 1892, estadio: "Anfield", cores: "Red / White",
    site: "http://www.liverpoolfc.com", id_campeonato: 2021
  },
  {
    id: 65, nome: "Manchester City FC", sigla: "MCI", apelido: "Man City",
    fundacao: 1880, estadio: "Etihad Stadium", cores: "Sky Blue / White",
    site: "http://www.mancity.com", id_campeonato: 2021
  },
  {
    id: 57, nome: "Arsenal FC", sigla: "ARS", apelido: "Arsenal",
    fundacao: 1886, estadio: "Emirates Stadium", cores: "Red / White",
    site: "http://www.arsenal.com", id_campeonato: 2021
  },
  {
    id: 61, nome: "Chelsea FC", sigla: "CHE", apelido: "Chelsea",
    fundacao: 1905, estadio: "Stamford Bridge", cores: "Royal Blue / White",
    site: "http://www.chelseafc.com", id_campeonato: 2021
  },
  {
    id: 66, nome: "Manchester United FC", sigla: "MUN", apelido: "Man United",
    fundacao: 1878, estadio: "Old Trafford", cores: "Red / White / Black",
    site: "http://www.manutd.com", id_campeonato: 2021
  },
  {
    id: 73, nome: "Tottenham Hotspur FC", sigla: "TOT", apelido: "Tottenham",
    fundacao: 1882, estadio: "Tottenham Hotspur Stadium", cores: "White / Navy Blue",
    site: "http://www.tottenhamhotspur.com", id_campeonato: 2021
  },
  {
    id: 81, nome: "FC Barcelona", sigla: "BAR", apelido: "Barcelona",
    fundacao: 1899, estadio: "Spotify Camp Nou", cores: "Blue / Garnet",
    site: "http://www.fcbarcelona.cat", id_campeonato: 2014
  },
  {
    id: 86, nome: "Real Madrid CF", sigla: "RMA", apelido: "Real Madrid",
    fundacao: 1902, estadio: "Estadio Santiago Bernabéu", cores: "White / Purple",
    site: "http://www.realmadrid.com", id_campeonato: 2014
  },
  {
    id: 78, nome: "Club Atlético de Madrid", sigla: "ATM", apelido: "Atlético de Madrid",
    fundacao: 1903, estadio: "Estadio Metropolitano", cores: "Red / White / Blue",
    site: "http://www.atleticodemadrid.com", id_campeonato: 2014
  },
  {
    id: 559, nome: "Sevilla FC", sigla: "SEV", apelido: "Sevilla",
    fundacao: 1890, estadio: "Estadio Ramón Sánchez-Pizjuán", cores: "White / Red",
    site: "http://www.sevillafc.es", id_campeonato: 2014
  },
  {
    id: 77, nome: "Athletic Club", sigla: "ATH", apelido: "Athletic Bilbao",
    fundacao: 1898, estadio: "San Mamés", cores: "Red / White",
    site: "http://www.athletic-club.eus", id_campeonato: 2014
  },
  {
    id: 108, nome: "FC Internazionale Milano", sigla: "INT", apelido: "Inter de Milão",
    fundacao: 1908, estadio: "Stadio Giuseppe Meazza", cores: "Blue / Black",
    site: "http://www.inter.it", id_campeonato: 2019
  },
  {
    id: 109, nome: "Juventus FC", sigla: "JUV", apelido: "Juventus",
    fundacao: 1897, estadio: "Allianz Stadium", cores: "White / Black",
    site: "http://www.juventus.com", id_campeonato: 2019
  },
  {
    id: 98, nome: "AC Milan", sigla: "MIL", apelido: "Milan",
    fundacao: 1899, estadio: "Stadio Giuseppe Meazza", cores: "Red / Black",
    site: "http://www.acmilan.com", id_campeonato: 2019
  },
  {
    id: 113, nome: "SSC Napoli", sigla: "NAP", apelido: "Napoli",
    fundacao: 1926, estadio: "Stadio Diego Armando Maradona", cores: "Sky Blue / White",
    site: "http://www.sscnapoli.it", id_campeonato: 2019
  },
  {
    id: 100, nome: "AS Roma", sigla: "ROM", apelido: "Roma",
    fundacao: 1927, estadio: "Stadio Olimpico", cores: "Dark Red / Orange",
    site: "http://www.asroma.com", id_campeonato: 2019
  },
  {
    id: 5, nome: "FC Bayern München", sigla: "FCB", apelido: "Bayern de Munique",
    fundacao: 1900, estadio: "Allianz Arena", cores: "Red / White",
    site: "http://www.fcbayern.de", id_campeonato: 2002
  },
  {
    id: 4, nome: "Borussia Dortmund", sigla: "BVB", apelido: "Dortmund",
    fundacao: 1909, estadio: "Signal Iduna Park", cores: "Yellow / Black",
    site: "http://www.bvb.de", id_campeonato: 2002
  },
  {
    id: 3, nome: "Bayer 04 Leverkusen", sigla: "B04", apelido: "Leverkusen",
    fundacao: 1904, estadio: "BayArena", cores: "Red / Black",
    site: "http://www.bayer04.de", id_campeonato: 2002
  },
  {
    id: 721, nome: "RB Leipzig", sigla: "RBL", apelido: "Leipzig",
    fundacao: 2009, estadio: "Red Bull Arena", cores: "White / Red",
    site: "http://www.dierotenbullen.com", id_campeonato: 2002
  },
  {
    id: 524, nome: "Paris Saint-Germain FC", sigla: "PSG", apelido: "PSG",
    fundacao: 1970, estadio: "Parc des Princes", cores: "Blue / Red / White",
    site: "http://www.psg.fr", id_campeonato: 2015
  },
  {
    id: 516, nome: "Olympique de Marseille", sigla: "OM", apelido: "Marseille",
    fundacao: 1899, estadio: "Orange Vélodrome", cores: "White / Sky Blue",
    site: "http://www.om.net", id_campeonato: 2015
  },
  {
    id: 523, nome: "Olympique Lyonnais", sigla: "OL", apelido: "Lyon",
    fundacao: 1950, estadio: "Groupama Stadium", cores: "Red / Blue / White",
    site: "http://www.ol.fr", id_campeonato: 2015
  },
  {
    id: 548, nome: "AS Monaco FC", sigla: "ASM", apelido: "Monaco",
    fundacao: 1924, estadio: "Stade Louis II", cores: "Red / White",
    site: "http://www.asmonaco.com", id_campeonato: 2015
  }
];

timesExemplo.forEach(function (time) {
  time.escudo = "https://crests.football-data.org/" + time.id + ".png";

  const campeonato = campeonatosExemplo.find(function (item) {
    return item.id === time.id_campeonato;
  });
  time.campeonato = campeonato.nome;
});

const maisBuscadosExemplo = [
  { id: 1783, apelido: "Flamengo", total: 34 },
  { id: 64, apelido: "Liverpool", total: 28 },
  { id: 1765, apelido: "Fluminense", total: 21 },
  { id: 86, apelido: "Real Madrid", total: 19 },
  { id: 1769, apelido: "Palmeiras", total: 15 }
];

const placaresExemplo = [
  [3, 0], [1, 2], [2, 2], [0, 1], [1, 0],
  [2, 1], [4, 1], [1, 1], [0, 2], [0, 3]
];

function buscarTimePorId(id) {
  return timesExemplo.find(function (time) {
    return time.id === id;
  });
}

function partidasDeExemplo(idTime) {
  const time = buscarTimePorId(idTime);
  if (!time) {
    return [];
  }

  const rivais = timesExemplo.filter(function (outro) {
    return outro.id_campeonato === time.id_campeonato && outro.id !== time.id;
  });

  const partidas = [];
  let data = new Date("2026-08-30T20:00:00Z");

  for (let i = 0; i < placaresExemplo.length; i++) {
    const rival = rivais[i % rivais.length];
    const emCasa = i % 2 === 0;
    const placar = placaresExemplo[i];

    const mandante = emCasa ? time : rival;
    const visitante = emCasa ? rival : time;

    partidas.push({
      id: 9000 + i,
      data_hora: data.toISOString(),
      rodada: placaresExemplo.length - i,
      campeonato: time.campeonato,
      id_time_casa: mandante.id,
      time_casa: mandante.apelido,
      escudo_casa: mandante.escudo,
      id_time_fora: visitante.id,
      time_fora: visitante.apelido,
      escudo_fora: visitante.escudo,
      gols_casa: placar[0],
      gols_fora: placar[1],
      resultado: calcularResultado(placar[0], placar[1], emCasa)
    });

    data = new Date(data.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return partidas;
}

function calcularResultado(golsCasa, golsFora, emCasa) {
  if (golsCasa === golsFora) {
    return "E";
  }
  const casaVenceu = golsCasa > golsFora;
  if (casaVenceu === emCasa) {
    return "V";
  }
  return "D";
}

const parametros = new URLSearchParams(window.location.search);

const selectTime1 = document.getElementById("time1");
const selectTime2 = document.getElementById("time2");
const pDica = document.getElementById("dica");
const pAviso = document.getElementById("aviso");
const divResultado = document.getElementById("resultado");

const MENSAGEM_ERRO = "Não foi possível carregar os dados. Verifique se a API está no ar e tente novamente.";

// melhor: "maior" = quem tem mais está melhor; "menor" = quem tem menos está melhor;
// null = só informativo, sem destaque
const METRICAS = [
  { chave: "jogos", rotulo: "Jogos", melhor: null },
  { chave: "vitorias", rotulo: "Vitórias", melhor: "maior" },
  { chave: "empates", rotulo: "Empates", melhor: null },
  { chave: "derrotas", rotulo: "Derrotas", melhor: "menor" },
  { chave: "gols_pro", rotulo: "Gols pró", melhor: "maior" },
  { chave: "gols_contra", rotulo: "Gols contra", melhor: "menor" },
  { chave: "aproveitamento", rotulo: "Aproveitamento", melhor: "maior", porcentagem: true }
];

const meses = ["jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez"];

let ultimaRequisicao = 0;

function formatarData(texto) {
  const data = new Date(texto);
  const dia = String(data.getDate()).padStart(2, "0");
  return dia + " " + meses[data.getMonth()] + " " + data.getFullYear();
}

function formatarValor(metrica, valor) {
  if (metrica.porcentagem) {
    return Number(valor).toFixed(1).replace(".", ",") + "%";
  }
  return String(valor);
}

// devolve 1 se o time 1 está melhor, 2 se o time 2 está melhor, 0 se empatam ou não há destaque
function quemEstaMelhor(metrica, valor1, valor2) {
  if (!metrica.melhor || valor1 === valor2) {
    return 0;
  }
  if (metrica.melhor === "maior") {
    return valor1 > valor2 ? 1 : 2;
  }
  return valor1 < valor2 ? 1 : 2;
}

function nomeCurto(time) {
  return time.nome_curto || time.nome;
}

async function carregarTimes() {
  try {
    const times = await api("/times");

    const grupos = {};
    times.forEach(function (time) {
      if (!grupos[time.campeonato]) {
        grupos[time.campeonato] = [];
      }
      grupos[time.campeonato].push(time);
    });

    [selectTime1, selectTime2].forEach(function (select) {
      Object.keys(grupos).sort().forEach(function (nomeCampeonato) {
        const grupo = criar("optgroup");
        grupo.label = nomeCampeonato;

        grupos[nomeCampeonato]
          .sort(function (a, b) { return nomeCurto(a).localeCompare(nomeCurto(b)); })
          .forEach(function (time) {
            const opcao = criar("option", "", nomeCurto(time));
            opcao.value = time.id;
            grupo.appendChild(opcao);
          });

        select.appendChild(grupo);
      });
    });
    return true;
  } catch (erro) {
    pDica.textContent = "";
    pAviso.textContent = MENSAGEM_ERRO;
    return false;
  }
}

function ladoDoTime(time) {
  const lado = criar("div", "lado");

  if (time.escudo_url) {
    const escudo = criar("img", "escudo-grande");
    escudo.src = time.escudo_url;
    escudo.alt = "escudo do " + nomeCurto(time);
    escudo.onerror = function () { escudo.style.display = "none"; };
    lado.appendChild(escudo);
  }

  const titulo = criar("h2");
  const link = criar("a", "", time.nome);
  link.href = "time.html?id=" + time.id;
  titulo.appendChild(link);
  lado.appendChild(titulo);

  lado.appendChild(criar("p", "campeonato", time.campeonato));
  return lado;
}

function montarDuelo(dados) {
  const duelo = criar("section", "duelo");
  duelo.appendChild(ladoDoTime(dados.time1));
  duelo.appendChild(criar("span", "vs", "x"));
  duelo.appendChild(ladoDoTime(dados.time2));
  return duelo;
}

function montarTabelaComparacao(dados) {
  const secao = criar("section");
  secao.appendChild(criar("h2", "titulo-secao", "Retrospecto na temporada"));

  const tabela = criar("table", "tabela-comparacao");
  const corpo = criar("tbody");

  METRICAS.forEach(function (metrica) {
    const valor1 = dados.time1.estatisticas[metrica.chave];
    const valor2 = dados.time2.estatisticas[metrica.chave];
    const melhor = quemEstaMelhor(metrica, valor1, valor2);

    const linha = criar("tr");
    linha.appendChild(criar("td", melhor === 1 ? "melhor" : "", formatarValor(metrica, valor1)));
    linha.appendChild(criar("td", "rotulo", metrica.rotulo));
    linha.appendChild(criar("td", melhor === 2 ? "melhor" : "", formatarValor(metrica, valor2)));
    corpo.appendChild(linha);
  });

  tabela.appendChild(corpo);
  secao.appendChild(tabela);
  secao.appendChild(criar("p", "legenda",
    "Destaque verde: quem está melhor no item (mais vitórias e gols pró, menos derrotas e gols contra). " +
    "Aproveitamento = pontos conquistados ÷ pontos possíveis."));
  return secao;
}

function montarConfrontos(dados) {
  const secao = criar("section");
  secao.appendChild(criar("h2", "titulo-secao", "Confrontos diretos"));

  if (!dados.mesmo_campeonato) {
    secao.appendChild(criar("p", "mensagem-confrontos",
      "Os dois times jogam campeonatos diferentes, por isso não há confrontos diretos."));
    return secao;
  }

  if (dados.confrontos.length === 0) {
    secao.appendChild(criar("p", "mensagem-confrontos",
      "Esses times ainda não se enfrentaram nesta temporada."));
    return secao;
  }

  const r = dados.confrontos_resumo;
  secao.appendChild(criar("p", "confrontos-resumo",
    nomeCurto(dados.time1) + ": " + r.vitorias_time1 + " vitória(s)  |  " +
    "Empates: " + r.empates + "  |  " +
    nomeCurto(dados.time2) + ": " + r.vitorias_time2 + " vitória(s)"));

  const rolagem = criar("div", "tabela-rolagem");
  const tabela = criar("table", "tabela-partidas");

  const cabecalho = criar("thead");
  const linhaCabecalho = criar("tr");
  ["Data", "Rodada", "Mandante", "Placar", "Visitante", "Vencedor"].forEach(function (titulo) {
    linhaCabecalho.appendChild(criar("th", "", titulo));
  });
  cabecalho.appendChild(linhaCabecalho);
  tabela.appendChild(cabecalho);

  const corpo = criar("tbody");
  dados.confrontos.forEach(function (jogo) {
    let vencedor = "Empate";
    if (jogo.vencedor_id !== null) {
      vencedor = jogo.vencedor_id === jogo.time_casa_id ? jogo.time_casa : jogo.time_fora;
    }

    const linha = criar("tr");
    linha.appendChild(criar("td", "", formatarData(jogo.data_utc)));
    linha.appendChild(criar("td", "", jogo.rodada || "-"));
    linha.appendChild(criar("td", jogo.vencedor_id === jogo.time_casa_id ? "destaque" : "", jogo.time_casa));
    linha.appendChild(criar("td", "placar", jogo.gols_casa + " x " + jogo.gols_fora));
    linha.appendChild(criar("td", jogo.vencedor_id === jogo.time_fora_id ? "destaque" : "", jogo.time_fora));
    linha.appendChild(criar("td", "", vencedor));
    corpo.appendChild(linha);
  });
  tabela.appendChild(corpo);
  rolagem.appendChild(tabela);
  secao.appendChild(rolagem);
  return secao;
}

function mostrarComparacao(dados) {
  divResultado.innerHTML = "";
  divResultado.appendChild(montarDuelo(dados));
  divResultado.appendChild(montarTabelaComparacao(dados));
  divResultado.appendChild(montarConfrontos(dados));
}

async function comparar() {
  const id1 = selectTime1.value;
  const id2 = selectTime2.value;

  pAviso.textContent = "";
  divResultado.innerHTML = "";

  if (!id1 && !id2) {
    pDica.textContent = "Escolha dois times para comparar.";
    return;
  }
  if (!id1 || !id2) {
    pDica.textContent = "Escolha o segundo time para ver a comparação.";
    return;
  }
  if (id1 === id2) {
    pDica.textContent = "";
    pAviso.textContent = "Escolha dois times diferentes.";
    return;
  }

  // deixa o endereço compartilhável (comparar.html?time1=..&time2=..)
  try {
    window.history.replaceState(null, "", "?time1=" + id1 + "&time2=" + id2);
  } catch (erro) { /* alguns navegadores bloqueiam em file:// */ }

  const minhaRequisicao = ++ultimaRequisicao;
  pDica.textContent = "Carregando...";

  try {
    const dados = await api("/comparar?time1=" + id1 + "&time2=" + id2);
    if (minhaRequisicao !== ultimaRequisicao) {
      return;
    }
    pDica.textContent = "";
    mostrarComparacao(dados);
  } catch (erro) {
    if (minhaRequisicao !== ultimaRequisicao) {
      return;
    }
    pDica.textContent = "";
    if (erro.status === 404) {
      pAviso.textContent = "Time não encontrado. Escolha outro na lista.";
    } else if (erro.status === 400) {
      pAviso.textContent = "Escolha dois times diferentes.";
    } else {
      pAviso.textContent = MENSAGEM_ERRO;
    }
  }
}

selectTime1.addEventListener("change", comparar);
selectTime2.addEventListener("change", comparar);

// times vindos da URL (ex.: botão "comparar" da página do time)
carregarTimes().then(function (ok) {
  if (!ok) {
    return;
  }
  selectTime1.value = parametros.get("time1") || "";
  selectTime2.value = parametros.get("time2") || "";
  comparar();
});

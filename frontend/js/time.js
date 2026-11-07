const parametros = new URLSearchParams(window.location.search);
const idTime = Number(parametros.get("id"));

const pAviso = document.getElementById("aviso");
const secaoCabecalho = document.getElementById("cabecalho-time");
const secaoResumo = document.getElementById("resumo");
const secaoHistorico = document.querySelector(".historico");
const corpoTabela = document.getElementById("lista-partidas");

let partidas = [];

const nomesResultado = { V: "Vitória", E: "Empate", D: "Derrota" };
const meses = ["jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez"];

function formatarData(texto) {
  const data = new Date(texto);
  const dia = String(data.getDate()).padStart(2, "0");
  return dia + " " + meses[data.getMonth()] + " " + data.getFullYear();
}

// Resultado do ponto de vista do time da página
function resultadoDaPartida(partida) {
  const emCasa = partida.time_casa_id === idTime;
  const pro = emCasa ? partida.gols_casa : partida.gols_fora;
  const contra = emCasa ? partida.gols_fora : partida.gols_casa;

  if (pro === contra) {
    return "E";
  }
  return pro > contra ? "V" : "D";
}

function mostrarCabecalho(time) {
  const nomeCurto = time.nome_curto || time.nome;
  document.title = "infoTeam - " + nomeCurto;

  secaoCabecalho.innerHTML = "";

  if (time.escudo_url) {
    const escudo = criar("img", "escudo-grande");
    escudo.src = time.escudo_url;
    escudo.alt = "escudo do " + nomeCurto;
    escudo.onerror = function () { escudo.style.display = "none"; };
    secaoCabecalho.appendChild(escudo);
  }

  const bloco = criar("div");
  bloco.appendChild(criar("h2", "", time.nome));
  bloco.appendChild(criar("p", "campeonato", time.campeonato));

  const dados = criar("ul", "dados");
  [
    ["Sigla", time.sigla],
    ["Fundação", time.fundacao],
    ["Estádio", time.estadio],
    ["Cores", time.cores]
  ].forEach(function (par) {
    const li = criar("li");
    li.appendChild(criar("span", "", par[0]));
    li.appendChild(document.createTextNode(par[1] || "-"));
    dados.appendChild(li);
  });
  bloco.appendChild(dados);

  // só aceita links http(s) vindos do banco
  if (time.site && /^https?:\/\//i.test(time.site)) {
    const site = criar("a", "site", "site oficial");
    site.href = time.site;
    site.target = "_blank";
    site.rel = "noopener";
    bloco.appendChild(site);
  }

  secaoCabecalho.appendChild(bloco);
}

function mostrarResumo(estatisticas) {
  const cartoes = [
    { rotulo: "Jogos", valor: estatisticas.jogos, cor: "" },
    { rotulo: "Vitórias", valor: estatisticas.vitorias, cor: "vitoria" },
    { rotulo: "Empates", valor: estatisticas.empates, cor: "empate" },
    { rotulo: "Derrotas", valor: estatisticas.derrotas, cor: "derrota" },
    { rotulo: "Pontos", valor: estatisticas.pontos, cor: "" },
    { rotulo: "Gols (pró/contra)", valor: estatisticas.gols_pro + " / " + estatisticas.gols_contra, cor: "" }
  ];

  secaoResumo.innerHTML = "";
  cartoes.forEach(function (cartao) {
    const div = criar("div", "cartao " + cartao.cor);
    div.appendChild(criar("strong", "", String(cartao.valor)));
    div.appendChild(criar("span", "", cartao.rotulo));
    secaoResumo.appendChild(div);
  });
}

function linhaVazia(texto) {
  const linha = criar("tr");
  const celula = criar("td", "vazio", texto);
  celula.colSpan = 6;
  linha.appendChild(celula);
  return linha;
}

function mostrarPartidas(local) {
  corpoTabela.innerHTML = "";

  const filtradas = partidas.filter(function (partida) {
    if (local === "casa") {
      return partida.time_casa_id === idTime;
    }
    if (local === "fora") {
      return partida.time_fora_id === idTime;
    }
    return true;
  });

  if (filtradas.length === 0) {
    corpoTabela.appendChild(linhaVazia(
      partidas.length === 0 ? "Nenhuma partida finalizada ainda." : "Nenhuma partida nesse filtro."));
    return;
  }

  filtradas.forEach(function (partida) {
    const jogouEmCasa = partida.time_casa_id === idTime;
    const resultado = resultadoDaPartida(partida);
    const linha = criar("tr");

    linha.appendChild(criar("td", "", formatarData(partida.data_utc)));
    linha.appendChild(criar("td", "", partida.rodada || "-"));
    linha.appendChild(criar("td", jogouEmCasa ? "destaque" : "", partida.time_casa));
    linha.appendChild(criar("td", "placar", partida.gols_casa + " x " + partida.gols_fora));
    linha.appendChild(criar("td", jogouEmCasa ? "" : "destaque", partida.time_fora));

    const tdResultado = criar("td");
    tdResultado.appendChild(criar("span", "etiqueta " + resultado, nomesResultado[resultado]));
    linha.appendChild(tdResultado);

    corpoTabela.appendChild(linha);
  });
}

function ligarFiltros() {
  const botoes = document.querySelectorAll("#filtro-local button");

  botoes.forEach(function (botao) {
    botao.addEventListener("click", function () {
      botoes.forEach(function (outro) {
        outro.classList.remove("ativo");
      });
      botao.classList.add("ativo");
      mostrarPartidas(botao.dataset.local);
    });
  });
}

function mostrarFalha(mensagem) {
  pAviso.textContent = mensagem;
  secaoHistorico.style.display = "none";
}

async function carregarTela() {
  // sem id na URL, id inválido (ex.: ?id=abc) ou zero
  if (!Number.isInteger(idTime) || idTime <= 0) {
    mostrarFalha("Time não encontrado. Volte para a busca e escolha outro.");
    return;
  }

  pAviso.textContent = "Carregando...";

  try {
    const resultados = await Promise.all([
      api("/times/" + idTime),
      api("/times/" + idTime + "/resumo"),
      api("/times/" + idTime + "/partidas?status=FINISHED&limite=200")
    ]);

    partidas = resultados[2].filter(function (partida) {
      return partida.gols_casa !== null && partida.gols_fora !== null;
    });
    pAviso.textContent = "";
    mostrarCabecalho(resultados[0]);
    mostrarResumo(resultados[1].estatisticas);
    mostrarPartidas("todas");
    ligarFiltros();
  } catch (erro) {
    if (erro.status === 404) {
      mostrarFalha("Time não encontrado. Volte para a busca e escolha outro.");
    } else {
      mostrarFalha("Não foi possível carregar os dados do time. Verifique se a API está no ar e tente novamente.");
    }
  }
}

carregarTela();

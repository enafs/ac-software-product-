const parametros = new URLSearchParams(window.location.search);
const idTime = Number(parametros.get("id"));

const pAviso = document.getElementById("aviso");
const secaoCabecalho = document.getElementById("cabecalho-time");
const secaoResumo = document.getElementById("resumo");
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

function mostrarCabecalho(time) {
  document.title = "infoTeam - " + time.apelido;

  secaoCabecalho.innerHTML =
    "<img class='escudo-grande' src='" + time.escudo + "' alt='escudo do " + time.apelido +
      "' onerror=\"this.style.display='none'\">" +
    "<div>" +
      "<h2>" + time.nome + "</h2>" +
      "<p class='campeonato'>" + time.campeonato + "</p>" +
      "<ul class='dados'>" +
        "<li><span>Sigla</span>" + time.sigla + "</li>" +
        "<li><span>Fundação</span>" + (time.fundacao || "-") + "</li>" +
        "<li><span>Estádio</span>" + (time.estadio || "-") + "</li>" +
        "<li><span>Cores</span>" + (time.cores || "-") + "</li>" +
      "</ul>" +
      (time.site ? "<a class='site' href='" + time.site + "' target='_blank'>site oficial</a>" : "") +
    "</div>";
}

function calcularResumo(lista) {
  const resumo = {
    jogos: lista.length, vitorias: 0, empates: 0, derrotas: 0,
    gols_pro: 0, gols_contra: 0
  };

  lista.forEach(function (partida) {
    if (partida.resultado === "V") {
      resumo.vitorias++;
    } else if (partida.resultado === "E") {
      resumo.empates++;
    } else {
      resumo.derrotas++;
    }

    const emCasa = partida.id_time_casa === idTime;
    resumo.gols_pro += emCasa ? partida.gols_casa : partida.gols_fora;
    resumo.gols_contra += emCasa ? partida.gols_fora : partida.gols_casa;
  });

  return resumo;
}

function mostrarResumo(resumo) {
  const cartoes = [
    { rotulo: "Jogos", valor: resumo.jogos, cor: "" },
    { rotulo: "Vitórias", valor: resumo.vitorias, cor: "vitoria" },
    { rotulo: "Empates", valor: resumo.empates, cor: "empate" },
    { rotulo: "Derrotas", valor: resumo.derrotas, cor: "derrota" },
    { rotulo: "Gols (pró/contra)", valor: resumo.gols_pro + " / " + resumo.gols_contra, cor: "" }
  ];

  secaoResumo.innerHTML = "";
  cartoes.forEach(function (cartao) {
    const div = document.createElement("div");
    div.className = "cartao " + cartao.cor;
    div.innerHTML = "<strong>" + cartao.valor + "</strong><span>" + cartao.rotulo + "</span>";
    secaoResumo.appendChild(div);
  });
}

function mostrarPartidas(local) {
  corpoTabela.innerHTML = "";

  const filtradas = partidas.filter(function (partida) {
    if (local === "casa") {
      return partida.id_time_casa === idTime;
    }
    if (local === "fora") {
      return partida.id_time_fora === idTime;
    }
    return true;
  });

  if (filtradas.length === 0) {
    corpoTabela.innerHTML = "<tr><td colspan='6' class='vazio'>Nenhuma partida nesse filtro.</td></tr>";
    return;
  }

  filtradas.forEach(function (partida) {
    const linha = document.createElement("tr");
    const jogouEmCasa = partida.id_time_casa === idTime;

    linha.innerHTML =
      "<td>" + formatarData(partida.data_hora) + "</td>" +
      "<td>" + (partida.rodada || "-") + "</td>" +
      "<td class='" + (jogouEmCasa ? "destaque" : "") + "'>" + partida.time_casa + "</td>" +
      "<td class='placar'>" + partida.gols_casa + " x " + partida.gols_fora + "</td>" +
      "<td class='" + (jogouEmCasa ? "" : "destaque") + "'>" + partida.time_fora + "</td>" +
      "<td><span class='etiqueta " + partida.resultado + "'>" +
        nomesResultado[partida.resultado] + "</span></td>";

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

function carregarTela() {
  const time = buscarTimePorId(idTime);

  if (!time) {
    pAviso.textContent = "Time não encontrado. Volte para a busca e escolha outro.";
    document.querySelector(".historico").style.display = "none";
    return;
  }

  partidas = partidasDeExemplo(idTime);

  mostrarCabecalho(time);
  mostrarResumo(calcularResumo(partidas));
  mostrarPartidas("todas");
  ligarFiltros();
}

carregarTela();

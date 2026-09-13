const campoBusca = document.getElementById("busca");
const campoCampeonato = document.getElementById("campeonato");
const divLista = document.getElementById("lista-times");
const pAviso = document.getElementById("aviso");
const pContador = document.getElementById("contador");

function preencherCampeonatos() {
  campeonatosExemplo.forEach(function (campeonato) {
    const opcao = document.createElement("option");
    opcao.value = campeonato.id;
    opcao.textContent = campeonato.nome;
    campoCampeonato.appendChild(opcao);
  });
}

function filtrarTimes() {
  const termo = campoBusca.value.trim().toLowerCase();
  const idCampeonato = campoCampeonato.value;

  return timesExemplo.filter(function (time) {
    const casaComNome = time.nome.toLowerCase().includes(termo) ||
      time.apelido.toLowerCase().includes(termo) ||
      time.sigla.toLowerCase().includes(termo);

    const casaComCampeonato = idCampeonato === "" ||
      time.id_campeonato === Number(idCampeonato);

    return casaComNome && casaComCampeonato;
  });
}

function montarCard(time) {
  const link = document.createElement("a");
  link.className = "card";
  link.href = "time.html?id=" + time.id;

  const escudo = document.createElement("img");
  escudo.className = "escudo";
  escudo.src = time.escudo;
  escudo.alt = "escudo do " + time.apelido;
  escudo.onerror = function () {
    const caixa = document.createElement("div");
    caixa.className = "escudo sem-escudo";
    caixa.textContent = time.sigla;
    escudo.replaceWith(caixa);
  };

  const info = document.createElement("div");
  info.innerHTML = "<strong>" + time.apelido + "</strong>" +
    "<span class='sigla'>" + time.sigla + "</span>" +
    "<span class='campeonato'>" + time.campeonato + "</span>";

  link.appendChild(escudo);
  link.appendChild(info);
  return link;
}

function mostrarTimes() {
  const times = filtrarTimes();

  divLista.innerHTML = "";
  times.forEach(function (time) {
    divLista.appendChild(montarCard(time));
  });

  if (times.length === 0) {
    pAviso.textContent = "Nenhum time encontrado para \"" + campoBusca.value.trim() + "\".";
    pContador.textContent = "";
  } else {
    pAviso.textContent = "";
    pContador.textContent = times.length === 1 ? "1 time encontrado" :
      times.length + " times encontrados";
  }
}

function mostrarMaisBuscados() {
  const lista = document.getElementById("mais-buscados");

  maisBuscadosExemplo.forEach(function (item) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = "time.html?id=" + item.id;
    link.textContent = item.apelido;

    const total = document.createElement("span");
    total.className = "total";
    total.textContent = item.total;

    li.appendChild(link);
    li.appendChild(total);
    lista.appendChild(li);
  });
}

campoBusca.addEventListener("input", mostrarTimes);
campoCampeonato.addEventListener("change", mostrarTimes);

preencherCampeonatos();
mostrarMaisBuscados();
mostrarTimes();

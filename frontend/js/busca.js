const campoBusca = document.getElementById("busca");
const campoCampeonato = document.getElementById("campeonato");
const divLista = document.getElementById("lista-times");
const pAviso = document.getElementById("aviso");
const pContador = document.getElementById("contador");
const listaMaisBuscados = document.getElementById("mais-buscados");

const MENSAGEM_ERRO = "Não foi possível carregar os dados. Verifique se a API está no ar e tente novamente.";

let ultimaRequisicao = 0;
let temporizador = null;

async function preencherCampeonatos() {
  try {
    const campeonatos = await api("/campeonatos");
    campeonatos.forEach(function (campeonato) {
      const opcao = criar("option", "", campeonato.nome);
      opcao.value = campeonato.id;
      campoCampeonato.appendChild(opcao);
    });
  } catch (erro) {
    pAviso.textContent = MENSAGEM_ERRO;
  }
}

// Registra a busca no banco (POST /api/buscas) e depois abre a página do time.
// Espera no máximo 1 segundo, para a navegação nunca ficar presa se a API demorar.
function registrarBusca(time) {
  const termo = campoBusca.value.trim() || time.nome_curto || time.nome;

  const envio = api("/buscas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ termo: termo, time_id: time.id, campeonato_id: time.campeonato_id })
  }).catch(function () { /* falha ao registrar não impede de abrir o time */ });

  const espera = new Promise(function (resolve) { setTimeout(resolve, 1000); });
  return Promise.race([envio, espera]);
}

function montarCard(time) {
  const nome = time.nome_curto || time.nome;

  const link = criar("a", "card");
  link.href = "time.html?id=" + time.id;

  let escudo;
  if (time.escudo_url) {
    escudo = criar("img", "escudo");
    escudo.src = time.escudo_url;
    escudo.alt = "escudo do " + nome;
    escudo.onerror = function () {
      escudo.replaceWith(caixaSemEscudo(time.sigla));
    };
  } else {
    escudo = caixaSemEscudo(time.sigla);
  }

  const info = criar("div");
  info.appendChild(criar("strong", "", nome));
  info.appendChild(criar("span", "sigla", time.sigla || ""));
  info.appendChild(criar("span", "campeonato", time.campeonato));

  link.appendChild(escudo);
  link.appendChild(info);

  link.addEventListener("click", function (evento) {
    // Ctrl/Shift/botão do meio continuam abrindo em nova aba normalmente
    if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey) {
      registrarBusca(time);
      return;
    }
    evento.preventDefault();
    registrarBusca(time).then(function () {
      window.location.href = link.href;
    });
  });

  return link;
}

function mostrarTimes(times) {
  divLista.innerHTML = "";
  times.forEach(function (time) {
    divLista.appendChild(montarCard(time));
  });

  if (times.length === 0) {
    const termo = campoBusca.value.trim();
    pAviso.textContent = termo
      ? "Nenhum time encontrado para \"" + termo + "\"."
      : "Nenhum time encontrado.";
    pContador.textContent = "";
  } else {
    pAviso.textContent = "";
    pContador.textContent = times.length === 1 ? "1 time encontrado" :
      times.length + " times encontrados";
  }
}

async function buscarTimes() {
  const minhaRequisicao = ++ultimaRequisicao;

  const parametros = new URLSearchParams();
  const termo = campoBusca.value.trim();
  if (termo) {
    parametros.set("busca", termo);
  }
  if (campoCampeonato.value) {
    parametros.set("campeonato", campoCampeonato.value);
  }

  pContador.textContent = "Carregando...";

  try {
    const times = await api("/times?" + parametros.toString());
    if (minhaRequisicao !== ultimaRequisicao) {
      return; // chegou uma resposta antiga, já existe uma busca mais nova
    }
    mostrarTimes(times);
  } catch (erro) {
    if (minhaRequisicao !== ultimaRequisicao) {
      return;
    }
    divLista.innerHTML = "";
    pContador.textContent = "";
    pAviso.textContent = MENSAGEM_ERRO;
  }
}

async function carregarMaisBuscados() {
  listaMaisBuscados.innerHTML = "";
  try {
    const itens = await api("/buscas/populares?limite=5");

    if (itens.length === 0) {
      listaMaisBuscados.appendChild(criar("li", "", "Ainda não há buscas registradas."));
      return;
    }

    itens.forEach(function (item) {
      const li = criar("li");
      if (item.time_id) {
        const link = criar("a", "", item.nome);
        link.href = "time.html?id=" + item.time_id;
        li.appendChild(link);
      } else {
        li.appendChild(criar("span", "", item.nome));
      }
      li.appendChild(criar("span", "total", String(item.total)));
      listaMaisBuscados.appendChild(li);
    });
  } catch (erro) {
    listaMaisBuscados.appendChild(criar("li", "", "Indisponível no momento."));
  }
}

// Espera o usuário parar de digitar para não chamar a API a cada tecla
campoBusca.addEventListener("input", function () {
  clearTimeout(temporizador);
  temporizador = setTimeout(buscarTimes, 300);
});
campoCampeonato.addEventListener("change", buscarTimes);

preencherCampeonatos();
carregarMaisBuscados();
buscarTimes();

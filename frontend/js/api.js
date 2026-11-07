const TEMPO_LIMITE_MS = 8000;

// Chama a API e devolve o JSON.
// Em caso de falha lança um Error com:
//   erro.status = código HTTP (ex.: 404), quando a API respondeu com erro
//   erro.rede   = true, quando não foi possível falar com a API (fora do ar, timeout)
async function api(caminho, opcoes) {
  const controle = new AbortController();
  const limite = setTimeout(function () { controle.abort(); }, TEMPO_LIMITE_MS);

  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, Object.assign({ signal: controle.signal }, opcoes));
  } catch (e) {
    const erro = new Error("API indisponível");
    erro.rede = true;
    throw erro;
  } finally {
    clearTimeout(limite);
  }

  if (!resposta.ok) {
    const erro = new Error("HTTP " + resposta.status);
    erro.status = resposta.status;
    throw erro;
  }
  return resposta.json();
}

// Cria um elemento já com classe e texto (textContent evita injeção de HTML).
function criar(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) {
    elemento.className = classe;
  }
  if (texto !== undefined) {
    elemento.textContent = texto;
  }
  return elemento;
}

function caixaSemEscudo(sigla) {
  return criar("div", "escudo sem-escudo", sigla || "?");
}

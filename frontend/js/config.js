// Endereço da API Flask. A porta 5001 é a que o docker-compose expõe no host.
// Usa o mesmo host da página (localhost, ou o IP da máquina na rede).
const API_URL = "http://" + (window.location.hostname || "localhost") + ":5001/api";

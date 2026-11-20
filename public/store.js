// Camada de dados: agora conversa com o back-end (API) em vez do localStorage.
const Store = {
  // ---- sessao (so guarda o token de login no navegador) ----
  token(chave = "token") { try { return localStorage.getItem(chave); } catch { return null; } },
  guardarToken(t, chave = "token") { try { t ? localStorage.setItem(chave, t) : localStorage.removeItem(chave); } catch {} },

  async api(metodo, url, corpo, chave) {
    const headers = { "Content-Type": "application/json" };
    const t = this.token(chave || "token");
    if (t) headers.Authorization = "Bearer " + t;
    let r;
    try {
      r = await fetch(url, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
    } catch { return { erro: "Sem conexao com o servidor. Tente novamente." }; }
    let dados = {};
    try { dados = await r.json(); } catch {}
    if (!r.ok) return { erro: dados.erro || "Erro inesperado.", status: r.status };
    return dados;
  },

  // ---- indicacao por link (guardada por alguns dias, so no navegador) ----
  ler(chave, padrao) { try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch { return padrao; } },
  gravar(chave, valor) { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch {} },
  async guardarIndicacao(codigo) {
    const p = await this.buscarParceira(codigo);
    if (!p) return;
    this.gravar("indicacao", { codigo: p.codigo, expira: Date.now() + CONFIG.diasValidadeIndicacao * 86400000 });
  },
  indicacaoAtual() {
    const i = this.ler("indicacao", null);
    if (!i || i.expira < Date.now()) return null;
    return i.codigo;
  },

  // ---- parceiras ----
  async criarParceira(d) { return this.api("POST", "/api/parceiras", d); },
  async buscarParceira(codigo) {
    const c = (codigo || "").trim().toUpperCase();
    if (!c) return null;
    const r = await this.api("GET", "/api/parceiras/" + encodeURIComponent(c));
    return r.erro ? null : r;
  },
  async comissoesDaParceira(codigo) {
    return this.api("GET", "/api/parceiras/" + encodeURIComponent(codigo) + "/comissoes");
  },

  // ---- pedidos de venda e interesses ----
  async criarSolicitacao(d) { return this.api("POST", "/api/solicitacoes", d); },
  async criarInteresse(d) { return this.api("POST", "/api/interesses", d); },
  async catalogo() {
    const r = await this.api("GET", "/api/catalogo");
    return Array.isArray(r) ? r : [];
  },

  // ---- clientes ----
  soDigitos(s) { return (s || "").replace(/\D/g, ""); },
  async criarCliente({ nome, whatsapp, senha }) {
    const r = await this.api("POST", "/api/cadastro", { nome, whatsapp, senha });
    if (r.erro) return { erro: r.erro };
    this.guardarToken(r.token);
    return { cliente: r.usuario };
  },
  async entrarCliente(whatsapp, senha) {
    const r = await this.api("POST", "/api/login", { whatsapp, senha });
    if (r.erro) return { erro: r.erro };
    this.guardarToken(r.token);
    return { cliente: r.usuario };
  },
  async clienteAtual() {
    if (!this.token()) return null;
    const r = await this.api("GET", "/api/eu");
    if (r.erro || !r.usuario || r.usuario.papel !== "cliente") { if (r.status === 401) this.guardarToken(null); return null; }
    return r.usuario;
  },
  sairCliente() { this.guardarToken(null); },
  async solicitacoesDoCliente() { const r = await this.api("GET", "/api/minhas-vendas"); return Array.isArray(r) ? r : []; },
  async interessesDoCliente() { const r = await this.api("GET", "/api/meus-interesses"); return Array.isArray(r) ? r : []; },

  // ---- admin ----
  async entrarAdmin(usuario, senha) {
    const r = await this.api("POST", "/api/admin/login", { usuario, senha });
    if (r.erro) return { erro: r.erro };
    this.guardarToken(r.token, "tokenAdmin");
    return { ok: true };
  },
  sairAdmin() { this.guardarToken(null, "tokenAdmin"); },
  temAdmin() { return !!this.token("tokenAdmin"); },
  async dadosAdmin() { return this.api("GET", "/api/admin/dados", null, "tokenAdmin"); },
  async atualizarRegistro(id, mudancas) { return this.api("PATCH", "/api/admin/registro/" + encodeURIComponent(id), mudancas, "tokenAdmin"); }
};

const brl = v => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = iso => new Date(iso).toLocaleDateString("pt-BR");
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

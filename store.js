// Camada de dados simples usando localStorage (demonstração).
// Em produção, troque por um backend (Firebase, Supabase, Node + banco de dados etc.).
const Store = {
  ler(chave, padrao) {
    try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; }
    catch { return padrao; }
  },
  gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch {}
  },

  // ---- Parceiras ----
  parceiras() { return this.ler("parceiras", []); },
  salvarParceiras(l) { this.gravar("parceiras", l); },
  criarParceira({ nome, whatsapp, cidade, pix }) {
    const lista = this.parceiras();
    const base = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5) || "PARC";
    let codigo;
    do { codigo = base + Math.floor(100 + Math.random() * 900); }
    while (lista.some(p => p.codigo === codigo));
    const nova = { codigo, nome, whatsapp, cidade, pix, criadaEm: new Date().toISOString() };
    lista.push(nova);
    this.salvarParceiras(lista);
    return nova;
  },
  buscarParceira(codigo) {
    return this.parceiras().find(p => p.codigo === (codigo || "").trim().toUpperCase());
  },

  // ---- Indicação (guardada por alguns dias) ----
  guardarIndicacao(codigo) {
    if (!this.buscarParceira(codigo)) return;
    const expira = Date.now() + CONFIG.diasValidadeIndicacao * 86400000;
    this.gravar("indicacao", { codigo: codigo.toUpperCase(), expira });
  },
  indicacaoAtual() {
    const i = this.ler("indicacao", null);
    if (!i || i.expira < Date.now()) return null;
    return i.codigo;
  },
  calcularComissao(valor) { return Math.round((valor || 0) * CONFIG.comissaoPercentual) / 100; },

  // ---- Solicitações de venda (quem quer vender com a Cata Ofertas) ----
  solicitacoes() { return this.ler("solicitacoes", []); },
  salvarSolicitacoes(l) { this.gravar("solicitacoes", l); },
  criarSolicitacao(dados) {
    const lista = this.solicitacoes();
    const s = {
      id: "V" + String(lista.length + 1).padStart(4, "0"),
      criadoEm: new Date().toISOString(),
      status: "recebido", // ver STATUS_VENDA em data.js
      comissaoPaga: false,
      ...dados
    };
    lista.push(s);
    this.salvarSolicitacoes(lista);
    return s;
  },

  // ---- Interesses de compra (quem quer comprar um produto do catálogo) ----
  interesses() { return this.ler("interesses", []); },
  salvarInteresses(l) { this.gravar("interesses", l); },
  criarInteresse(dados) {
    const lista = this.interesses();
    const i = {
      id: "I" + String(lista.length + 1).padStart(4, "0"),
      criadoEm: new Date().toISOString(),
      status: "novo", // ver STATUS_INTERESSE em data.js
      comissaoPaga: false,
      ...dados
    };
    lista.push(i);
    this.salvarInteresses(lista);
    return i;
  },

  // ---- Utilidades para registros de venda/interesse (prefixo V ou I) ----
  buscarRegistro(id) {
    const lista = id[0] === "V" ? this.solicitacoes() : this.interesses();
    return { lista, item: lista.find(x => x.id === id), salvar: id[0] === "V" ? l => this.salvarSolicitacoes(l) : l => this.salvarInteresses(l) };
  },
  comissoesDaParceira(codigo) {
    const itens = [
      ...this.solicitacoes().filter(x => x.parceira === codigo).map(x => ({ ...x, tipo: "Venda indicada" })),
      ...this.interesses().filter(x => x.parceira === codigo).map(x => ({ ...x, tipo: "Compra indicada" }))
    ].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    const pendente = itens.filter(x => x.status === "vendido" && !x.comissaoPaga).reduce((s, x) => s + x.comissao, 0);
    const paga = itens.filter(x => x.comissaoPaga).reduce((s, x) => s + x.comissao, 0);
    return { itens, pendente, paga };
  },

  // ---- Clientes (demonstração: dados só neste navegador) ----
  soDigitos(s) { return (s || "").replace(/\D/g, ""); },
  async hashSenha(s) {
    try {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("cata:" + s));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
    } catch { return btoa(unescape(encodeURIComponent("cata:" + s))); }
  },
  clientes() { return this.ler("clientes", []); },
  async criarCliente({ nome, whatsapp, senha }) {
    const lista = this.clientes();
    const w = this.soDigitos(whatsapp);
    if (w.length < 10) return { erro: "Informe um WhatsApp válido, com DDD." };
    if (lista.some(c => c.whatsapp === w)) return { erro: "Já existe uma conta com esse WhatsApp." };
    const c = { nome, whatsapp: w, senha: await this.hashSenha(senha), criadoEm: new Date().toISOString() };
    lista.push(c);
    this.gravar("clientes", lista);
    this.gravar("clienteLogado", w);
    return { cliente: c };
  },
  async entrarCliente(whatsapp, senha) {
    const w = this.soDigitos(whatsapp);
    const c = this.clientes().find(x => x.whatsapp === w);
    if (!c || c.senha !== await this.hashSenha(senha)) return { erro: "WhatsApp ou senha incorretos." };
    this.gravar("clienteLogado", w);
    return { cliente: c };
  },
  clienteAtual() {
    const w = this.ler("clienteLogado", null);
    return this.clientes().find(c => c.whatsapp === w) || null;
  },
  sairCliente() { this.gravar("clienteLogado", null); },
  solicitacoesDoCliente(w) { return this.solicitacoes().filter(x => this.soDigitos(x.whatsapp) === w); },
  interessesDoCliente(w) { return this.interesses().filter(x => this.soDigitos(x.whatsapp) === w); }
};

const brl = v => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = iso => new Date(iso).toLocaleDateString("pt-BR");
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

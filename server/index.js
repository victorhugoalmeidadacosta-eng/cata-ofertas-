const path = require("path");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query, iniciarBanco } = require("./db");

const app = express();
app.use(express.json({ limit: "100kb" }));

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error("Defina JWT_SECRET (uma frase longa e aleatoria, minimo 16 caracteres).");
  process.exit(1);
}
const COMISSAO_PERCENTUAL = Number(process.env.COMISSAO_PERCENTUAL || 5);
const STATUS_VENDA = ["recebido", "fotografando", "anunciado", "negociando", "vendido", "cancelado"];
const STATUS_INTERESSE = ["novo", "negociando", "vendido", "cancelado"];
const APROVACOES = ["pendente", "aprovado", "rejeitado"];

// ---------- utilidades ----------
const soDigitos = s => String(s || "").replace(/\D/g, "");
const texto = (s, max = 500) => String(s ?? "").trim().slice(0, max);
const numero = v => {
  const n = typeof v === "number" ? v : parseFloat(String(v || "").replace(/\./g, "").replace(",", "."));
  return isNaN(n) || n < 0 ? 0 : Math.round(n * 100) / 100;
};
const calcComissao = valor => Math.round(valor * COMISSAO_PERCENTUAL) / 100;
const wrap = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ erro: "Erro interno. Tente novamente." }); });

function assinar(u) {
  return jwt.sign({ id: u.id, papel: u.papel }, JWT_SECRET, { expiresIn: "7d" });
}
function auth(papeis) {
  return (req, res, next) => {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ erro: "Faca login." });
    try {
      const d = jwt.verify(token, JWT_SECRET);
      if (papeis && !papeis.includes(d.papel)) return res.status(403).json({ erro: "Sem permissao." });
      req.user = d;
      next();
    } catch { res.status(401).json({ erro: "Sessao expirada. Entre novamente." }); }
  };
}
function authOpcional(req, _res, next) {
  const h = req.headers.authorization || "";
  if (h.startsWith("Bearer ")) { try { req.user = jwt.verify(h.slice(7), JWT_SECRET); } catch {} }
  next();
}

// limite simples de tentativas de login (por IP)
const tentativas = new Map();
function limitarLogin(req, res, next) {
  const ip = req.ip, agora = Date.now();
  const lista = (tentativas.get(ip) || []).filter(t => agora - t < 15 * 60 * 1000);
  if (lista.length >= 20) return res.status(429).json({ erro: "Muitas tentativas. Aguarde 15 minutos." });
  lista.push(agora); tentativas.set(ip, lista);
  next();
}

const fmtVenda = r => ({
  id: r.id, nome: r.nome, whatsapp: r.whatsapp, cidade: r.cidade, produto: r.produto,
  categoria: r.categoria, estado: r.estado, valor: Number(r.valor), descricao: r.descricao,
  parceira: r.parceira, comissao: Number(r.comissao), comissaoPaga: r.comissao_paga,
  aprovacao: r.aprovacao, status: r.status, criadoEm: r.criado_em
});
const fmtInteresse = r => ({
  id: r.id, nome: r.nome, whatsapp: r.whatsapp, produtoId: r.produto_id, produto: r.produto,
  valor: Number(r.valor), obs: r.obs, parceira: r.parceira, comissao: Number(r.comissao),
  comissaoPaga: r.comissao_paga, status: r.status, criadoEm: r.criado_em
});

// ---------- configuracao publica ----------
app.get("/api/config", (_req, res) => res.json({ comissaoPercentual: COMISSAO_PERCENTUAL }));

// ---------- clientes ----------
app.post("/api/cadastro", limitarLogin, wrap(async (req, res) => {
  const nome = texto(req.body.nome, 120);
  const whatsapp = soDigitos(req.body.whatsapp);
  const senha = String(req.body.senha || "");
  if (!nome) return res.status(400).json({ erro: "Informe seu nome." });
  if (whatsapp.length < 10) return res.status(400).json({ erro: "Informe um WhatsApp valido, com DDD." });
  if (senha.length < 4) return res.status(400).json({ erro: "A senha precisa ter pelo menos 4 caracteres." });
  const existe = await query("SELECT 1 FROM usuarios WHERE whatsapp=$1", [whatsapp]);
  if (existe.rowCount) return res.status(409).json({ erro: "Ja existe uma conta com esse WhatsApp." });
  const hash = await bcrypt.hash(senha, 10);
  const r = await query("INSERT INTO usuarios (nome, whatsapp, senha_hash) VALUES ($1,$2,$3) RETURNING id, nome, whatsapp, papel", [nome, whatsapp, hash]);
  const u = r.rows[0];
  res.json({ token: assinar(u), usuario: { nome: u.nome, whatsapp: u.whatsapp, papel: u.papel } });
}));

app.post("/api/login", limitarLogin, wrap(async (req, res) => {
  const whatsapp = soDigitos(req.body.whatsapp);
  const senha = String(req.body.senha || "");
  const r = await query("SELECT * FROM usuarios WHERE whatsapp=$1 AND papel='cliente'", [whatsapp]);
  const u = r.rows[0];
  if (!u || !(await bcrypt.compare(senha, u.senha_hash))) return res.status(401).json({ erro: "WhatsApp ou senha incorretos." });
  res.json({ token: assinar(u), usuario: { nome: u.nome, whatsapp: u.whatsapp, papel: u.papel } });
}));

app.get("/api/eu", auth(["cliente", "admin"]), wrap(async (req, res) => {
  const r = await query("SELECT nome, whatsapp, papel FROM usuarios WHERE id=$1", [req.user.id]);
  if (!r.rowCount) return res.status(401).json({ erro: "Conta nao encontrada." });
  res.json({ usuario: r.rows[0] });
}));

app.get("/api/minhas-vendas", auth(["cliente"]), wrap(async (req, res) => {
  const u = (await query("SELECT whatsapp FROM usuarios WHERE id=$1", [req.user.id])).rows[0];
  const r = await query("SELECT * FROM solicitacoes WHERE usuario_id=$1 OR whatsapp=$2 ORDER BY criado_em DESC", [req.user.id, u.whatsapp]);
  res.json(r.rows.map(fmtVenda));
}));
app.get("/api/meus-interesses", auth(["cliente"]), wrap(async (req, res) => {
  const u = (await query("SELECT whatsapp FROM usuarios WHERE id=$1", [req.user.id])).rows[0];
  const r = await query("SELECT * FROM interesses WHERE usuario_id=$1 OR whatsapp=$2 ORDER BY criado_em DESC", [req.user.id, u.whatsapp]);
  res.json(r.rows.map(fmtInteresse));
}));

// ---------- parceiras ----------
app.post("/api/parceiras", wrap(async (req, res) => {
  const nome = texto(req.body.nome, 120), whatsapp = texto(req.body.whatsapp, 30);
  const cidade = texto(req.body.cidade, 80), pix = texto(req.body.pix, 120);
  if (!nome || !whatsapp || !cidade || !pix) return res.status(400).json({ erro: "Preencha todos os campos." });
  const base = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5) || "PARC";
  let codigo;
  for (let i = 0; i < 30; i++) {
    codigo = base + Math.floor(100 + Math.random() * 900);
    const e = await query("SELECT 1 FROM parceiras WHERE codigo=$1", [codigo]);
    if (!e.rowCount) break;
  }
  const r = await query("INSERT INTO parceiras (codigo,nome,whatsapp,cidade,pix) VALUES ($1,$2,$3,$4,$5) RETURNING *", [codigo, nome, whatsapp, cidade, pix]);
  res.json({ codigo: r.rows[0].codigo, nome: r.rows[0].nome });
}));

app.get("/api/parceiras/:codigo", wrap(async (req, res) => {
  const codigo = texto(req.params.codigo, 30).toUpperCase();
  const r = await query("SELECT codigo, nome FROM parceiras WHERE codigo=$1", [codigo]);
  if (!r.rowCount) return res.status(404).json({ erro: "Codigo nao encontrado." });
  res.json(r.rows[0]);
}));

// painel da parceira: o codigo funciona como identificacao (igual ao site original)
app.get("/api/parceiras/:codigo/comissoes", wrap(async (req, res) => {
  const codigo = texto(req.params.codigo, 30).toUpperCase();
  const p = await query("SELECT codigo, nome FROM parceiras WHERE codigo=$1", [codigo]);
  if (!p.rowCount) return res.status(404).json({ erro: "Codigo nao encontrado." });
  const v = await query("SELECT * FROM solicitacoes WHERE parceira=$1", [codigo]);
  const i = await query("SELECT * FROM interesses WHERE parceira=$1", [codigo]);
  const itens = [
    ...v.rows.map(fmtVenda).map(x => ({ ...x, tipo: "Venda indicada" })),
    ...i.rows.map(fmtInteresse).map(x => ({ ...x, tipo: "Compra indicada" }))
  ].sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
  const pendente = itens.filter(x => x.status === "vendido" && !x.comissaoPaga).reduce((s, x) => s + x.comissao, 0);
  const paga = itens.filter(x => x.comissaoPaga).reduce((s, x) => s + x.comissao, 0);
  res.json({ parceira: p.rows[0], itens, pendente, paga });
}));

// ---------- pedidos de venda e interesses (qualquer visitante pode enviar) ----------
async function validarParceira(codigoBruto) {
  const codigo = texto(codigoBruto, 30).toUpperCase();
  if (!codigo) return { codigo: null };
  const r = await query("SELECT codigo FROM parceiras WHERE codigo=$1", [codigo]);
  return r.rowCount ? { codigo } : { erro: "Codigo de parceira nao encontrado. Confira ou deixe em branco." };
}

app.post("/api/solicitacoes", authOpcional, wrap(async (req, res) => {
  const b = req.body;
  const nome = texto(b.nome, 120), produto = texto(b.produto, 200);
  if (!nome || !produto) return res.status(400).json({ erro: "Preencha nome e produto." });
  if (soDigitos(b.whatsapp).length < 10) return res.status(400).json({ erro: "Informe um WhatsApp valido, com DDD." });
  const p = await validarParceira(b.parceira);
  if (p.erro) return res.status(400).json({ erro: p.erro });
  const valor = numero(b.valor);
  const n = (await query("SELECT nextval('seq_venda') AS n")).rows[0].n;
  const id = "V" + String(n).padStart(4, "0");
  const r = await query(
    `INSERT INTO solicitacoes (id, usuario_id, nome, whatsapp, cidade, produto, categoria, estado, valor, descricao, parceira, comissao)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [id, req.user && req.user.papel === "cliente" ? req.user.id : null, nome, texto(b.whatsapp, 30), texto(b.cidade, 80), produto,
     texto(b.categoria, 80), texto(b.estado, 40), valor, texto(b.descricao, 1500), p.codigo, p.codigo ? calcComissao(valor) : 0]);
  res.json(fmtVenda(r.rows[0]));
}));

app.post("/api/interesses", authOpcional, wrap(async (req, res) => {
  const b = req.body;
  const nome = texto(b.nome, 120), produto = texto(b.produto, 200);
  if (!nome || !produto) return res.status(400).json({ erro: "Informe seu nome." });
  if (soDigitos(b.whatsapp).length < 10) return res.status(400).json({ erro: "Informe um WhatsApp valido, com DDD." });
  const p = await validarParceira(b.parceira);
  if (p.erro) return res.status(400).json({ erro: p.erro });
  const valor = numero(b.valor);
  const n = (await query("SELECT nextval('seq_interesse') AS n")).rows[0].n;
  const id = "I" + String(n).padStart(4, "0");
  const r = await query(
    `INSERT INTO interesses (id, usuario_id, nome, whatsapp, produto_id, produto, valor, obs, parceira, comissao)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [id, req.user && req.user.papel === "cliente" ? req.user.id : null, nome, texto(b.whatsapp, 30),
     Number.isInteger(b.produtoId) ? b.produtoId : null, produto, valor, texto(b.obs, 800), p.codigo, p.codigo ? calcComissao(valor) : 0]);
  res.json(fmtInteresse(r.rows[0]));
}));

// ---------- catalogo publico: so aparece o que o admin aprovou ----------
app.get("/api/catalogo", wrap(async (_req, res) => {
  const r = await query("SELECT * FROM solicitacoes WHERE aprovacao='aprovado' AND status <> 'cancelado' ORDER BY criado_em DESC");
  res.json(r.rows.map(x => ({
    id: x.id, nome: x.produto, categoria: x.categoria, estado: x.estado, preco: Number(x.valor),
    descricao: x.descricao, foto: x.foto, status: x.status === "vendido" ? "vendido" : x.status === "negociando" ? "reservado" : "disponivel"
  })));
}));

// ---------- admin ----------
app.post("/api/admin/login", limitarLogin, wrap(async (req, res) => {
  const usuario = texto(req.body.usuario, 60).toLowerCase();
  const senha = String(req.body.senha || "");
  const r = await query("SELECT * FROM usuarios WHERE papel='admin' AND lower(nome)=$1", [usuario]);
  const u = r.rows[0];
  if (!u || !(await bcrypt.compare(senha, u.senha_hash))) return res.status(401).json({ erro: "Usuario ou senha incorretos." });
  res.json({ token: assinar(u), usuario: { nome: u.nome, papel: u.papel } });
}));

const soAdmin = auth(["admin"]);

app.get("/api/admin/dados", soAdmin, wrap(async (_req, res) => {
  const v = await query("SELECT * FROM solicitacoes ORDER BY criado_em DESC");
  const i = await query("SELECT * FROM interesses ORDER BY criado_em DESC");
  const p = await query("SELECT * FROM parceiras ORDER BY criado_em ASC");
  const vendas = v.rows.map(fmtVenda), interesses = i.rows.map(fmtInteresse);
  const parceiras = p.rows.map(x => {
    const itens = [...vendas, ...interesses].filter(y => y.parceira === x.codigo);
    const pendente = itens.filter(y => y.status === "vendido" && !y.comissaoPaga).reduce((s, y) => s + y.comissao, 0);
    return { codigo: x.codigo, nome: x.nome, whatsapp: x.whatsapp, cidade: x.cidade, pix: x.pix, pendente };
  });
  res.json({ vendas, interesses, parceiras });
}));

function tabelaDoId(id) {
  if (/^V\d+$/.test(id)) return "solicitacoes";
  if (/^I\d+$/.test(id)) return "interesses";
  return null;
}

app.patch("/api/admin/registro/:id", soAdmin, wrap(async (req, res) => {
  const id = req.params.id, tabela = tabelaDoId(id);
  if (!tabela) return res.status(400).json({ erro: "Protocolo invalido." });
  const atual = (await query(`SELECT * FROM ${tabela} WHERE id=$1`, [id])).rows[0];
  if (!atual) return res.status(404).json({ erro: "Registro nao encontrado." });
  const b = req.body;
  let { status, comissao_paga: paga, valor, comissao } = atual;

  if (b.status !== undefined) {
    const validos = tabela === "solicitacoes" ? STATUS_VENDA : STATUS_INTERESSE;
    if (!validos.includes(b.status)) return res.status(400).json({ erro: "Status invalido." });
    status = b.status;
    if (status !== "vendido") paga = false;
  }
  if (b.valor !== undefined) {
    valor = numero(b.valor);
    comissao = atual.parceira ? calcComissao(valor) : 0;
  }
  if (b.comissaoPaga !== undefined) paga = !!b.comissaoPaga;

  let aprovacao = atual.aprovacao;
  if (tabela === "solicitacoes" && b.aprovacao !== undefined) {
    if (!APROVACOES.includes(b.aprovacao)) return res.status(400).json({ erro: "Aprovacao invalida." });
    aprovacao = b.aprovacao;
  }

  const r = tabela === "solicitacoes"
    ? await query("UPDATE solicitacoes SET status=$2, comissao_paga=$3, valor=$4, comissao=$5, aprovacao=$6 WHERE id=$1 RETURNING *", [id, status, paga, valor, comissao, aprovacao])
    : await query("UPDATE interesses SET status=$2, comissao_paga=$3, valor=$4, comissao=$5 WHERE id=$1 RETURNING *", [id, status, paga, valor, comissao]);
  res.json(tabela === "solicitacoes" ? fmtVenda(r.rows[0]) : fmtInteresse(r.rows[0]));
}));

// ---------- site (arquivos estaticos) ----------
app.use(express.static(path.join(__dirname, "..", "public"), { extensions: ["html"] }));
app.use("/api", (_req, res) => res.status(404).json({ erro: "Rota nao encontrada." }));

// ---------- iniciar ----------
async function criarAdmin() {
  const nome = texto(process.env.ADMIN_USUARIO || "victor", 60);
  const senha = process.env.ADMIN_SENHA;
  if (!senha || senha.length < 8) {
    console.warn("ADMIN_SENHA nao definida (ou com menos de 8 caracteres): o admin nao sera criado/atualizado.");
    return;
  }
  const hash = await bcrypt.hash(senha, 10);
  const existe = await query("SELECT id FROM usuarios WHERE papel='admin' AND lower(nome)=$1", [nome.toLowerCase()]);
  if (existe.rowCount) {
    await query("UPDATE usuarios SET senha_hash=$2 WHERE id=$1", [existe.rows[0].id, hash]);
  } else {
    await query("INSERT INTO usuarios (nome, whatsapp, senha_hash, papel) VALUES ($1,$2,$3,'admin')", [nome, "admin-" + nome.toLowerCase(), hash]);
  }
  console.log(`Admin "${nome}" pronto.`);
}

// Na primeira vez (banco vazio) carrega os produtos de exemplo ja aprovados, para a vitrine nao ficar vazia.
async function carregarProdutosIniciais() {
  const total = (await query("SELECT count(*)::int AS n FROM solicitacoes")).rows[0].n;
  if (total > 0) return;
  const lista = require("./produtos-iniciais.json");
  for (const p of lista) {
    const n = (await query("SELECT nextval('seq_venda') AS n")).rows[0].n;
    await query(
      `INSERT INTO solicitacoes (id, nome, whatsapp, cidade, produto, categoria, estado, valor, descricao, foto, aprovacao, status)
       VALUES ($1,'Cata Ofertas','5511913522426','',$2,$3,$4,$5,$6,$7,'aprovado',$8)`,
      ["V" + String(n).padStart(4, "0"), p.nome, p.categoria, p.estado, p.preco, p.descricao, p.foto,
       p.status === "vendido" ? "vendido" : p.status === "reservado" ? "negociando" : "anunciado"]);
  }
  console.log("Produtos iniciais carregados:", lista.length);
}

const PORT = process.env.PORT || 3000;
iniciarBanco()
  .then(criarAdmin)
  .then(carregarProdutosIniciais)
  .then(() => app.listen(PORT, () => console.log("Cata Ofertas rodando na porta " + PORT)))
  .catch(e => { console.error("Falha ao iniciar:", e); process.exit(1); });

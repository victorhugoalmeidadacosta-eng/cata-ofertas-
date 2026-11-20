// ===== Indicação por link (?ref=CODIGO) =====
const params = new URLSearchParams(location.search);
if (params.get("ref")) Store.guardarIndicacao(params.get("ref"));

const form = document.getElementById("formVender");
document.getElementById("ano").textContent = new Date().getFullYear();
document.querySelectorAll(".link-whats").forEach(a => {
  a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo site da Cata Ofertas.")}`;
});

// opções
form.categoria.innerHTML = '<option value="">Selecione...</option>' + CATEGORIAS_VENDA.map(c => `<option>${esc(c)}</option>`).join("");
form.estado.innerHTML = '<option value="">Selecione...</option>' + ESTADOS_PRODUTO.map(c => `<option>${esc(c)}</option>`).join("");

// pré-preenchimento (indicação e cliente logado)
const ind = Store.indicacaoAtual();
if (ind) form.parceira.value = ind;
const cli = Store.clienteAtual();
if (cli) {
  form.nome.value = cli.nome;
  form.whatsapp.value = cli.whatsapp;
  document.getElementById("linkEntrar").textContent = "👤 " + cli.nome.split(" ")[0];
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(form));
  const erro = document.getElementById("erroVender");
  erro.textContent = "";

  if (Store.soDigitos(f.whatsapp).length < 10) return erro.textContent = "Informe um WhatsApp válido, com DDD.";
  const codigo = (f.parceira || "").trim().toUpperCase();
  const parceira = Store.buscarParceira(codigo);
  if (codigo && !parceira) return erro.textContent = "Código de parceira não encontrado. Confira ou deixe em branco.";

  const preco = parseFloat(String(f.preco || "").replace(/\./g, "").replace(",", ".")) || 0;
  const s = Store.criarSolicitacao({
    nome: f.nome.trim(), whatsapp: f.whatsapp.trim(), cidade: f.cidade.trim(),
    produto: f.produto.trim(), categoria: f.categoria, estado: f.estado,
    valor: preco, descricao: f.descricao.trim(),
    parceira: parceira ? parceira.codigo : null,
    comissao: parceira ? Store.calcularComissao(preco) : 0
  });

  const msg = `Olá! Quero vender um produto pela Cata Ofertas (protocolo ${s.id}).\n\n` +
    `Produto: ${s.produto}\nCategoria: ${s.categoria}\nEstado: ${s.estado}\n` +
    `Preço desejado: ${preco ? brl(preco) : "a combinar"}\nCidade: ${s.cidade}\n` +
    (s.descricao ? `Descrição: ${s.descricao}\n` : "") +
    `\nNome: ${s.nome}\nWhatsApp: ${s.whatsapp}` + (parceira ? `\nIndicação: ${parceira.codigo}` : "");

  form.classList.add("oculto");
  document.getElementById("sucesso").classList.remove("oculto");
  document.getElementById("protocolo").textContent = s.id;
  const link = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  document.getElementById("btnWhats").href = link;
  window.open(link, "_blank");
});

document.getElementById("txtComissao").textContent = CONFIG.comissaoPercentual + "%";
document.getElementById("diasValidade").textContent = CONFIG.diasValidadeIndicacao;

const telaEntrada = document.getElementById("telaEntrada");
const telaPainel = document.getElementById("telaPainel");

function linkDaParceira(codigo) {
  const base = location.href.replace(/parceira\.html.*$/, "index.html");
  return `${base}?ref=${codigo}`;
}

async function mostrarPainel(p) {
  Store.gravar("parceiraLogada", p.codigo);
  telaEntrada.classList.add("oculto");
  telaPainel.classList.remove("oculto");

  document.getElementById("boasVindas").textContent = `Olá, ${p.nome}!`;
  document.getElementById("meuLink").value = linkDaParceira(p.codigo);
  document.getElementById("meuCodigo").textContent = p.codigo;

  const r = await Store.comissoesDaParceira(p.codigo);
  const itens = r.itens || [], pendente = r.pendente || 0, paga = r.paga || 0;
  document.getElementById("kIndicacoes").textContent = itens.length;
  document.getElementById("kPendente").textContent = brl(pendente);
  document.getElementById("kPaga").textContent = brl(paga);

  document.getElementById("tbody").innerHTML = itens.length
    ? itens.map(x => `<tr>
        <td>${esc(x.tipo)}<br><small>${esc(x.id)} · ${dataBR(x.criadoEm)}</small></td>
        <td>${esc(x.produto)}</td>
        <td>${x.valor ? brl(x.valor) : "—"}</td>
        <td>${brl(x.comissao)}${x.comissaoPaga ? " ✅" : ""}</td>
        <td><span class="tag ${esc(x.status)}">${esc(x.status)}</span></td></tr>`).join("")
    : `<tr><td colspan="5" style="color:var(--muted)">Ainda sem indicações. Compartilhe seu link!</td></tr>`;
}

document.getElementById("btnEntrar").addEventListener("click", async () => {
  const p = await Store.buscarParceira(document.getElementById("codigoLogin").value);
  if (!p) return alert("Código não encontrado.");
  mostrarPainel(p);
});

document.getElementById("formCadastro").addEventListener("submit", async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const p = await Store.criarParceira({
    nome: f.nome.trim(), whatsapp: f.whatsapp.trim(), cidade: f.cidade.trim(), pix: f.pix.trim()
  });
  if (p.erro) return alert(p.erro);
  alert(`Cadastro feito! Seu código é ${p.codigo}. Guarde-o para entrar depois.`);
  mostrarPainel(p);
});

document.getElementById("btnCopiar").addEventListener("click", async () => {
  const input = document.getElementById("meuLink");
  try { await navigator.clipboard.writeText(input.value); }
  catch { input.select(); document.execCommand("copy"); }
  alert("Link copiado!");
});

document.getElementById("btnSair").addEventListener("click", () => {
  Store.gravar("parceiraLogada", null);
  location.reload();
});

(async () => {
  const cod = Store.ler("parceiraLogada", "");
  if (!cod) return;
  const p = await Store.buscarParceira(cod);
  if (p) mostrarPainel(p);
})();

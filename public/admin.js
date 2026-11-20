const telaLogin = document.getElementById("telaLogin");
const telaAdmin = document.getElementById("telaAdmin");

function entrar() {
  telaLogin.classList.add("oculto");
  telaAdmin.classList.remove("oculto");
  desenhar();
}
function sair() { Store.sairAdmin(); location.reload(); }

async function tentarLogin() {
  const r = await Store.entrarAdmin(document.getElementById("usuario").value, document.getElementById("senha").value);
  if (r.erro) return alert(r.erro);
  entrar();
}
document.getElementById("btnEntrar").addEventListener("click", tentarLogin);
document.getElementById("senha").addEventListener("keydown", e => { if (e.key === "Enter") tentarLogin(); });
document.getElementById("btnSairAdmin").addEventListener("click", sair);

const ROTULO_APROV = { pendente: "⏳ Pendente", aprovado: "✅ No site", rejeitado: "⛔ Rejeitado" };

function linha(x, estados, detalhe, comSite) {
  const comPagamento = x.parceira && x.status === "vendido" && x.comissao > 0;
  return `<tr>
    <td>${esc(x.id)}<br><small>${dataBR(x.criadoEm)}</small></td>
    <td>${esc(x.nome)}<br><small>${esc(x.whatsapp)}</small></td>
    <td>${esc(x.produto)}<br><small>${detalhe}</small></td>
    <td>${x.valor ? brl(x.valor) : "—"} <button class="btn sec pequeno" data-valor="${esc(x.id)}" title="Editar valor final">✎</button></td>
    <td>${esc(x.parceira || "—")}</td>
    <td>${x.parceira ? brl(x.comissao) : "—"}</td>
    <td><select data-status="${esc(x.id)}">${estados.map(s => `<option ${s === x.status ? "selected" : ""}>${s}</option>`).join("")}</select></td>
    ${comSite ? `<td><select data-aprov="${esc(x.id)}">${["pendente", "aprovado", "rejeitado"].map(s => `<option value="${s}" ${s === x.aprovacao ? "selected" : ""}>${ROTULO_APROV[s]}</option>`).join("")}</select></td>` : ""}
    <td>${comPagamento
      ? `<button class="btn pequeno ${x.comissaoPaga ? "sec" : ""}" data-paga="${esc(x.id)}">${x.comissaoPaga ? "Paga ✅" : "Marcar paga"}</button>` : "—"}</td>
  </tr>`;
}

function linhaPendente(x) {
  return `<tr>
    <td>${esc(x.id)}<br><small>${dataBR(x.criadoEm)}</small></td>
    <td>${esc(x.nome)}<br><small>${esc(x.whatsapp)} · ${esc(x.cidade)}</small></td>
    <td>${esc(x.produto)}<br><small>${esc(x.categoria)} · ${esc(x.estado)}${x.descricao ? "<br>" + esc(x.descricao) : ""}</small></td>
    <td>${x.valor ? brl(x.valor) : "a combinar"}</td>
    <td><button class="btn verde pequeno" data-aprovar="${esc(x.id)}">Aprovar</button>
        <button class="btn sec pequeno" data-rejeitar="${esc(x.id)}">Rejeitar</button></td>
  </tr>`;
}

async function desenhar() {
  const d = await Store.dadosAdmin();
  if (d.erro) {
    if (d.status === 401 || d.status === 403) { alert("Sessão expirada. Entre novamente."); return sair(); }
    return alert(d.erro);
  }
  const { vendas, interesses, parceiras } = d;
  const pendentes = vendas.filter(x => x.aprovacao === "pendente");

  document.getElementById("kPendentes").textContent = pendentes.length;
  document.getElementById("kVendas").textContent = vendas.length;
  document.getElementById("kInteresses").textContent = interesses.length;
  document.getElementById("kVolume").textContent = brl(vendas.filter(x => x.status === "vendido").reduce((s, x) => s + x.valor, 0));
  document.getElementById("kPagar").textContent = brl(parceiras.reduce((s, p) => s + p.pendente, 0));
  document.getElementById("kParc").textContent = parceiras.length;

  document.getElementById("tbPendentes").innerHTML = pendentes.length
    ? pendentes.map(linhaPendente).join("")
    : `<tr><td colspan="5" style="color:var(--muted)">Nenhum anúncio aguardando aprovação.</td></tr>`;

  document.getElementById("tbVendas").innerHTML = vendas.length
    ? vendas.map(x => linha(x, STATUS_VENDA,
        `${esc(x.categoria)} · ${esc(x.estado)} · ${esc(x.cidade)}${x.descricao ? "<br>" + esc(x.descricao) : ""}`, true)).join("")
    : `<tr><td colspan="9" style="color:var(--muted)">Nenhuma solicitação de venda ainda.</td></tr>`;

  document.getElementById("tbInteresses").innerHTML = interesses.length
    ? interesses.map(x => linha(x, STATUS_INTERESSE, x.obs ? esc(x.obs) : "sem observações", false)).join("")
    : `<tr><td colspan="8" style="color:var(--muted)">Nenhum interesse de compra ainda.</td></tr>`;

  document.getElementById("tbParceiras").innerHTML = parceiras.length
    ? parceiras.map(p => `<tr><td>${esc(p.codigo)}</td><td>${esc(p.nome)}</td><td>${esc(p.whatsapp)}</td><td>${esc(p.cidade)}</td><td>${esc(p.pix)}</td><td>${brl(p.pendente)}</td></tr>`).join("")
    : `<tr><td colspan="6" style="color:var(--muted)">Nenhuma parceira cadastrada.</td></tr>`;
}

async function atualizar(id, mudancas) {
  const r = await Store.atualizarRegistro(id, mudancas);
  if (r.erro) alert(r.erro);
  desenhar();
}

telaAdmin.addEventListener("change", e => {
  if (e.target.dataset.status) atualizar(e.target.dataset.status, { status: e.target.value });
  if (e.target.dataset.aprov) atualizar(e.target.dataset.aprov, { aprovacao: e.target.value });
});

telaAdmin.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.aprovar) atualizar(b.dataset.aprovar, { aprovacao: "aprovado", status: "anunciado" });
  if (b.dataset.rejeitar) {
    if (confirm("Rejeitar este anúncio? Ele não aparecerá no site.")) atualizar(b.dataset.rejeitar, { aprovacao: "rejeitado" });
  }
  if (b.dataset.paga) {
    const marcada = b.textContent.includes("Paga");
    atualizar(b.dataset.paga, { comissaoPaga: !marcada });
  }
  if (b.dataset.valor) {
    const txt = prompt("Valor final da venda (R$):", "");
    if (txt === null) return;
    const n = parseFloat(String(txt).replace(/\./g, "").replace(",", "."));
    if (isNaN(n) || n < 0) return alert("Valor inválido.");
    atualizar(b.dataset.valor, { valor: n });
  }
});

if (Store.temAdmin()) entrar();

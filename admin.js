const telaLogin = document.getElementById("telaLogin");
const telaAdmin = document.getElementById("telaAdmin");

function entrar() {
  telaLogin.classList.add("oculto");
  telaAdmin.classList.remove("oculto");
  desenhar();
}

document.getElementById("btnEntrar").addEventListener("click", () => {
  if (document.getElementById("senha").value === CONFIG.senhaAdmin) {
    try { sessionStorage.setItem("admin", "1"); } catch {}
    entrar();
  } else alert("Senha incorreta.");
});

function linha(x, estados, atributoStatus, detalhe) {
  const comPagamento = x.parceira && x.status === "vendido" && x.comissao > 0;
  return `<tr>
    <td>${esc(x.id)}<br><small>${dataBR(x.criadoEm)}</small></td>
    <td>${esc(x.nome)}<br><small>${esc(x.whatsapp)}</small></td>
    <td>${esc(x.produto)}<br><small>${detalhe}</small></td>
    <td>${x.valor ? brl(x.valor) : "—"} <button class="btn sec pequeno" data-valor="${esc(x.id)}" title="Editar valor final">✎</button></td>
    <td>${esc(x.parceira || "—")}</td>
    <td>${x.parceira ? brl(x.comissao) : "—"}</td>
    <td><select ${atributoStatus}="${esc(x.id)}">${estados.map(s => `<option ${s === x.status ? "selected" : ""}>${s}</option>`).join("")}</select></td>
    <td>${comPagamento
      ? `<button class="btn pequeno ${x.comissaoPaga ? "sec" : ""}" data-paga="${esc(x.id)}">${x.comissaoPaga ? "Paga ✅" : "Marcar paga"}</button>` : "—"}</td>
  </tr>`;
}

function desenhar() {
  const vendas = Store.solicitacoes();
  const interesses = Store.interesses();
  const parceiras = Store.parceiras();

  document.getElementById("kVendas").textContent = vendas.length;
  document.getElementById("kInteresses").textContent = interesses.length;
  document.getElementById("kVolume").textContent = brl(vendas.filter(x => x.status === "vendido").reduce((s, x) => s + x.valor, 0));
  document.getElementById("kPagar").textContent = brl(parceiras.reduce((s, p) => s + Store.comissoesDaParceira(p.codigo).pendente, 0));
  document.getElementById("kParc").textContent = parceiras.length;

  document.getElementById("tbVendas").innerHTML = vendas.length
    ? vendas.slice().reverse().map(x => linha(x, STATUS_VENDA, "data-status",
        `${esc(x.categoria)} · ${esc(x.estado)} · ${esc(x.cidade)}${x.descricao ? "<br>" + esc(x.descricao) : ""}`)).join("")
    : `<tr><td colspan="8" style="color:var(--muted)">Nenhuma solicitação de venda ainda.</td></tr>`;

  document.getElementById("tbInteresses").innerHTML = interesses.length
    ? interesses.slice().reverse().map(x => linha(x, STATUS_INTERESSE, "data-status",
        x.obs ? esc(x.obs) : "sem observações")).join("")
    : `<tr><td colspan="8" style="color:var(--muted)">Nenhum interesse de compra ainda.</td></tr>`;

  document.getElementById("tbParceiras").innerHTML = parceiras.length
    ? parceiras.map(p => `<tr><td>${esc(p.codigo)}</td><td>${esc(p.nome)}</td><td>${esc(p.whatsapp)}</td><td>${esc(p.cidade)}</td><td>${esc(p.pix)}</td><td>${brl(Store.comissoesDaParceira(p.codigo).pendente)}</td></tr>`).join("")
    : `<tr><td colspan="6" style="color:var(--muted)">Nenhuma parceira cadastrada.</td></tr>`;
}

telaAdmin.addEventListener("change", e => {
  const id = e.target.dataset.status;
  if (!id) return;
  const { lista, item, salvar } = Store.buscarRegistro(id);
  item.status = e.target.value;
  if (item.status !== "vendido") item.comissaoPaga = false;
  salvar(lista);
  desenhar();
});

telaAdmin.addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.paga) {
    const { lista, item, salvar } = Store.buscarRegistro(b.dataset.paga);
    item.comissaoPaga = !item.comissaoPaga;
    salvar(lista); desenhar();
  }
  if (b.dataset.valor) {
    const { lista, item, salvar } = Store.buscarRegistro(b.dataset.valor);
    const txt = prompt("Valor final da venda (R$):", item.valor || "");
    if (txt === null) return;
    const n = parseFloat(String(txt).replace(/\./g, "").replace(",", "."));
    if (isNaN(n) || n < 0) return alert("Valor inválido.");
    item.valor = n;
    item.comissao = item.parceira ? Store.calcularComissao(n) : 0;
    salvar(lista); desenhar();
  }
});

try { if (sessionStorage.getItem("admin") === "1") entrar(); } catch {}

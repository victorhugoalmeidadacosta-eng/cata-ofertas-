const telaAuth = document.getElementById("telaAuth");
const telaConta = document.getElementById("telaConta");
const formEntrar = document.getElementById("formEntrar");
const formCriar = document.getElementById("formCriar");

document.querySelectorAll(".aba").forEach(b => b.addEventListener("click", () => {
  document.querySelectorAll(".aba").forEach(x => x.classList.toggle("ativa", x === b));
  const entrar = b.dataset.aba === "entrar";
  formEntrar.classList.toggle("oculto", !entrar);
  formCriar.classList.toggle("oculto", entrar);
}));

function mostrarConta(c) {
  telaAuth.classList.add("oculto");
  telaConta.classList.remove("oculto");
  document.getElementById("boasVindas").textContent = `Olá, ${c.nome.split(" ")[0]}!`;

  const vendas = Store.solicitacoesDoCliente(c.whatsapp);
  document.getElementById("tbVendas").innerHTML = vendas.length
    ? vendas.slice().reverse().map(x => `<tr>
        <td>${esc(x.id)}<br><small>${dataBR(x.criadoEm)}</small></td>
        <td>${esc(x.produto)}<br><small>${esc(x.categoria)} · ${esc(x.estado)}</small></td>
        <td>${x.valor ? brl(x.valor) : "a combinar"}</td>
        <td><span class="tag ${esc(x.status)}">${esc(x.status)}</span></td></tr>`).join("")
    : `<tr><td colspan="4" style="color:var(--muted)">Você ainda não pediu para vender nada. <a href="vender.html" style="color:var(--red);font-weight:700">Quero vender →</a></td></tr>`;

  const compras = Store.interessesDoCliente(c.whatsapp);
  document.getElementById("tbCompras").innerHTML = compras.length
    ? compras.slice().reverse().map(x => `<tr>
        <td>${esc(x.id)}<br><small>${dataBR(x.criadoEm)}</small></td>
        <td>${esc(x.produto)}</td>
        <td>${brl(x.valor)}</td>
        <td><span class="tag ${esc(x.status)}">${esc(x.status)}</span></td></tr>`).join("")
    : `<tr><td colspan="4" style="color:var(--muted)">Você ainda não demonstrou interesse em nenhum produto.</td></tr>`;
}

formEntrar.addEventListener("submit", async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(formEntrar));
  const r = await Store.entrarCliente(f.whatsapp, f.senha);
  if (r.erro) return document.getElementById("erroEntrar").textContent = r.erro;
  mostrarConta(r.cliente);
});

formCriar.addEventListener("submit", async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(formCriar));
  const r = await Store.criarCliente({ nome: f.nome.trim(), whatsapp: f.whatsapp, senha: f.senha });
  if (r.erro) return document.getElementById("erroCriar").textContent = r.erro;
  mostrarConta(r.cliente);
});

document.getElementById("btnSair").addEventListener("click", () => { Store.sairCliente(); location.reload(); });

const logado = Store.clienteAtual();
if (logado) mostrarConta(logado);

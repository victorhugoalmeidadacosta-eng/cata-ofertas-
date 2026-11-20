// ===== Indicação por link (?ref=CODIGO) =====
const params = new URLSearchParams(location.search);
let PRODUTOS = [];

(async function indicacao() {
  if (params.get("ref")) await Store.guardarIndicacao(params.get("ref"));
  const faixa = document.getElementById("faixaIndicacao");
  const codigoAtual = Store.indicacaoAtual();
  if (codigoAtual) {
    const p = await Store.buscarParceira(codigoAtual);
    if (p) {
      faixa.textContent = `Você chegou por indicação de ${p.nome} 💚`;
      faixa.style.display = "block";
      document.getElementById("codigo").value = codigoAtual;
    }
  }
})();

document.getElementById("ano").textContent = new Date().getFullYear();
document.getElementById("txtComissao").textContent = CONFIG.comissaoPercentual + "%";
document.querySelectorAll(".link-whats").forEach(a => {
  a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo site da Cata Ofertas.")}`;
});

// ===== Catálogo de produtos à venda =====
const grade = document.getElementById("grade");
const busca = document.getElementById("busca");
const chips = document.getElementById("chips");
let categoriaAtiva = "";

function desenharChips() {
  const categorias = [...new Set(PRODUTOS.map(p => p.categoria).filter(Boolean))];
  chips.innerHTML = ["Todos", ...categorias].map((c, i) =>
    `<button class="chip ${(i === 0 && !categoriaAtiva) || c === categoriaAtiva ? "ativo" : ""}" data-cat="${i === 0 ? "" : esc(c)}">${esc(c)}</button>`).join("");
}
chips.addEventListener("click", e => {
  const b = e.target.closest(".chip");
  if (!b) return;
  categoriaAtiva = b.dataset.cat;
  [...chips.children].forEach(x => x.classList.toggle("ativo", x === b));
  desenharCatalogo();
});

const ROTULO = { disponivel: "● Disponível", reservado: "Reservado", vendido: "Vendido" };
const ORDEM = { disponivel: 0, reservado: 1, vendido: 2 };

function desenharCatalogo() {
  const termo = busca.value.trim().toLowerCase();
  const lista = PRODUTOS
    .filter(p => (!categoriaAtiva || p.categoria === categoriaAtiva) &&
      (!termo || (p.nome + " " + p.descricao + " " + p.categoria).toLowerCase().includes(termo)))
    .sort((a, b) => ORDEM[a.status] - ORDEM[b.status]);
  if (!lista.length) { grade.innerHTML = "<p class='vazio'>Nenhum produto encontrado.</p>"; return; }
  grade.innerHTML = lista.map(p => {
    const livre = p.status === "disponivel";
    const visual = p.foto ? `<img src="${esc(p.foto)}" alt="${esc(p.nome)}">` : `<span class="emoji">${p.emoji}</span>`;
    return `
    <article class="card ${esc(p.status)}">
      <div class="card-visual ${p.foto ? "foto" : ""}">
        ${visual}
        <span class="estoque ${p.status === "reservado" ? "res" : p.status === "vendido" ? "zero" : ""}">${ROTULO[p.status] || ""}</span>
      </div>
      <div class="card-corpo">
        <span class="cat">${esc(p.categoria)} · ${esc(p.estado)}</span>
        <h3>${esc(p.nome)}</h3>
        <p>${esc(p.descricao)}</p>
        <div class="card-rodape">
          <div class="preco"><strong>${brl(p.preco)}</strong></div>
          <button class="btn" data-int="${esc(p.id)}" ${livre ? "" : "disabled"}>${livre ? "Tenho interesse" : p.status === "reservado" ? "Reservado" : "Vendido"}</button>
        </div>
      </div>
    </article>`;
  }).join("");
}
busca.addEventListener("input", desenharCatalogo);
grade.addEventListener("click", e => {
  const b = e.target.closest("[data-int]");
  if (b) abrirInteresse(b.dataset.int);
});

// ===== Gaveta "Tenho interesse" =====
const gaveta = document.getElementById("gaveta");
const fundo = document.getElementById("fundo");
const resumo = document.getElementById("resumo");
let produtoAtual = null;

function abrirInteresse(id) {
  produtoAtual = PRODUTOS.find(p => p.id === id);
  if (!produtoAtual) return;
  resumo.innerHTML = `<div><strong>${esc(produtoAtual.nome)}</strong><br><small>${esc(produtoAtual.categoria)} · ${esc(produtoAtual.estado)}</small></div>
    <strong style="font-family:var(--font-title);font-weight:400;font-size:1.4rem">${brl(produtoAtual.preco)}</strong>`;
  gaveta.classList.add("aberta"); fundo.classList.add("aberto");
}
const fechar = () => { gaveta.classList.remove("aberta"); fundo.classList.remove("aberto"); };
document.getElementById("fechar").onclick = fechar;
fundo.onclick = fechar;

document.getElementById("enviarInteresse").addEventListener("click", async () => {
  const nome = document.getElementById("nome").value.trim();
  const whats = document.getElementById("whats").value.trim();
  const obs = document.getElementById("obs").value.trim();
  const codigoDigitado = document.getElementById("codigo").value.trim().toUpperCase();
  if (!produtoAtual) return;
  if (!nome || whats.replace(/\D/g, "").length < 10) return alert("Informe seu nome e um WhatsApp válido.");

  const parceira = await Store.buscarParceira(codigoDigitado);
  if (codigoDigitado && !parceira) return alert("Código de parceira não encontrado. Confira ou deixe em branco.");

  const i = await Store.criarInteresse({
    nome, whatsapp: whats, produto: produtoAtual.nome,
    valor: produtoAtual.preco, obs,
    parceira: parceira ? parceira.codigo : ""
  });
  if (i.erro) return alert(i.erro);

  const msg = `Olá! Tenho interesse neste produto da Cata Ofertas (protocolo ${i.id}):\n\n• ${produtoAtual.nome} — ${brl(produtoAtual.preco)}\n\nNome: ${nome}\nWhatsApp: ${whats}` +
    (obs ? `\nObservação: ${obs}` : "") + (parceira ? `\nIndicação: ${parceira.codigo}` : "");
  document.getElementById("obs").value = "";
  fechar();
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
});

// ===== Carrossel =====
(function iniciarCarrossel() {
  const trilho = document.getElementById("trilho");
  const pontos = document.getElementById("pontos");
  const caixa = document.getElementById("carrossel");
  if (!trilho || !SLIDES.length) { if (caixa) caixa.style.display = "none"; return; }

  trilho.innerHTML = SLIDES.map(s => {
    const fundo = s.tipo === "imagem" ? "#000" : (s.fundo || "#111");
    const img = s.img ? `<img src="${esc(s.img)}" alt="${esc(s.alt || "")}">` : "";
    const botao = s.botao ? `<a class="btn" href="${esc(s.link || "#")}">${esc(s.botao)}</a>` : "";
    return `<div class="slide" style="background:${fundo}">
      <div class="conteudo"><h2>${esc(s.titulo || "")}</h2><p>${esc(s.texto || "")}</p>${botao}</div>${img}</div>`;
  }).join("");
  pontos.innerHTML = SLIDES.map((_, i) => `<button aria-label="Ir para o slide ${i + 1}" data-i="${i}"></button>`).join("");

  let atual = 0, timer = null;
  function ir(i) {
    atual = (i + SLIDES.length) % SLIDES.length;
    trilho.style.transform = `translateX(-${atual * 100}%)`;
    [...pontos.children].forEach((b, n) => b.classList.toggle("ativo", n === atual));
  }
  function iniciarAuto() { pararAuto(); timer = setInterval(() => ir(atual + 1), 6000); }
  function pararAuto() { if (timer) clearInterval(timer); timer = null; }

  document.getElementById("setaEsq").onclick = () => { ir(atual - 1); iniciarAuto(); };
  document.getElementById("setaDir").onclick = () => { ir(atual + 1); iniciarAuto(); };
  pontos.addEventListener("click", e => { if (e.target.dataset.i) { ir(Number(e.target.dataset.i)); iniciarAuto(); } });
  caixa.addEventListener("mouseenter", pararAuto);
  caixa.addEventListener("mouseleave", iniciarAuto);

  let x0 = null;
  caixa.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; pararAuto(); }, { passive: true });
  caixa.addEventListener("touchend", e => {
    if (x0 !== null) {
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) ir(atual + (dx < 0 ? 1 : -1));
    }
    x0 = null; iniciarAuto();
  });

  ir(0);
  iniciarAuto();
})();

// ===== Cliente logado: botão do topo e dados pré-preenchidos =====
(async function () {
  const cli = await Store.clienteAtual();
  if (!cli) return;
  document.getElementById("linkEntrar").textContent = "👤 " + cli.nome.split(" ")[0];
  document.getElementById("nome").value = cli.nome;
  document.getElementById("whats").value = cli.whatsapp;
})();

(async function carregarCatalogo() {
  grade.innerHTML = "<p class='vazio'>Carregando ofertas...</p>";
  PRODUTOS = await Store.catalogo();
  desenharChips();
  desenharCatalogo();
})();

// ===== Vídeo de apresentação (sem som): toca só quando está visível =====
(function () {
  const v = document.getElementById("video");
  const b = document.getElementById("videoBtn");
  if (!v || !b) return;
  v.muted = true;
  let pausadoPeloUsuario = false;
  const atualizar = () => { b.textContent = v.paused ? "▶" : "⏸"; };
  v.addEventListener("play", atualizar);
  v.addEventListener("pause", atualizar);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entradas => {
      entradas.forEach(e => {
        if (pausadoPeloUsuario) return;
        if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
      });
    }, { threshold: 0.35 }).observe(v);
  } else {
    v.play().catch(() => {});
  }
  const alternar = () => {
    if (v.paused) { pausadoPeloUsuario = false; v.play().catch(() => {}); }
    else { pausadoPeloUsuario = true; v.pause(); }
  };
  b.addEventListener("click", alternar);
  v.addEventListener("click", alternar);
})();

// ====== CONFIGURAÇÕES (edite aqui) ======
const CONFIG = {
  nomeLoja: "Cata Ofertas",
  whatsapp: "5511913522426",      // número da Cata Ofertas, com DDI + DDD (TROQUE!)
  comissaoPercentual: 5,          // % do valor da venda que a parceira recebe (ajuste à sua regra)
  diasValidadeIndicacao: 30,      // por quantos dias a indicação da parceira vale
  senhaAdmin: "admin123"          // TROQUE! (proteção simples, só para demonstração)
};

// Etapas de acompanhamento (aparecem no painel admin e para o cliente)
const STATUS_VENDA = ["recebido", "fotografando", "anunciado", "negociando", "vendido", "cancelado"];
const STATUS_INTERESSE = ["novo", "negociando", "vendido", "cancelado"];

const CATEGORIAS_VENDA = ["Eletrodomésticos", "Casa e móveis", "Lazer e viagem", "Eletrônicos e games", "Veículos", "Instrumentos musicais", "Outros"];
const ESTADOS_PRODUTO = ["Novo", "Seminovo", "Usado"];

// ====== SLIDES DO CARROSSEL (edite/adicione/remova) ======
// tipo "imagem": usa uma imagem (coloque o arquivo em images/)
// tipo "texto": slide colorido com título, texto e botão
const SLIDES = [
  { tipo: "imagem", img: "images/banner.png", alt: "Cata Ofertas", titulo: "Quer vender, mas não tem tempo?", texto: "A Cata Ofertas cuida de tudo: fotografa, anuncia, divulga e negocia por você.", botao: "Quero vender", link: "vender.html" },
  { tipo: "texto", fundo: "linear-gradient(135deg,#04210f,#128a47)", titulo: "Do produto parado à venda feita", texto: "Fotografia do produto, anúncio atrativo, divulgação e negociação com os compradores.", botao: "Ver como funciona", link: "#como" },
  { tipo: "texto", fundo: "linear-gradient(135deg,#3a0808,#ff3131)", titulo: "Procurando uma boa oferta?", texto: "Veja os produtos que estamos anunciando e fale direto com a gente.", botao: "Ver produtos", link: "#catalogo" },
  { tipo: "texto", fundo: "linear-gradient(135deg,#111,#2a2a30)", titulo: "Indique e ganhe comissão", texto: "Seja parceira: indique quem quer vender ou comprar e ganhe em cada venda concluída.", botao: "Conhecer parcerias", link: "parcerias.html" }
];

// ====== OFERTAS ANUNCIADAS (produtos à venda) ======
// ATENÇÃO: os PREÇOS e o ESTADO abaixo são PROVISÓRIOS. Troque pelos valores reais de cada item.
// status: "disponivel" | "reservado" | "vendido"
// foto: imagem em images/ofertas/ (sem foto, o site usa o emoji)
const PRODUTOS = [
  { id: 1,  nome: "Máquina de lavar Samsung",        categoria: "Eletrodomésticos",      preco: 1140,  estado: "Seminovo", emoji: "🧺", foto: "images/ofertas/maquina-lavar.jpg", status: "vendido", descricao: "Máquina de lavar roupa de abertura frontal, na cor branca." },
  { id: 2,  nome: "Sofá de canto",                   categoria: "Casa e móveis",         preco: 1500,  estado: "Usado",    emoji: "🛋️", foto: "images/ofertas/sofa-canto.jpg",    status: "disponivel", descricao: "Sofá de canto em tecido bege." },
  { id: 3,  nome: "Mesa de sinuca",                  categoria: "Lazer e viagem",        preco: 250,   estado: "Seminovo", emoji: "🎱", foto: "images/ofertas/mesa-sinuca.jpg",   status: "disponivel", descricao: "Mesa de sinuca compacta com pés de madeira, tacos e bolas." },
  { id: 4,  nome: "Conjunto de malas de viagem",     categoria: "Lazer e viagem",        preco: 420,   estado: "Seminovo", emoji: "🧳", foto: "images/ofertas/malas-viagem.jpg",  status: "reservado", descricao: "Duas malas rígidas com rodinhas e alça retrátil, cor champanhe." },
  { id: 5,  nome: "Xbox One com Kinect e controle",  categoria: "Eletrônicos e games",   preco: 640,  estado: "Usado",    emoji: "🎮", foto: "images/ofertas/xbox-one.jpg",      status: "disponivel", descricao: "Console Xbox One com sensor Kinect e controle." },
  { id: 6,  nome: "Fogão 4 bocas retrô amarelo",     categoria: "Eletrodomésticos",      preco: 500,   estado: "Seminovo", emoji: "🍳", foto: "images/ofertas/fogao-retro.jpg",   status: "vendido", descricao: "Fogão de 4 bocas com forno e abas laterais, na cor amarela." },
  { id: 7,  nome: "Setup gamer: monitor curvo, teclado e mouse", categoria: "Eletrônicos e games", preco: 2200, estado: "Seminovo", emoji: "🖥️", foto: "images/ofertas/setup-gamer.jpg", status: "disponivel", descricao: "Monitor curvo, teclado mecânico, mouse, mousepad grande e caixa de som." },
  { id: 8,  nome: "Moto vermelha",                   categoria: "Veículos",              preco: 12500, estado: "Usado",    emoji: "🏍️", foto: "images/ofertas/moto-vermelha.jpg", status: "disponivel", descricao: "Moto vermelha com detalhes em azul. Fale com a gente para ver documentação e quilometragem." },
  { id: 9,  nome: "Trompete com estojo",             categoria: "Instrumentos musicais", preco: 1200,  estado: "Usado",    emoji: "🎺", foto: "images/ofertas/trompete.jpg",      status: "disponivel", descricao: "Trompete dourado com estojo." },
  { id: 10, nome: "Smartphone com capinha",          categoria: "Eletrônicos e games",   preco: 1200,  estado: "Seminovo", emoji: "📱", foto: "images/ofertas/smartphone.jpg",    status: "reservado", descricao: "Smartphone com capinha branca." }
];

# Cata Ofertas

Site (HTML + CSS + JavaScript, sem instalação) da Cata Ofertas: nós cuidamos de todo o processo de venda de quem tem produtos para vender, mas não tem tempo, conhecimento ou disposição. Fotografia do produto, anúncio atrativo, divulgação e negociação com os compradores.

## Como abrir no VS Code
1. Extraia o ZIP e abra a pasta `cata-ofertas` no VS Code (`Arquivo > Abrir Pasta`).
2. Instale a extensão **Live Server** (Ritwick Dey).
3. Clique com o botão direito em `index.html` > **Open with Live Server**.

## Estrutura de pastas (importante)
Tudo precisa ficar junto, assim:
```
cata-ofertas/
  index.html  vender.html  parcerias.html  login.html  parceira.html  admin.html
  styles.css  data.js  store.js  app.js  vender.js  login.js  parceira.js  admin.js
  images/
    logo.png  banner.png
  images/ofertas/
    (as fotos dos produtos à venda)
  videos/
    apresentacao.mp4  capa.jpg
```
Se a página aparecer sem cores ou com a logo quebrada, o `styles.css` ou a pasta `images` não está ao lado dos `.html`.

## Vídeo da página inicial
O vídeo fica em `videos/apresentacao.mp4` (sem som, em loop, toca só quando aparece na tela) e a imagem de capa em `videos/capa.jpg`. Para trocar, substitua esses dois arquivos mantendo os nomes. Se o arquivo for grande (mais de uns 10 MB), comprima antes para o site carregar rápido.

## Páginas
| Arquivo | Para quê |
|---|---|
| `index.html` | Início: quem somos, como funciona, produtos à venda ("Tenho interesse") |
| `vender.html` | Formulário para quem quer vender: os dados vão para o WhatsApp da Cata Ofertas |
| `parcerias.html` | Explica o programa de parcerias |
| `login.html` | Login/cadastro do cliente, com acompanhamento dos pedidos de venda e interesses |
| `parceira.html` | Cadastro da parceira, link exclusivo e extrato de comissões |
| `admin.html` | Você gerencia os pedidos, o andamento e o pagamento das comissões |

## O que editar primeiro (`data.js`)
- `CONFIG.whatsapp`: **o número da Cata Ofertas** (DDI + DDD + número).
- `CONFIG.senhaAdmin`: troque a senha do admin.
- `CONFIG.comissaoPercentual`: % da venda que a parceira recebe (hoje 5%, ajuste à sua regra).
- `PRODUTOS`: os produtos à venda. **As fotos ficam em `images/ofertas/`; para adicionar uma, ponha o arquivo lá e preencha `foto: "images/ofertas/arquivo.jpg"`. **Os preços e o estado dos 10 itens atuais são provisórios: troque pelos reais.** Para marcar como vendido ou reservado, mude o `status`.
- `SLIDES`: os slides do carrossel.

## Como funciona
**Quem quer vender:** preenche `vender.html` → o pedido é salvo (protocolo V0001...) e os dados abrem no WhatsApp da Cata Ofertas → no admin você acompanha: recebido, fotografando, anunciado, negociando, vendido ou cancelado.

**Quem quer comprar:** clica em "Tenho interesse" num produto → o interesse é salvo (protocolo I0001...) e abre o WhatsApp → no admin: novo, negociando, vendido ou cancelado.

**Parceiras:** recebem um link (`index.html?ref=CODIGO`) válido por 30 dias. A indicação vale para quem vende ou compra. A comissão só conta quando o status está **vendido**. No admin você pode ajustar o valor final (✎) e marcar a comissão como **paga** depois do Pix.

## Limitações desta versão
Os dados ficam no `localStorage` do navegador. Cada computador vê dados diferentes e a senha do admin não é segura de verdade. Para uso real, o próximo passo é um backend (Supabase, Firebase ou Node + banco) com login de verdade, e upload de fotos dos produtos.

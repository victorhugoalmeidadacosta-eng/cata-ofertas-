# Cata Ofertas (site + back-end)

Node + Express + PostgreSQL. O site fica na pasta `public/` e o servidor em `server/`.

## O que o back-end faz
- Cadastro e login de clientes (senha criptografada, sessão por token).
- Admin com login de verdade (usuário `victor`).
- Quem quer vender envia o anúncio: ele entra como **pendente**. O admin aprova ou rejeita no painel, e só o aprovado aparece no site.
- Interesses de compra, parceiras e comissões, tudo salvo no banco.

## Como colocar no ar (GitHub + Render)

### 1. GitHub
1. Crie um repositório novo no GitHub.
2. Suba o conteúdo desta pasta (package.json, render.yaml, server/, public/). Não suba `node_modules` nem `.env`.

### 2. Render
1. Entre em render.com e clique em **New > Blueprint**.
2. Conecte o repositório. O Render lê o `render.yaml` e cria o site e o banco PostgreSQL sozinho.
3. Quando ele pedir, preencha **ADMIN_SENHA** com a senha do admin (mínimo 8 caracteres).
4. Clique em Apply e espere o deploy terminar. O link do site aparece no topo do serviço.

### 3. Primeiro acesso
- Abra `SEU-LINK/admin.html`, usuário `victor` e a senha que você escolheu.
- Na primeira vez que o servidor sobe, os 10 produtos de exemplo são carregados já aprovados.

## Se preferir criar na mão (sem Blueprint)
1. Crie um **PostgreSQL** no Render e copie a *Internal Database URL*.
2. Crie um **Web Service** ligado ao repositório: build `npm install`, start `npm start`.
3. Em Environment, defina `DATABASE_URL`, `JWT_SECRET` (frase longa), `ADMIN_USUARIO` e `ADMIN_SENHA`.

## Atenção
- No plano gratuito do Render o site "dorme" depois de um tempo parado e o primeiro acesso demora. O banco gratuito também tem prazo de validade; para uso real, passe para um plano pago.
- Troque o número do WhatsApp em `public/data.js` se precisar.
- Para rodar no seu computador: copie `.env.example` para `.env`, preencha, e use `npm install` e `npm start` (precisa de um PostgreSQL local).

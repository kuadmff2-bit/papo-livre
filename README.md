# Papo Livre

Chat de sala com mensagens em tempo real e suporte a anexos de imagem, PDF, Excel e Word.

## Rodar localmente

```bash
npm install
npm run dev
```

## Publicar pelo painel da Cloudflare

1. Envie este projeto para um repositório GitHub.
2. No painel Cloudflare, abra **Workers & Pages > Create application > Import repository**.
3. Selecione o repositório e escolha **Workers**, não Pages.
4. Use estas configurações de build:
	- Build command: `npm run build`
	- Deploy command: `npx wrangler deploy`
	- Root directory: `/`
5. Antes do primeiro deploy, crie o bucket R2 `papo-livre-files` em **R2 > Create bucket**.
6. No Worker, confirme os recursos Durable Objects e R2 quando o painel solicitar.

O `wrangler.toml` já informa à Cloudflare que o Worker usa Durable Objects, R2 e os arquivos gerados em `dist`. Cada sala usa o nome definido na URL (`/api/room/amizade`) e o Worker mantém as conexões via WebSocket.

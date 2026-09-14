# Papo Livre

Chat de sala com mensagens em tempo real e suporte a anexos de imagem, PDF, Excel e Word.

## Rodar localmente

```bash
npm install
npm run dev
```

## Publicar pelo painel da Cloudflare

1. No painel Cloudflare, abra **Workers & Pages > Create application > Import repository**.
2. Selecione o repositório `papo-livre` e escolha **Workers**, não Pages.
3. Use estas configurações:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Root directory: `/`
4. Publique.

O projeto usa **Workers Static Assets**, **Durable Objects** com armazenamento SQLite e **R2**. O bucket R2 é deixado sem nome no `wrangler.toml` para que o Wrangler/Cloudflare faça o provisionamento automático no primeiro deploy, inclusive em deploys conectados ao GitHub.

As rotas `/api/*` passam primeiro pelo Worker, enquanto o frontend compilado pelo Vite é servido a partir de `dist`.

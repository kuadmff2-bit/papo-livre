# Papo Livre

Chat de sala com mensagens em tempo real e suporte a anexos de imagem, PDF, Excel e Word.

## Rodar localmente

```bash
npm install
npm run dev
```

## Publicar no Cloudflare

1. Instale o Wrangler: `npm install -g wrangler`.
2. Faça login: `wrangler login`.
3. Crie o bucket R2: `wrangler r2 bucket create papo-livre-files`.
4. Gere a build: `npm run build`.
5. Publique: `wrangler deploy`.

O link gerado pelo Cloudflare pode ser enviado aos amigos. Cada sala usa o nome definido na URL (`/api/room/amizade`) e o Worker mantém as conexões via Durable Objects. Para produção, recomenda-se adicionar autenticação, limite de tamanho/tipo de arquivo e persistência das mensagens em D1.

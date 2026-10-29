# stonebid-web

Frontend do **Stonebid**, casa de leilões online: vitrine pública, lances ao vivo e histórico auditável.

React + Vite + TypeScript, Tailwind CSS v4 com shadcn/ui, TanStack Router (rotas por arquivo) e TanStack Query.

## Como rodar

Requisitos: Node 22.12 ou mais recente (o CI usa Node 26) e a API `stonebid-api` rodando.

```bash
cp .env.example .env   # ajuste VITE_API_URL se a API não estiver em localhost:3333
npm install
npm run dev            # http://localhost:5173
```

## Variáveis de ambiente

| Variável       | Padrão                  | Para quê                                                  |
| -------------- | ----------------------- | --------------------------------------------------------- |
| `VITE_API_URL` | `http://localhost:3333` | URL base da API. Validada com zod em `src/config/env.ts`. |

## Scripts

| Script                            | O que faz                                        |
| --------------------------------- | ------------------------------------------------ |
| `npm run dev`                     | Servidor de desenvolvimento                      |
| `npm run build`                   | Checagem de tipos + build de produção em `dist/` |
| `npm run preview`                 | Serve o build localmente                         |
| `npm run lint`                    | ESLint (sem avisos permitidos)                   |
| `npm run format` / `format:check` | Prettier: formata / confere                      |
| `npm run typecheck`               | TypeScript (`tsc -b`)                            |

## Estrutura

- `src/routes/`: rotas por arquivo. `_public` (aberto a todos), `_auth` (só para quem não entrou), `_app` (exige login). O `routeTree.gen.ts` é gerado pelo plugin do router: nunca edite à mão.
- `src/features/<feature>/`: tudo de um domínio (api, components, hooks, schemas, types), acessado só pelo `index.ts`.
- `src/components/ui/`: componentes do shadcn/ui, instalados só pela CLI (`npx shadcn@latest add <componente>`).
- `src/components/layout/` e `src/components/common/`: shell da aplicação e componentes próprios reutilizáveis.

## Deploy

Vercel, a partir do GitHub Actions depois do CI verde (o deploy automático pelo Git da Vercel fica desligado em `vercel.json`). O `vercel.json` reescreve todas as rotas para `index.html` (SPA).

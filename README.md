# Quiz Claude Code (Verdadeiro ou Falso)

Quiz de treinamento interno sobre Claude Code: 20 afirmações em 4 níveis (Negócio → Básico → Intermediário → Avançado), feedback imediato com link para a documentação oficial e ranking global no Supabase. A especificação completa está em [`.claude/prd.md`](./.claude/prd.md).

Stack: React 19 + Vite + TypeScript, Tailwind CSS 4, React Router, Zod, Supabase, Vitest + Testing Library e Playwright. O deploy é na Vercel.

## Setup local

```bash
npm install
cp .env.example .env.local   # preencha as variáveis (veja abaixo)
npm run dev                  # http://localhost:5173
```

Sem as variáveis do Supabase, o quiz funciona normalmente. O ranking aparece como indisponível, e o resultado fica guardado na fila local de reenvio.

### Variáveis de ambiente

| Variável                     | Descrição                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`          | URL do projeto Supabase                                                                                     |
| `VITE_SUPABASE_ANON_KEY`     | Chave `anon` (pública; o acesso é limitado por RLS e RPC)                                                   |
| `VITE_ALLOWED_EMAIL_DOMAINS` | Domínios aceitos, separados por vírgula (ex.: `empresa.com,empresa.com.br`). Vazio aceita qualquer domínio. |
| `VITE_APP_VERSION`           | Versão gravada em cada partida                                                                              |

## Scripts

| Comando                             | O que faz                                              |
| ----------------------------------- | ------------------------------------------------------ |
| `npm run dev`                       | Servidor de desenvolvimento                            |
| `npm run build` / `npm run preview` | Build de produção (`dist/`) e preview local            |
| `npm run typecheck`                 | `tsc -b`                                               |
| `npm run lint`                      | oxlint (inclui regras `jsx-a11y`)                      |
| `npm run format`                    | Prettier                                               |
| `npm test`                          | Testes unitários e de integração (Vitest)              |
| `npm run test:e2e`                  | E2E com Playwright (Supabase mockado; desktop e 360px) |

Para rodar um único teste: `npx vitest run src/features/quiz/scoring.test.ts` ou `npx playwright test -g "retoma a partida"`. Na primeira vez, instale o navegador do E2E com `npx playwright install chromium`.

## Supabase

A migração está em [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql). O front só usa a chave `anon`: as tabelas têm RLS e não têm policies, e toda leitura e escrita passa pelas funções `submit_result` e `get_leaderboard` (`security definer`).

```bash
npx supabase login
npx supabase link --project-ref <ref-do-projeto>
npx supabase db push
```

Depois, cadastre os domínios permitidos no SQL Editor. Eles devem espelhar `VITE_ALLOWED_EMAIL_DOMAINS`; com a tabela vazia, o banco aceita qualquer domínio:

```sql
insert into public.allowed_domains (domain) values ('empresa.com'), ('empresa.com.br');
```

Regras aplicadas no banco:

- **Envio idempotente:** cada partida tem um `client_game_id` gerado no navegador. Reenviar a mesma partida devolve o id já gravado, sem duplicar.
- **Rate limit:** 1 envio por e-mail a cada 60 s, serializado por e-mail (sem corrida entre envios simultâneos).
- **Validação:** partida entre 10 s e 2 h, exatamente 20 perguntas, e `score` / `correct_count` coerentes com os acertos por nível.
- **Ranking:** melhor partida por e-mail, sem expor o e-mail, com no máximo 100 linhas por consulta.
- **"Você" no ranking:** a pessoa é reconhecida pelos ids de partida que o navegador recebeu no envio, nunca pelo e-mail. Por isso não dá para consultar a posição de outra pessoa a partir do e-mail dela.

> **Risco aceito (v1):** a pontuação é calculada no cliente. Veja a §7.5 do PRD.

## Deploy na Vercel

- Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
- O `vercel.json` já tem o rewrite de SPA.
- Configure as quatro variáveis `VITE_*` em **Production** e **Preview**.

## Banco de perguntas

As perguntas ficam em `src/data/questions.json` e são validadas por `src/data/questions.test.ts`: schema Zod, IDs únicos, ≥ 5 por nível, `docUrl` com `https://` e entre 30% e 70% de "Verdadeiro" por nível.

⚠️ **Revisão pendente.** O conteúdo veio da §9 do PRD e precisa ser revisado pelo time, com validação de cada link. Para cumprir a regra de equilíbrio V/F, sete afirmações verdadeiras foram reescritas como falsas e marcadas com a tag `"revisar"`:

| ID       | Nova afirmação (Falso)                                    |
| -------- | --------------------------------------------------------- |
| `bas-07` | `Esc` encerra a sessão e apaga a conversa                 |
| `bas-11` | `claude --continue` abre um seletor de conversas          |
| `int-01` | No Plan Mode, o Claude edita arquivos sem pedir aprovação |
| `int-04` | `.claude/settings.local.json` deve ser versionado         |
| `int-14` | O Claude Code não consegue analisar imagens               |
| `ava-04` | No modo `-p` não existe saída JSON                        |
| `ava-09` | Entre `allow` e `deny`, a regra `allow` prevalece         |

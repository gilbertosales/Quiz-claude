# PRD — Quiz Claude Code (Verdadeiro ou Falso)

> Documento de requisitos para ser consumido pelo Claude Code na construção do projeto.
> Versão 1.0 · 2026-10-27

---

## 1. Visão geral

Aplicação web de **quiz Verdadeiro/Falso sobre Claude Code**, voltada para **treinamento interno**. A pessoa participante avança por uma **trilha progressiva** de quatro níveis — **Negócio → Básico → Intermediário → Avançado** —, recebe **feedback imediato com explicação e link para a documentação oficial** a cada resposta e, ao final, entra em um **ranking global** da empresa.

### 1.1 Problema
Times de negócio e de engenharia estão adotando o Claude Code, mas não existe uma forma leve e engajante de medir e reforçar o conhecimento sobre a ferramenta, do conceito ao uso avançado.

### 1.2 Objetivos
| # | Objetivo | Métrica de sucesso |
|---|----------|--------------------|
| O1 | Ensinar conceitos de Claude Code de forma progressiva | ≥ 70% das pessoas que iniciam terminam a partida |
| O2 | Medir o nível de conhecimento dos times | Pontuação média por nível visível no ranking/exportação |
| O3 | Engajar via competição saudável | ≥ 50% do público-alvo jogando no 1º mês |
| O4 | Direcionar para a documentação oficial | Cliques nos links de documentação (opcional, via analytics) |

### 1.3 Fora de escopo (v1)
- Painel administrativo para cadastrar perguntas (o banco fica em arquivo versionado).
- Login com senha ou SSO.
- Timer por pergunta.
- Certificados.
- Internacionalização (a v1 é somente em **pt-BR**).

---

## 2. Público e personas

| Persona | Descrição | Necessidade |
|---------|-----------|-------------|
| **Pessoa de negócio** (PM, gestão, vendas) | Pouco ou nenhum contato com terminal | Entender o que é o Claude Code, para que serve e quais são seus limites |
| **Dev iniciante na ferramenta** | Programa, mas começou agora no Claude Code | Aprender comandos e fluxos básicos |
| **Dev avançado / tech lead** | Usa o Claude Code no dia a dia | Validar o conhecimento de hooks, MCP, subagents, SDK e permissões |
| **Organizador(a) do treinamento** | Responsável pela iniciativa | Acompanhar o ranking e a participação |

---

## 3. Decisões do brainstorm

| Tema | Decisão |
|------|---------|
| Objetivo | Treinamento interno |
| Níveis | Trilha progressiva: Negócio → Básico → Intermediário → Avançado |
| Perguntas por partida | **20** (5 por nível), sorteadas de um banco de **60** (15 por nível) |
| Feedback | Imediato: certo/errado + explicação + link para a doc oficial |
| Timer | Sem timer; o tempo total serve apenas como **critério de desempate** |
| Persistência | **Ranking global** no Supabase |
| Identificação | Nome + e-mail corporativo (sem senha), domínio validado via env |
| Stack | React + Vite + TypeScript |
| Deploy | Vercel |
| Conteúdo | Banco inicial gerado (seção 9), sujeito a revisão do time |

---

## 4. Jornada da pessoa usuária

```
[Tela inicial] → [Identificação] → [Quiz: 20 perguntas em 4 níveis] → [Resultado + revisão] → [Ranking]
                                        ↑ transição entre níveis ↑
```

1. **Tela inicial** — título, breve explicação (4 níveis, 20 perguntas, ~10 min), botões "Começar" e "Ver ranking".
2. **Identificação** — campos Nome e E-mail corporativo + checkbox de consentimento (LGPD). Os dados ficam salvos no `localStorage` para pré-preencher a próxima partida.
3. **Quiz**
   - Cabeçalho: nível atual (badge com cor), progresso "Pergunta 7 de 20", barra de progresso e pontuação parcial.
   - Enunciado da afirmação + dois botões grandes: **Verdadeiro** e **Falso** (atalhos de teclado `V`/`F` ou `←`/`→`).
   - Após responder: os botões são bloqueados, aparece o card de feedback (✅ Correto / ❌ Incorreto), a resposta correta, a **explicação** e o link **"Saiba mais na documentação oficial"** (abre em nova aba). Botão "Próxima" (atalho `Enter`).
   - **Transição de nível** — ao terminar as 5 perguntas de um nível, uma tela intermediária mostra "Nível Básico concluído: 4/5" e apresenta o próximo nível.
4. **Resultado** — pontuação total, acertos por nível (gráfico de barras simples ou cards), tempo total, posição no ranking, lista de revisão das 20 perguntas (com a resposta dada, a correta, a explicação e o link), botões "Jogar novamente" e "Ver ranking".
5. **Ranking** — top 50 com posição, nome, pontuação, acertos e tempo. A linha da própria pessoa fica destacada, e se ela estiver fora do top 50 a sua posição aparece fixada no fim da lista.

---

## 5. Requisitos funcionais

### 5.1 Quiz
- **RF01** — Sortear 5 perguntas aleatórias de cada nível a partir do banco (shuffle Fisher-Yates), mantendo a ordem dos níveis.
- **RF02** — Exibir uma pergunta por vez; não é possível voltar nem alterar a resposta.
- **RF03** — Mostrar o feedback imediato com o resultado, a explicação e o link da documentação.
- **RF04** — Exibir a tela de transição entre níveis com o desempenho do nível concluído.
- **RF05** — Cronometrar o tempo total da partida (do início da 1ª pergunta até a resposta da última), sem exibir pressão de tempo (um relógio discreto é opcional).
- **RF06** — Se a pessoa recarregar a página no meio da partida, retomar o estado salvo no `sessionStorage` (sem penalidade).

### 5.2 Pontuação
- **RF07** — Pontos ponderados por nível:

  | Nível | Pontos por acerto | Máximo |
  |-------|-------------------|--------|
  | Negócio | 1 | 5 |
  | Básico | 2 | 10 |
  | Intermediário | 3 | 15 |
  | Avançado | 4 | 20 |
  | **Total** | | **50** |

- **RF08** — Erros não descontam pontos.

### 5.3 Identificação
- **RF09** — Nome obrigatório (2–60 caracteres) e e-mail obrigatório e válido.
- **RF10** — O domínio do e-mail deve pertencer a `VITE_ALLOWED_EMAIL_DOMAINS` (lista separada por vírgula, ex.: `empresa.com,empresa.com.br`). Se a variável estiver vazia, aceita qualquer domínio. A validação acontece **no front e também no banco** (função RPC).
- **RF11** — O e-mail é normalizado (trim + lowercase) e serve como identificador único da pessoa.
- **RF12** — Checkbox de consentimento obrigatório: "Concordo que meu nome e pontuação sejam exibidos no ranking interno."

### 5.4 Ranking
- **RF13** — Ao final da partida, enviar o resultado ao Supabase. Cada partida é registrada; o ranking considera a **melhor partida por e-mail**.
- **RF14** — Ordenação: pontuação ↓, tempo total ↑, data da partida ↑.
- **RF15** — O ranking público **não exibe o e-mail**, apenas o nome.
- **RF16** — Exibir o top 50 e a posição da pessoa atual.
- **RF17** — Se o envio falhar (rede ou Supabase), mostrar o resultado mesmo assim, guardar a partida pendente no `localStorage` e tentar reenviar com o botão "Tentar novamente" ou ao abrir o app de novo.

### 5.5 Histórico local
- **RF18** — Guardar no `localStorage` a melhor pontuação pessoal e as últimas 5 partidas, exibindo "Seu recorde: X pts" na tela inicial.

---

## 6. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| RNF01 | **Responsivo** (mobile-first, a partir de 360px), sem scroll horizontal |
| RNF02 | **Acessibilidade WCAG 2.1 AA**: navegação por teclado, foco visível, `aria-live` no feedback, contraste adequado, sem depender só de cor (usar ícone + texto) |
| RNF03 | **Performance**: Lighthouse ≥ 90 em Performance e Accessibility; bundle inicial < 200 KB gzip |
| RNF04 | **Tema** claro/escuro seguindo `prefers-color-scheme` |
| RNF05 | **Privacidade/LGPD**: coletar apenas nome e e-mail; e-mail nunca exposto no front de outras pessoas |
| RNF06 | **Segurança**: chave `anon` do Supabase no front, RLS habilitado, escrita somente via RPC |
| RNF07 | **Idioma**: pt-BR |
| RNF08 | **Manutenibilidade**: perguntas em arquivo JSON versionado, validado por schema (Zod) em teste |

---

## 7. Arquitetura técnica

### 7.1 Stack
| Camada | Tecnologia |
|--------|------------|
| Build | Vite 5+ |
| UI | React 18+ + TypeScript (strict) |
| Estilo | Tailwind CSS |
| Estado | `useReducer` + Context (máquina de estados do quiz); sem Redux |
| Roteamento | React Router (`/`, `/quiz`, `/resultado`, `/ranking`) |
| Validação | Zod (formulário e schema do banco de perguntas) |
| Backend | Supabase (Postgres + RPC + RLS) via `@supabase/supabase-js` |
| Testes | Vitest + React Testing Library; Playwright para o fluxo E2E principal |
| Lint/format | ESLint + Prettier |
| Deploy | Vercel (preview por PR, produção na `main`) |

### 7.2 Estrutura de pastas
```
quiz-claude-code/
├─ public/
├─ src/
│  ├─ app/                # rotas e layout
│  ├─ components/         # QuestionCard, FeedbackCard, ProgressBar, LevelBadge, LeaderboardTable...
│  ├─ features/
│  │  ├─ quiz/            # quizReducer.ts, useQuiz.ts, draw.ts (sorteio), scoring.ts
│  │  ├─ identity/        # IdentityForm.tsx, validation.ts
│  │  └─ leaderboard/     # api.ts, useLeaderboard.ts
│  ├─ data/
│  │  └─ questions.json   # banco de perguntas
│  ├─ lib/
│  │  ├─ supabase.ts
│  │  └─ storage.ts       # wrappers seguros de localStorage/sessionStorage (try/catch)
│  ├─ types/
│  └─ main.tsx
├─ supabase/
│  └─ migrations/
│     └─ 0001_init.sql
├─ tests/                 # e2e Playwright
├─ .env.example
└─ README.md
```

### 7.3 Modelo de dados da pergunta (`questions.json`)
```ts
type Level = 'negocio' | 'basico' | 'intermediario' | 'avancado';

interface Question {
  id: string;           // ex.: "neg-01"
  level: Level;
  statement: string;    // afirmação exibida
  answer: boolean;      // true = Verdadeiro
  explanation: string;  // 1–3 frases
  docUrl: string;       // link da doc oficial
  tags?: string[];
}
```
Regras (validadas em teste): IDs únicos, ≥ 5 perguntas por nível, `docUrl` começando com `https://`, e um equilíbrio aproximado entre V e F em cada nível (entre 30% e 70%).

### 7.4 Máquina de estados do quiz
```
idle → identifying → playing(questionIndex, answered=false)
     → feedback(questionIndex) → [levelTransition] → playing(...) ... → finished → submitting → done | submitError
```
Ações: `START`, `SET_IDENTITY`, `ANSWER(bool)`, `NEXT`, `FINISH`, `SUBMIT_OK`, `SUBMIT_FAIL`, `RESTORE(state)`, `RESET`.

### 7.5 Banco de dados (Supabase) — `supabase/migrations/0001_init.sql`
```sql
create table public.quiz_results (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 2 and 60),
  email           text not null check (email = lower(email)),
  score           int  not null check (score between 0 and 50),
  correct_count   int  not null check (correct_count between 0 and 20),
  correct_by_level jsonb not null,           -- {"negocio":4,"basico":5,...}
  duration_ms     int  not null check (duration_ms between 10000 and 7200000),
  question_ids    text[] not null,
  app_version     text,
  created_at      timestamptz not null default now()
);
create index on public.quiz_results (email);
create index on public.quiz_results (score desc, duration_ms asc);

alter table public.quiz_results enable row level security;
-- Sem policies de SELECT/INSERT diretas para anon: acesso apenas via funções abaixo.

-- Domínios permitidos (espelha VITE_ALLOWED_EMAIL_DOMAINS)
create table public.allowed_domains (domain text primary key);
alter table public.allowed_domains enable row level security;

-- Envio de resultado
create or replace function public.submit_result(
  p_name text, p_email text, p_score int, p_correct_count int,
  p_correct_by_level jsonb, p_duration_ms int, p_question_ids text[], p_app_version text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_domain text;
begin
  v_domain := split_part(lower(trim(p_email)), '@', 2);
  if exists (select 1 from allowed_domains) and
     not exists (select 1 from allowed_domains where domain = v_domain) then
    raise exception 'email domain not allowed';
  end if;
  -- rate limit simples: máx. 1 envio por e-mail a cada 60s
  if exists (select 1 from quiz_results where email = lower(trim(p_email))
             and created_at > now() - interval '60 seconds') then
    raise exception 'too many submissions';
  end if;
  insert into quiz_results(name, email, score, correct_count, correct_by_level,
                           duration_ms, question_ids, app_version)
  values (trim(p_name), lower(trim(p_email)), p_score, p_correct_count,
          p_correct_by_level, p_duration_ms, p_question_ids, p_app_version)
  returning id into v_id;
  return v_id;
end $$;

-- Ranking: melhor partida por e-mail, sem expor e-mail
create or replace function public.get_leaderboard(p_limit int default 50, p_email text default null)
returns table(position bigint, name text, score int, correct_count int,
              duration_ms int, created_at timestamptz, is_me boolean)
language sql security definer set search_path = public as $$
  with best as (
    select distinct on (email) *
    from quiz_results
    order by email, score desc, duration_ms asc, created_at asc
  ), ranked as (
    select row_number() over (order by score desc, duration_ms asc, created_at asc) as position,
           name, score, correct_count, duration_ms, created_at,
           (email = lower(trim(coalesce(p_email, '')))) as is_me
    from best
  )
  select * from ranked where position <= p_limit or is_me order by position;
$$;

grant execute on function public.submit_result to anon;
grant execute on function public.get_leaderboard to anon;
```

> **Risco aceito:** a pontuação é calculada no cliente, então uma pessoa com conhecimento técnico poderia forjar um envio. Para um treinamento interno esse risco é aceitável na v1. Mitigação futura (v2): mover o gabarito para o banco e calcular a pontuação dentro de `submit_result` a partir das respostas enviadas.

### 7.6 Variáveis de ambiente (`.env.example`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ALLOWED_EMAIL_DOMAINS=empresa.com,empresa.com.br
VITE_APP_VERSION=1.0.0
```
Configurar as mesmas variáveis no projeto da Vercel (Production e Preview).

### 7.7 Deploy (Vercel)
- Framework preset: Vite · Build: `npm run build` · Output: `dist`.
- `vercel.json` com rewrite de SPA: `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`.
- Migração do Supabase aplicada via `supabase db push` (documentar no README).

---

## 8. UI / UX

- **Cores por nível** (badge e barra de progresso): Negócio = verde, Básico = azul, Intermediário = laranja, Avançado = roxo. Usar sempre cor + rótulo textual.
- Botões V/F grandes (altura mínima de 56px, área de toque ≥ 44px), lado a lado no desktop e empilhados no mobile se necessário.
- Feedback com animação curta (≤ 200ms) respeitando `prefers-reduced-motion`.
- Visual limpo, tipografia legível (16px+), cards com cantos arredondados.
- Estados de carregamento e erro no ranking (skeleton + mensagem com botão "Tentar novamente").

---

## 9. Banco inicial de perguntas (60)

> ⚠️ **Revisão obrigatória:** o conteúdo foi gerado com base na documentação oficial do Claude Code, mas a ferramenta evolui rapidamente. O time deve revisar as afirmações e **validar cada link** antes do lançamento. Base da documentação: `https://code.claude.com/docs/en/` (se algum caminho tiver mudado, buscar a página equivalente na doc oficial).
>
> Converter esta tabela para `src/data/questions.json` seguindo o schema da seção 7.3.

### 9.1 Nível Negócio (1 pt)

| ID | Afirmação | Resp. | Explicação | Doc |
|----|-----------|-------|------------|-----|
| neg-01 | O Claude Code é uma ferramenta de programação agêntica da Anthropic, capaz de ler o código, editar arquivos e executar comandos. | V | É um assistente agêntico: entende a base de código e age nela (edita, roda comandos, cria commits) sob supervisão de quem o usa. | /overview |
| neg-02 | O Claude Code funciona exclusivamente no navegador. | F | Ele roda no terminal, em IDEs (VS Code, JetBrains), no app desktop e também na web. | /overview |
| neg-03 | O Claude Code é um produto da OpenAI. | F | O Claude Code é desenvolvido pela Anthropic e usa os modelos Claude. | /overview |
| neg-04 | Existem integrações do Claude Code para VS Code e IDEs JetBrains. | V | Há extensão para VS Code (e forks) e plugin para JetBrains. | /vs-code |
| neg-05 | Para usar o Claude Code é preciso ter um plano Claude (Pro, Max, Team ou Enterprise) ou uma conta na Claude Console/API. | V | O acesso exige assinatura de um plano compatível ou faturamento via API/Console (ou um provedor de nuvem). | /setup |
| neg-06 | Pessoas não desenvolvedoras podem usar o Claude Code para entender um código existente fazendo perguntas em linguagem natural. | V | Perguntas como "o que este projeto faz?" ou "onde fica a regra de desconto?" são casos de uso comuns. | /common-workflows |
| neg-07 | O Claude Code só entende comandos escritos em inglês. | F | Você pode conversar em português e em vários outros idiomas. | /overview |
| neg-08 | Empresas podem usar o Claude Code por meio do Amazon Bedrock ou do Google Vertex AI. | V | Ele suporta esses provedores de nuvem como alternativa à API direta da Anthropic. | /amazon-bedrock |
| neg-09 | Por padrão, o Claude Code executa qualquer ação sem pedir permissão. | F | Por padrão, ele pede aprovação antes de editar arquivos ou rodar comandos que não foram previamente autorizados. | /iam |
| neg-10 | O Claude Code consegue criar commits e abrir pull requests. | V | Ele trabalha com git e com o GitHub CLI para fazer commits, criar branches e abrir PRs. | /common-workflows |
| neg-11 | O Claude Code dispensa completamente a revisão humana de código. | F | Ele acelera o trabalho, mas a responsabilidade e a revisão continuam com as pessoas do time. | /security |
| neg-12 | Além do terminal, o Claude Code está disponível como app desktop e na web. | V | Há versões desktop e web (claude.ai/code), além da CLI e das IDEs. | /desktop |
| neg-13 | O Claude Code só funciona em projetos Python. | F | Ele é agnóstico de linguagem e trabalha com praticamente qualquer stack. | /overview |
| neg-14 | Nos planos comerciais (Team, Enterprise e API), a Anthropic não usa por padrão o código e os prompts para treinar modelos. | V | Os termos comerciais não permitem treinamento com os dados dos clientes por padrão. | /data-usage |
| neg-15 | O Claude Code pode ser integrado ao GitHub Actions para automatizar tarefas em PRs e issues. | V | Existe uma integração oficial com GitHub Actions (por exemplo, mencionando @claude). | /github-actions |

### 9.2 Nível Básico (2 pts)

| ID | Afirmação | Resp. | Explicação | Doc |
|----|-----------|-------|------------|-----|
| bas-01 | O comando `claude`, executado no terminal, inicia uma sessão interativa. | V | Basta rodar `claude` na pasta do projeto. | /quickstart |
| bas-02 | O arquivo `CLAUDE.md` guarda instruções e contexto do projeto e é carregado automaticamente nas sessões. | V | É a "memória" do projeto: convenções, comandos de build, estilo etc. | /memory |
| bas-03 | O comando `/init` gera um `CLAUDE.md` inicial analisando o projeto. | V | O `/init` examina a base de código e cria um rascunho do CLAUDE.md. | /memory |
| bas-04 | O comando `/clear` limpa o histórico da conversa atual. | V | Útil para começar uma tarefa nova sem o contexto anterior. | /slash-commands |
| bas-05 | O comando `/compact` apaga os arquivos temporários do projeto. | F | O `/compact` resume a conversa para liberar espaço no contexto; ele não mexe em arquivos. | /slash-commands |
| bas-06 | `claude -p "pergunta"` executa uma consulta em modo não interativo, imprime a resposta e encerra. | V | É o modo "print"/headless, útil em scripts. | /cli-reference |
| bas-07 | Pressionar `Esc` interrompe o Claude enquanto ele está trabalhando. | V | O `Esc` interrompe a ação atual sem perder a conversa. | /interactive-mode |
| bas-08 | No prompt, `@` permite referenciar arquivos específicos. | V | Ex.: `@src/app.ts` inclui o arquivo como contexto. | /common-workflows |
| bas-09 | Começar a mensagem com `!` executa um comando de shell diretamente, sem passar pelo modelo. | V | É o "bash mode"; o comando e sua saída entram no contexto da conversa. | /interactive-mode |
| bas-10 | O comando `/help` lista os comandos disponíveis. | V | Mostra a ajuda e os slash commands. | /slash-commands |
| bas-11 | `claude --continue` (ou `-c`) retoma a conversa mais recente do diretório. | V | Continua de onde você parou. | /cli-reference |
| bas-12 | O Claude Code consegue ler arquivos, mas não editá-los. | F | Ele edita e cria arquivos, normalmente pedindo sua aprovação. | /overview |
| bas-13 | `Shift+Tab` alterna entre os modos de permissão, incluindo o Plan Mode. | V | O atalho percorre os modos (padrão, aceitar edições, plan mode). | /interactive-mode |
| bas-14 | O comando `/model` permite trocar o modelo usado na sessão. | V | Permite escolher entre os modelos disponíveis. | /slash-commands |
| bas-15 | Instalar o Claude Code exige obrigatoriamente o Docker. | F | A instalação é feita pelo instalador nativo ou via npm; Docker não é requisito. | /setup |

### 9.3 Nível Intermediário (3 pts)

| ID | Afirmação | Resp. | Explicação | Doc |
|----|-----------|-------|------------|-----|
| int-01 | No Plan Mode, o Claude analisa e propõe um plano sem modificar arquivos. | V | É um modo somente leitura para explorar e planejar antes de executar. | /common-workflows |
| int-02 | Hooks são comandos configurados pela pessoa usuária que rodam em eventos do ciclo de vida, como `PreToolUse` e `PostToolUse`. | V | Eles permitem automatizar ações (formatar, validar, notificar) de forma determinística. | /hooks-guide |
| int-03 | As configurações ficam em arquivos `settings.json`, tanto no nível do usuário (`~/.claude/`) quanto no do projeto (`.claude/`). | V | Existe hierarquia: usuário, projeto, local e gerenciada (enterprise). | /settings |
| int-04 | O `.claude/settings.local.json` serve para configurações pessoais do projeto que não devem ir para o controle de versão. | V | Ele é ignorado pelo git e serve para preferências individuais. | /settings |
| int-05 | Dá para criar slash commands personalizados com arquivos Markdown no projeto. | V | Arquivos `.md` (em `.claude/commands/` ou como skills) viram comandos invocados com `/nome`. | /slash-commands |
| int-06 | MCP (Model Context Protocol) permite conectar o Claude Code a ferramentas e fontes de dados externas. | V | Servidores MCP expõem ferramentas, como banco de dados, Jira e navegador. | /mcp |
| int-07 | O comando `claude mcp add` adiciona um servidor MCP. | V | É a CLI para gerenciar servidores MCP. | /mcp |
| int-08 | Subagents personalizados podem ser definidos em arquivos Markdown dentro de `.claude/agents/`. | V | Cada arquivo define nome, descrição, ferramentas e prompt do subagent. | /sub-agents |
| int-09 | Subagents sempre compartilham a mesma janela de contexto da conversa principal. | F | Cada subagent tem seu próprio contexto, o que ajuda a preservar o contexto principal. | /sub-agents |
| int-10 | Regras de permissão podem liberar comandos específicos, como `Bash(npm run test:*)`. | V | As regras `allow`/`ask`/`deny` aceitam padrões por ferramenta e argumento. | /iam |
| int-11 | O `CLAUDE.md` só funciona quando está na raiz do projeto. | F | Também existe o `~/.claude/CLAUDE.md` (global do usuário), e há arquivos em subdiretórios. | /memory |
| int-12 | `claude --resume` permite escolher uma conversa anterior para retomar. | V | Ele abre um seletor de sessões passadas. | /cli-reference |
| int-13 | Skills são pastas com um arquivo `SKILL.md` que o Claude pode carregar quando forem relevantes para a tarefa. | V | Elas empacotam instruções e recursos reutilizáveis. | /skills |
| int-14 | O Claude Code consegue analisar imagens, como screenshots coladas no prompt. | V | Você pode colar ou arrastar imagens para dar contexto visual. | /common-workflows |
| int-15 | O comando `/mcp` mostra o status dos servidores MCP configurados. | V | Também permite autenticar servidores que usam OAuth. | /mcp |

### 9.4 Nível Avançado (4 pts)

| ID | Afirmação | Resp. | Explicação | Doc |
|----|-----------|-------|------------|-----|
| ava-01 | Um hook `PreToolUse` pode bloquear a execução de uma ferramenta (por exemplo, saindo com código 2). | V | O exit code 2 bloqueia a chamada e devolve o stderr ao Claude como feedback. | /hooks |
| ava-02 | Hooks são apenas sugestões no prompt, e o modelo pode decidir ignorá-los. | F | Hooks são executados pelo harness de forma determinística, fora da decisão do modelo. | /hooks-guide |
| ava-03 | O Claude Agent SDK permite construir agentes próprios usando a mesma base do Claude Code. | V | O SDK expõe o loop agêntico, as ferramentas e o gerenciamento de contexto. | /sdk |
| ava-04 | No modo `-p`, a flag `--output-format` aceita `json` e `stream-json` para integração com outros programas. | V | Facilita automações e pipelines. | /headless |
| ava-05 | A flag `--dangerously-skip-permissions` pula todos os pedidos de permissão e só é recomendada em ambientes isolados. | V | Use apenas em containers ou sandboxes sem acesso a dados sensíveis. | /iam |
| ava-06 | Git worktrees permitem rodar várias sessões do Claude Code em paralelo, cada uma isolada em seu próprio diretório. | V | Cada worktree tem seu próprio checkout, o que evita conflitos entre sessões. | /common-workflows |
| ava-07 | Servidores MCP podem ter escopo local, de projeto (arquivo `.mcp.json`) ou de usuário. | V | O escopo de projeto permite compartilhar a configuração com o time pelo git. | /mcp |
| ava-08 | Configurações gerenciadas (managed settings) definidas pela empresa podem ser sobrescritas pelo `settings.json` do usuário. | F | As managed settings têm a maior precedência e não podem ser sobrescritas. | /settings |
| ava-09 | Quando uma ação casa ao mesmo tempo com uma regra `allow` e uma regra `deny`, a regra `deny` prevalece. | V | As regras deny têm precedência sobre ask e allow. | /iam |
| ava-10 | O Claude Code pode se autenticar usando a variável de ambiente `ANTHROPIC_API_KEY`. | V | É uma das formas de autenticação via API. | /settings |
| ava-11 | Plugins podem agrupar slash commands, subagents, skills, hooks e servidores MCP e ser distribuídos por marketplaces. | V | Plugins facilitam o compartilhamento de extensões entre times. | /plugins |
| ava-12 | Quando o contexto se aproxima do limite, o Claude Code pode compactar a conversa automaticamente (auto-compact). | V | Ele resume o histórico para continuar trabalhando. | /costs |
| ava-13 | Um hook `SessionStart` pode adicionar contexto no início de uma sessão. | V | A saída do hook pode ser injetada como contexto adicional. | /hooks |
| ava-14 | Subagents podem criar outros subagents recursivamente, sem limite. | F | Subagents não podem iniciar outros subagents, o que evita aninhamento infinito. | /sub-agents |
| ava-15 | No modo headless, `--allowedTools` define quais ferramentas podem ser usadas sem pedir permissão. | V | Ex.: `--allowedTools "Read,Bash(git *)"`. | /cli-reference |

> Na coluna **Doc**, o caminho é relativo a `https://code.claude.com/docs/en`. Exemplo: `/hooks` → `https://code.claude.com/docs/en/hooks`.

---

## 10. Critérios de aceite

- [ ] É possível jogar uma partida completa de 20 perguntas (5 por nível, na ordem Negócio → Avançado), e cada partida sorteia perguntas diferentes.
- [ ] Cada resposta mostra certo/errado, a explicação e um link funcional para a doc oficial (abre em nova aba).
- [ ] A tela de transição aparece entre os níveis.
- [ ] A pontuação segue os pesos 1/2/3/4 (máx. 50) e o tempo total é registrado.
- [ ] E-mails fora de `VITE_ALLOWED_EMAIL_DOMAINS` são rejeitados no front e no banco.
- [ ] O resultado é salvo no Supabase, e o ranking mostra a melhor partida por pessoa, ordenada por pontuação ↓ e tempo ↑, sem exibir e-mails.
- [ ] Se o envio falhar, o resultado não se perde e pode ser reenviado.
- [ ] Recarregar a página no meio da partida retoma o estado.
- [ ] O quiz pode ser jogado inteiro pelo teclado; Lighthouse Accessibility ≥ 90.
- [ ] O layout funciona em 360px de largura e no desktop, nos temas claro e escuro.
- [ ] Os testes unitários cobrem sorteio, pontuação, reducer, validação de e-mail e o schema do `questions.json`; um teste E2E cobre o fluxo completo (com o Supabase mockado).
- [ ] O deploy na Vercel funciona, e o README documenta setup local, variáveis de ambiente e migração do Supabase.

---

## 11. Plano de implementação sugerido

1. **Setup** — Vite + React + TS + Tailwind + ESLint/Prettier + Vitest; estrutura de pastas; `.env.example`.
2. **Dados** — converter a seção 9 em `questions.json` + schema Zod + teste de validação.
3. **Lógica do quiz** — `draw.ts`, `scoring.ts`, `quizReducer.ts` com testes unitários.
4. **UI do quiz** — telas inicial, identificação, pergunta, feedback, transição e resultado.
5. **Supabase** — migração SQL, `lib/supabase.ts`, `submit_result`, `get_leaderboard`, tela de ranking, fila de reenvio.
6. **Polimento** — acessibilidade, tema escuro, responsividade, animações, persistência em `sessionStorage`/`localStorage`.
7. **Qualidade** — E2E com Playwright e Lighthouse.
8. **Deploy** — Vercel + README.

---

## 12. Evoluções futuras (backlog)

- Painel admin para cadastrar e editar perguntas no Supabase.
- Cálculo da pontuação no servidor (antifraude).
- Ranking por área/time e filtros por período (mensal).
- Modo "praticar nível" avulso, sem ranking.
- Exportação CSV dos resultados para a pessoa organizadora.
- SSO corporativo (Microsoft/Google).
- Certificado em PDF para quem atingir uma pontuação mínima.
- Explicações enriquecidas com exemplos de comandos.

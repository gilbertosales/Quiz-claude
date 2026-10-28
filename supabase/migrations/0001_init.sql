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

-- Reforço: nenhum acesso direto às tabelas pelos papéis da API; só via funções acima.
revoke all on table public.quiz_results, public.allowed_domains from anon, authenticated;
revoke execute on function public.submit_result from public;
revoke execute on function public.get_leaderboard from public;
grant execute on function public.submit_result to anon, authenticated;
grant execute on function public.get_leaderboard to anon, authenticated;

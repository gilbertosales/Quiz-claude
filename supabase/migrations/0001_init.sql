-- Quiz Claude Code: resultados e ranking.
-- O front usa só a chave anon: as tabelas têm RLS sem policies e todo acesso passa
-- pelas funções security definer abaixo.

create table public.quiz_results (
  id               uuid primary key default gen_random_uuid(),
  -- Gerado no navegador por partida; torna o envio idempotente (reenvios não duplicam).
  client_game_id   uuid not null unique,
  name             text not null check (char_length(name) between 2 and 60),
  email            text not null check (email = lower(email) and char_length(email) <= 254),
  score            int  not null check (score between 0 and 50),
  correct_count    int  not null check (correct_count between 0 and 20),
  correct_by_level jsonb not null check (
    jsonb_typeof(correct_by_level) = 'object' and pg_column_size(correct_by_level) < 256
  ),                                         -- {"negocio":4,"basico":5,...}
  duration_ms      int  not null check (duration_ms between 10000 and 7200000),
  question_ids     text[] not null check (
    cardinality(question_ids) = 20 and pg_column_size(question_ids) < 1024
  ),
  app_version      text check (char_length(app_version) <= 32),
  created_at       timestamptz not null default now()
);
create index on public.quiz_results (email, created_at desc);
create index on public.quiz_results (email, score desc, duration_ms asc, created_at asc);

alter table public.quiz_results enable row level security;

-- Domínios permitidos (espelha VITE_ALLOWED_EMAIL_DOMAINS). Vazia = qualquer domínio.
create table public.allowed_domains (domain text primary key);
alter table public.allowed_domains enable row level security;

revoke all on table public.quiz_results, public.allowed_domains from anon, authenticated;

-- Envio de resultado. Devolve o id da partida, que o navegador guarda para se
-- reconhecer no ranking (get_leaderboard.p_result_ids).
create or replace function public.submit_result(
  p_client_game_id uuid, p_name text, p_email text, p_score int, p_correct_count int,
  p_correct_by_level jsonb, p_duration_ms int, p_question_ids text[], p_app_version text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id     uuid;
  v_email  text := lower(trim(p_email));
  v_domain text := split_part(lower(trim(p_email)), '@', 2);
  v_neg int; v_bas int; v_int int; v_ava int;
begin
  -- Serializa envios do mesmo e-mail: o rate limit abaixo deixa de ter corrida.
  perform pg_advisory_xact_lock(hashtext(v_email));

  -- Idempotência: reenvio da mesma partida devolve o id já gravado.
  select r.id into v_id from public.quiz_results r where r.client_game_id = p_client_game_id;
  if found then
    return v_id;
  end if;

  if exists (select 1 from public.allowed_domains) and
     not exists (select 1 from public.allowed_domains d where d.domain = v_domain) then
    raise exception 'email domain not allowed';
  end if;

  -- correct_by_level precisa ter exatamente os 4 níveis, cada um entre 0 e 5,
  -- e ser coerente com correct_count e score (pesos 1/2/3/4).
  if (select count(*) from jsonb_object_keys(p_correct_by_level)) <> 4 or
     not (p_correct_by_level ?& array['negocio', 'basico', 'intermediario', 'avancado']) then
    raise exception 'invalid result' using errcode = '22023';
  end if;
  v_neg := (p_correct_by_level ->> 'negocio')::int;
  v_bas := (p_correct_by_level ->> 'basico')::int;
  v_int := (p_correct_by_level ->> 'intermediario')::int;
  v_ava := (p_correct_by_level ->> 'avancado')::int;
  if least(v_neg, v_bas, v_int, v_ava) < 0 or greatest(v_neg, v_bas, v_int, v_ava) > 5 or
     v_neg + v_bas + v_int + v_ava <> p_correct_count or
     v_neg + 2 * v_bas + 3 * v_int + 4 * v_ava <> p_score then
    raise exception 'invalid result' using errcode = '22023';
  end if;

  -- Rate limit simples: máx. 1 envio por e-mail a cada 60s.
  if exists (select 1 from public.quiz_results r
             where r.email = v_email and r.created_at > now() - interval '60 seconds') then
    raise exception 'too many submissions';
  end if;

  insert into public.quiz_results(client_game_id, name, email, score, correct_count,
                                  correct_by_level, duration_ms, question_ids, app_version)
  values (p_client_game_id, trim(p_name), v_email, p_score, p_correct_count,
          p_correct_by_level, p_duration_ms, p_question_ids, p_app_version)
  returning id into v_id;
  return v_id;
end $$;

-- Ranking: melhor partida por e-mail, sem expor e-mail. is_me só marca a linha cuja
-- própria partida está em p_result_ids (ids devolvidos a este navegador pelo
-- submit_result). Assim não dá para descobrir dados de alguém a partir do e-mail.
create or replace function public.get_leaderboard(
  p_limit int default 50, p_result_ids uuid[] default '{}'
)
-- "position" precisa de aspas: sem elas, é erro de sintaxe em RETURNS TABLE.
returns table("position" bigint, name text, score int, correct_count int,
              duration_ms int, created_at timestamptz, is_me boolean)
language sql stable security definer set search_path = '' as $$
  with best as (
    select distinct on (r.email) r.id, r.name, r.score, r.correct_count, r.duration_ms, r.created_at
    from public.quiz_results r
    order by r.email, r.score desc, r.duration_ms asc, r.created_at asc
  ), ranked as (
    select row_number() over (order by b.score desc, b.duration_ms asc, b.created_at asc) as pos,
           b.name, b.score, b.correct_count, b.duration_ms, b.created_at,
           coalesce(b.id = any((coalesce(p_result_ids, '{}'::uuid[]))[1:50]), false) as is_me
    from best b
  )
  select k.pos, k.name, k.score, k.correct_count, k.duration_ms, k.created_at, k.is_me
  from ranked k
  where k.pos <= least(greatest(coalesce(p_limit, 50), 1), 100) or k.is_me
  order by k.pos;
$$;

revoke execute on function public.submit_result from public;
revoke execute on function public.get_leaderboard from public;
grant execute on function public.submit_result to anon, authenticated;
grant execute on function public.get_leaderboard to anon, authenticated;

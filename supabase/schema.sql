-- Kovo cloud storage. Run only in the owner's Supabase project.
-- Never expose the service-role key in the browser.
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;
revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;
create policy "Read own data" on public.user_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own data" on public.user_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own data" on public.user_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own data" on public.user_data for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.save_user_data(p_payload jsonb, p_expected_revision bigint)
returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare v_user uuid := (select auth.uid()); v_revision bigint;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_expected_revision < 0 then raise exception 'Invalid revision'; end if;
  if jsonb_typeof(p_payload) <> 'object' then raise exception 'Invalid payload'; end if;
  if p_expected_revision = 0 then
    insert into public.user_data(user_id,payload,revision) values(v_user,p_payload,1)
    on conflict (user_id) do nothing returning revision into v_revision;
  else
    update public.user_data set payload=p_payload,revision=revision+1,updated_at=now()
    where user_id=v_user and revision=p_expected_revision returning revision into v_revision;
  end if;
  if v_revision is null then return jsonb_build_object('saved',false); end if;
  return jsonb_build_object('saved',true,'revision',v_revision);
end;
$$;
revoke all on function public.save_user_data(jsonb,bigint) from public,anon;
grant execute on function public.save_user_data(jsonb,bigint) to authenticated;

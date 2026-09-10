alter table public.kovo_sync_accounts add column revision bigint not null default 1;
create function public.kovo_sync_version() returns bigint language plpgsql security invoker set search_path='' as $$
begin
 perform public.kovo_initialize();
 return (select revision from public.kovo_sync_accounts where user_id=auth.uid());
end;
$$;
create function public.kovo_bump_sync_version() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 update public.kovo_sync_accounts set revision=revision+1 where user_id=new.user_id;
 return new;
end;
$$;
create trigger kovo_operation_version after insert on public.kovo_operations for each row execute function public.kovo_bump_sync_version();
revoke all on function public.kovo_sync_version(), public.kovo_bump_sync_version() from public,anon;
grant execute on function public.kovo_sync_version() to authenticated;

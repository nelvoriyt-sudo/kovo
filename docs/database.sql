-- Additive migration. Existing snapshots remain intact for recovery.
create table public.kovo_records (
 user_id uuid not null references auth.users(id) on delete cascade,
 collection text not null check (length(collection) between 1 and 100),
 id text not null check (length(id) between 1 and 1000),
 value jsonb,
 revision bigint not null default 1,
 primary key(user_id,collection,id)
);
create table public.kovo_operations (
 user_id uuid not null references auth.users(id) on delete cascade,
 id uuid not null,
 created_at timestamptz not null default now(),
 primary key(user_id,id)
);
create table public.kovo_sync_accounts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 migrated_at timestamptz not null default now()
);
alter table public.kovo_records enable row level security;
alter table public.kovo_operations enable row level security;
alter table public.kovo_sync_accounts enable row level security;
create policy own_records on public.kovo_records to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_operations on public.kovo_operations to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy own_sync_account on public.kovo_sync_accounts to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
revoke all on public.kovo_records, public.kovo_operations, public.kovo_sync_accounts from anon;
grant select,insert,update,delete on public.kovo_records, public.kovo_operations, public.kovo_sync_accounts to authenticated;

create function public.kovo_initialize() returns void language plpgsql security invoker set search_path='' as $$
declare u uuid := auth.uid(); snapshot jsonb; entry record; item record; setting record; key text;
begin
 if u is null then raise exception 'Authentication required'; end if;
 insert into public.kovo_user_data(user_id,data,revision) values(u,'{}',0) on conflict do nothing;
 select data into snapshot from public.kovo_user_data where user_id=u for update;
 if exists(select 1 from public.kovo_sync_accounts where user_id=u) then return; end if;
 for entry in select * from jsonb_each(snapshot) loop
  if entry.key in ('accounts','investments','transactions','budgets','bills','goals','history','categories','tipEntries','coachHistory') and jsonb_typeof(entry.value)='array' then
   for item in select value, ordinality from jsonb_array_elements(entry.value) with ordinality loop
    key := case when entry.key='categories' then item.value#>>'{}' when entry.key='budgets' then item.value->>'category' when entry.key='history' then item.value->>'date' else coalesce(item.value->>'id','legacy-'||(item.ordinality-1)::text) end;
    insert into public.kovo_records(user_id,collection,id,value) values(u,entry.key,key,item.value) on conflict do nothing;
   end loop;
  elsif entry.key='settings' and jsonb_typeof(entry.value)='object' then
   for setting in select * from jsonb_each(entry.value) loop
    insert into public.kovo_records(user_id,collection,id,value) values(u,'settings',setting.key,setting.value) on conflict do nothing;
   end loop;
  else
   insert into public.kovo_records(user_id,collection,id,value) values(u,'_meta',entry.key,entry.value) on conflict do nothing;
  end if;
 end loop;
 insert into public.kovo_sync_accounts(user_id) values(u);
end;
$$;

create function public.kovo_read_records() returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 perform public.kovo_initialize();
 return coalesce((select jsonb_agg(jsonb_build_object('collection',collection,'id',id,'value',value,'revision',revision)) from public.kovo_records where user_id=auth.uid()),'[]'::jsonb);
end;
$$;

create function public.kovo_apply_operation(p_id uuid,p_changes jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare u uuid := auth.uid(); change jsonb; actual bigint;
begin
 perform public.kovo_initialize();
 -- The per-account lock serializes batches, including creation of absent records.
 perform 1 from public.kovo_sync_accounts where user_id=u for update;
 if exists(select 1 from public.kovo_operations where user_id=u and id=p_id) then return jsonb_build_object('saved',true); end if;
 if jsonb_typeof(p_changes) is distinct from 'array' or jsonb_array_length(p_changes)>5000 or octet_length(p_changes::text)>5000000 then raise exception 'Invalid or oversized change batch'; end if;
 if (select count(*) from jsonb_array_elements(p_changes)) <> (select count(distinct (x->>'collection',x->>'id')) from jsonb_array_elements(p_changes) x) then raise exception 'Duplicate record in batch'; end if;
 for change in select * from jsonb_array_elements(p_changes) loop
  select revision into actual from public.kovo_records where user_id=u and collection=change->>'collection' and id=change->>'id';
  if coalesce(actual,0) <> (change->>'revision')::bigint or not (change ? 'revision') then return jsonb_build_object('saved',false); end if;
 end loop;
 for change in select * from jsonb_array_elements(p_changes) loop
  insert into public.kovo_records(user_id,collection,id,value,revision) values(u,change->>'collection',change->>'id',nullif(change->'value','null'::jsonb),1)
  on conflict(user_id,collection,id) do update set value=excluded.value,revision=public.kovo_records.revision+1;
 end loop;
 insert into public.kovo_operations(user_id,id) values(u,p_id);
 return jsonb_build_object('saved',true);
end;
$$;

-- Old clients can still read their preserved snapshot, but cannot overwrite migrated records.
create or replace function public.kovo_save(p_data jsonb,p_revision bigint) returns table(saved boolean,current_revision bigint)
language plpgsql security invoker set search_path='' as $$
declare v_revision bigint; u uuid := auth.uid();
begin
 if u is null then raise exception 'Authentication required'; end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Invalid Kovo data'; end if;
 insert into public.kovo_user_data(user_id,data,revision) values(u,'{}',0) on conflict do nothing;
 perform 1 from public.kovo_user_data where user_id=u for update;
 if exists(select 1 from public.kovo_sync_accounts where user_id=u) then raise exception 'Kovo was updated. Reload this app; your local changes are preserved for import.'; end if;
 update public.kovo_user_data set data=p_data,revision=revision+1,updated_at=now() where user_id=u and revision=p_revision returning revision into v_revision;
 return query select v_revision is not null,coalesce(v_revision,(select revision from public.kovo_user_data where user_id=u));
end;
$$;
revoke all on function public.kovo_initialize(),public.kovo_read_records(),public.kovo_apply_operation(uuid,jsonb) from public,anon;
grant execute on function public.kovo_initialize(),public.kovo_read_records(),public.kovo_apply_operation(uuid,jsonb) to authenticated;

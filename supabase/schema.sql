create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  first_name text not null default '',
  middle_name text not null default '',
  last_name text not null default '',
  username text not null default '',
  phone text not null default '',
  country text not null default '',
  city text not null default '',
  account_type text not null default '',
  currency text not null default 'USD',
  account_purpose text not null default 'Personal banking',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (first_name, middle_name, last_name, username, phone, country, city, account_type, currency, account_purpose, updated_at)
  on table public.profiles to authenticated;

drop policy if exists "Members can read own profile" on public.profiles;
create policy "Members can read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Members can update own profile" on public.profiles;
create policy "Members can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create or replace function public.handle_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id, email, first_name, middle_name, last_name, username, phone, country, city,
    account_type, currency, account_purpose
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'middle_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'username', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'country', ''),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    coalesce(new.raw_user_meta_data ->> 'account_type', ''),
    coalesce(new.raw_user_meta_data ->> 'currency', 'USD'),
    coalesce(new.raw_user_meta_data ->> 'account_purpose', 'Personal banking')
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    middle_name = excluded.middle_name,
    last_name = excluded.last_name,
    username = excluded.username,
    phone = excluded.phone,
    country = excluded.country,
    city = excluded.city,
    account_type = excluded.account_type,
    currency = excluded.currency,
    account_purpose = excluded.account_purpose,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_created on auth.users;
create trigger on_auth_user_profile_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_user_profile();

create table if not exists public.case_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  request_type text not null check (request_type in ('claim', 'verification', 'loan', 'withdrawal', 'support')),
  subject text not null check (char_length(subject) between 1 and 200),
  details text not null check (char_length(details) between 1 and 5000),
  requested_amount numeric(14, 2),
  currency text,
  loan_term_months integer,
  transaction_reference text check (transaction_reference is null or char_length(transaction_reference) <= 120),
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'needs_information', 'approved', 'declined', 'resolved')),
  staff_message text check (staff_message is null or char_length(staff_message) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint case_requests_amount_positive check (requested_amount is null or requested_amount > 0),
  constraint case_requests_amount_currency check (requested_amount is null or currency is not null),
  constraint case_requests_loan_term check (loan_term_months is null or loan_term_months between 1 and 600)
);

create index if not exists case_requests_user_created_idx
  on public.case_requests (user_id, created_at desc);
create index if not exists case_requests_type_status_created_idx
  on public.case_requests (request_type, status, created_at desc);
create index if not exists case_requests_closed_at_idx
  on public.case_requests (closed_at)
  where closed_at is not null;

alter table public.case_requests enable row level security;
revoke all on table public.case_requests from anon, authenticated;
grant select on table public.case_requests to authenticated;
grant insert (user_id, request_type, subject, details, requested_amount, currency, loan_term_months, transaction_reference)
  on table public.case_requests to authenticated;
grant update (status, staff_message) on table public.case_requests to authenticated;

drop policy if exists "Members can read own case requests" on public.case_requests;
create policy "Members can read own case requests"
  on public.case_requests for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read all case requests" on public.case_requests;
create policy "Admins can read all case requests"
  on public.case_requests for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Members can submit own case requests" on public.case_requests;
create policy "Members can submit own case requests"
  on public.case_requests for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Admins can update case requests" on public.case_requests;
create policy "Admins can update case requests"
  on public.case_requests for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create or replace function public.update_case_request_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  if new.status in ('declined', 'resolved') then
    new.closed_at := coalesce(old.closed_at, pg_catalog.now());
  else
    new.closed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists set_case_request_timestamps on public.case_requests;
create trigger set_case_request_timestamps
  before update on public.case_requests
  for each row execute function public.update_case_request_timestamps();

create table if not exists public.case_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.case_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  file_size bigint not null check (file_size between 1 and 10485760),
  created_at timestamptz not null default now()
);

create index if not exists case_documents_request_idx
  on public.case_documents (request_id, created_at desc);
create index if not exists case_documents_user_idx
  on public.case_documents (user_id, created_at desc);

alter table public.case_documents enable row level security;
revoke all on table public.case_documents from anon, authenticated;
grant select on table public.case_documents to authenticated;
grant insert (request_id, user_id, storage_path, file_name, mime_type, file_size)
  on table public.case_documents to authenticated;

drop policy if exists "Members can read own case documents" on public.case_documents;
create policy "Members can read own case documents"
  on public.case_documents for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read all case documents" on public.case_documents;
create policy "Admins can read all case documents"
  on public.case_documents for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Members can add documents to own requests" on public.case_documents;
create policy "Members can add documents to own requests"
  on public.case_documents for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.case_requests r
      where r.id = request_id and r.user_id = (select auth.uid())
        and r.status not in ('declined', 'resolved')
    )
    and (storage.foldername(storage_path))[1] = (select auth.uid())::text
    and (storage.foldername(storage_path))[2] = request_id::text
    and exists (
      select 1 from storage.objects o
      where o.bucket_id = 'case-documents' and o.name = storage_path
    )
  );

create or replace function public.enforce_case_document_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  document_count integer;
begin
  perform 1
  from public.case_requests r
  where r.id = new.request_id
  for update;

  select count(*) into document_count
  from public.case_documents d
  where d.request_id = new.request_id;

  if document_count >= 5 then
    raise exception 'A request can have no more than five supporting documents.';
  end if;

  return new;
end;
$$;

drop trigger if exists limit_case_documents on public.case_documents;
create trigger limit_case_documents
  before insert on public.case_documents
  for each row execute function public.enforce_case_document_limit();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-documents',
  'case-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Members can upload own case files" on storage.objects;
create policy "Members can upload own case files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.case_requests r
      where r.id::text = (storage.foldername(name))[2]
        and r.user_id = (select auth.uid())
        and r.status not in ('declined', 'resolved')
    )
  );

drop policy if exists "Members can read own case files" on storage.objects;
create policy "Members can read own case files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.case_requests r
      where r.id::text = (storage.foldername(name))[2]
        and r.user_id = (select auth.uid())
    )
  );

drop policy if exists "Admins can read case files" on storage.objects;
create policy "Admins can read case files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'case-documents'
    and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

drop policy if exists "Members can delete unlinked own case files" on storage.objects;
create policy "Members can delete unlinked own case files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'case-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (
      select 1 from public.case_documents d where d.storage_path = name
    )
    and exists (
      select 1 from public.case_requests r
      where r.id::text = (storage.foldername(name))[2]
        and r.user_id = (select auth.uid())
        and r.status = 'submitted'
    )
  );

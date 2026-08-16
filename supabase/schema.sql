-- Streamline Video profile table.
-- Run this once in Supabase SQL Editor before using account creation.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text,
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check check (account_status in ('active', 'suspended'));
alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Approved admins can read profiles" on public.profiles;
create policy "Approved admins can read profiles" on public.profiles
  for select using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com'));

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Approved admins can update account status" on public.profiles;
create policy "Approved admins can update account status" on public.profiles
  for update using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com'))
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com'));

create or replace function public.prevent_unauthorized_status_change()
returns trigger
language plpgsql
as $$
begin
  if new.account_status is distinct from old.account_status
    and lower(coalesce(auth.jwt() ->> 'email', '')) not in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com') then
    raise exception 'Only approved administrators can change account status';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_account_status on public.profiles;
create trigger protect_profile_account_status
before update on public.profiles
for each row execute function public.prevent_unauthorized_status_change();

create or replace function public.admin_set_account_status(target_user_id uuid, next_status text)
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare updated_profile public.profiles;
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) not in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com') then
    raise exception 'Only approved administrators can suspend accounts';
  end if;
  if next_status not in ('active', 'suspended') then
    raise exception 'Invalid account status';
  end if;
  update public.profiles set account_status = next_status where id = target_user_id returning * into updated_profile;
  if updated_profile.id is null then raise exception 'Customer not found'; end if;
  return updated_profile;
end;
$$;
revoke all on function public.admin_set_account_status(uuid, text) from public;
grant execute on function public.admin_set_account_status(uuid, text) to authenticated;

-- Avatar storage setup. Run this section once in Supabase SQL Editor.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

 drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Secure permanent self-service deletion. The caller can only delete their own auth user.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth, storage
as $$
begin
  delete from storage.objects where bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

drop policy if exists "Anyone can view avatars" on storage.objects;
create policy "Anyone can view avatars" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_profile_updated_at();


-- Manual premium verification. Run this section once in Supabase SQL Editor.
create table if not exists public.premium_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default false,
  transaction_reference text,
  notes text,
  activated_at timestamptz,
  expires_at timestamptz,
  activated_by text,
  updated_at timestamptz not null default now()
);

alter table public.premium_entitlements enable row level security;

drop policy if exists "Users can read their own premium status" on public.premium_entitlements;
create policy "Users can read their own premium status" on public.premium_entitlements
  for select using (auth.uid() = user_id);

drop policy if exists "Approved admins can read premium statuses" on public.premium_entitlements;
create policy "Approved admins can read premium statuses" on public.premium_entitlements
  for select using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com'));

drop policy if exists "Approved admins can create premium statuses" on public.premium_entitlements;
create policy "Approved admins can create premium statuses" on public.premium_entitlements
  for insert with check (lower(coalesce(auth.jwt() ->> 'email', '')) in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com'));

drop policy if exists "Approved admins can update premium statuses" on public.premium_entitlements;
create policy "Approved admins can update premium statuses" on public.premium_entitlements
  for update using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com'))
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com'));

create or replace function public.set_premium_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists premium_entitlements_updated_at on public.premium_entitlements;
create trigger premium_entitlements_updated_at before update on public.premium_entitlements
for each row execute function public.set_premium_updated_at();


-- WhatsApp verification notifications. Run this section once in Supabase SQL Editor.
create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_email text not null,
  customer_name text,
  transaction_reference text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'activated', 'declined')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

alter table public.verification_requests enable row level security;

drop policy if exists "Users can create their own verification requests" on public.verification_requests;
create policy "Users can create their own verification requests" on public.verification_requests
  for insert with check (auth.uid() = user_id and lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Users can read their own verification requests" on public.verification_requests;
create policy "Users can read their own verification requests" on public.verification_requests
  for select using (auth.uid() = user_id);

drop policy if exists "Approved admins can read verification requests" on public.verification_requests;
create policy "Approved admins can read verification requests" on public.verification_requests
  for select using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com'));

drop policy if exists "Approved admins can update verification requests" on public.verification_requests;
create policy "Approved admins can update verification requests" on public.verification_requests
  for update using (lower(coalesce(auth.jwt() ->> 'email', '')) in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com'))
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) in ('mikeakex80@gmail.com', 'elijahchinecheremonah@gmail.com'));

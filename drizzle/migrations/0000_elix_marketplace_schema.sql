-- ===== Enums =====
create type public.app_role as enum ('admin', 'user');
create type public.account_type as enum ('creator', 'editor');
create type public.video_style as enum ('gaming', 'business', 'humour', 'vlog', 'lifestyle', 'education');
create type public.duration_category as enum ('under_30', 's30_60', 'm1_3', 'over_3');
create type public.offer_kind as enum ('unit', 'pack');
create type public.order_status as enum ('pending_payment','in_progress','delivered','revision_requested','completed','disputed','refunded','cancelled');

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.commission_for(_cents integer) returns integer
language sql immutable set search_path = public as $$
  select round(_cents * 0.15)::integer
$$;

-- ===== Profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  account_type public.account_type not null default 'creator',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles visible to signed-in users" on public.profiles for select to authenticated using (true);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- ===== Roles =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ===== Editor profiles =====
create table public.editor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  headline text not null default '',
  bio text not null default '' check (char_length(bio) <= 800),
  styles public.video_style[] not null default '{}',
  available boolean not null default true,
  published boolean not null default false,
  is_demo boolean not null default false,
  rating_avg numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  completed_orders integer not null default 0,
  stripe_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.editor_profiles to anon;
grant select, insert, update on public.editor_profiles to authenticated;
grant all on public.editor_profiles to service_role;
alter table public.editor_profiles enable row level security;
create policy "Anon sees published editors" on public.editor_profiles for select to anon using (published);
create policy "Members see published or own editors" on public.editor_profiles for select to authenticated
  using (published or user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users create own editor profile" on public.editor_profiles for insert to authenticated
  with check (user_id = auth.uid() and is_demo = false);
create policy "Users update own editor profile" on public.editor_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger editor_profiles_updated_at before update on public.editor_profiles for each row execute function public.set_updated_at();

create or replace function public.protect_editor_fields() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.rating_avg := 0; new.rating_count := 0; new.completed_orders := 0;
      new.is_demo := false; new.stripe_account_id := null;
    else
      new.rating_avg := old.rating_avg; new.rating_count := old.rating_count;
      new.completed_orders := old.completed_orders; new.is_demo := old.is_demo;
      new.stripe_account_id := old.stripe_account_id; new.user_id := old.user_id;
    end if;
  end if;
  return new;
end $$;
create trigger editor_profiles_protect before insert or update on public.editor_profiles
  for each row execute function public.protect_editor_fields();

create or replace function public.owns_editor(_editor_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.editor_profiles where id = _editor_id and user_id = auth.uid())
$$;
create or replace function public.editor_visible(_editor_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.editor_profiles where id = _editor_id
    and (published or (auth.uid() is not null and user_id = auth.uid())))
$$;

-- ===== Portfolio =====
create table public.portfolio_videos (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references public.editor_profiles(id) on delete cascade,
  title text not null default '',
  video_path text,
  video_url text,
  poster_url text,
  duration_category public.duration_category not null default 'under_30',
  style public.video_style not null default 'vlog',
  position integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.portfolio_videos to anon;
grant select, insert, update, delete on public.portfolio_videos to authenticated;
grant all on public.portfolio_videos to service_role;
alter table public.portfolio_videos enable row level security;
create policy "Portfolio visible with editor" on public.portfolio_videos for select to anon, authenticated using (public.editor_visible(editor_id));
create policy "Owner inserts portfolio" on public.portfolio_videos for insert to authenticated with check (public.owns_editor(editor_id));
create policy "Owner updates portfolio" on public.portfolio_videos for update to authenticated using (public.owns_editor(editor_id)) with check (public.owns_editor(editor_id));
create policy "Owner deletes portfolio" on public.portfolio_videos for delete to authenticated using (public.owns_editor(editor_id));

create or replace function public.enforce_portfolio_limit() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.portfolio_videos where editor_id = new.editor_id) >= 3 then
    raise exception 'Un portfolio contient au maximum 3 vidéos';
  end if;
  return new;
end $$;
create trigger portfolio_limit before insert on public.portfolio_videos for each row execute function public.enforce_portfolio_limit();

-- ===== Offers =====
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  editor_id uuid not null references public.editor_profiles(id) on delete cascade,
  kind public.offer_kind not null default 'unit',
  title text not null,
  description text not null default '',
  price_cents integer not null check (price_cents >= 500),
  videos_count integer not null default 1 check (videos_count between 1 and 60),
  included_revisions integer not null default 2 check (included_revisions between 0 and 10),
  extra_revision_cents integer not null default 1000 check (extra_revision_cents >= 0),
  delivery_days integer not null default 3 check (delivery_days between 1 and 60),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.offers to anon;
grant select, insert, update, delete on public.offers to authenticated;
grant all on public.offers to service_role;
alter table public.offers enable row level security;
create policy "Offers visible with editor" on public.offers for select to anon, authenticated using (public.editor_visible(editor_id));
create policy "Owner inserts offers" on public.offers for insert to authenticated with check (public.owns_editor(editor_id));
create policy "Owner updates offers" on public.offers for update to authenticated using (public.owns_editor(editor_id)) with check (public.owns_editor(editor_id));
create policy "Owner deletes offers" on public.offers for delete to authenticated using (public.owns_editor(editor_id));

-- ===== Orders =====
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null,
  editor_id uuid not null references public.editor_profiles(id),
  editor_user_id uuid,
  offer_id uuid references public.offers(id) on delete set null,
  kind public.offer_kind not null default 'unit',
  title text not null default '',
  videos_count integer not null default 1,
  amount_cents integer not null default 0,
  extras_cents integer not null default 0,
  commission_cents integer not null default 0,
  editor_amount_cents integer not null default 0,
  included_revisions integer not null default 0,
  revisions_used integer not null default 0,
  extra_revision_cents integer not null default 0,
  delivery_days integer not null default 3,
  rushes_url text not null check (char_length(rushes_url) between 8 and 1000),
  brief text not null default '' check (char_length(brief) <= 3000),
  status public.order_status not null default 'pending_payment',
  payment_mode text not null default 'test',
  payout_status text not null default 'none',
  dispute_reason text,
  paid_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_creator_idx on public.orders(creator_id);
create index orders_editor_user_idx on public.orders(editor_user_id);
grant select, insert on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Participants see orders" on public.orders for select to authenticated
  using (creator_id = auth.uid() or editor_user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Creators place orders" on public.orders for insert to authenticated with check (creator_id = auth.uid());
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

create or replace function public.prepare_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare o public.offers; e public.editor_profiles;
begin
  select * into o from public.offers where id = new.offer_id and active;
  if not found then raise exception 'Offre introuvable'; end if;
  select * into e from public.editor_profiles where id = o.editor_id;
  if e.is_demo or e.user_id is null or not e.published then
    raise exception 'Ce monteur ne prend pas de commandes pour le moment';
  end if;
  if e.user_id = new.creator_id then raise exception 'Vous ne pouvez pas commander votre propre offre'; end if;
  new.editor_id := e.id; new.editor_user_id := e.user_id;
  new.kind := o.kind; new.title := o.title; new.videos_count := o.videos_count;
  new.amount_cents := o.price_cents; new.extras_cents := 0;
  new.commission_cents := public.commission_for(o.price_cents);
  new.editor_amount_cents := o.price_cents - new.commission_cents;
  new.included_revisions := o.included_revisions; new.revisions_used := 0;
  new.extra_revision_cents := o.extra_revision_cents; new.delivery_days := o.delivery_days;
  new.status := 'pending_payment'; new.payment_mode := 'test'; new.payout_status := 'none';
  new.dispute_reason := null; new.paid_at := null; new.delivered_at := null; new.completed_at := null;
  return new;
end $$;
create trigger orders_prepare before insert on public.orders for each row execute function public.prepare_order();

create or replace function public.is_order_participant(_order_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.orders where id = _order_id and (creator_id = auth.uid() or editor_user_id = auth.uid()))
$$;

-- ===== Deliveries =====
create table public.order_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  url text,
  file_path text,
  note text not null default '',
  created_at timestamptz not null default now()
);
grant select on public.order_deliveries to authenticated;
grant all on public.order_deliveries to service_role;
alter table public.order_deliveries enable row level security;
create policy "Participants see deliveries" on public.order_deliveries for select to authenticated
  using (public.is_order_participant(order_id) or public.has_role(auth.uid(), 'admin'));

-- ===== Messages =====
create table public.order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid,
  body text not null check (char_length(body) between 1 and 4000),
  kind text not null default 'message',
  created_at timestamptz not null default now()
);
create index order_messages_order_idx on public.order_messages(order_id, created_at);
grant select, insert on public.order_messages to authenticated;
grant all on public.order_messages to service_role;
alter table public.order_messages enable row level security;
create policy "Participants read messages" on public.order_messages for select to authenticated
  using (public.is_order_participant(order_id) or public.has_role(auth.uid(), 'admin'));
create policy "Participants send messages" on public.order_messages for insert to authenticated
  with check (sender_id = auth.uid() and kind = 'message' and public.is_order_participant(order_id));
alter publication supabase_realtime add table public.order_messages;

create or replace function public.post_system_message(_order_id uuid, _body text) returns void
language sql security definer set search_path = public as $$
  insert into public.order_messages(order_id, sender_id, body, kind) values (_order_id, null, _body, 'system');
$$;
revoke execute on function public.post_system_message(uuid, text) from public, anon, authenticated;

-- ===== Reviews =====
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique references public.orders(id) on delete cascade,
  editor_id uuid not null references public.editor_profiles(id) on delete cascade,
  creator_id uuid,
  reviewer_name text not null default '',
  rating integer not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon;
grant select, insert on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Reviews are public" on public.reviews for select to anon, authenticated using (true);
create policy "Creators review completed orders" on public.reviews for insert to authenticated
  with check (creator_id = auth.uid() and order_id is not null);

create or replace function public.prepare_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if new.order_id is null then
    if auth.uid() is not null then raise exception 'Commande introuvable'; end if;
    return new;
  end if;
  select * into o from public.orders where id = new.order_id;
  if not found or o.creator_id <> auth.uid() then raise exception 'Commande introuvable'; end if;
  if o.status <> 'completed' then raise exception 'Vous pourrez noter le monteur après validation'; end if;
  new.editor_id := o.editor_id; new.creator_id := o.creator_id;
  new.reviewer_name := coalesce((select display_name from public.profiles where id = o.creator_id), 'Créateur');
  return new;
end $$;
create trigger reviews_prepare before insert on public.reviews for each row execute function public.prepare_review();

create or replace function public.refresh_editor_rating() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.editor_profiles e set
    rating_count = s.c, rating_avg = coalesce(s.a, 0)
  from (select count(*)::int c, round(avg(rating)::numeric, 2) a from public.reviews where editor_id = new.editor_id) s
  where e.id = new.editor_id and not e.is_demo;
  return new;
end $$;
create trigger reviews_refresh after insert on public.reviews for each row execute function public.refresh_editor_rating();

-- ===== Order actions =====
create or replace function public.recompute_split(_order_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.orders set
    commission_cents = public.commission_for(amount_cents + extras_cents),
    editor_amount_cents = amount_cents + extras_cents - public.commission_for(amount_cents + extras_cents)
  where id = _order_id;
$$;
revoke execute on function public.recompute_split(uuid) from public, anon, authenticated;

create or replace function public.simulate_payment(_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = _order_id for update;
  if not found or o.creator_id <> auth.uid() then raise exception 'Commande introuvable'; end if;
  if o.status <> 'pending_payment' then raise exception 'Cette commande est déjà payée'; end if;
  update public.orders set status = 'in_progress', paid_at = now(), payment_mode = 'test' where id = _order_id;
  perform public.post_system_message(_order_id, 'Paiement reçu et bloqué en séquestre. Le monteur peut commencer le montage.');
end $$;

create or replace function public.cancel_order(_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = _order_id for update;
  if not found or o.creator_id <> auth.uid() then raise exception 'Commande introuvable'; end if;
  if o.status <> 'pending_payment' then raise exception 'Seule une commande non payée peut être annulée'; end if;
  update public.orders set status = 'cancelled' where id = _order_id;
end $$;

create or replace function public.deliver_order(_order_id uuid, _url text, _note text, _file_path text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = _order_id for update;
  if not found or o.editor_user_id <> auth.uid() then raise exception 'Commande introuvable'; end if;
  if o.status not in ('in_progress', 'revision_requested') then raise exception 'Cette commande ne peut pas être livrée maintenant'; end if;
  if coalesce(trim(_url), '') = '' and coalesce(_file_path, '') = '' then raise exception 'Ajoutez un lien ou un fichier'; end if;
  insert into public.order_deliveries(order_id, url, file_path, note)
    values (_order_id, nullif(trim(_url), ''), nullif(_file_path, ''), coalesce(left(_note, 2000), ''));
  update public.orders set status = 'delivered', delivered_at = now() where id = _order_id;
  perform public.post_system_message(_order_id, 'Le monteur a livré la vidéo. Vérifiez-la puis validez ou demandez une retouche.');
end $$;

create or replace function public.request_revision(_order_id uuid, _note text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders; paid boolean;
begin
  select * into o from public.orders where id = _order_id for update;
  if not found or o.creator_id <> auth.uid() then raise exception 'Commande introuvable'; end if;
  if o.status <> 'delivered' then raise exception 'Une retouche se demande après une livraison'; end if;
  paid := o.revisions_used >= o.included_revisions;
  update public.orders set
    status = 'revision_requested',
    revisions_used = revisions_used + 1,
    extras_cents = extras_cents + case when paid then extra_revision_cents else 0 end
  where id = _order_id;
  perform public.recompute_split(_order_id);
  perform public.post_system_message(_order_id,
    case when paid then 'Retouche supplémentaire demandée (facturée ' || to_char(o.extra_revision_cents / 100.0, 'FM999990D00') || ' €) : '
         else 'Retouche demandée (' || (o.revisions_used + 1) || '/' || o.included_revisions || ' incluses) : ' end
    || coalesce(left(_note, 1500), ''));
end $$;

create or replace function public.complete_order(_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = _order_id for update;
  if not found or o.creator_id <> auth.uid() then raise exception 'Commande introuvable'; end if;
  if o.status <> 'delivered' then raise exception 'Vous pourrez valider après la livraison'; end if;
  update public.orders set status = 'completed', completed_at = now(), payout_status = 'to_release' where id = _order_id;
  update public.editor_profiles set completed_orders = completed_orders + 1 where id = o.editor_id;
  perform public.post_system_message(_order_id, 'Commande validée. Le paiement est libéré pour le monteur (85 %), Elix conserve 15 % de frais de service.');
end $$;

create or replace function public.open_dispute(_order_id uuid, _reason text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = _order_id for update;
  if not found or (o.creator_id <> auth.uid() and o.editor_user_id <> auth.uid()) then raise exception 'Commande introuvable'; end if;
  if o.status not in ('in_progress', 'delivered', 'revision_requested') then raise exception 'Un litige ne peut pas être ouvert à ce stade'; end if;
  if char_length(coalesce(trim(_reason), '')) < 10 then raise exception 'Décrivez le problème (10 caractères minimum)'; end if;
  update public.orders set status = 'disputed', dispute_reason = left(_reason, 2000) where id = _order_id;
  perform public.post_system_message(_order_id, 'Un litige a été ouvert. L''équipe Elix va examiner la commande. Motif : ' || left(_reason, 1500));
end $$;

create or replace function public.resolve_dispute(_order_id uuid, _outcome text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Accès réservé'; end if;
  select * into o from public.orders where id = _order_id for update;
  if not found then raise exception 'Commande introuvable'; end if;
  if o.status <> 'disputed' then raise exception 'Cette commande n''est pas en litige'; end if;
  if _outcome = 'release' then
    update public.orders set status = 'completed', completed_at = now(), payout_status = 'to_release' where id = _order_id;
    update public.editor_profiles set completed_orders = completed_orders + 1 where id = o.editor_id;
    perform public.post_system_message(_order_id, 'Litige résolu par Elix : le paiement est libéré pour le monteur.');
  elsif _outcome = 'refund' then
    update public.orders set status = 'refunded', payout_status = 'none' where id = _order_id;
    perform public.post_system_message(_order_id, 'Litige résolu par Elix : le créateur est remboursé.');
  else
    raise exception 'Décision inconnue';
  end if;
end $$;

create or replace function public.mark_payout_paid(_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Accès réservé'; end if;
  update public.orders set payout_status = 'paid' where id = _order_id and payout_status = 'to_release';
end $$;

revoke execute on function public.simulate_payment(uuid), public.cancel_order(uuid), public.deliver_order(uuid, text, text, text),
  public.request_revision(uuid, text), public.complete_order(uuid), public.open_dispute(uuid, text),
  public.resolve_dispute(uuid, text), public.mark_payout_paid(uuid) from public, anon;
grant execute on function public.simulate_payment(uuid), public.cancel_order(uuid), public.deliver_order(uuid, text, text, text),
  public.request_revision(uuid, text), public.complete_order(uuid), public.open_dispute(uuid, text),
  public.resolve_dispute(uuid, text), public.mark_payout_paid(uuid) to authenticated;

-- ===== Signup handling =====
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare acct public.account_type; dname text;
begin
  acct := case when new.raw_user_meta_data->>'account_type' = 'editor' then 'editor'::public.account_type else 'creator'::public.account_type end;
  dname := coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1));
  insert into public.profiles(id, display_name, avatar_url, account_type)
    values (new.id, dname, new.raw_user_meta_data->>'avatar_url', acct)
    on conflict (id) do nothing;
  if acct = 'editor' then
    insert into public.editor_profiles(user_id, display_name) values (new.id, dname) on conflict (user_id) do nothing;
  end if;
  if lower(new.email) = 'nazeyrollash@gmail.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.user_roles(user_id, role)
  select id, 'admin' from auth.users where lower(email) = 'nazeyrollash@gmail.com'
  on conflict do nothing;

-- ===== Storage policies =====
create policy "Portfolio files readable" on storage.objects for select to anon, authenticated using (bucket_id = 'portfolio');
create policy "Users upload own portfolio files" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users update own portfolio files" on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Users delete own portfolio files" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Editors upload deliveries" on storage.objects for insert to authenticated
  with check (bucket_id = 'deliveries' and exists (
    select 1 from public.orders o where o.id::text = (storage.foldername(name))[1] and o.editor_user_id = auth.uid()));
create policy "Participants read deliveries" on storage.objects for select to authenticated
  using (bucket_id = 'deliveries' and exists (
    select 1 from public.orders o where o.id::text = (storage.foldername(name))[1]
      and (o.creator_id = auth.uid() or o.editor_user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))));

-- ===== Demo data =====
insert into public.editor_profiles (id, display_name, headline, bio, styles, available, published, is_demo, rating_avg, rating_count, completed_orders) values
 ('11111111-0000-4000-8000-000000000001', 'Yanis « Kuro » Benali', 'Montage gaming nerveux, sound design et zooms rythmés', 'Ancien joueur semi-pro, je transforme tes clips Valorant, Fortnite ou FC en pépites virales : cuts au beat, sous-titres animés, memes bien placés. +40 M de vues cumulées pour mes clients.', '{gaming,humour}', true, true, true, 4.9, 87, 312),
 ('11111111-0000-4000-8000-000000000002', 'Inès Moreau', 'Vidéos business qui convertissent pour coachs et marques', 'Spécialiste du format face caméra : hook fort dans les 2 premières secondes, B-roll soigné, sous-titres lisibles et call-to-action clair. J''accompagne entrepreneurs, coachs et startups.', '{business,education}', true, true, true, 4.8, 64, 205),
 ('11111111-0000-4000-8000-000000000003', 'Lou Garnier', 'Sketchs, punchlines et timing comique au millimètre', 'Le rire, c''est du rythme. Je coupe au bon moment, j''ajoute bruitages et effets qui claquent, et je garde l''énergie de tes sketchs du début à la fin.', '{humour,vlog}', true, true, true, 4.7, 41, 133),
 ('11111111-0000-4000-8000-000000000004', 'Théo Lambert', 'Vlogs voyage cinématiques en format vertical', 'Étalonnage chaud, transitions fluides et storytelling : je fais de tes rushs de voyage des mini-films qui donnent envie de partir.', '{vlog,lifestyle}', true, true, true, 4.9, 52, 160),
 ('11111111-0000-4000-8000-000000000005', 'Maëlle Diallo', 'Lifestyle, food et beauté — esthétique clean', 'Couleurs douces, rythme apaisant, textes élégants : un rendu premium pour les créatrices lifestyle, food et beauté.', '{lifestyle,vlog}', false, true, true, 4.6, 29, 88),
 ('11111111-0000-4000-8000-000000000006', 'Sacha Roux', 'Vulgarisation et contenus éducatifs captivants', 'Je rends tes explications limpides avec schémas animés, mots-clés à l''écran et rythme soutenu. Idéal pour profs, experts et créateurs tech.', '{education,business}', true, true, true, 4.8, 37, 119);

insert into public.offers (editor_id, kind, title, description, price_cents, videos_count, included_revisions, extra_revision_cents, delivery_days) values
 ('11111111-0000-4000-8000-000000000001', 'unit', 'Clip gaming viral', 'Jusqu''à 60 s, sous-titres animés, sound design.', 4500, 1, 2, 1000, 2),
 ('11111111-0000-4000-8000-000000000001', 'pack', 'Pack streamer — 10 vidéos/mois', '10 clips par mois à partir de tes VODs.', 39000, 10, 2, 1000, 30),
 ('11111111-0000-4000-8000-000000000002', 'unit', 'Vidéo face caméra', 'Hook, B-roll, sous-titres, CTA.', 6000, 1, 2, 1500, 3),
 ('11111111-0000-4000-8000-000000000002', 'pack', 'Pack croissance — 12 vidéos/mois', '3 vidéos par semaine, ligne éditoriale incluse.', 59000, 12, 2, 1500, 30),
 ('11111111-0000-4000-8000-000000000003', 'unit', 'Sketch monté', 'Timing comique, bruitages, effets.', 4000, 1, 3, 800, 2),
 ('11111111-0000-4000-8000-000000000003', 'pack', 'Pack humour — 8 vidéos/mois', '2 sketchs par semaine.', 28000, 8, 2, 800, 30),
 ('11111111-0000-4000-8000-000000000004', 'unit', 'Vlog cinématique', 'Jusqu''à 90 s, étalonnage, musique.', 7000, 1, 2, 1500, 4),
 ('11111111-0000-4000-8000-000000000004', 'pack', 'Pack voyage — 6 vidéos', 'Toute la série de ton voyage.', 36000, 6, 2, 1500, 21),
 ('11111111-0000-4000-8000-000000000005', 'unit', 'Reel lifestyle', 'Esthétique clean, textes élégants.', 5000, 1, 2, 1000, 3),
 ('11111111-0000-4000-8000-000000000006', 'unit', 'Vidéo pédagogique', 'Schémas animés, mots-clés à l''écran.', 6500, 1, 2, 1200, 3),
 ('11111111-0000-4000-8000-000000000006', 'pack', 'Pack expert — 10 vidéos/mois', 'Série éducative régulière.', 52000, 10, 2, 1200, 30);

insert into public.portfolio_videos (editor_id, title, poster_url, duration_category, style, position) values
 ('11111111-0000-4000-8000-000000000001', 'Clutch 1v4 en 30 secondes', '/images/demo/gaming.jpg', 'under_30', 'gaming', 0),
 ('11111111-0000-4000-8000-000000000001', 'Rage quit compilation', '/images/demo/humour.jpg', 's30_60', 'humour', 1),
 ('11111111-0000-4000-8000-000000000001', 'Best of stream de la semaine', '/images/demo/gaming.jpg', 'm1_3', 'gaming', 2),
 ('11111111-0000-4000-8000-000000000002', '3 erreurs qui tuent ta startup', '/images/demo/business.jpg', 's30_60', 'business', 0),
 ('11111111-0000-4000-8000-000000000002', 'Pitch en 20 secondes', '/images/demo/business.jpg', 'under_30', 'business', 1),
 ('11111111-0000-4000-8000-000000000002', 'Comprendre la TVA simplement', '/images/demo/education.jpg', 'm1_3', 'education', 2),
 ('11111111-0000-4000-8000-000000000003', 'Quand tu rates ton gâteau', '/images/demo/humour.jpg', 'under_30', 'humour', 0),
 ('11111111-0000-4000-8000-000000000003', 'Les types de colocs', '/images/demo/humour.jpg', 's30_60', 'humour', 1),
 ('11111111-0000-4000-8000-000000000003', 'Une journée avec moi', '/images/demo/vlog.jpg', 'm1_3', 'vlog', 2),
 ('11111111-0000-4000-8000-000000000004', 'Lisbonne au coucher du soleil', '/images/demo/vlog.jpg', 's30_60', 'vlog', 0),
 ('11111111-0000-4000-8000-000000000004', '48 h à Porto', '/images/demo/vlog.jpg', 'm1_3', 'vlog', 1),
 ('11111111-0000-4000-8000-000000000004', 'Road trip — le film', '/images/demo/vlog.jpg', 'over_3', 'vlog', 2),
 ('11111111-0000-4000-8000-000000000005', 'Smoothie bowl du matin', '/images/demo/lifestyle.jpg', 'under_30', 'lifestyle', 0),
 ('11111111-0000-4000-8000-000000000005', 'Ma routine du dimanche', '/images/demo/lifestyle.jpg', 's30_60', 'lifestyle', 1),
 ('11111111-0000-4000-8000-000000000006', 'L''atome en 45 secondes', '/images/demo/education.jpg', 's30_60', 'education', 0),
 ('11111111-0000-4000-8000-000000000006', 'Excel : 5 raccourcis magiques', '/images/demo/education.jpg', 'under_30', 'education', 1),
 ('11111111-0000-4000-8000-000000000006', 'Pourquoi le ciel est bleu', '/images/demo/education.jpg', 'm1_3', 'education', 2);

insert into public.reviews (editor_id, reviewer_name, rating, comment) values
 ('11111111-0000-4000-8000-000000000001', 'Nathan — 210k abonnés', 5, 'Mes clips ont explosé depuis que Kuro les monte. Toujours livré en avance.'),
 ('11111111-0000-4000-8000-000000000001', 'Sarah G.', 5, 'Sound design incroyable, il a compris mon style direct.'),
 ('11111111-0000-4000-8000-000000000002', 'Julien, coach business', 5, 'Mes vidéos convertissent enfin. Hook parfait à chaque fois.'),
 ('11111111-0000-4000-8000-000000000002', 'Camille D.', 4, 'Très pro, une retouche demandée et corrigée en quelques heures.'),
 ('11111111-0000-4000-8000-000000000003', 'Mehdi Laugh', 5, 'Le timing comique est parfait, mes sketchs n''ont jamais été aussi drôles.'),
 ('11111111-0000-4000-8000-000000000004', 'Clara voyage', 5, 'On dirait des mini-films. Mes abonnés adorent.'),
 ('11111111-0000-4000-8000-000000000005', 'Emma Cuisine', 5, 'Rendu élégant et doux, exactement mon univers.'),
 ('11111111-0000-4000-8000-000000000006', 'Prof Antoine', 5, 'Les schémas animés rendent tout limpide. Top.');
-- ことば: Lernstand je Benutzer (Paket 4a)
--
-- Drei Tabellen, jede Zeile gehört genau einem Benutzer und ist nur für ihn
-- sichtbar (Row Level Security). Den Benutzer und die Zeitstempel setzt immer
-- die Datenbank, nie die App. Ohne Anmeldung gibt es keinen Zugriff.
-- Wird ein Konto gelöscht, verschwinden alle seine Zeilen mit.
-- Hintergrund und Gründe: ARCHITEKTUR.md, Abschnitt "Supabase".
--
-- Einmal im SQL-Editor des Projekts ausführen (README, "Konto einrichten").
-- Die Tests (tests/supabase.test.js) prüfen genau diese Regeln.

-- ---------------------------------------------------------------- Tabellen

-- Lernereignisse wie in verlauf.js: Antworten, Übernahmen, Widerrufe.
-- Sie werden nur angelegt und gelesen, nie geändert oder gelöscht. Die
-- Kennung vergibt die App; derselbe Upload zweimal ergibt keine zweite Zeile.
create table public.lern_ereignisse (
  user_id      uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id           uuid        not null,
  wort_id      text        not null check (char_length(wort_id) between 1 and 200),
  art          text        not null check (art in ('antwort', 'uebernahme', 'widerruf')),
  bewertung    smallint    check (bewertung between 1 and 4),
  zeit         timestamptz not null,
  tag          integer     not null,
  geraet_id    text        not null check (char_length(geraet_id) between 1 and 64),
  plan_version text        not null check (char_length(plan_version) <= 200),
  daten        jsonb       check (daten is null or octet_length(daten::text) <= 16384),
  empfangen_am timestamptz not null default now(),
  primary key (user_id, id),
  check ((art = 'antwort') = (bewertung is not null))
);
comment on table public.lern_ereignisse is
  'Antworten, Übernahmen und Widerrufe je Benutzer (verlauf.js). Nur anlegen und lesen.';
comment on column public.lern_ereignisse.tag is
  'Lerntag der App: Tage seit 1970-01-01 nach dem Kalender des Geräts, Tageswechsel um 4 Uhr.';
comment on column public.lern_ereignisse.empfangen_am is
  'Wann der Server das Ereignis angenommen hat; Merker für den Abgleich (4b).';

-- Abgleich: alles eines Benutzers ab einem Zeitpunkt
create index lern_ereignisse_abruf on public.lern_ereignisse (user_id, empfangen_am);
-- Späte Ereignisse: die ganze Historie eines Wortes
create index lern_ereignisse_wort on public.lern_ereignisse (user_id, wort_id, zeit);

-- Einstellungen, die für den Benutzer gelten (nicht die des Geräts): eine Zeile je Benutzer
create table public.einstellungen (
  user_id      uuid        primary key default auth.uid() references auth.users (id) on delete cascade,
  daten        jsonb       not null check (jsonb_typeof(daten) = 'object' and octet_length(daten::text) <= 65536),
  geaendert_am timestamptz not null default now()
);
comment on table public.einstellungen is 'Einstellungen je Benutzer, eine Zeile je Benutzer.';

-- Stand des Dojo: eine Zeile je Benutzer
create table public.dojo_stand (
  user_id      uuid        primary key default auth.uid() references auth.users (id) on delete cascade,
  daten        jsonb       not null check (jsonb_typeof(daten) = 'object' and octet_length(daten::text) <= 1048576),
  geaendert_am timestamptz not null default now()
);
comment on table public.dojo_stand is 'Fortschritt im Dojo je Benutzer, eine Zeile je Benutzer.';

-- ---------------------------------------------------------------- Stempel
-- Benutzer und Zeit kommen von der Datenbank, was auch immer mitgeschickt wird.
-- Beim Ändern bleibt der Benutzer der bisherige: Eine Zeile wandert nie zu
-- einem anderen Konto.

create function public.ereignis_stempeln() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.user_id := auth.uid();
  new.empfangen_am := now();
  return new;
end
$$;

create function public.stand_stempeln() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
  else
    new.user_id := old.user_id;
  end if;
  new.geaendert_am := now();
  return new;
end
$$;

create trigger ereignis_stempeln before insert on public.lern_ereignisse
  for each row execute function public.ereignis_stempeln();
create trigger einstellungen_stempeln before insert or update on public.einstellungen
  for each row execute function public.stand_stempeln();
create trigger dojo_stand_stempeln before insert or update on public.dojo_stand
  for each row execute function public.stand_stempeln();

-- ---------------------------------------------------------------- Rechte
-- Ohne Anmeldung (anon): nichts. Angemeldet: Ereignisse lesen und anlegen,
-- Einstellungen und Dojo lesen, anlegen und ändern. Löschen nur zusammen mit
-- dem Konto. Die Stempel-Funktionen sind von außen nicht aufrufbar.

revoke all on table public.lern_ereignisse, public.einstellungen, public.dojo_stand from anon, authenticated;
grant select, insert on table public.lern_ereignisse to authenticated;
grant select, insert, update on table public.einstellungen, public.dojo_stand to authenticated;
grant select, insert, update, delete on table public.lern_ereignisse, public.einstellungen, public.dojo_stand to service_role;

revoke all on function public.ereignis_stempeln(), public.stand_stempeln() from public, anon, authenticated;

-- ---------------------------------------------------------------- Row Level Security

alter table public.lern_ereignisse enable row level security;
alter table public.einstellungen enable row level security;
alter table public.dojo_stand enable row level security;

create policy "eigene Ereignisse lesen" on public.lern_ereignisse
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "eigene Ereignisse anlegen" on public.lern_ereignisse
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "eigene Einstellungen lesen" on public.einstellungen
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "eigene Einstellungen anlegen" on public.einstellungen
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "eigene Einstellungen ändern" on public.einstellungen
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "eigenen Dojo-Stand lesen" on public.dojo_stand
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "eigenen Dojo-Stand anlegen" on public.dojo_stand
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "eigenen Dojo-Stand ändern" on public.dojo_stand
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists blackcrown_link_challenges_browser_deny
  on public.blackcrown_telegram_link_challenges;
create policy blackcrown_link_challenges_browser_deny
  on public.blackcrown_telegram_link_challenges
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists blackcrown_account_links_browser_deny
  on public.blackcrown_account_links;
create policy blackcrown_account_links_browser_deny
  on public.blackcrown_account_links
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists blackcrown_entitlements_browser_deny
  on public.blackcrown_entitlements;
create policy blackcrown_entitlements_browser_deny
  on public.blackcrown_entitlements
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists blackcrown_link_events_browser_deny
  on public.blackcrown_account_link_events;
create policy blackcrown_link_events_browser_deny
  on public.blackcrown_account_link_events
  for all
  to anon, authenticated
  using (false)
  with check (false);

comment on function public.blackcrown_complete_telegram_link(text, text) is
  'Intentionally callable with the public API key. Authority is a 192-bit, short-lived, one-time token created by the server-only Telegram backend. The function cannot create entitlements.';
comment on function public.blackcrown_get_site_telegram_status(text) is
  'Returns only linked/premium booleans, entitlement keys, and linked timestamp. It does not expose Telegram identifiers or profile data.';

revoke execute on function public.blackcrown_complete_telegram_link(text, text)
  from public, anon, authenticated;
revoke execute on function public.blackcrown_get_site_telegram_status(text)
  from public, anon, authenticated;

grant execute on function public.blackcrown_complete_telegram_link(text, text)
  to service_role;
grant execute on function public.blackcrown_get_site_telegram_status(text)
  to service_role;

comment on function public.blackcrown_complete_telegram_link(text, text) is
  'Server-only. Render independently verifies the signed BlackCrown site session before consuming the short-lived Telegram token.';
comment on function public.blackcrown_get_site_telegram_status(text) is
  'Server-only. Called after independent BlackCrown site-session verification; returns sanitized link and entitlement state.';

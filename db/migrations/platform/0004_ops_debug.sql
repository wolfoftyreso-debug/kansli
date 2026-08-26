-- Request-id lookup for the command desk. Append-only events stay append-only.

create index if not exists events_request_id_idx
  on events (request_id);

create index if not exists events_failed_blocked_idx
  on events (occurred_at desc)
  where kind like '%.failed' or kind like '%.blocked';

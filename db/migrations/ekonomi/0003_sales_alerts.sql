-- Sales SMS: org settings + outbox. Delivery goes through the SMS channel,
-- never from product code talking to 46elks directly.

create table if not exists sales_alert_settings (
  org_ref text primary key,
  phone text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists sales_alert_outbox (
  id text primary key,
  org_ref text not null,
  invoice_id text references invoices (id) on delete restrict,
  channel text not null default 'sms' check (channel = 'sms'),
  recipient text not null,
  body text not null,
  status text not null check (status in ('PENDING', 'SENT', 'FAILED', 'BLOCKED')),
  last_error text,
  provider_ref text,
  created_at timestamptz not null default now()
);

create index if not exists sales_alert_outbox_org_idx
  on sales_alert_outbox (org_ref, created_at desc);

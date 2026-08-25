-- Shared ledger for the house. Other products never write these tables.
-- They create receivables through ekonomi's own API / events.

create table if not exists accounts (
  code text primary key,
  name text not null,
  kind text not null check (kind in ('asset', 'liability', 'income', 'expense')),
  vat_rate_bps int
);

insert into accounts (code, name, kind, vat_rate_bps) values
  ('1510', 'Kundfordringar', 'asset', null),
  ('1910', 'Kassa', 'asset', null),
  ('1930', 'Bank / Revolut', 'asset', null),
  ('1931', 'Stripe clearing', 'asset', null),
  ('1932', 'Swish clearing', 'asset', null),
  ('2610', 'Utgående moms 25 %', 'liability', 2500),
  ('2614', 'Utgående moms 12 %', 'liability', 1200),
  ('2615', 'Utgående moms 6 %', 'liability', 600),
  ('3001', 'Försäljning tjänster 25 %', 'income', 2500),
  ('3002', 'Försäljning tjänster 12 %', 'income', 1200),
  ('3041', 'Försäljning varor 25 %', 'income', 2500),
  ('3740', 'Öresavrundning', 'income', 0)
on conflict (code) do nothing;

create table if not exists journals (
  org_ref text primary key,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id text primary key,
  org_ref text not null,
  template text not null,
  description text not null,
  currency text not null default 'SEK',
  hash text not null,
  prev_hash text not null,
  source_system text,
  source_ref text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_org_idx
  on transactions (org_ref, created_at desc);

create table if not exists entries (
  id text primary key,
  org_ref text not null,
  transaction_id text not null references transactions (id) on delete restrict,
  account_code text not null references accounts (code),
  debit_ore bigint not null default 0 check (debit_ore >= 0),
  credit_ore bigint not null default 0 check (credit_ore >= 0),
  constraint entries_one_side check (
    (debit_ore > 0 and credit_ore = 0) or (credit_ore > 0 and debit_ore = 0)
  )
);

create index if not exists entries_tx_idx on entries (transaction_id);
create index if not exists entries_org_account_idx on entries (org_ref, account_code);

create table if not exists invoices (
  id text primary key,
  org_ref text not null,
  number text not null,
  status text not null check (status in ('draft', 'issued', 'part_paid', 'paid', 'void')),
  customer_name text not null,
  customer_ref text,
  currency text not null default 'SEK',
  net_ore bigint not null default 0,
  vat_ore bigint not null default 0,
  gross_ore bigint not null default 0,
  paid_ore bigint not null default 0,
  due_at timestamptz,
  issued_at timestamptz,
  source_system text,
  source_ref text,
  issue_transaction_id text references transactions (id),
  created_at timestamptz not null default now(),
  unique (org_ref, number)
);

create index if not exists invoices_org_idx on invoices (org_ref, created_at desc);

create table if not exists invoice_lines (
  id text primary key,
  org_ref text not null,
  invoice_id text not null references invoices (id) on delete restrict,
  description text not null,
  quantity int not null default 1 check (quantity > 0),
  unit_net_ore bigint not null check (unit_net_ore >= 0),
  vat_rate_bps int not null check (vat_rate_bps in (0, 600, 1200, 2500)),
  kind text not null check (kind in ('service', 'goods')),
  net_ore bigint not null,
  vat_ore bigint not null,
  gross_ore bigint not null
);

create table if not exists payments (
  id text primary key,
  org_ref text not null,
  invoice_id text not null references invoices (id) on delete restrict,
  rail text not null check (rail in ('swish', 'stripe', 'invoice_10', 'revolut')),
  status text not null check (status in ('offered', 'received', 'blocked', 'failed')),
  amount_ore bigint not null check (amount_ore > 0),
  currency text not null default 'SEK',
  external_ref text,
  received_at timestamptz,
  transaction_id text references transactions (id),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists payments_invoice_idx on payments (org_ref, invoice_id);

create table if not exists inbound_transfers (
  id text primary key,
  org_ref text not null,
  provider text not null,
  provider_tx_id text not null,
  amount_ore bigint not null,
  currency text not null,
  reference text,
  booked_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  matched_payment_id text references payments (id),
  match_status text not null default 'unmatched'
    check (match_status in ('unmatched', 'matched', 'ambiguous', 'ignored')),
  unique (org_ref, provider, provider_tx_id)
);

create table if not exists connectors (
  org_ref text not null,
  provider text not null
    check (provider in ('revolut_business', 'revolut_merchant', 'stripe', 'swish')),
  ciphertext text,
  last4 text,
  env_key text not null,
  updated_at timestamptz not null default now(),
  primary key (org_ref, provider)
);

create table if not exists documents (
  id text primary key,
  org_ref text not null,
  kind text not null check (kind in ('invoice', 'vat_period', 'journal', 'aged_ar')),
  title text not null,
  body text not null,
  period_from date,
  period_to date,
  created_at timestamptz not null default now()
);

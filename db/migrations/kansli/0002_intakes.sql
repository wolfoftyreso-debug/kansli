create table if not exists intakes (
  id text primary key,
  company_name text not null,
  org_number text,
  contact_name text not null,
  contact_email text not null,
  contact_title text,
  sites text,
  brands text,
  dms text,
  economy_system text,
  tire_hotel text,
  sms_provider text,
  identity_system text,
  environment text,
  oidc_notes text,
  demo_modules text[] not null default '{}',
  notes text,
  honesty_accepted boolean not null,
  provision_account boolean not null default true,
  issue_invoice boolean not null default true,
  invoice_net_ore integer,
  meeting_at timestamptz not null,
  provisioned_org_id text,
  provisioned_org_ref text,
  provisioned_user_id text,
  provisioned_email text,
  invoice_id text,
  invoice_number text,
  house_org_ref text,
  password_once text,
  blocked text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists intakes_created_idx on intakes (created_at desc);
create index if not exists intakes_meeting_idx on intakes (meeting_at);
create index if not exists intakes_email_idx on intakes (lower(contact_email));

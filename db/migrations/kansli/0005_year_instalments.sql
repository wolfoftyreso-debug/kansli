-- One year, ten instalment invoices issued at registration.
alter table intakes add column if not exists invoice_numbers text[] not null default '{}';

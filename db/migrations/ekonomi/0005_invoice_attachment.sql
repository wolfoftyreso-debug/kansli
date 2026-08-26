-- Order specification (bilaga) carried on the invoice itself, org-scoped.
alter table invoices add column if not exists attachment_text text;

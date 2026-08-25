-- Workshop notes on the case. Not customer-visible. Not a second CRM.
alter table tire_cases add column if not exists advisor_notes text;

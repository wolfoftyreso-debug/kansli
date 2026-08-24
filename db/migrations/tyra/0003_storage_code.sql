-- Align wheel_sets with the CRM card type. Location code is workshop-assigned,
-- not a live warehouse integration.
alter table wheel_sets add column if not exists storage_code text;

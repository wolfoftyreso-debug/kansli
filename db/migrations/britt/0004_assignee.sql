-- Inbox ownership. Not Fortnox users — the BFF subject.
alter table observations add column if not exists assignee_ref text;
create index if not exists observations_org_assignee_idx
  on observations (org_ref, assignee_ref, created_at desc);

-- Counterpart web presence via the platform web-visibility channel (Semrush).
-- Vendor values verbatim as text; the system never invents traffic or ranks.
alter table inquiries add column if not exists subject_domain text;
alter table inquiries add column if not exists web_status text;
alter table inquiries add column if not exists web_rank text;
alter table inquiries add column if not exists web_organic_keywords text;
alter table inquiries add column if not exists web_organic_traffic text;
alter table inquiries add column if not exists web_adwords_keywords text;
alter table inquiries add column if not exists web_reason text;
alter table inquiries add column if not exists web_fetched_at timestamptz;

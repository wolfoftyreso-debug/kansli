-- Intake facts toward a future protocol. No diagnosis, no findings, no session.
alter table cases add column if not exists area text;
alter table cases add column if not exists mileage_km int;
alter table cases add column if not exists desired_outcome text;

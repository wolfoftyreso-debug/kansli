-- Self-service registration replaces the demo-and-meeting intake.
-- The module list is what the customer bought; there is no meeting.
alter table intakes rename column demo_modules to modules;
alter table intakes alter column meeting_at drop not null;

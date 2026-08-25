-- Signed content is immutable at the database, not only in application code.
create or replace function prevent_signed_content_update()
returns trigger as $$
begin
  if old.status = 'signed' then
    if new.title is distinct from old.title
       or new.body is distinct from old.body
       or new.clauses is distinct from old.clauses
       or new.counterparty is distinct from old.counterparty
       or new.content_sha256 is distinct from old.content_sha256 then
      raise exception 'signed agreement content is immutable';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists agreements_signed_immutable on agreements;
create trigger agreements_signed_immutable
  before update on agreements
  for each row execute function prevent_signed_content_update();

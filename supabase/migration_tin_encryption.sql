-- ============================================================
-- TIN/SSN encryption for agent_tax_profiles
--  • Key lives in an internal table that is NOT exposed via the API (RLS, no policies).
--  • The tin column is encrypted on write by a trigger (pgcrypto / pgp_sym).
--  • Decryption is only available through authorization-checked functions:
--      - my_tin()           -> the signed-in user's own TIN
--      - tin_for_email(text)-> an agent's TIN, readable only by owner/broker of that brokerage
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- Internal key store (not reachable through PostgREST: RLS on + no policies + grants revoked).
create table if not exists app_secrets (k text primary key, v text not null);
alter table app_secrets enable row level security;
revoke all on app_secrets from anon, authenticated;

insert into app_secrets (k, v)
  select 'tin_enc_key', encode(extensions.gen_random_bytes(32), 'hex')
  where not exists (select 1 from app_secrets where k = 'tin_enc_key');

create or replace function get_tin_key() returns text
  language sql security definer stable set search_path = public as $$
  select v from app_secrets where k = 'tin_enc_key' limit 1
$$;

create or replace function encrypt_tin(p text) returns text
  language sql security definer set search_path = public as $$
  select case when p is null or p = '' then p
              else encode(extensions.pgp_sym_encrypt(p, get_tin_key()), 'base64') end
$$;

create or replace function decrypt_tin(enc text) returns text
  language plpgsql security definer set search_path = public as $$
  begin
    if enc is null or enc = '' then return enc; end if;
    return extensions.pgp_sym_decrypt(decode(enc, 'base64'), get_tin_key());
  exception when others then
    return enc; -- not decryptable (e.g., legacy plaintext) -> return as-is
  end
$$;

-- Encrypt the tin on every write (guards against double-encrypting an already-ciphertext value).
create or replace function tax_encrypt_tin() returns trigger
  language plpgsql security definer set search_path = public as $$
  declare already boolean := false;
  begin
    if NEW.tin is not null and NEW.tin <> '' then
      begin
        perform extensions.pgp_sym_decrypt(decode(NEW.tin, 'base64'), get_tin_key());
        already := true;            -- decrypts cleanly -> already ciphertext
      exception when others then
        already := false;           -- plaintext -> needs encryption
      end;
      if not already then
        NEW.tin := encode(extensions.pgp_sym_encrypt(NEW.tin, get_tin_key()), 'base64');
      end if;
    end if;
    return NEW;
  end
$$;

drop trigger if exists trg_tax_encrypt on agent_tax_profiles;
create trigger trg_tax_encrypt before insert or update on agent_tax_profiles
  for each row execute function tax_encrypt_tin();

-- Authorization-checked read functions.
create or replace function my_tin() returns text
  language sql security definer stable set search_path = public as $$
  select decrypt_tin(tin) from agent_tax_profiles where user_id = auth.uid() limit 1
$$;

create or replace function tin_for_email(p_email text) returns text
  language plpgsql security definer stable set search_path = public as $$
  declare v_tin text; v_bid uuid;
  begin
    select tin, brokerage_id into v_tin, v_bid
      from agent_tax_profiles where lower(email) = lower(p_email) limit 1;
    if v_tin is null then return null; end if;
    if not (v_bid in (select my_brokerage_ids())
            and coalesce(my_role_in(v_bid), '') in ('owner', 'broker')) then
      return null;
    end if;
    return decrypt_tin(v_tin);
  end
$$;

-- Lock down low-level crypto; expose only the checked readers.
revoke all on function get_tin_key()    from public, anon, authenticated;
revoke all on function encrypt_tin(text) from public, anon, authenticated;
revoke all on function decrypt_tin(text) from public, anon, authenticated;
revoke all on function tax_encrypt_tin() from public, anon, authenticated;
grant execute on function my_tin()            to authenticated;
grant execute on function tin_for_email(text) to authenticated;

-- Encrypt any existing plaintext rows (the trigger handles the rest going forward).
update agent_tax_profiles set tin = tin where tin is not null and tin <> '';

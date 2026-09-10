-- ==============================================================================
-- 003_sequences_and_functions.sql — Atomic Sequence Generator & Auth Hooks
-- ==============================================================================

-- Atomic sequence generator function (locks sequence row FOR UPDATE)
CREATE OR REPLACE FUNCTION fn_next_sequence(p_org_id UUID, p_entity_type TEXT)
RETURNS TEXT AS $$
DECLARE
    v_next_val BIGINT;
    v_year TEXT;
    v_prefix TEXT;
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');
    
    CASE p_entity_type
        WHEN 'quote' THEN v_prefix := 'Q';
        WHEN 'job' THEN v_prefix := 'J';
        WHEN 'invoice' THEN v_prefix := 'INV';
        ELSE RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
    END CASE;

    INSERT INTO sequences (organization_id, entity_type, last_val)
    VALUES (p_org_id, p_entity_type, 1)
    ON CONFLICT (organization_id, entity_type)
    DO UPDATE SET last_val = sequences.last_val + 1
    RETURNING last_val INTO v_next_val;

    RETURN v_prefix || '-' || v_year || '-' || LPAD(v_next_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatically insert row into public.users when Supabase auth signs up a user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wire trigger to auth.users if available
DO $$ BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
    WHEN undefined_table THEN null;
END $$;

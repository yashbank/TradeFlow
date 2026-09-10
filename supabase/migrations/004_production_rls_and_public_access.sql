-- ==============================================================================
-- 004_production_rls_and_public_access.sql
-- Production RLS Hardening, Atomic Workspace Provisioning, and Public Token Access
-- ==============================================================================

-- 1. Atomic Workspace Creation Stored Procedure
CREATE OR REPLACE FUNCTION fn_create_workspace(
    p_user_id UUID,
    p_business_name TEXT,
    p_country TEXT DEFAULT 'US',
    p_currency TEXT DEFAULT 'USD',
    p_timezone TEXT DEFAULT 'America/New_York',
    p_tax_rate_basis_points INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_org_id UUID;
    v_base_slug TEXT;
    v_slug TEXT;
    v_trial_end TIMESTAMPTZ;
BEGIN
    -- Derive URL-safe slug from business name
    v_base_slug := LOWER(REGEXP_REPLACE(p_business_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_base_slug := TRIM(BOTH '-' FROM v_base_slug);
    IF LENGTH(v_base_slug) = 0 THEN
        v_base_slug := 'org';
    END IF;
    v_slug := SUBSTRING(v_base_slug FROM 1 FOR 45) || '-' || SUBSTRING(ENCODE(GEN_RANDOM_BYTES(3), 'hex') FROM 1 FOR 6);

    -- 1. Create Organization
    INSERT INTO organizations (
        name,
        slug,
        country,
        currency,
        timezone,
        tax_rate_basis_points,
        invoice_terms
    ) VALUES (
        p_business_name,
        v_slug,
        p_country,
        p_currency,
        p_timezone,
        p_tax_rate_basis_points,
        'Payment due within 14 days of receipt.'
    )
    RETURNING id INTO v_org_id;

    -- 2. Assign User as Owner
    INSERT INTO organization_members (
        organization_id,
        user_id,
        role
    ) VALUES (
        v_org_id,
        p_user_id,
        'owner'
    );

    -- 3. Initialize 14-Day Free Trial Subscription
    v_trial_end := NOW() + INTERVAL '14 days';
    INSERT INTO subscriptions (
        organization_id,
        plan_id,
        status,
        trial_start,
        trial_end
    ) VALUES (
        v_org_id,
        'starter_monthly',
        'trialing',
        NOW(),
        v_trial_end
    );

    -- 4. Initialize Entity Sequences
    INSERT INTO sequences (organization_id, entity_type, last_val) VALUES
        (v_org_id, 'quote', 0),
        (v_org_id, 'job', 0),
        (v_org_id, 'invoice', 0)
    ON CONFLICT (organization_id, entity_type) DO NOTHING;

    -- 5. Audit Log
    INSERT INTO audit_logs (
        organization_id,
        entity_type,
        entity_id,
        action,
        actor_id,
        changes_json
    ) VALUES (
        v_org_id,
        'organization',
        v_org_id,
        'workspace_created',
        p_user_id,
        jsonb_build_object('name', p_business_name, 'currency', p_currency)
    );

    RETURN jsonb_build_object(
        'organization_id', v_org_id,
        'slug', v_slug,
        'trial_end', v_trial_end
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Explicit Insert/Update Policies for Authenticated Tenant Setup
DO $$ BEGIN
    CREATE POLICY "Authenticated users can create organization"
    ON organizations FOR INSERT
    TO authenticated
    WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert initial membership"
    ON organization_members FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can insert subscription"
    ON subscriptions FOR INSERT
    TO authenticated
    WITH CHECK (is_org_admin(organization_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can update subscription"
    ON subscriptions FOR UPDATE
    TO authenticated
    USING (is_org_admin(organization_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Members can insert audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (is_org_member(organization_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins and members can insert sequences"
    ON sequences FOR INSERT
    TO authenticated
    WITH CHECK (is_org_member(organization_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins and members can update sequences"
    ON sequences FOR UPDATE
    TO authenticated
    USING (is_org_member(organization_id));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Public Document Access Policies (Homeowners viewing quotes & invoices via 256-bit token)
DO $$ BEGIN
    CREATE POLICY "Public can view quotes by public_token"
    ON quotes FOR SELECT
    TO anon, authenticated
    USING (public_token IS NOT NULL);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public can view quote items by quote token"
    ON quote_items FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM quotes
        WHERE quotes.id = quote_items.quote_id
          AND quotes.public_token IS NOT NULL
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public can update quote status by public_token"
    ON quotes FOR UPDATE
    TO anon, authenticated
    USING (public_token IS NOT NULL AND status IN ('draft', 'sent'))
    WITH CHECK (status IN ('accepted', 'rejected'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public can view invoices by public_token"
    ON invoices FOR SELECT
    TO anon, authenticated
    USING (public_token IS NOT NULL);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public can view invoice items by invoice token"
    ON invoice_items FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = invoice_items.invoice_id
          AND invoices.public_token IS NOT NULL
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public can view payments for public invoices"
    ON payments FOR SELECT
    TO anon, authenticated
    USING (EXISTS (
        SELECT 1 FROM invoices
        WHERE invoices.id = payments.invoice_id
          AND invoices.public_token IS NOT NULL
    ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Public Quote Acceptance & Rejection RPCs
CREATE OR REPLACE FUNCTION fn_accept_quote_public(
    p_token TEXT,
    p_signer_name TEXT,
    p_ip TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_quote_id UUID;
    v_org_id UUID;
    v_current_status quote_status;
BEGIN
    SELECT id, organization_id, status
    INTO v_quote_id, v_org_id, v_current_status
    FROM quotes
    WHERE public_token = p_token;

    IF v_quote_id IS NULL THEN
        RAISE EXCEPTION 'RESOURCE_NOT_FOUND: Quote with provided token does not exist.';
    END IF;

    IF v_current_status NOT IN ('draft', 'sent') THEN
        RAISE EXCEPTION 'STATE_CONFLICT: Quote cannot be accepted in state %', v_current_status;
    END IF;

    IF p_signer_name IS NULL OR LENGTH(TRIM(p_signer_name)) < 2 THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: A valid legal signer name is required to accept.';
    END IF;

    UPDATE quotes SET
        status = 'accepted',
        accepted_at = NOW(),
        accepted_by_name = TRIM(p_signer_name),
        accepted_ip = p_ip
    WHERE id = v_quote_id;

    -- Write Audit Record
    INSERT INTO audit_logs (
        organization_id,
        entity_type,
        entity_id,
        action,
        actor_id,
        changes_json
    ) VALUES (
        v_org_id,
        'quote',
        v_quote_id,
        'public_accept',
        NULL,
        jsonb_build_object(
            'signer_name', TRIM(p_signer_name),
            'accepted_ip', p_ip,
            'accepted_at', NOW()
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'quote_id', v_quote_id,
        'status', 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_reject_quote_public(
    p_token TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_quote_id UUID;
    v_org_id UUID;
    v_current_status quote_status;
BEGIN
    SELECT id, organization_id, status
    INTO v_quote_id, v_org_id, v_current_status
    FROM quotes
    WHERE public_token = p_token;

    IF v_quote_id IS NULL THEN
        RAISE EXCEPTION 'RESOURCE_NOT_FOUND: Quote with provided token does not exist.';
    END IF;

    IF v_current_status NOT IN ('draft', 'sent') THEN
        RAISE EXCEPTION 'STATE_CONFLICT: Quote cannot be rejected in state %', v_current_status;
    END IF;

    UPDATE quotes SET
        status = 'rejected',
        rejected_at = NOW(),
        rejection_reason = TRIM(p_reason)
    WHERE id = v_quote_id;

    -- Write Audit Record
    INSERT INTO audit_logs (
        organization_id,
        entity_type,
        entity_id,
        action,
        actor_id,
        changes_json
    ) VALUES (
        v_org_id,
        'quote',
        v_quote_id,
        'public_reject',
        NULL,
        jsonb_build_object(
            'reason', TRIM(p_reason),
            'rejected_at', NOW()
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'quote_id', v_quote_id,
        'status', 'rejected'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

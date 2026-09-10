-- ==============================================================================
-- 002_rls_policies.sql — Multi-Tenant Row Level Security (RLS) Policies
-- ==============================================================================

-- Security context helper: checks if auth.uid() is an active member of organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security context helper: checks if auth.uid() has owner or admin role
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = org_id
          AND user_id = auth.uid()
          AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on ALL application tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Organizations Policies
CREATE POLICY "Members can view their own organization"
ON organizations FOR SELECT
USING (is_org_member(id));

CREATE POLICY "Owners and Admins can update their organization"
ON organizations FOR UPDATE
USING (is_org_admin(id));

-- 2. Users Policies
CREATE POLICY "Users can view members of same organization"
ON users FOR SELECT
USING (
    id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM organization_members m1
        JOIN organization_members m2 ON m1.organization_id = m2.organization_id
        WHERE m1.user_id = auth.uid() AND m2.user_id = users.id
    )
);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (id = auth.uid());

-- 3. Organization Members Policies
CREATE POLICY "Members can view team membership in their org"
ON organization_members FOR SELECT
USING (is_org_member(organization_id));

CREATE POLICY "Admins can invite and manage members"
ON organization_members FOR ALL
USING (is_org_admin(organization_id));

-- 4. Subscriptions Policies
CREATE POLICY "Members can view subscription status"
ON subscriptions FOR SELECT
USING (is_org_member(organization_id));

-- 5. Sequences Policies
CREATE POLICY "Admins and members can view sequences"
ON sequences FOR SELECT
USING (is_org_member(organization_id));

-- 6. Customers Policies
CREATE POLICY "Org members can view customers"
ON customers FOR SELECT
USING (is_org_member(organization_id));

CREATE POLICY "Admins and Owners can insert/update customers"
ON customers FOR ALL
USING (is_org_admin(organization_id));

-- 7. Quotes & Items Policies
CREATE POLICY "Org members can view quotes"
ON quotes FOR SELECT
USING (is_org_member(organization_id));

CREATE POLICY "Admins and Owners can manage quotes"
ON quotes FOR ALL
USING (is_org_admin(organization_id));

CREATE POLICY "Org members can view quote items"
ON quote_items FOR SELECT
USING (is_org_member(organization_id));

CREATE POLICY "Admins and Owners can manage quote items"
ON quote_items FOR ALL
USING (is_org_admin(organization_id));

-- 8. Jobs Policies
CREATE POLICY "Members can view jobs they belong to or are assigned"
ON jobs FOR SELECT
USING (
    is_org_admin(organization_id) OR
    (is_org_member(organization_id) AND assigned_to_user_id = auth.uid())
);

CREATE POLICY "Admins can manage jobs"
ON jobs FOR ALL
USING (is_org_admin(organization_id));

CREATE POLICY "Assigned technicians can update job status and notes"
ON jobs FOR UPDATE
USING (assigned_to_user_id = auth.uid())
WITH CHECK (assigned_to_user_id = auth.uid());

-- 9. Invoices & Items Policies
CREATE POLICY "Org admins can view invoices"
ON invoices FOR SELECT
USING (is_org_admin(organization_id));

CREATE POLICY "Admins can manage invoices"
ON invoices FOR ALL
USING (is_org_admin(organization_id));

CREATE POLICY "Org admins can view invoice items"
ON invoice_items FOR SELECT
USING (is_org_admin(organization_id));

CREATE POLICY "Admins can manage invoice items"
ON invoice_items FOR ALL
USING (is_org_admin(organization_id));

-- 10. Payments Policies
CREATE POLICY "Admins can view and record payments"
ON payments FOR ALL
USING (is_org_admin(organization_id));

-- 11. Audit Logs Policies
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (is_org_admin(organization_id));

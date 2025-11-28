-- ================================================
-- SHARED DATA MIGRATION
-- Remove user_id columns and configure shared access
-- ================================================

-- Step 1: Drop user_id columns from tables
-- These columns are no longer needed for a shared company dashboard
ALTER TABLE public.apify DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.leads DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.waha DROP COLUMN IF EXISTS user_id;

-- Step 2: Ensure RLS is enabled on all tables
ALTER TABLE public.apify ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow authenticated users full access to apify" ON public.apify;
DROP POLICY IF EXISTS "Allow authenticated users full access to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated users full access to waha" ON public.waha;
DROP POLICY IF EXISTS "Allow authenticated users full access to messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated users full access to automations" ON public.automations;

-- Step 4: Create new shared access policies
-- All authenticated users can read, insert, update, and delete all records

-- APIFY Table Policies
CREATE POLICY "Allow authenticated users full access to apify"
ON public.apify
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- LEADS Table Policies
CREATE POLICY "Allow authenticated users full access to leads"
ON public.leads
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- WAHA Table Policies
CREATE POLICY "Allow authenticated users full access to waha"
ON public.waha
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- MESSAGES Table Policies
CREATE POLICY "Allow authenticated users full access to messages"
ON public.messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- AUTOMATIONS Table Policies
CREATE POLICY "Allow authenticated users full access to automations"
ON public.automations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 5: Grant necessary permissions
GRANT ALL ON public.apify TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.waha TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.automations TO authenticated;

-- Optional: Add comment for documentation
COMMENT ON TABLE public.apify IS 'Shared company data - all authenticated users have full access';
COMMENT ON TABLE public.leads IS 'Shared company data - all authenticated users have full access';
COMMENT ON TABLE public.waha IS 'Shared company data - all authenticated users have full access';
COMMENT ON TABLE public.messages IS 'Shared company data - all authenticated users have full access';
COMMENT ON TABLE public.automations IS 'Shared company data - all authenticated users have full access';

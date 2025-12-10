-- Social Proofs Table
-- Stores social proof configurations with AI prompt settings and generated messages

CREATE TABLE IF NOT EXISTS social_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    model TEXT DEFAULT 'gemini-2.0-flash-exp',
    ai_prompt TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    avatar_url TEXT,
    contact_name TEXT DEFAULT 'Cliente Satisfeito',
    is_active BOOLEAN DEFAULT true,
    messages JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE social_proofs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all social proofs (shared resource)
CREATE POLICY "Anyone can view social proofs" ON social_proofs
    FOR SELECT USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can insert social proofs" ON social_proofs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update their own or admins can update any
CREATE POLICY "Users can update own social proofs" ON social_proofs
    FOR UPDATE USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Policy: Users can delete their own or admins can delete any
CREATE POLICY "Users can delete own social proofs" ON social_proofs
    FOR DELETE USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Index for faster queries
CREATE INDEX idx_social_proofs_category ON social_proofs(category);
CREATE INDEX idx_social_proofs_user_id ON social_proofs(user_id);

-- ============================================
-- Social Proof Items (Generated Proofs)
-- ============================================

CREATE TABLE IF NOT EXISTS social_proof_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    album_id UUID REFERENCES social_proofs(id) ON DELETE CASCADE,
    contact_name TEXT DEFAULT 'Cliente',
    messages JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE social_proof_items ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view items
CREATE POLICY "Anyone can view social proof items" ON social_proof_items
    FOR SELECT USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can insert social proof items" ON social_proof_items
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update/delete items from their albums
CREATE POLICY "Users can update social proof items" ON social_proof_items
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM social_proofs WHERE id = album_id AND (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    ));

CREATE POLICY "Users can delete social proof items" ON social_proof_items
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM social_proofs WHERE id = album_id AND (user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        ))
    ));

-- Index for faster queries
CREATE INDEX idx_social_proof_items_album ON social_proof_items(album_id);

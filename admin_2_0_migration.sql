-- Create coupons table
CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    discount_type TEXT CHECK (discount_type IN ('percent', 'flat')) NOT NULL,
    discount_value INTEGER NOT NULL, -- percentage (e.g. 20) or flat amount in cents/paise (e.g. 1000 for $10)
    max_uses INTEGER, -- NULL means unlimited
    uses_count INTEGER DEFAULT 0,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- RLS Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on coupons" ON coupons
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Public can read active coupons (for validation)
-- In reality, we might not want to list all coupons, but validation API will likely bypass RLS or use a secure function.
-- For now, let's keep it restricted to admins and use service role in API for validation.

-- Add policy for reading coupons if needed for client-side validation (though server-side is safer)
-- CREATE POLICY "Anyone can read coupons" ON coupons FOR SELECT USING (true);


-- Add index for speed
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

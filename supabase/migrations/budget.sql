-- =====================================================
-- MIGRATION: Rename income table to budget
-- =====================================================
-- This migration renames the income table to budget and updates all related objects
-- Date: 2025-01-20

-- =====================================================
-- DROP OLD INCOME TABLE AND RELATED OBJECTS
-- =====================================================

-- Drop trigger
DROP TRIGGER IF EXISTS update_income_updated_at ON income;

-- Drop policies
DROP POLICY IF EXISTS "Users can delete their own income" ON income;
DROP POLICY IF EXISTS "Users can update their own income" ON income;
DROP POLICY IF EXISTS "Users can insert their own income" ON income;
DROP POLICY IF EXISTS "Users can view their own income" ON income;

-- Drop indexes
DROP INDEX IF EXISTS idx_income_user_month;
DROP INDEX IF EXISTS idx_income_month;
DROP INDEX IF EXISTS idx_income_user_id;

-- Drop table
DROP TABLE IF EXISTS income CASCADE;

-- =====================================================
-- CREATE BUDGET TABLE
-- =====================================================
-- Budget tracking table
CREATE TABLE IF NOT EXISTS budget (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES expense_users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    budget_month DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, budget_month)
);

-- Create index for faster queries
CREATE INDEX idx_budget_user_id ON budget(user_id);
CREATE INDEX idx_budget_month ON budget(budget_month);
CREATE INDEX idx_budget_user_month ON budget(user_id, budget_month);

-- Enable RLS
ALTER TABLE budget ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BUDGET POLICIES
-- =====================================================

-- Policy: Users can view their own budget
CREATE POLICY "Users can view their own budget"
    ON budget
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own budget
CREATE POLICY "Users can insert their own budget"
    ON budget
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own budget
CREATE POLICY "Users can update their own budget"
    ON budget
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own budget
CREATE POLICY "Users can delete their own budget"
    ON budget
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- BUDGET TRIGGERS
-- =====================================================

-- Trigger: Auto-update updated_at timestamp
CREATE TRIGGER update_budget_updated_at
    BEFORE UPDATE ON budget
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- UPDATE VIEWS
-- =====================================================

-- Drop old view
DROP VIEW IF EXISTS monthly_totals;

-- Recreate view with budget table
CREATE OR REPLACE VIEW monthly_totals AS
SELECT
    e.user_id,
    DATE_TRUNC('month', e.expense_date) AS month,
    COALESCE(SUM(e.amount), 0) AS total_expenses,
    COALESCE(b.total_budget, 0) AS total_budget,
    COALESCE(b.total_budget, 0) - COALESCE(SUM(e.amount), 0) AS balance
FROM expenses e
LEFT JOIN (
    SELECT
        user_id,
        DATE_TRUNC('month', budget_month) AS month,
        SUM(amount) AS total_budget
    FROM budget
    GROUP BY user_id, DATE_TRUNC('month', budget_month)
) b ON e.user_id = b.user_id AND DATE_TRUNC('month', e.expense_date) = b.month
GROUP BY e.user_id, DATE_TRUNC('month', e.expense_date), b.total_budget;

-- Grant access to views
GRANT SELECT ON monthly_totals TO authenticated;

-- =====================================================
-- TABLE COMMENTS
-- =====================================================

COMMENT ON TABLE budget IS 'User budget records by month';
COMMENT ON COLUMN budget.user_id IS 'Reference to the expense_users table';
COMMENT ON COLUMN budget.amount IS 'Budget amount for the month (must be greater than 0)';
COMMENT ON COLUMN budget.budget_month IS 'Month for which this budget applies (stored as first day of month)';
COMMENT ON COLUMN budget.created_at IS 'Timestamp when the budget record was created';
COMMENT ON COLUMN budget.updated_at IS 'Timestamp when the budget record was last updated';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The income table has been successfully renamed to budget
-- All indexes, policies, triggers, and views have been updated

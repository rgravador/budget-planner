-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- EXPENSE USERS TABLE
-- =====================================================
-- Main users table for expense tracking
CREATE TABLE IF NOT EXISTS expense_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'tracker' CHECK (role IN ('tracker', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expense_users ENABLE ROW LEVEL SECURITY;

-- Policies for expense_users
CREATE POLICY "Users can view their own profile"
    ON expense_users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON expense_users
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON expense_users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
-- Categories for expenses
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES expense_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Users can view their own categories"
    ON categories
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
    ON categories
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON categories
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON categories
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- EXPENSES TABLE
-- =====================================================
-- Expenses tracking table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES expense_users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policies for expenses
CREATE POLICY "Users can view their own expenses"
    ON expenses
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
    ON expenses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
    ON expenses
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
    ON expenses
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- BUDGET TABLE
-- =====================================================
-- Budget tracking table
CREATE TABLE IF NOT EXISTS budget (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES expense_users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    budget_month DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_budget_user_id ON budget(user_id);
CREATE INDEX idx_budget_month ON budget(budget_month);
CREATE INDEX idx_budget_user_month ON budget(user_id, budget_month);

-- Enable RLS
ALTER TABLE budget ENABLE ROW LEVEL SECURITY;

-- Policies for budget
CREATE POLICY "Users can view their own budget"
    ON budget
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget"
    ON budget
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget"
    ON budget
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget"
    ON budget
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_expense_users_updated_at
    BEFORE UPDATE ON expense_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_updated_at
    BEFORE UPDATE ON budget
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-CREATE USER ON SIGNUP
-- =====================================================

-- Function to automatically create expense_user entry on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.expense_users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        'tracker'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SEED DEFAULT CATEGORIES
-- =====================================================

-- Function to seed default categories for new users
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.categories (user_id, name, icon, is_default)
    VALUES
        (NEW.id, 'Food & Dining', 'CoffeeOutlined', true),
        (NEW.id, 'Transportation', 'CarOutlined', true),
        (NEW.id, 'Shopping', 'ShoppingOutlined', true),
        (NEW.id, 'Entertainment', 'VideoCameraOutlined', true),
        (NEW.id, 'Bills & Utilities', 'HomeOutlined', true),
        (NEW.id, 'Healthcare', 'MedicineBoxOutlined', true),
        (NEW.id, 'Education', 'BookOutlined', true),
        (NEW.id, 'Travel', 'GlobalOutlined', true),
        (NEW.id, 'Personal Care', 'SmileOutlined', true),
        (NEW.id, 'Other', 'TagOutlined', true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to seed categories after expense_user is created
DROP TRIGGER IF EXISTS on_expense_user_created ON expense_users;
CREATE TRIGGER on_expense_user_created
    AFTER INSERT ON expense_users
    FOR EACH ROW
    EXECUTE FUNCTION public.seed_default_categories();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View for monthly expense summary by category
CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT
    user_id,
    DATE_TRUNC('month', expense_date) AS month,
    category,
    COUNT(*) AS expense_count,
    SUM(amount) AS total_amount
FROM expenses
GROUP BY user_id, DATE_TRUNC('month', expense_date), category;

-- View for monthly totals
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
GRANT SELECT ON monthly_expense_summary TO authenticated;
GRANT SELECT ON monthly_totals TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE expense_users IS 'Main users table for expense tracking application';
COMMENT ON TABLE categories IS 'User-defined expense categories';
COMMENT ON TABLE expenses IS 'User expense records';
COMMENT ON TABLE budget IS 'User budget records by month';
COMMENT ON COLUMN expense_users.role IS 'User role: tracker (default) or admin';
COMMENT ON COLUMN categories.is_default IS 'Whether this is a default category seeded by the system';

# Supabase Database Setup

This directory contains the database schema and migrations for the Budget Planner application.

## Database Schema

### Tables

#### 1. `expense_users`
Main users table that automatically syncs with Supabase auth.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (references auth.users) |
| name | TEXT | User's full name (nullable) |
| email | TEXT | User's email address |
| role | TEXT | User role: 'tracker' (default) or 'admin' |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Features:**
- Automatically created when a user signs up via trigger
- Role defaults to 'tracker'
- Name and other fields can be filled later

#### 2. `categories`
User-defined expense categories.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to expense_users |
| name | TEXT | Category name |
| icon | TEXT | Icon name (e.g., 'CoffeeOutlined') |
| is_default | BOOLEAN | Whether it's a system-seeded category |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Features:**
- 10 default categories automatically created for each new user
- Users can add custom categories
- Unique constraint on (user_id, name)

**Default Categories:**
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Education
- Travel
- Personal Care
- Other

#### 3. `expenses`
User expense records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to expense_users |
| category | TEXT | Expense category name |
| description | TEXT | Expense description |
| amount | DECIMAL(12,2) | Expense amount (must be > 0) |
| expense_date | DATE | Date of expense |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_expenses_user_id` - Fast user queries
- `idx_expenses_expense_date` - Fast date queries
- `idx_expenses_category` - Fast category queries
- `idx_expenses_user_date` - Combined user+date queries

#### 4. `income`
User income records by month.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to expense_users |
| amount | DECIMAL(12,2) | Income amount (must be > 0) |
| income_month | DATE | Month of income |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- `idx_income_user_id` - Fast user queries
- `idx_income_month` - Fast month queries
- `idx_income_user_month` - Combined user+month queries

### Views

#### `monthly_expense_summary`
Aggregated expense data by user, month, and category.

```sql
SELECT * FROM monthly_expense_summary
WHERE user_id = auth.uid()
AND month = '2025-01-01';
```

#### `monthly_totals`
Monthly financial overview with income, expenses, and balance.

```sql
SELECT * FROM monthly_totals
WHERE user_id = auth.uid()
ORDER BY month DESC;
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Users can perform CRUD operations on their own records
- Data is isolated between users

### Triggers

1. **`on_auth_user_created`** - Automatically creates an `expense_users` record when a user signs up
2. **`on_expense_user_created`** - Seeds 10 default categories for new users
3. **`update_*_updated_at`** - Automatically updates the `updated_at` timestamp on record updates

## Setup Instructions

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `migrations/20250120000000_initial_schema.sql`
4. Paste and run the SQL script
5. Verify tables are created in the Table Editor

### Option 2: Using Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Run migrations:
```bash
supabase db push
```

### Verify Setup

After running the migration, verify:

1. **Tables exist**: Check the Table Editor in Supabase dashboard
2. **RLS is enabled**: All tables should show RLS as "Enabled"
3. **Policies are active**: Each table should have 4 policies (SELECT, INSERT, UPDATE, DELETE)
4. **Triggers work**: Sign up a new user and check:
   - `expense_users` table has a new record
   - `categories` table has 10 default categories for that user

## Data Flow

```
1. User signs up via auth
   ↓
2. auth.users record created
   ↓
3. Trigger: on_auth_user_created fires
   ↓
4. expense_users record created
   ↓
5. Trigger: on_expense_user_created fires
   ↓
6. 10 default categories seeded
```

## Example Queries

### Get user's expenses for current month
```sql
SELECT *
FROM expenses
WHERE user_id = auth.uid()
AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY expense_date DESC;
```

### Get monthly expense totals by category
```sql
SELECT
    category,
    COUNT(*) as count,
    SUM(amount) as total
FROM expenses
WHERE user_id = auth.uid()
AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY category
ORDER BY total DESC;
```

### Get income vs expenses comparison
```sql
SELECT * FROM monthly_totals
WHERE user_id = auth.uid()
ORDER BY month DESC
LIMIT 12;
```

## Notes

- All monetary amounts use `DECIMAL(12,2)` for precision
- Dates are stored in user's local date format
- UUID v4 is used for all IDs
- Timestamps use `TIMESTAMP WITH TIME ZONE` for accuracy across timezones
- All foreign keys have `ON DELETE CASCADE` to maintain referential integrity

# 🗄️ Supabase Setup Guide

## Step 1: Create Supabase Account (Free!)

1. Go to **https://supabase.com**
2. Click "Start your project" 
3. Sign up with GitHub (free tier)
4. Click "New Project"
5. Fill in:
   - **Name**: baro-ai
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
6. Click "Create new project" (takes ~2 minutes)

## Step 2: Create the Transactions Table

Once your project is ready:

1. Go to **SQL Editor** in the left sidebar
2. Click **"+ New Query"**
3. Paste this SQL:

```sql
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL, -- Stores Telegram user ID
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT,
  account TEXT NOT NULL DEFAULT 'cash',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_timestamp ON transactions(user_id, timestamp DESC);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Optional migration if your table already exists (run once):
-- ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account TEXT NOT NULL DEFAULT 'cash';
```

4. Click **"RUN"** (bottom right)

## Step 2.5: Create the Budgets Table (Optional but Recommended)

To use the new budget features:

1. In the **SQL Editor**, create a new query
2. Paste this SQL:

```sql
CREATE TABLE budgets (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL, -- Stores Telegram user ID
  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 0-11 (JavaScript month format)
  category TEXT, -- NULL for overall budget, or category name
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budgets_user_month ON budgets(user_id, year, month);
```
## Step 2.6: Create Accounts Table (Optional but Recommended)

This stores the list of accounts per user (e.g., cash, bank, card):

```sql
CREATE TABLE accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_accounts_user ON accounts(user_id);
```

3. Click **"RUN"**

## Step 3: Get Your API Keys

1. Go to **Settings** → **API** in the left sidebar
2. You'll see:
   - **Project URL**: Copy this (starts with https://)
   - **anon public key**: Copy this (long string)

## Step 4: Add to Your .env File

Add these lines to your `.env` file:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 5: Enable Row Level Security (Recommended)

For security, enable RLS so users can only see their own data:

```sql
-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions
FOR SELECT USING (true);

-- Allow users to insert their own transactions
CREATE POLICY "Users can insert their own transactions" ON transactions
FOR INSERT WITH CHECK (true);

-- Allow users to delete their own transactions
CREATE POLICY "Users can delete their own transactions" ON transactions
FOR DELETE USING (true);

-- Enable RLS on budgets (if you created the table)
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own budgets
CREATE POLICY "Users can view their own budgets" ON budgets
FOR SELECT USING (true);

-- Allow users to insert their own budgets
CREATE POLICY "Users can insert their own budgets" ON budgets
FOR INSERT WITH CHECK (true);

-- Allow users to delete their own budgets
CREATE POLICY "Users can delete their own budgets" ON budgets
FOR DELETE USING (true);

-- Enable RLS on accounts (if you created the table)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Allow users to view/insert/delete their own accounts
CREATE POLICY "Users can view their own accounts" ON accounts
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own accounts" ON accounts
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own accounts" ON accounts
FOR DELETE USING (true);
```

## That's it! 

Each user's transactions will be stored separately and persist across bot restarts 🎉

**Note:** The `user_id` field stores the Telegram user ID, so each user has their own separate balance, transaction history, and budgets!

## Using Budgets

Once the budgets table is created, you can use these commands in your Telegram bot:

- `budget $500` - Set a $500 overall budget for this month
- `budget $500 groceries` - Set a $500 budget for groceries this month
- `budgets` - View all your budgets for the current month
- `budget status` - Check how much you've spent vs your budgets

Budgets can be either:
- **Overall budgets** (no category): Track total spending across all categories
- **Category-specific budgets**: Track spending for specific categories like "groceries", "dining", etc.

**Budget Updates:** If you set a budget for the same month and category, you'll be asked to confirm before replacing the existing budget.

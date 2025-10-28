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
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_timestamp ON transactions(user_id, timestamp DESC);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
```

4. Click **"RUN"** (bottom right)

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

For security, enable RLS so users can only see their own transactions:

```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions
FOR SELECT USING (true);

-- Allow users to insert their own transactions
CREATE POLICY "Users can insert their own transactions" ON transactions
FOR INSERT WITH CHECK (true);

-- Allow users to update their own transactions (if needed)
CREATE POLICY "Users can update their own transactions" ON transactions
FOR UPDATE USING (user_id = current_setting('request.jwt.claims')::json->>'user_id');
```

## That's it! 

Each user's transactions will be stored separately and persist across bot restarts 🎉

**Note:** The `user_id` field stores the Telegram user ID, so each user has their own separate balance and transaction history!

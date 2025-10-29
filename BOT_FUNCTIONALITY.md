# 🤖 Baro AI Bot - Complete Functionality Guide

This document provides a comprehensive guide to all bot functionalities, intended actions, and usage patterns.

## Table of Contents

1. [Transaction Management](#transaction-management)
2. [Account Management](#account-management)
3. [Budget Management](#budget-management)
4. [Viewing & Analytics](#viewing--analytics)
5. [Data Export](#data-export)
6. [Data Management](#data-management)
7. [Command Patterns](#command-patterns)

---

## Transaction Management

### Adding Transactions

The bot uses AI to understand natural language and extract transaction information automatically.

#### Income Transactions

**Purpose**: Record money received (salary, payments, gifts, etc.)

**Natural Language Examples:**
```
"I got paid $500"
"Received $200 salary"
"Made $150 freelancing"
"Got $50 as a gift"
"Earned $75 from side project"
```

**What the Bot Extracts:**
- ✅ Type: `income`
- ✅ Amount: Extracted number
- ✅ Description: Extracted from message
- ✅ Category: Auto-detected when clear (e.g., "salary", "freelancing")
- ✅ Account: Current account or defaults to "cash"

**Bot Response:**
```
✅ Added income of $500.00 for got paid in cash. Current balance: $500.00
```

#### Expense Transactions

**Purpose**: Record money spent (purchases, bills, services, etc.)

**Natural Language Examples:**
```
"Spent $50 on groceries"
"Paid $30 for lunch"
"Bought gas for $40"
"Coffee cost $5"
"Paid $100 rent"
"Dining out $25"
```

**What the Bot Extracts:**
- ✅ Type: `expense`
- ✅ Amount: Extracted number
- ✅ Description: Extracted from message
- ✅ Category: Auto-detected (e.g., "groceries", "dining", "gas", "rent")
- ✅ Account: Current account or defaults to "cash"

**Bot Response:**
```
✅ Added expense of $50.00 for groceries in cash. Current balance: $450.00
```

#### Amount Formats Supported

The bot understands various amount formats:
- `$50` → 50
- `50 dollars` → 50
- `$50.00` → 50
- `50` → 50 (assumed as currency)
- `fifty dollars` → (parsed by AI)

#### Category Auto-Detection

The bot automatically detects categories from context:
- **Food**: groceries, lunch, dinner, food, restaurant, dining
- **Transport**: gas, fuel, taxi, uber, parking, transportation
- **Bills**: rent, utility, electricity, water, internet
- **Entertainment**: movie, cinema, game, subscription
- **Shopping**: clothes, electronics, purchase
- **Health**: medical, doctor, pharmacy, medicine

---

## Account Management

### Purpose

Manage multiple accounts (cash, bank, credit card, etc.) to track transactions separately.

### Viewing Accounts

**Command:**
- Natural: `"Show my accounts"`, `"List accounts"`, `"What accounts do I have?"`
- Explicit: `accounts`

**Bot Response:**
```
🏦 Your accounts:

1. cash (current)
2. bank
3. credit-card
```

The current account is marked with "(current)".

### Creating Accounts

**Command:**
- Natural: `"Create account bank"`, `"Add account credit-card"`, `"New account savings"`
- Explicit: `account add bank`

**Bot Response:**
```
✅ Account "bank" created.
```

**Notes:**
- Account names are converted to lowercase
- Duplicate names are ignored
- "cash" is the default account (created automatically)

### Switching Accounts

**Command:**
- Natural: `"Use bank account"`, `"Switch to card"`, `"Change to savings"`
- Explicit: `account use bank`

**Bot Response:**
```
✅ Current account set to "bank".
```

**Impact:**
- All subsequent transactions will use the selected account
- Previous transactions remain unchanged
- Account must exist (create it first if needed)

### Account Workflow Example

```
User: "Create account bank"
Bot: ✅ Account "bank" created.

User: "Switch to bank"
Bot: ✅ Current account set to "bank".

User: "Paid $100 for groceries"
Bot: ✅ Added expense of $100.00 for groceries in bank. Current balance: $400.00

User: "Use cash"
Bot: ✅ Current account set to "cash".

User: "Bought coffee $5"
Bot: ✅ Added expense of $5.00 for coffee in cash. Current balance: $395.00
```

---

## Budget Management

### Purpose

Set spending limits for the current month (overall or category-specific) and track progress.

### Setting Overall Budget

**Command:**
- Natural: `"Set budget $500"`, `"Budget $1000 for this month"`, `"Create $750 budget"`
- Explicit: Budget creation via AI

**Bot Response:**
```
✅ Budget set: $500.00 for overall spending this month (January 2024).
```

**What it does:**
- Sets an overall spending limit for the current month
- Applies to all expenses regardless of category
- Can be replaced by setting a new budget (with confirmation)

### Setting Category Budget

**Command:**
- Natural: `"Budget $300 for groceries"`, `"Set $200 dining budget"`, `"$150 for gas"`
- Explicit: Budget creation via AI with category

**Bot Response:**
```
✅ Budget set: $300.00 for "groceries" this month (January 2024).
```

**What it does:**
- Sets a spending limit for a specific category
- Only tracks expenses in that category
- Multiple category budgets can exist simultaneously

### Viewing Budgets

**Command:**
- Natural: `"Show budgets"`, `"List my budgets"`, `"What are my budgets?"`
- Explicit: `budgets`

**Bot Response:**
```
💰 Budgets for January 2024:

• Overall Budget: $1000.00 (expense)
• groceries: $300.00 (expense)
• dining: $200.00 (expense)
```

**Shows:**
- All budgets for the current month
- Budget type (expense/income)
- Overall vs category-specific budgets

### Budget Status & Tracking

**Command:**
- Natural: `"Budget status"`, `"How am I doing?"`, `"Check my budget"`
- Explicit: `budget status`

**Bot Response:**
```
📊 Budget Status:

✅ Overall Budget:
   Budget: $1000.00
   Spent: $650.00
   Remaining: $350.00
   65.0% spent

⚠️ groceries:
   Budget: $300.00
   Spent: $320.00
   Remaining: $-20.00
   106.7% spent

✅ dining:
   Budget: $200.00
   Spent: $150.00
   Remaining: $50.00
   75.0% spent
```

**Information Provided:**
- Budget amount vs actual spending
- Remaining budget (negative = over budget)
- Percentage spent
- Visual indicators (✅ = on track, ⚠️ = over budget)

### Budget Override

**Scenario**: You already have a budget for the month and want to change it.

**Workflow:**
```
User: "Budget $500 for groceries"
Bot: ⚠️ Budget Already Exists

You already have a $300.00 budget for "groceries" this month.

To replace it with $500.00, reply: "yes" or "confirm"
To cancel, just ignore this message.

User: "yes"
Bot: ✅ Budget updated: $500.00 for "groceries" this month (January 2024).
```

**Safety Feature:**
- Prevents accidental overwrites
- Shows existing budget amount
- Requires explicit confirmation

### Budget Best Practices

1. **Set budgets at month start**: Set all budgets on the 1st
2. **Review regularly**: Check budget status weekly
3. **Be realistic**: Set achievable but meaningful limits
4. **Use category budgets**: More granular control than overall
5. **Adjust when needed**: Update budgets if circumstances change

---

## Viewing & Analytics

### Balance

**Purpose**: Check current account balance.

**Command:**
- Natural: `"What's my balance?"`, `"Show balance"`, `"How much do I have?"`
- Explicit: `balance`

**Bot Response:**
```
💰 Current balance: $1,234.56
```

**Calculation:**
- Sum of all income minus sum of all expenses
- Includes all transactions across all accounts
- Real-time calculation

### Transaction History

**Purpose**: View recent transactions.

**Command:**
- Natural: `"Show history"`, `"List transactions"`, `"Recent transactions"`
- Explicit: `history`

**Bot Response:**
```
📋 Last 10 transactions:

1. 📤 -$50.00 - groceries [ID: 12345]
2. 📥 +$500.00 - got paid [ID: 12344]
3. 📤 -$30.00 - lunch [ID: 12343]
4. 📥 +$200.00 - salary [ID: 12342]
...
```

**Shows:**
- Last 10 transactions (most recent first)
- Type indicator (📥 = income, 📤 = expense)
- Amount with sign
- Description
- Transaction ID (for deletion)

### Monthly View

**Purpose**: View all transactions for a specific month.

**Command:**
- Natural: `"Show January"`, `"Transactions for month 1"`, `"What did I spend in December?"`
- Explicit: `month 1` (1 = first month in list)

**Workflow:**
```
User: "months"
Bot: 📅 Available months:

1. January 2024
2. December 2023
3. November 2023

User: "month 1"
Bot: 📅 January 2024:

1. 📥 +$500.00 - salary (1/15/2024)
2. 📤 -$50.00 - groceries (1/14/2024)
3. 📤 -$30.00 - lunch (1/13/2024)
...

📊 Summary:
📥 Income: $500.00
📤 Expenses: $450.00
💰 Net: $50.00
```

**Includes:**
- All transactions for the month
- Transaction dates
- Monthly summary (income, expenses, net)

### Categories List

**Purpose**: View all unique categories from your transactions.

**Command:**
- Natural: `"Show categories"`, `"List categories"`, `"What categories do I have?"`
- Explicit: `categories`

**Bot Response:**
```
📂 Your categories:

1. groceries
2. dining
3. gas
4. salary
5. rent
...
```

**Notes:**
- Categories are automatically created from transactions
- Sorted alphabetically
- Uncategorized transactions don't appear in list

### Category Statistics

**Purpose**: See spending breakdown by category for a specific month.

**Command:**
- Natural: `"Category stats for January"`, `"Show category breakdown for month 1"`
- Explicit: `catstats 1`

**Bot Response:**
```
📊 Category Stats for January 2024:

1. groceries:
   📥 Income: $0.00
   📤 Expenses: $200.00
   💰 Net: -$200.00

2. dining:
   📥 Income: $0.00
   📤 Expenses: $150.00
   💰 Net: -$150.00

3. salary:
   📥 Income: $500.00
   📤 Expenses: $0.00
   💰 Net: +$500.00
```

**Information:**
- Income and expenses per category
- Net amount (income - expenses)
- Sorted by absolute net amount

---

## Data Export

### Export All Transactions

**Purpose**: Download all transactions as CSV for analysis or backup.

**Command:**
- Natural: `"Export data"`, `"Download transactions"`, `"Export everything"`
- Explicit: `export`

**Bot Response:**
```
📊 Exported 150 transaction(s)
💰 Current balance: $1,234.56
```

**File Details:**
- Filename: `baro-ai-export-2024-01-15.csv`
- Format: CSV with headers
- Columns: ID, Date, Type, Amount, Description, Category, Account
- Sent as Telegram document

**Use Cases:**
- Monthly backup
- Analysis in Excel/Sheets
- Financial reports
- Tax preparation

### Export by Month

**Purpose**: Download transactions for a specific month only.

**Command:**
- Natural: `"Export January"`, `"Download month 1 transactions"`
- Explicit: `export month 1`

**Workflow:**
```
User: "export month 1"
Bot: 📊 Exported 25 transaction(s) from January 2024
```

**File Details:**
- Filename: `baro-ai-export-2024-01.csv`
- Contains only transactions from selected month
- Same CSV format as full export

**Best Practice:**
- Export monthly for record-keeping
- Use for monthly financial reviews

---

## Data Management

### Delete Transaction

**Purpose**: Remove a single transaction by ID.

**Command:**
- Explicit only: `delete 12345` (ID from history)

**Bot Response:**
```
✅ Transaction 12345 deleted. New balance: $1,184.56
```

**Impact:**
- Removes transaction from database
- Recalculates balance
- Cannot be undone

**Safety:**
- Requires explicit command (not AI-inferred)
- Must provide exact transaction ID

### Clear Month

**Purpose**: Delete all transactions for a specific month.

**Command:**
- Explicit only: `clear month 1`

**Workflow:**
```
User: "clear month 1"
Bot: ⚠️ WARNING: Clear Month?

This will delete 25 transaction(s) from January 2024 permanently!

To confirm, reply: "yes" or "confirm"
To cancel, just ignore this message.

User: "yes"
Bot: ✅ Cleared 25 transaction(s) from January 2024.
💰 New balance: $1,209.56
```

**Safety:**
- Shows count of transactions to be deleted
- Requires explicit confirmation
- Cannot be undone

### Clear All Transactions

**Purpose**: Delete all transactions (but keep budgets and accounts).

**Command:**
- Explicit only: `clear`

**Workflow:**
```
User: "clear"
Bot: ⚠️ WARNING: Clear All Transactions?

This will delete 150 transactions permanently!

Balance: $1,234.56

To confirm, reply: "yes clear all" or "confirm clear"
To cancel, just ignore this message.

User: "yes clear all"
Bot: ✅ Cleared 150 transactions from database and memory.
💰 Balance reset to $0.00
```

**Impact:**
- Deletes all transactions
- Keeps accounts and budgets
- Resets balance to zero
- Requires specific confirmation phrase

### Clear All Data

**Purpose**: Complete reset - delete everything (transactions, budgets, accounts).

**Command:**
- Explicit only: `clear all data` or `delete all data` or `reset all`

**Workflow:**
```
User: "clear all data"
Bot: ⚠️ CRITICAL WARNING: Clear ALL Data?

This will PERMANENTLY delete:
• 150 transaction(s)
• 5 budget(s)
• 3 account(s)

This action CANNOT be undone!

To confirm, reply: "yes delete everything" or "confirm delete all"
To cancel, just ignore this message.

User: "yes delete everything"
Bot: ✅ All Data Cleared

Deleted:
• 150 transaction(s)
• 5 budget(s)
• 3 account(s)

💰 Balance reset to $0.00

Your account has been reset to a fresh start.
```

**Safety Features:**
- Shows detailed breakdown of what will be deleted
- Requires very explicit confirmation
- Cannot be undone
- Use only when starting completely fresh

---

## Command Patterns

### Natural Language (Recommended)

The bot is designed to understand conversational commands:

**Examples:**
- ✅ "What's my balance?" → balance
- ✅ "Show me last month" → month view
- ✅ "Set a $500 budget" → budget creation
- ✅ "Export my data" → export

**Benefits:**
- More intuitive
- Faster input
- Works with voice input
- Natural conversation flow

**When to Use:**
- Most commands support natural language
- View commands work best with natural language
- Transaction input is always natural language

### Explicit Commands

Some commands require explicit syntax for safety:

**Destructive Operations:**
- `delete 12345` - Must provide exact ID
- `clear month 1` - Explicit command prevents accidents
- `clear` - Must type exactly
- `clear all data` - Very explicit to prevent data loss

**Benefits:**
- Prevents accidental execution
- Clear intent
- Safety mechanism

**When to Use:**
- Delete operations
- Clearing data
- Critical operations

### Hybrid Approach

The bot uses a hybrid approach:
- **Non-destructive**: Natural language preferred
- **Destructive**: Explicit commands required
- **AI Routing**: AI determines intent for safe commands
- **Manual Routing**: Destructive commands bypass AI

---

## Best Practices

### Daily Usage

1. **Add transactions immediately**: Don't wait - record as you spend
2. **Use natural language**: It's faster and more intuitive
3. **Be descriptive**: Better descriptions help with categorization

### Monthly Routine

1. **Set budgets**: At the start of each month
2. **Review status**: Check budget status weekly
3. **Export data**: Export at month end for records
4. **Analyze patterns**: Use category stats to understand spending

### Account Management

1. **Use multiple accounts**: Separate cash, bank, card
2. **Switch appropriately**: Use the correct account for each transaction
3. **Keep organized**: Consistent account naming

### Safety

1. **Export regularly**: Back up your data
2. **Review before deleting**: Check transactions before clearing
3. **Use confirmations**: Don't ignore confirmation prompts
4. **Test new features**: Try view commands before destructive ones

---

## Troubleshooting

### Bot Doesn't Understand Transaction

**Problem**: Bot responds with "I couldn't extract a transaction..."

**Solutions:**
- Be more explicit about amount: "Spent 50 dollars" vs "bought something"
- Include currency: "$50" vs "50"
- Be clear about type: "paid" or "spent" for expenses
- Try rephrasing: "bought groceries for $50" instead of "groceries"

### Budget Not Appearing

**Problem**: Set budget but doesn't show in status

**Check:**
- Verify it's the current month (budgets are month-specific)
- Check budget type (expense vs income)
- Try "show budgets" to list all

### Account Not Switching

**Problem**: Transactions still using old account

**Solutions:**
- Verify account exists: "show accounts"
- Create account if missing: "create account bank"
- Confirm switch with "show accounts" after switching

### Export Empty or Missing Data

**Problem**: Export file has no transactions

**Check:**
- Verify you have transactions: "history"
- Check date range: Transactions might be in different month
- Try full export: "export" (all transactions)

---

**This guide covers all major functionalities. For technical details, see [README.md](./README.md).**


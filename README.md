# Baro AI - Telegram Accounting Bot

An AI-powered Telegram bot that tracks your expenses and income through natural language messages.

## Features

- 📱 Telegram bot integration
- 🤖 AI-powered parsing of transactions using LangChain (Groq/OpenAI)
- 💰 Automatic balance tracking
- 📊 Expense categorization
- 📅 Monthly transaction history
- 💾 Monthly budgets with tracking
- 📈 Category statistics
- 📋 CSV export (all transactions or by month)
- 🗄️ Supabase persistence (optional, recommended)

## Prerequisites

- Node.js 18 or higher
- Telegram bot token (get from [@BotFather](https://t.me/BotFather))
- Groq API key (free at [console.groq.com](https://console.groq.com)) OR OpenAI API key
- Supabase account (optional, for data persistence)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/baro-ai.git
cd baro-ai
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
GROQ_API_KEY=your_groq_api_key
LLM_PROVIDER=groq

# Optional (for data persistence)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

### Development Mode

Run the bot in development mode:
```bash
npm run dev
```

### Production Mode

Build and run:
```bash
npm run build
npm start
```

## Telegram Commands

Once your bot is running, open Telegram and start chatting:

### Transaction Commands
- `"I spent $50 on groceries"` - Add an expense
- `"Received $200 salary"` - Add income
- Natural language: `"Paid $30 for lunch"`

### View Commands
- `balance` - Current balance
- `history` - Last 10 transactions
- `months` - List available months
- `month 1` - View transactions for month #1

### Category Commands
- `categories` - List all categories
- `catstats 1` - Category stats for month #1

### Budget Commands
- `budget $500` - Set $500 overall budget
- `budget $500 groceries` - Set $500 budget for groceries
- `budgets` - List all budgets
- `budget status` - Check budget status

### Delete Commands
- `delete 12345` - Delete transaction by ID
- `clear month 1` - Clear all transactions for month #1
- `clear` - Delete all transactions (with confirmation)

### Export Commands
- `export` - Export all transactions as CSV
- `export month 1` - Export transactions for month #1

### Help
- `help` - Show all commands

## Database Setup

For persistent storage, set up Supabase:

1. Create account at [supabase.com](https://supabase.com) (free tier available)
2. Run the SQL scripts from `SUPABASE_SETUP.md`
3. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your `.env`

Without Supabase, data is stored in memory only (lost on restart).

## Project Structure

```
baro-ai/
├── src/
│   ├── telegram/
│   │   └── bot.ts              # Telegram bot entry point
│   ├── agent/
│   │   ├── accounting-agent.ts # LangChain agent for parsing
│   │   ├── expense-tracker.ts  # In-memory expense tracker
│   │   └── persisted-tracker.ts # Supabase-backed tracker
│   └── config/
│       ├── settings.ts         # Configuration management
│       └── database.ts         # Supabase client
├── package.json
├── tsconfig.json
└── .env                        # Environment variables
```

## Deployment

See `REPLIT_SETUP.md` for instructions on deploying to Replit (free).

## Learn More

- [LangChain.js Documentation](https://js.langchain.com/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Groq API](https://console.groq.com)
- [Supabase Documentation](https://supabase.com/docs)

## License

MIT

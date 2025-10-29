# 🤖 Baro AI - Intelligent Telegram Accounting Bot

An AI-powered Telegram bot that tracks your expenses and income through natural language conversations. Built with TypeScript, LangChain, and Supabase following SOLID principles.

## ✨ Features

- 🤖 **AI-Powered Understanding**: Natural language processing using LangChain (Groq/OpenAI)
- 💰 **Transaction Tracking**: Automatic income and expense recording
- 📊 **Smart Categorization**: Automatic category detection from descriptions
- 🏦 **Multi-Account Support**: Track transactions across multiple accounts (cash, bank, card, etc.)
- 📅 **Monthly Budgets**: Set overall or category-specific budgets with status tracking
- 📈 **Analytics**: Category statistics, monthly summaries, and spending insights
- 💾 **Data Persistence**: Supabase-backed storage (recommended) or in-memory mode
- 📋 **CSV Export**: Export transactions for analysis in spreadsheet applications
- 🔒 **Data Safety**: Confirmation prompts for destructive operations
- ⚡ **Clean Architecture**: SOLID principles, modular design, easy to extend

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **Telegram Bot Token** - Get from [@BotFather](https://t.me/BotFather) on Telegram
- **Groq API Key** (Free) - Get from [console.groq.com](https://console.groq.com)
  - OR **OpenAI API Key** - Get from [platform.openai.com](https://platform.openai.com)
- **Supabase Account** (Free) - For data persistence ([supabase.com](https://supabase.com))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/baro-ai.git
   cd baro-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   # Required
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   GROQ_API_KEY=your_groq_api_key
   LLM_PROVIDER=groq  # or 'openai'
   
   # Required for data persistence (recommended)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database:**
   
   See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions on creating tables.

5. **Run the bot:**
   ```bash
   npm run build
   npm start
   ```

   Or in development mode:
   ```bash
   npm run dev
   ```

## 📱 Bot Functionalities

### 💬 Adding Transactions (Natural Language)

The bot understands natural language! Just describe your transactions:

**Income Examples:**
- "I got paid $500"
- "Received $200 salary"
- "Made $150 freelancing"

**Expense Examples:**
- "Spent $50 on groceries"
- "Paid $30 for lunch"
- "Bought gas for $40"
- "Coffee cost $5"

The AI automatically extracts:
- ✅ Transaction type (income/expense)
- ✅ Amount
- ✅ Description
- ✅ Category (when clear from context)
- ✅ Account (uses current account or defaults to "cash")

### 📊 View Commands (Natural Language)

All view commands work with natural language or explicit commands:

**Balance & History:**
- "What's my balance?" or `balance`
- "Show my transactions" or `history`
- "Show last month's spending" or `month 1`

**Months & Categories:**
- "List all months" or `months`
- "Show categories" or `categories`
- "Category stats for January" or `catstats 1`

### 🏦 Account Management

**View Accounts:**
- "Show my accounts" or `accounts`
- Shows all accounts with current account highlighted

**Create Account:**
- "Create account bank" or `account add bank`
- "Add account credit-card"

**Switch Account:**
- "Use bank account" or `account use bank`
- "Switch to card"
- All new transactions will use the selected account

### 💰 Budget Management

**Set Budget:**
- "Set budget $500" (overall budget)
- "Budget $300 for groceries" (category-specific)
- "Create $1000 monthly budget"

**View Budgets:**
- "Show budgets" or `budgets`
- Lists all budgets for current month

**Budget Status:**
- "How am I doing with budgets?" or `budget status`
- Shows spending vs budget, remaining amount, and percentage used
- Warnings when approaching or exceeding budget

**Budget Override:**
- If a budget already exists, the bot will ask for confirmation before replacing it

### 📋 Export Data

**Export All Transactions:**
- "Export all data" or `export`
- Downloads CSV file with all transactions

**Export by Month:**
- "Export January" or `export month 1`
- Downloads CSV file for specific month

CSV files include: ID, Date, Type, Amount, Description, Category, Account

### 🗑️ Delete Operations (Require Explicit Commands)

**For safety, delete operations require explicit commands:**

**Delete Transaction:**
- `delete 12345` - Delete transaction by ID (shown in history)

**Clear Month:**
- `clear month 1` - Clear all transactions for month #1
- Requires confirmation: reply "yes" or "confirm"

**Clear All Transactions:**
- `clear` - Delete all transactions
- Requires confirmation: reply "yes clear all"

**Clear All Data:**
- `clear all data` - Delete EVERYTHING (transactions, budgets, accounts)
- Requires explicit confirmation: reply "yes delete everything"

## 🎯 Intended Actions & Use Cases

### Personal Finance Tracking
- Track daily expenses automatically
- Monitor income sources
- Analyze spending by category
- Stay within monthly budgets

### Budget Monitoring
- Set realistic spending limits
- Get alerts when approaching budget limits
- Track category-specific budgets
- Review budget performance monthly

### Financial Analysis
- Export data for detailed analysis
- Review monthly summaries
- Identify spending patterns
- Category-wise breakdowns

### Multi-Account Management
- Separate cash, bank, and card transactions
- Switch between accounts easily
- Track balances across accounts

## 📚 Command Reference

| Command Type | Natural Language Example | Explicit Command |
|-------------|-------------------------|------------------|
| **Add Income** | "Got paid $500" | (AI understands automatically) |
| **Add Expense** | "Spent $50 on groceries" | (AI understands automatically) |
| **Balance** | "What's my balance?" | `balance` |
| **History** | "Show transactions" | `history` |
| **Months** | "List months" | `months` |
| **Month View** | "Show January" | `month 1` |
| **Categories** | "List categories" | `categories` |
| **Category Stats** | "Category stats for month 1" | `catstats 1` |
| **Accounts** | "Show accounts" | `accounts` |
| **Add Account** | "Create account bank" | `account add bank` |
| **Switch Account** | "Use bank account" | `account use bank` |
| **Set Budget** | "Budget $500 for groceries" | (AI understands) |
| **View Budgets** | "Show budgets" | `budgets` |
| **Budget Status** | "Budget status" | `budget status` |
| **Export** | "Export data" | `export` |
| **Export Month** | "Export January" | `export month 1` |
| **Delete** | — | `delete 12345` |
| **Clear Month** | — | `clear month 1` |
| **Clear All** | — | `clear` |
| **Clear Everything** | — | `clear all data` |
| **Help** | — | `help` |

## 🏗️ Architecture

The codebase follows SOLID principles with a clean, modular architecture:

```
src/
├── interfaces/          # Type definitions and interfaces
│   ├── command.interface.ts
│   └── expense-tracker.interface.ts
├── agent/               # Core business logic
│   ├── accounting-agent.ts     # AI-powered message processing
│   ├── persisted-tracker.ts    # Data persistence layer
│   └── expense-tracker.ts      # Transaction models
├── telegram/
│   ├── bot.ts                  # Main bot entry point
│   ├── handlers/               # Command handlers (SOLID)
│   │   ├── base-command-handler.ts
│   │   ├── view-command-handlers.ts
│   │   ├── budget-command-handlers.ts
│   │   ├── account-command-handlers.ts
│   │   ├── export-command-handlers.ts
│   │   └── destructive-command-handlers.ts
│   ├── router/                 # Command routing
│   │   └── command-router.ts
│   └── services/               # Services
│       ├── confirmation-manager.service.ts
│       └── message-formatter.service.ts
└── config/             # Configuration
    ├── settings.ts
    └── database.ts
```

### Design Principles

- **Single Responsibility**: Each handler handles one command type
- **Open/Closed**: Easy to extend with new commands
- **Dependency Inversion**: Depends on interfaces, not implementations
- **Interface Segregation**: Focused, specific interfaces
- **Separation of Concerns**: Handlers, services, and routing are separate

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Get from [@BotFather](https://t.me/BotFather) |
| `GROQ_API_KEY` | Yes* | Free Groq API key |
| `OPENAI_API_KEY` | Yes* | Alternative to Groq |
| `LLM_PROVIDER` | Yes | `groq` or `openai` |
| `SUPABASE_URL` | Recommended | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Recommended | Your Supabase anon key |

*One of Groq or OpenAI API key is required

### LLM Provider Options

**Groq (Recommended - Free):**
- Fast responses
- Free tier available
- Good for development and personal use

**OpenAI:**
- More powerful models
- Paid (pay-as-you-go)
- Better for production with high volume

## 📖 Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Database setup guide
- **[TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)** - Bot creation guide
- **[REPLIT_SETUP.md](./REPLIT_SETUP.md)** - Free hosting on Replit

## 🚢 Deployment

### Free Hosting Options

1. **Replit** - See [REPLIT_SETUP.md](./REPLIT_SETUP.md)
   - Free tier available
   - Auto-deploy from GitHub
   - Easy setup

2. **Other Options:**
   - Railway
   - Render
   - Fly.io
   - Any Node.js hosting service

### Production Considerations

- Use Supabase for data persistence (not in-memory)
- Set up environment variables securely
- Monitor bot uptime
- Consider using a process manager like PM2

## 🤝 Contributing

Contributions are welcome! The codebase is designed to be easily extensible:

1. Add new commands by creating handlers in `src/telegram/handlers/`
2. Register handlers in `src/telegram/bot.ts`
3. Follow SOLID principles
4. Add tests for new functionality

## 📝 License

MIT License - feel free to use and modify for your needs.

## 🔗 Links

- [LangChain.js Documentation](https://js.langchain.com/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Groq API](https://console.groq.com)
- [Supabase Documentation](https://supabase.com/docs)

## 💡 Tips

1. **Use Natural Language**: The bot understands conversational commands better than explicit syntax
2. **Set Budgets Early**: Set monthly budgets at the start of each month
3. **Categorize Consistently**: The AI learns from your categorization patterns
4. **Export Regularly**: Export data monthly for backup and analysis
5. **Multiple Accounts**: Use different accounts for better financial organization

## ❓ FAQ

**Q: Is my data safe?**  
A: Yes! Data is stored in your Supabase database with Row Level Security. Only you can access your data.

**Q: Can I use it without Supabase?**  
A: Yes, but data will be lost when the bot restarts. Supabase is recommended.

**Q: Is Groq API really free?**  
A: Yes, Groq offers a free tier that's sufficient for personal use.

**Q: Can I add custom categories?**  
A: Categories are automatically created from your transaction descriptions. The bot learns from your usage.

**Q: How do I backup my data?**  
A: Use the export feature regularly, or rely on Supabase's built-in backups.

---

**Made with ❤️ for better personal finance management**

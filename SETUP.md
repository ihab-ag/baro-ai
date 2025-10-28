# Setup Guide

This guide will help you set up and run your Baro AI accounting agent.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

1. Create a `.env` file in the project root:
```bash
touch .env
```

2. Add your configuration to `.env`:
```env
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini
```

**Important**: You need an OpenAI API key to use the LangChain agent. You can get one at: https://platform.openai.com/api-keys

## Step 3: Test the Agent

Before integrating with WhatsApp, test the agent locally:

```bash
npm run test:dev
```

This will run sample messages and show you how the agent processes transactions.

## Step 4: Run the Agent

### Development Mode

Run the agent in development mode with hot reload:

```bash
npm run dev
```

### Production Mode

Build and run:

```bash
npm run build
npm start
```

## Step 5: How the Agent Works

### Basic Usage

The agent processes natural language messages and extracts transactions:

**Examples:**
- "I spent $50 on groceries" → Records an expense of $50
- "Received $200 salary" → Records income of $200
- "Paid $30 for lunch" → Records an expense of $30

### How LangChain is Used

1. **Message Processing**: The agent uses LangChain's ChatOpenAI to extract transaction information from natural language messages.

2. **Structured Output**: The LLM is prompted to return JSON with:
   - Transaction type (income/expense)
   - Amount
   - Description
   - Category (optional)

3. **Balance Tracking**: Transactions are stored in the `ExpenseTracker` class which maintains a running balance.

4. **Memory**: Uses LangChain's BufferMemory to maintain conversation context.

## Step 6: Understanding the Architecture

```
src/
├── index.ts                    # Entry point
├── agent/
│   ├── accounting-agent.ts     # LangChain agent for processing messages
│   └── expense-tracker.ts      # Balance and transaction tracking
├── whatsapp/
│   └── handler.ts              # WhatsApp integration
└── config/
    └── settings.ts             # Configuration management
```

## Step 7: Next Steps

To integrate with WhatsApp:

1. Choose a WhatsApp API service (Twilio, MessageBird, or WhatsApp Business API)
2. Implement webhooks in `src/whatsapp/handler.ts`
3. Configure webhook URLs and tokens in `.env`

## Tips

- The agent uses LangChain's conversation memory to maintain context
- Transactions are kept in memory by default (you can add database persistence)
- The agent can categorize transactions (groceries, dining, etc.)
- TypeScript provides type safety and better IDE support

## Troubleshooting

**Problem**: "OpenAI API key not found"
- Solution: Make sure you've created the `.env` file and added your API key

**Problem**: Import errors
- Solution: Make sure you've run `npm install`

**Problem**: Agent not extracting amounts properly
- Solution: Make sure your messages include clear amounts (e.g., "$50", "50 dollars", etc.)

## Why JavaScript/TypeScript?

- ✅ You already have Node.js installed (v24.7.0)
- ✅ Same LangChain capabilities as Python
- ✅ Great TypeScript support
- ✅ Easier to deploy (Vercel, Render, Railway, etc.)
- ✅ Modern async/await syntax
- ✅ Rich ecosystem of packages

## Learn More

- LangChain.js Documentation: https://js.langchain.com/
- OpenAI API: https://platform.openai.com/docs
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- TypeScript: https://www.typescriptlang.org/
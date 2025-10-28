# Getting Started with Baro AI

Welcome! This guide will help you get your WhatsApp AI accounting agent running in minutes.

## Why JavaScript/TypeScript?

✅ You have Node.js already installed (v24.7.0)  
✅ Same powerful LangChain capabilities as Python  
✅ Better type safety with TypeScript  
✅ Easier deployment to modern platforms  
✅ Rich ecosystem of packages  

## Quick Start (5 minutes)

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/signup
2. Create an account (or sign in)
3. Navigate to https://platform.openai.com/api-keys
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 2. Set Up Your Project

The project is already set up! Just configure it:

```bash
# Create your .env file
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Test the Agent

Run the test script to see the agent in action:

```bash
npm run test:dev
```

You should see output like:
```
🚀 Initializing Baro AI Accounting Agent...
Agent initialized. Testing with sample messages:

📨 Message: I received $500 salary today
✅ Added income of $500.00 for I received $500 salary today. Current balance: $500.00
💰 Current Balance: $500.00

📨 Message: Spent $45 on groceries at the supermarket
✅ Added expense of $45.00 for Spent $45 on groceries at the supermarket. Current balance: $455.00
💰 Current Balance: $455.00
```

## What You Can Do Now

### Run the Agent

```bash
# Development mode with hot reload
npm run dev

# Or production build
npm run build && npm start
```

### Send Messages

The agent can understand natural language:

**Income Examples:**
- "Received $1000 salary"
- "Got $50 from client"
- "I earned $200 today"

**Expense Examples:**
- "Spent $45 on groceries"
- "Paid $80 for dinner"
- "Bought $120 worth of gas"

### Check Your Balance

Ask for your balance:
```
"What's my balance?"
"How much money do I have?"
```

## Project Structure

```
baro-ai/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── agent/
│   │   ├── accounting-agent.ts  # AI agent with LangChain
│   │   └── expense-tracker.ts   # Balance tracking
│   ├── whatsapp/
│   │   └── handler.ts          # WhatsApp integration
│   └── config/
│       └── settings.ts         # Configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
└── .env                        # Your API keys
```

## Next Steps

1. **Add Data Persistence**: Save transactions to a database
2. **Integrate WhatsApp**: Add webhook handling
3. **Add Image Processing**: OCR for receipts
4. **Deploy**: Host on Vercel, Render, or Railway

## Troubleshooting

**"OpenAI API key not found"**
- Make sure you created the `.env` file
- Check that the key is correct
- Restart your terminal after creating `.env`

**Build errors**
- Run `npm install` again
- Check that Node.js is v18+

**Agent not working**
- Verify your API key is valid
- Check you have credits in your OpenAI account

## Learn More

- Read [SETUP.md](SETUP.md) for detailed setup
- Check [README.md](README.md) for features
- LangChain.js docs: https://js.langchain.com/

## Need Help?

Common issues and solutions are in SETUP.md. The agent is designed to work out of the box with just an OpenAI API key!

Happy tracking! 💰📊

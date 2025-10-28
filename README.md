# Baro AI - WhatsApp Accounting Agent

An AI-powered WhatsApp agent that tracks your accounting through text messages and images.

## Features

- 📱 WhatsApp integration for convenient expense tracking
- 🤖 AI-powered parsing of transactions from text using LangChain
- 📸 Image recognition for receipts and bills (coming soon)
- ➕ Automatic balance tracking
- 📊 Expense categorization

## Prerequisites

- Node.js 18 or higher
- OpenAI API key
- WhatsApp Business API access (or use a WhatsApp wrapper)

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

3. Create a `.env` file with your configuration:
```bash
cp .env.example .env
```

4. Update the `.env` file with your API keys and credentials.

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
WHATSAPP_PHONE_NUMBER=your_whatsapp_number
```

## Usage

### Development Mode

Run the agent in development mode:

```bash
npm run dev
```

### Production Mode

Build and run:

```bash
npm run build
npm start
```

### Test the Agent

Run the test script:

```bash
npm run test:dev
```

Send messages to your WhatsApp number with transactions like:
- "Spent $50 on groceries"
- "Received $200 salary"
- "Paid $30 for restaurant"

The agent will automatically update your balance!

## Project Structure

```
baro-ai/
├── src/
│   ├── index.ts                 # Main application entry point
│   ├── agent/                   # Core agent logic
│   │   ├── accounting-agent.ts  # LangChain agent for accounting
│   │   └── expense-tracker.ts   # Balance and expense tracking
│   ├── whatsapp/                # WhatsApp integration
│   │   └── handler.ts          # Message handler
│   ├── config/                  # Configuration
│   │   └── settings.ts         # Settings management
│   └── utils/                   # Utilities
├── tests/                       # Tests
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
└── .env                        # Environment variables
```

## Learn More

- [LangChain.js Documentation](https://js.langchain.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

## License

MIT
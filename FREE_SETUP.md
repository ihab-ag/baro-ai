# 🆓 Free Development Setup Guide

**No credit card needed!** This guide shows you how to get your WhatsApp AI agent running for FREE.

## Option 1: Groq (Recommended - 100% Free)

### Step 1: Get FREE Groq API Key

1. Go to **https://console.groq.com/keys**
2. Sign up with your email (free account)
3. Click "Create API Key"
4. Copy the key (starts with `gsk_`)

### Step 2: Create Your .env File

```bash
cp .env.example .env
```

Edit `.env` and add:
```env
# Use Groq (FREE!)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

### Step 3: Run Your Agent

```bash
npm run test:dev
```

**That's it!** You're running AI for free. Groq gives you:
- ✅ 30 requests per minute (FREE tier)
- ✅ Fast responses (uses Llama models)
- ✅ No credit card needed
- ✅ Perfect for development

---

## Option 2: OpenAI (Free Credits)

### Step 1: Get OpenAI API Key

1. Go to **https://platform.openai.com/signup**
2. New accounts get $5 free credits
3. Navigate to **https://platform.openai.com/api-keys**
4. Create a new API key
5. Copy the key (starts with `sk-`)

### Step 2: Create Your .env File

```bash
cp .env.example .env
```

Edit `.env` and add:
```env
# Use OpenAI (with free credits)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your_key_here
OPENAI_MODEL=gpt-4o-mini
```

### Step 3: Run Your Agent

```bash
npm run test:dev
```

**Note**: OpenAI free credits expire after ~3 months.

---

## Option 3: Local LLM (Completely Free Forever)

Want to use AI without any API calls?

### Install Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### Pull a Model

```bash
ollama pull llama3.2
```

### Use in Your Project

Update your code to connect to `http://localhost:11434` (Ollama's default API).

---

## Comparison

| Provider | Cost | Speed | Setup | Best For |
|----------|------|-------|-------|----------|
| **Groq** | ✅ FREE | ⚡ Fast | 🟢 Easy | Development |
| **OpenAI** | 💰 $5 free | ⚡ Fast | 🟢 Easy | Production |
| **Ollama** | ✅ FREE | 🐌 Slow | 🟡 Medium | Privacy |

## Recommendation

**Start with Groq**: It's free, fast, and easy to set up. Switch to OpenAI or Ollama later if needed!

---

## Quick Test

After setting up Groq or OpenAI:

```bash
npm run test:dev
```

You should see:
```
🚀 Using GROQ (FREE tier) for LLM
Processing: I received $500 salary today
✅ Added income of $500.00...
💰 Current Balance: $500.00
```

If it works, you're ready to build! 🎉

---

## Troubleshooting

### "GROQ_API_KEY not set"
- Make sure you created the `.env` file
- Check the key is correct (starts with `gsk_`)

### "OpenAI API key invalid"
- Verify your key at https://platform.openai.com/api-keys
- Check you still have credits

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## What's Next?

1. ✅ Get a free API key (choose Groq or OpenAI)
2. ✅ Run `npm run test:dev` to test
3. 📖 Read [GETTING_STARTED.md](GETTING_STARTED.md) for usage
4. 🚀 Build your WhatsApp integration!

Happy coding! 💰🤖

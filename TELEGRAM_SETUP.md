# 🤖 Telegram Bot Setup (2 Minutes)

## Step 1: Create Your Telegram Bot

1. Open Telegram app or web: https://web.telegram.org
2. Search for "**BotFather**" and start a chat
3. Send: `/newbot`
4. Follow the prompts:
   - Choose a name (e.g., "My Accounting Bot")
   - Choose a username (e.g., "my_accounting_bot")
5. BotFather will give you a **token** like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
6. **Copy this token** - you'll need it next!

## Step 2: Add Token to Your Project

1. Open `.env` in your project
2. Add your token:
   ```env
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

## Step 3: Run the Bot

```bash
npm run telegram
```

You should see:
```
🤖 Telegram bot started (polling). Send a DM to your bot.
```

## Step 4: Chat with Your Bot

1. In Telegram, search for your bot's username
2. Click "Start" or send "hi"
3. Your bot will respond!

## What You Can Do

**Send transactions:**
- "I spent $50 on groceries"
- "Received $200 salary"
- "Paid $30 for lunch"

**Commands:**
- Type `balance` - Check your balance
- Type `history` - See recent transactions
- Type `start` - Get help

## Troubleshooting

**Bot not responding?**
- Make sure `npm run telegram` is still running
- Check the token is correct in `.env`
- Make sure you clicked "Start" in Telegram

**Installation issue?**
```bash
npm install node-telegram-bot-api
```

That's it! Your bot is ready to track expenses 💰

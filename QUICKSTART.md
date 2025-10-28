# 🚀 Quick Start - Use Your Agent Now!

Your WhatsApp AI accounting agent is ready! Here's how to use it:

## Running the Interactive Chat

Start the interactive chat mode:

```bash
npm run chat
```

Or alternatively:

```bash
npm run interactive
```

## What You Can Do

### 1. Add Transactions

Just type what happened:

```
💬 You: I received $500 salary today
✅ Added income of $500.00 for salary. Current balance: $500.00
```

```
💬 You: Spent $45 on groceries
✅ Added expense of $45.00 for groceries. Current balance: $455.00
```

### 2. Check Balance

Type `balance` to see your current balance:

```
💬 You: balance
💰 Current Balance: $455.00
```

### 3. View History

Type `history` to see recent transactions:

```
💬 You: history
📋 Recent Transactions:
  1. -$45.00 - groceries (2:30 PM)
  2. +$500.00 - salary (2:25 PM)
```

### 4. Exit

Type `exit` or `quit` to stop the agent and see your final summary.

## Example Session

```bash
$ npm run chat

🤖 Welcome to Baro AI Accounting Agent!

💡 Examples:
  - "I spent $50 on groceries"
  - "Received $200 payment"
  - "Paid $30 for lunch"
  - "balance" - check your balance
  - "history" - see recent transactions

💬 You: I received $500 salary

✅ Added income of $500.00 for salary. Current balance: $500.00

💬 You: Spent $45 on groceries

✅ Added expense of $45.00 for groceries. Current balance: $455.00

💬 You: balance
💰 Current Balance: $455.00

💬 You: exit

👋 Thanks for using Baro AI! Here's your final summary:
💰 Final Balance: $455.00
...
```

## Natural Language Examples

The agent understands natural language! Try:

**Income:**
- "Got $200 from my client"
- "Received $1000 salary"
- "Earned $50 today"
- "Payment of $300 received"

**Expenses:**
- "Bought groceries for $65"
- "Paid $30 for parking"
- "Spent $120 on gas"
- "Restaurant bill was $85"

**Categories are auto-detected:**
- salary, payment, income
- groceries, food, dining
- gas, parking, transport
- bills, utilities

## All Available Commands

```bash
npm run chat          # Interactive chat mode
npm run test:dev      # Run test with sample data
npm run build         # Build for production
npm start             # Run production build
```

## Tips

- 🎯 Be clear about amounts ("$50" or "50 dollars")
- 📝 Include context ("for groceries", "from client")
- 🔍 Type "balance" anytime to check balance
- 📜 Type "history" to see all transactions
- 🚪 Type "exit" when done

## What's Next?

1. ✅ Your agent is working!
2. 📱 Want WhatsApp integration? Add webhook support
3. 💾 Want persistence? Add database support
4. 📊 Want charts? Add visualization

Enjoy tracking your finances! 💰

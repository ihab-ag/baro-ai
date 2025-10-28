/**
 * Telegram bot using long-polling with your AccountingAgent
 */

import TelegramBot from 'node-telegram-bot-api';
import { AccountingAgent } from '../agent/accounting-agent.js';
import { Settings } from '../config/settings.js';
import { PersistedExpenseTracker } from '../agent/persisted-tracker.js';

async function main() {
  const settings = new Settings();
  const token = settings.telegramBotToken;

  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
    process.exit(1);
  }

  const bot = new TelegramBot(token, { polling: true });
  
  // Store agents per user ID
  const userAgents = new Map<string, AccountingAgent>();
  
  // Store pending budget confirmations per user
  const pendingBudgetConfirmations = new Map<string, {
    amount: number,
    year: number,
    month: number,
    category?: string,
    existingBudgets: any[]
  }>();
  
  // Store pending clear month confirmations per user
  const pendingClearMonthConfirmations = new Map<string, {
    year: number,
    month: number,
    count: number,
    monthName: string
  }>();
  
  function getOrCreateAgent(userId: string): AccountingAgent {
    if (!userAgents.has(userId)) {
      // Try using persisted tracker if Supabase is configured
      const useSupabase = settings.supabaseUrl && settings.supabaseKey;
      
      if (useSupabase) {
        const tracker = new PersistedExpenseTracker(userId);
        const agent = new AccountingAgent(settings);
        agent.tracker = tracker as any;
        userAgents.set(userId, agent);
        
        // Load user's transactions
        tracker.loadTransactions().catch(err => 
          console.error(`Failed to load transactions for user ${userId}:`, err)
        );
        
        return agent;
      }
    }
    
    if (!userAgents.has(userId)) {
      userAgents.set(userId, new AccountingAgent(settings));
    }
    
    return userAgents.get(userId)!;
  }

  console.log('\n🤖 Telegram bot started (long-polling)');
  console.log('💡 Open Telegram and send your bot a message to start!\n');

  // Greeting on /start
  bot.onText(/\/start|hi|hello/i, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(
      chatId,
      '👋 Welcome to Baro AI!\n\n' +
        'I can help you track expenses:\n' +
        '• "I spent $50 on groceries"\n' +
        '• "Received $200 salary"\n' +
        '• "Paid $30 for lunch"\n\n' +
        'Type "help" to see all commands!'
    );
  });

  // Handle all messages
  bot.on('message', async (msg) => {
    console.log('Message received', msg);
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || chatId);
    const text = msg.text || '';

    if (!text) return;
    
    // Get or create agent for this user
    const agent = getOrCreateAgent(userId);
    
    // Skip /start, hi, hello (exact matches only)
    const textLower = text.toLowerCase().trim();
    if (textLower === 'hi' || textLower === 'hello' || textLower.startsWith('/start')) return;
    
    // Help command
    if (/^help$|^commands$/i.test(text)) {
      const helpMessage = `📚 *Baro AI Commands:*\n\n` +
        `💬 *Transaction Commands:*\n` +
        `• Add income: "Received $500 salary"\n` +
        `• Add expense: "Spent $50 on groceries"\n` +
        `• Natural language: "Paid $30 for lunch"\n\n` +
        `📊 *View Commands:*\n` +
        `• \`balance\` - Current balance\n` +
        `• \`history\` - Last 10 transactions with IDs\n` +
        `• \`months\` - List available months\n` +
        `• \`month 1\` - View transactions for month #1\n\n` +
        `📂 *Category Commands:*\n` +
        `• \`categories\` - List all your categories\n` +
        `• \`catstats 1\` - Category stats for month #1\n\n` +
        `💰 *Budget Commands:*\n` +
        `• \`budget $500\` - Set $500 overall budget\n` +
        `• \`budget $500 groceries\` - Set $500 budget for groceries\n` +
        `• \`budgets\` - List all budgets\n` +
        `• \`budget status\` - Check budget status\n\n` +
        `🗑️ *Delete Commands:*\n` +
        `• \`delete 12345\` - Delete transaction by ID\n` +
        `• \`clear month 1\` - Clear all transactions for month #1\n` +
        `• \`clear\` - Delete all transactions\n\n` +
        `💾 *Export Commands:*\n` +
        `• \`export\` - Export all transactions as CSV file\n` +
        `• \`export month 1\` - Export transactions for month #1\n\n` +
        `ℹ️ Send "help" anytime to see this menu!`;
      await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
      return;
    }

    // Balance command
    if (/\bbalance\b/i.test(text)) {
      const balance = agent.tracker.getBalance();
      await bot.sendMessage(chatId, `💰 Current balance: $${balance.toFixed(2)}`);
      return;
    }

    // History command - show last 10 with IDs
    if (/history|list/i.test(text)) {
      const transactions = agent.tracker.getRecentTransactions(10);
      if (transactions.length === 0) {
        await bot.sendMessage(chatId, '📜 No transactions yet.');
      } else {
        const lines = transactions.map((item: any, i: number) => {
          const t = item.transaction || item;
          const sign = t.type === 'income' ? '+' : '-';
          const emoji = t.type === 'income' ? '📥' : '📤';
          const desc = t.description.length > 25 ? t.description.substring(0, 22) + '...' : t.description;
          const id = item.id ? `[ID: ${item.id}]` : '';
          return `${i + 1}. ${emoji} ${sign}$${t.amount.toFixed(2)} - ${desc} ${id}`;
        });
        const message = `📋 Last 10 transactions:\n\n${lines.join('\n')}\n\n💡 To delete: send "delete ID"\n💡 To clear all: send "clear"`;
        await bot.sendMessage(chatId, message);
      }
      return;
    }
    
    // Delete transaction command
    if (/^delete\s+\d+$/i.test(text)) {
      const match = text.match(/(\d+)/);
      if (match) {
        const id = parseInt(match[1]);
        const deleted = await (agent.tracker as any).deleteTransaction?.(id);
        if (deleted) {
          await bot.sendMessage(chatId, `✅ Transaction ${id} deleted. New balance: $${agent.tracker.getBalance().toFixed(2)}`);
        } else {
          await bot.sendMessage(chatId, `❌ Transaction ${id} not found.`);
        }
      }
      return;
    }
    
    // Clear all transactions command - confirmation required
    if (/^clear$|^clearall$|^clear all$/i.test(text)) {
      const count = (agent.tracker as any).transactions?.length || 0;
      if (count === 0) {
        await bot.sendMessage(chatId, '📜 No transactions to clear.');
        return;
      }
      
      // Ask for confirmation
      await bot.sendMessage(chatId, 
        `⚠️ *WARNING: Clear All Transactions?*\n\n` +
        `This will delete ${count} transactions permanently!\n\n` +
        `Balance: $${agent.tracker.getBalance().toFixed(2)}\n\n` +
        `To confirm, reply: "yes clear all" or "confirm clear"\n` +
        `To cancel, just ignore this message.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Confirmation to clear
    if (/^(yes clear all|confirm clear)$/i.test(text)) {
      const count = await (agent.tracker as any).clearHistory?.() || 0;
      if (count > 0) {
        await bot.sendMessage(chatId, `✅ Cleared ${count} transactions from database and memory.\n💰 Balance reset to $${agent.tracker.getBalance().toFixed(2)}`);
      } else {
        await bot.sendMessage(chatId, '📜 No transactions to clear.');
      }
      return;
    }
    
    // Get transactions by month - show available months
    if (/^months$|^show months$/i.test(text)) {
      const months = (agent.tracker as any).getAllMonths?.() || [];
      if (months.length === 0) {
        await bot.sendMessage(chatId, '📅 No transactions found.');
      } else {
        const lines = months.map((m: any, i: number) => `${i + 1}. ${m.name}`);
        await bot.sendMessage(chatId, `📅 Available months:\n\n${lines.join('\n')}\n\n💡 To view transactions for a month, send: "month NUMBER"`);
      }
      return;
    }
    
    // List categories command
    if (/^categories$|^cats$/i.test(text)) {
      const categories = (agent.tracker as any).getAllCategories?.() || [];
      if (categories.length === 0) {
        await bot.sendMessage(chatId, '📂 No categories found. Transactions will be uncategorized.');
      } else {
        const lines = categories.map((cat: string, i: number) => `${i + 1}. ${cat}`);
        await bot.sendMessage(chatId, `📂 Your categories:\n\n${lines.join('\n')}\n\n💡 Use "catstats MONTH" to see stats for each category`);
      }
      return;
    }
    
    // Category stats for a specific month
    if (/^catstats\s+\d+$/i.test(text)) {
      const match = text.match(/(\d+)/);
      if (match) {
        const monthIndex = parseInt(match[1]) - 1;
        const months = (agent.tracker as any).getAllMonths?.() || [];
        
        if (monthIndex < 0 || monthIndex >= months.length) {
          await bot.sendMessage(chatId, '❌ Invalid month number. Send "months" to see available months.');
          return;
        }
        
        const selectedMonth = months[monthIndex];
        const stats = (agent.tracker as any).getCategoryStatsForMonth?.(selectedMonth.year, selectedMonth.month) || [];
        
        if (stats.length === 0) {
          await bot.sendMessage(chatId, `📊 No transactions for ${selectedMonth.name}`);
        } else {
          const lines = stats.map((s: any, i: number) => {
            const sign = s.net >= 0 ? '+' : '';
            return `${i + 1}. ${s.category}:\n   📥 Income: $${s.income.toFixed(2)}\n   📤 Expenses: $${s.expense.toFixed(2)}\n   💰 Net: ${sign}$${s.net.toFixed(2)}`;
          });
          
          const message = `📊 Category Stats for ${selectedMonth.name}:\n\n${lines.join('\n\n')}`;
          await bot.sendMessage(chatId, message);
        }
      }
      return;
    }
    
    // Get transactions by month
    if (/^month\s+\d+$/i.test(text)) {
      const match = text.match(/(\d+)/);
      if (match) {
        const monthIndex = parseInt(match[1]) - 1;
        const months = (agent.tracker as any).getAllMonths?.() || [];
        
        if (monthIndex < 0 || monthIndex >= months.length) {
          await bot.sendMessage(chatId, '❌ Invalid month number. Send "months" to see available months.');
          return;
        }
        
        const selectedMonth = months[monthIndex];
        const transactions = (agent.tracker as any).getTransactionsByMonth?.(selectedMonth.year, selectedMonth.month) || [];
        
        if (transactions.length === 0) {
          await bot.sendMessage(chatId, `📅 No transactions for ${selectedMonth.name}`);
        } else {
          const lines = transactions.map((item: any, i: number) => {
            const t = item.transaction || item;
            const sign = t.type === 'income' ? '+' : '-';
            const emoji = t.type === 'income' ? '📥' : '📤';
            const desc = t.description.length > 25 ? t.description.substring(0, 22) + '...' : t.description;
            const date = t.timestamp.toLocaleDateString();
            return `${i + 1}. ${emoji} ${sign}$${t.amount.toFixed(2)} - ${desc} (${date})`;
          });
          
          const totalIncome = transactions.filter((item: any) => (item.transaction || item).type === 'income')
            .reduce((sum: number, item: any) => sum + (item.transaction || item).amount, 0);
          const totalExpense = transactions.filter((item: any) => (item.transaction || item).type === 'expense')
            .reduce((sum: number, item: any) => sum + (item.transaction || item).amount, 0);
          const net = totalIncome - totalExpense;
          
          const message = `📅 ${selectedMonth.name}:\n\n${lines.join('\n')}\n\n📊 Summary:\n📥 Income: $${totalIncome.toFixed(2)}\n📤 Expenses: $${totalExpense.toFixed(2)}\n💰 Net: $${net.toFixed(2)}`;
          await bot.sendMessage(chatId, message);
        }
      }
      return;
    }
    
    // Clear month command
    if (/^clear month\s+\d+$/i.test(text)) {
      const match = text.match(/(\d+)/);
      if (match) {
        const monthIndex = parseInt(match[1]) - 1;
        const months = (agent.tracker as any).getAllMonths?.() || [];
        
        if (monthIndex < 0 || monthIndex >= months.length) {
          await bot.sendMessage(chatId, '❌ Invalid month number. Send "months" to see available months.');
          return;
        }
        
        const selectedMonth = months[monthIndex];
        const transactions = (agent.tracker as any).getTransactionsByMonth?.(selectedMonth.year, selectedMonth.month) || [];
        
        if (transactions.length === 0) {
          await bot.sendMessage(chatId, `📜 No transactions to clear for ${selectedMonth.name}.`);
        } else {
          // Ask for confirmation
          pendingClearMonthConfirmations.set(userId, {
            year: selectedMonth.year,
            month: selectedMonth.month,
            count: transactions.length,
            monthName: selectedMonth.name
          });
          
          await bot.sendMessage(chatId, 
            `⚠️ *WARNING: Clear Month?*\n\n` +
            `This will delete ${transactions.length} transaction(s) from ${selectedMonth.name} permanently!\n\n` +
            `To confirm, reply: "yes" or "confirm"\n` +
            `To cancel, just ignore this message.`,
            { parse_mode: 'Markdown' }
          );
        }
      }
      return;
    }
    
    // Create budget command - can be with or without category
    if (/^budget\s+\$?\d+\.?\d*(\s+\w+)?$/i.test(text)) {
      const match = text.match(/^budget\s+\$?(\d+\.?\d*)(?:\s+(.+))?$/i);
      if (match) {
        const amount = parseFloat(match[1]);
        const category = match[2]?.trim(); // Optional category
        
        if (amount <= 0) {
          await bot.sendMessage(chatId, '❌ Invalid budget amount.');
          return;
        }
        
        try {
          const now = new Date();
          const year = now.getFullYear(); // Always use current year
          const month = now.getMonth(); // 0-11 - current month
          
          // Check if budget already exists for this month and category (in current year)
          const existingBudgets = await (agent.tracker as any).getBudgets?.(year, month) || [];
          const matchingBudgets = existingBudgets.filter((b: any) => 
            b.type === 'expense' && 
            ((!category && !b.category) || (category && b.category === category))
          );
          
          if (matchingBudgets.length > 0) {
            // Ask for confirmation to override
            pendingBudgetConfirmations.set(userId, {
              amount,
              year,
              month,
              category,
              existingBudgets: matchingBudgets
            });
            
            const budgetType = category || 'overall';
            const total = matchingBudgets.reduce((sum: number, b: any) => sum + parseFloat(b.amount), 0);
            const message = `⚠️ *Budget Already Exists*\n\n` +
              `You already have a $${total.toFixed(2)} budget for "${budgetType}" this month.\n\n` +
              `To replace it with $${amount.toFixed(2)}, reply: "yes" or "confirm"\n` +
              `To cancel, just ignore this message.`;
            
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
          } else {
            // No existing budget, create it
            const budgetId = await (agent.tracker as any).createBudget?.(amount, year, month, category);
            if (budgetId) {
              const budgetType = category ? `"${category}"` : 'overall spending';
              await bot.sendMessage(chatId, `✅ Budget set: $${amount.toFixed(2)} for ${budgetType} this month (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}).`);
            } else {
              await bot.sendMessage(chatId, '❌ Failed to create budget. Make sure Supabase is configured.');
            }
          }
        } catch (err) {
          await bot.sendMessage(chatId, `❌ Error: ${String(err)}`);
        }
      }
      return;
    }
    
    // Handle budget confirmation or cancellation
    if (pendingBudgetConfirmations.has(userId)) {
      if (/^(yes|confirm|replace|y)$/i.test(text)) {
        const confirmation = pendingBudgetConfirmations.get(userId)!;
        pendingBudgetConfirmations.delete(userId);
        
        try {
          // Delete existing budgets
          for (const budget of confirmation.existingBudgets) {
            await (agent.tracker as any).deleteBudget?.(budget.id);
          }
          
          // Create new budget
          const budgetId = await (agent.tracker as any).createBudget?.(
            confirmation.amount, 
            confirmation.year, 
            confirmation.month, 
            confirmation.category
          );
          
          if (budgetId) {
            const budgetType = confirmation.category ? `"${confirmation.category}"` : 'overall spending';
            const monthName = new Date(confirmation.year, confirmation.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            await bot.sendMessage(chatId, `✅ Budget updated: $${confirmation.amount.toFixed(2)} for ${budgetType} this month (${monthName}).`);
          } else {
            await bot.sendMessage(chatId, '❌ Failed to update budget.');
          }
        } catch (err) {
          await bot.sendMessage(chatId, `❌ Error: ${String(err)}`);
        }
        return;
      } else if (/^(no|cancel|skip|ignore)$/i.test(text)) {
        // Clear pending confirmation on cancel
        pendingBudgetConfirmations.delete(userId);
        await bot.sendMessage(chatId, '❌ Budget update cancelled.');
        return;
      }
      // If neither yes nor no, continue to check other commands
    }
    
    // Handle clear month confirmation or cancellation
    if (pendingClearMonthConfirmations.has(userId)) {
      if (/^(yes|confirm|y)$/i.test(text)) {
        const confirmation = pendingClearMonthConfirmations.get(userId)!;
        pendingClearMonthConfirmations.delete(userId);
        
        try {
          const count = await (agent.tracker as any).clearMonth?.(confirmation.year, confirmation.month) || 0;
          if (count > 0) {
            await bot.sendMessage(chatId, `✅ Cleared ${count} transaction(s) from ${confirmation.monthName}.\n💰 New balance: $${agent.tracker.getBalance().toFixed(2)}`);
          } else {
            await bot.sendMessage(chatId, '📜 No transactions to clear.');
          }
        } catch (err) {
          await bot.sendMessage(chatId, `❌ Error: ${String(err)}`);
        }
        return;
      } else if (/^(no|cancel|skip|ignore)$/i.test(text)) {
        // Clear pending confirmation on cancel
        pendingClearMonthConfirmations.delete(userId);
        await bot.sendMessage(chatId, '❌ Clear month cancelled.');
        return;
      }
      // If neither yes nor no, continue to check other commands
    }
    
    // List budgets command
    if (/^budgets$/i.test(text)) {
      try {
        const now = new Date();
        const year = now.getFullYear(); // Current year
        const month = now.getMonth(); // Current month
        
        const budgets = await (agent.tracker as any).getBudgets?.(year, month) || [];
        
        if (budgets.length === 0) {
          await bot.sendMessage(chatId, '💰 No budgets set for this month.');
        } else {
          const lines = budgets.map((b: any) => {
            const cat = b.category || 'Overall Budget';
            return `• ${cat}: $${parseFloat(b.amount).toFixed(2)} (${b.type === 'expense' ? 'expense' : 'income'})`;
          });
          await bot.sendMessage(chatId, `💰 Budgets for ${new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}:\n\n${lines.join('\n')}`);
        }
      } catch (err) {
        await bot.sendMessage(chatId, `❌ Error: ${String(err)}`);
      }
      return;
    }
    
    // Budget status command
    if (/^budget status$/i.test(text)) {
      try {
        const now = new Date();
        const year = now.getFullYear(); // Current year
        const month = now.getMonth(); // Current month
        
        const status = await (agent.tracker as any).getBudgetStatus?.(year, month) || [];
        
        if (status.length === 0) {
          await bot.sendMessage(chatId, '💰 No budgets set for this month.');
        } else {
          const lines = status.map((s: any) => {
            const cat = s.category || 'Overall';
            const emoji = s.remaining >= 0 ? '✅' : '⚠️';
            const statusText = s.percentage > 0 
              ? `${s.percentage.toFixed(1)}% spent` 
              : 'No spending yet';
            return `${emoji} ${cat}:\n   Budget: $${s.budgetAmount.toFixed(2)}\n   Spent: $${s.spentAmount.toFixed(2)}\n   Remaining: $${s.remaining.toFixed(2)}\n   ${statusText}`;
          });
          
          await bot.sendMessage(chatId, 
            `📊 Budget Status for ${new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}:\n\n${lines.join('\n\n')}`
          );
        }
      } catch (err) {
        await bot.sendMessage(chatId, `❌ Error: ${String(err)}`);
      }
      return;
    }
    
    // Export command - export transactions as CSV
    if (/^export$/i.test(text)) {
      try {
        const csvData = (agent.tracker as any).exportToCSV?.() || '';
        
        if (!csvData || csvData.trim() === '') {
          await bot.sendMessage(chatId, '📜 No transactions to export.');
          return;
        }
        
        // Convert CSV string to buffer
        const csvBuffer = Buffer.from(csvData, 'utf-8');
        
        // Generate filename with current date
        const now = new Date();
        const filename = `baro-ai-export-${now.toISOString().split('T')[0]}.csv`;
        
        // Create a readable stream from the buffer
        const { Readable } = require('stream');
        const stream = Readable.from([csvBuffer]);
        
        // Send as document using bot's private method
        const count = (agent.tracker as any).transactions?.length || 0;
        const balance = agent.tracker.getBalance().toFixed(2);
        
        await bot.sendDocument(chatId, stream, {}, {
          filename: filename,
          caption: `📊 Exported ${count} transaction(s)\n💰 Current balance: $${balance}`
        } as any);
      } catch (err) {
        console.error('Export error:', err);
        await bot.sendMessage(chatId, `❌ Error exporting data: ${String(err)}`);
      }
      return;
    }
    
    // Export month command - export transactions for a specific month
    if (/^export month\s+\d+$/i.test(text)) {
      const match = text.match(/(\d+)/);
      if (match) {
        const monthIndex = parseInt(match[1]) - 1;
        const months = (agent.tracker as any).getAllMonths?.() || [];
        
        if (monthIndex < 0 || monthIndex >= months.length) {
          await bot.sendMessage(chatId, '❌ Invalid month number. Send "months" to see available months.');
          return;
        }
        
        const selectedMonth = months[monthIndex];
        const csvData = (agent.tracker as any).exportMonthToCSV?.(selectedMonth.year, selectedMonth.month) || '';
        
        if (!csvData || csvData.trim() === '') {
          await bot.sendMessage(chatId, `📜 No transactions to export for ${selectedMonth.name}.`);
          return;
        }
        
        try {
          // Convert CSV string to buffer
          const csvBuffer = Buffer.from(csvData, 'utf-8');
          
          // Generate filename with month info
          const filename = `baro-ai-export-${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}.csv`;
          
          // Create a readable stream from the buffer
          const { Readable } = require('stream');
          const stream = Readable.from([csvBuffer]);
          
          // Count transactions for this month
          const transactions = (agent.tracker as any).getTransactionsByMonth?.(selectedMonth.year, selectedMonth.month) || [];
          const count = transactions.length;
          
          await bot.sendDocument(chatId, stream, {
            filename: filename
          } as any);
          
          await bot.sendMessage(chatId, `📊 Exported ${count} transaction(s) from ${selectedMonth.name}`);
        } catch (err) {
          console.error('Export month error:', err);
          await bot.sendMessage(chatId, `❌ Error exporting month data: ${String(err)}`);
        }
      }
      return;
    }

    // Process transaction
    try {
      const result = await agent.processMessage(text);
      await bot.sendMessage(chatId, result.message || '✅ Processed');
    } catch (err) {
      await bot.sendMessage(chatId, `❌ Error: ${String(err)}`);
    }
  });
  
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});

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
  
  // Store pending clear all data confirmations per user
  const pendingClearAllDataConfirmations = new Map<string, {
    transactions: number,
    budgets: number,
    accounts: number
  }>();
  
  function getOrCreateAgent(userId: string): AccountingAgent {
    if (!userAgents.has(userId)) {
      if (!settings.supabaseUrl || !settings.supabaseKey) {
        throw new Error('Supabase is required. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.');
      }
      const tracker = new PersistedExpenseTracker(userId);
      const agent = new AccountingAgent(settings, tracker as any);
      userAgents.set(userId, agent);
      
      // Load user's transactions
      tracker.loadTransactions().catch(err => 
        console.error(`Failed to load transactions for user ${userId}:`, err)
      );
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
    // Ensure user's data is loaded before handling any command
    await (agent.tracker as any).ensureLoaded?.();
    
    // Skip /start, hi, hello (exact matches only)
    const textLower = text.toLowerCase().trim();
    if (textLower === 'hi' || textLower === 'hello' || textLower.startsWith('/start')) return;
    
    // Help command - keep explicit for clarity
    if (/^help$|^commands$/i.test(text)) {
      const helpMessage = `📚 *Baro AI Commands:*\n\n` +
        `💬 *Transaction Commands (Natural Language):*\n` +
        `• "Received $500 salary" - Add income\n` +
        `• "Spent $50 on groceries" - Add expense\n` +
        `• "Paid $30 for lunch" - Add expense\n\n` +
        `📊 *View Commands (Natural Language):*\n` +
        `• "show balance" or "what's my balance?"\n` +
        `• "show history" or "list transactions"\n` +
        `• "show months" or "list months"\n` +
        `• "show month 1" or "january transactions"\n` +
        `• "show categories" or "list categories"\n` +
        `• "category stats for month 1"\n` +
        `• "show budgets" or "list budgets"\n` +
        `• "budget status" or "how am I doing with budgets?"\n\n` +
        `🏦 *Account Commands (Natural Language):*\n` +
        `• "show accounts" or "list accounts"\n` +
        `• "create account bank" or "add account card"\n` +
        `• "switch to bank" or "use bank account"\n\n` +
        `💰 *Budget Commands (Natural Language):*\n` +
        `• "set budget $500" or "budget $500 for groceries"\n\n` +
        `💾 *Export Commands (Natural Language):*\n` +
        `• "export data" or "download transactions"\n` +
        `• "export month 1" or "download january"\n\n` +
        `🗑️ *Delete Commands (Explicit Only):*\n` +
        `• \`delete 12345\` - Delete transaction by ID\n` +
        `• \`clear month 1\` - Clear all transactions for month #1\n` +
        `• \`clear\` - Delete all transactions\n` +
        `• \`clear all data\` - Delete EVERYTHING (transactions, budgets, accounts)\n\n` +
        `ℹ️ Just talk naturally - the AI understands!`;
      await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
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
    
    // Confirmation to clear all transactions
    if (/^(yes clear all|confirm clear)$/i.test(text)) {
      const count = await (agent.tracker as any).clearHistory?.() || 0;
      if (count > 0) {
        await bot.sendMessage(chatId, `✅ Cleared ${count} transactions from database and memory.\n💰 Balance reset to $${agent.tracker.getBalance().toFixed(2)}`);
      } else {
        await bot.sendMessage(chatId, '📜 No transactions to clear.');
      }
      return;
    }
    
    // Clear all data command - requires strong confirmation
    if (/^(clear all data|delete all data|reset all|wipe all)$/i.test(text)) {
      // Get counts from the database directly for accuracy
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          settings.supabaseUrl || '',
          settings.supabaseKey || ''
        );
        
        // Count transactions
        const { count: txCount } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId.toString());
        
        // Count budgets
        const { count: budgetsCount } = await supabase
          .from('budgets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId.toString());
        
        // Count accounts
        const { count: accountsCount } = await supabase
          .from('accounts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId.toString());
        
        const tx = txCount || 0;
        const budgets = budgetsCount || 0;
        const accounts = accountsCount || 0;
        
        if (tx === 0 && budgets === 0 && accounts === 0) {
          await bot.sendMessage(chatId, '📜 No data to clear.');
          return;
        }
        
        // Store confirmation data
        pendingClearAllDataConfirmations.set(userId, {
          transactions: tx,
          budgets: budgets,
          accounts: accounts
        });
        
        await bot.sendMessage(chatId, 
          `⚠️ *CRITICAL WARNING: Clear ALL Data?*\n\n` +
          `This will PERMANENTLY delete:\n` +
          `• ${tx} transaction(s)\n` +
          `• ${budgets} budget(s)\n` +
          `• ${accounts} account(s)\n\n` +
          `This action CANNOT be undone!\n\n` +
          `To confirm, reply: "yes delete everything" or "confirm delete all"\n` +
          `To cancel, just ignore this message.`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        await bot.sendMessage(chatId, `❌ Error counting data: ${String(err)}`);
      }
      return;
    }
    
    // Confirmation to clear all data
    if (pendingClearAllDataConfirmations.has(userId)) {
      if (/^(yes delete everything|confirm delete all|yes wipe all)$/i.test(text)) {
        const confirmation = pendingClearAllDataConfirmations.get(userId)!;
        pendingClearAllDataConfirmations.delete(userId);
        
        try {
          const result = await (agent.tracker as any).clearAllData?.() || { transactions: 0, budgets: 0, accounts: 0 };
          
          await bot.sendMessage(chatId, 
            `✅ *All Data Cleared*\n\n` +
            `Deleted:\n` +
            `• ${result.transactions} transaction(s)\n` +
            `• ${result.budgets} budget(s)\n` +
            `• ${result.accounts} account(s)\n\n` +
            `💰 Balance reset to $${agent.tracker.getBalance().toFixed(2)}\n\n` +
            `Your account has been reset to a fresh start.`,
            { parse_mode: 'Markdown' }
          );
        } catch (err) {
          await bot.sendMessage(chatId, `❌ Error: ${String(err)}`);
        }
        return;
      } else if (/^(no|cancel|skip|ignore)$/i.test(text)) {
        pendingClearAllDataConfirmations.delete(userId);
        await bot.sendMessage(chatId, '❌ Clear all data cancelled.');
        return;
      }
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
    

    // Process via AI (transactions or NLU commands)
    try {
      const result = await agent.processMessage(text);
      // If AI resolved a command, safely route to existing handlers (non-destructive only)
      if (result?.intent?.type === 'command') {
        const cmd = String(result.intent.command || '').toLowerCase();
        const args = result.intent.args || {};
        switch (cmd) {
          case 'balance': {
            const balance = agent.tracker.getBalance();
            await bot.sendMessage(chatId, `💰 Current balance: $${balance.toFixed(2)}`);
            return;
          }
          case 'history': {
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
              await bot.sendMessage(chatId, `📋 Last 10 transactions:\n\n${lines.join('\n')}`);
            }
            return;
          }
          case 'months': {
            const months = (agent.tracker as any).getAllMonths?.() || [];
            if (months.length === 0) {
              await bot.sendMessage(chatId, '📅 No transactions found.');
            } else {
              const lines = months.map((m: any, i: number) => `${i + 1}. ${m.name}`);
              await bot.sendMessage(chatId, `📅 Available months:\n\n${lines.join('\n')}`);
            }
            return;
          }
          case 'month': {
            const index = Number(args.index) || 1;
            const months = (agent.tracker as any).getAllMonths?.() || [];
            const monthIndex = index - 1;
            if (monthIndex < 0 || monthIndex >= months.length) {
              await bot.sendMessage(chatId, '❌ Invalid month number. Send "months" to see available months.');
              return;
            }
            const selectedMonth = months[monthIndex];
            const transactions = (agent.tracker as any).getTransactionsByMonth?.(selectedMonth.year, selectedMonth.month) || [];
            if (transactions.length === 0) {
              await bot.sendMessage(chatId, `📅 No transactions for ${selectedMonth.name}`);
              return;
            }
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
            await bot.sendMessage(chatId, `📅 ${selectedMonth.name}:\n\n${lines.join('\n')}\n\n📊 Summary:\n📥 Income: $${totalIncome.toFixed(2)}\n📤 Expenses: $${totalExpense.toFixed(2)}\n💰 Net: $${net.toFixed(2)}`);
            return;
          }
          case 'categories': {
            const categories = (agent.tracker as any).getAllCategories?.() || [];
            if (categories.length === 0) {
              await bot.sendMessage(chatId, '📂 No categories found. Transactions will be uncategorized.');
            } else {
              const lines = categories.map((cat: string, i: number) => `${i + 1}. ${cat}`);
              await bot.sendMessage(chatId, `📂 Your categories:\n\n${lines.join('\n')}`);
            }
            return;
          }
          case 'catstats': {
            const index = Number(args.index) || 1;
            const months = (agent.tracker as any).getAllMonths?.() || [];
            const monthIndex = index - 1;
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
              await bot.sendMessage(chatId, `📊 Category Stats for ${selectedMonth.name}:\n\n${lines.join('\n\n')}`);
            }
            return;
          }
          case 'budgets': {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
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
            return;
          }
          case 'budget_status': {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const status = await (agent.tracker as any).getBudgetStatus?.(year, month) || [];
            if (status.length === 0) {
              await bot.sendMessage(chatId, '💰 No budgets set for this month.');
            } else {
              const lines = status.map((s: any) => {
                const cat = s.category || 'Overall';
                const emoji = s.remaining >= 0 ? '✅' : '⚠️';
                const statusText = s.percentage > 0 ? `${s.percentage.toFixed(1)}% spent` : 'No spending yet';
                return `${emoji} ${cat}:\n   Budget: $${s.budgetAmount.toFixed(2)}\n   Spent: $${s.spentAmount.toFixed(2)}\n   Remaining: $${s.remaining.toFixed(2)}\n   ${statusText}`;
              });
              await bot.sendMessage(chatId, `📊 Budget Status:\n\n${lines.join('\n\n')}`);
            }
            return;
          }
          case 'budget_create': {
            const amount = Number(args.amount);
            const category = args.category ? String(args.category).trim() : undefined;
            if (!amount || amount <= 0) {
              await bot.sendMessage(chatId, '❌ Invalid budget amount.');
              return;
            }
            try {
              const now = new Date();
              const year = now.getFullYear();
              const month = now.getMonth();
              const existingBudgets = await (agent.tracker as any).getBudgets?.(year, month) || [];
              const matchingBudgets = existingBudgets.filter((b: any) => 
                b.type === 'expense' && 
                ((!category && !b.category) || (category && b.category === category))
              );
              if (matchingBudgets.length > 0) {
                pendingBudgetConfirmations.set(userId, {
                  amount,
                  year,
                  month,
                  category,
                  existingBudgets: matchingBudgets
                });
                const budgetType = category || 'overall';
                const total = matchingBudgets.reduce((sum: number, b: any) => sum + parseFloat(b.amount), 0);
                await bot.sendMessage(chatId, `⚠️ *Budget Already Exists*\n\nYou already have a $${total.toFixed(2)} budget for "${budgetType}" this month.\n\nTo replace it with $${amount.toFixed(2)}, reply: "yes" or "confirm"\nTo cancel, just ignore this message.`, { parse_mode: 'Markdown' });
                return;
              }
              const budgetId = await (agent.tracker as any).createBudget?.(amount, year, month, category);
              if (budgetId) {
                const budgetType = category ? `"${category}"` : 'overall spending';
                await bot.sendMessage(chatId, `✅ Budget set: $${amount.toFixed(2)} for ${budgetType} this month (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}).`);
              } else {
                await bot.sendMessage(chatId, '❌ Failed to create budget. Make sure Supabase is configured.');
              }
            } catch (err) {
              await bot.sendMessage(chatId, `❌ Error: ${String(err)}`);
            }
            return;
          }
          case 'accounts': {
            const accounts = await (agent.tracker as any).getAccounts?.() || [];
            const current = (agent.tracker as any).getCurrentAccount?.() || 'cash';
            const lines = accounts.map((name: string, i: number) => name === current ? `${i + 1}. ${name} (current)` : `${i + 1}. ${name}`);
            await bot.sendMessage(chatId, `🏦 Your accounts:\n\n${lines.join('\n')}`);
            return;
          }
          case 'account_add': {
            const name = String(args.name || '').trim();
            if (!name) { await bot.sendMessage(chatId, '❌ Missing account name.'); return; }
            await (agent.tracker as any).ensureAccountExists?.(name);
            await bot.sendMessage(chatId, `✅ Account "${name}" created.`);
            return;
          }
          case 'account_use': {
            const name = String(args.name || '').trim();
            if (!name) { await bot.sendMessage(chatId, '❌ Missing account name.'); return; }
            await (agent.tracker as any).setCurrentAccount?.(name);
            await bot.sendMessage(chatId, `✅ Current account set to "${name}".`);
            return;
          }
          case 'export': {
            const csvData = (agent.tracker as any).exportToCSV?.() || '';
            if (!csvData || csvData.trim() === '') {
              await bot.sendMessage(chatId, '📜 No transactions to export.');
              return;
            }
            const csvBuffer = Buffer.from(csvData, 'utf-8');
            const { Readable } = require('stream');
            const stream = Readable.from([csvBuffer]);
            const now = new Date();
            const filename = `baro-ai-export-${now.toISOString().split('T')[0]}.csv`;
            await bot.sendDocument(chatId, stream, {}, { filename } as any);
            return;
          }
          case 'export_month': {
            const index = Number(args.index) || 1;
            const months = (agent.tracker as any).getAllMonths?.() || [];
            const monthIndex = index - 1;
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
            const csvBuffer = Buffer.from(csvData, 'utf-8');
            const { Readable } = require('stream');
            const stream = Readable.from([csvBuffer]);
            const filename = `baro-ai-export-${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}.csv`;
            await bot.sendDocument(chatId, stream, { filename } as any);
            return;
          }
        }
      }
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

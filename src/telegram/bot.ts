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
        `• Natural language: "Paid $30 for lunch"\n` +
        `• 📸 Send receipt photo (with or without caption)\n\n` +
        `📊 *View Commands:*\n` +
        `• \`balance\` - Current balance\n` +
        `• \`history\` - Last 10 transactions with IDs\n` +
        `• \`months\` - List available months\n` +
        `• \`month 1\` - View transactions for month #1\n\n` +
        `🗑️ *Delete Commands:*\n` +
        `• \`delete 12345\` - Delete transaction by ID\n` +
        `• \`clear\` - Delete all transactions\n\n` +
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
    
    // Clear all transactions command
    if (/^clear$|^clearall$|^clear all$/i.test(text)) {
      const count = await (agent.tracker as any).clearHistory?.() || 0;
      if (count > 0) {
        await bot.sendMessage(chatId, `🗑️ Cleared ${count} transactions. Balance reset to $${agent.tracker.getBalance().toFixed(2)}`);
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

    // Process transaction
    try {
      const result = await agent.processMessage(text);
      await bot.sendMessage(chatId, result.message || '✅ Processed');
    } catch (err) {
      await bot.sendMessage(chatId, `❌ Error: ${String(err)}`);
    }
  });
  
  // Handle photo messages (receipts)
  bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id || chatId);
    const agent = getOrCreateAgent(userId);
    
    try {
      await bot.sendMessage(chatId, '📸 Processing receipt...');
      
      // Get photo file
      const photo = msg.photo![msg.photo!.length - 1];
      const fileId = photo.file_id;
      
      // Download photo
      const file = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
      
      // Use caption if provided, or extract text from image
      const caption = msg.caption;
      
      if (caption) {
        // Process caption
        const result = await agent.processMessage(caption);
        await bot.sendMessage(chatId, result.message || '✅ Receipt processed from caption');
      } else {
        // TODO: Use vision model to extract text from receipt
        // For now, ask user to describe
        await bot.sendMessage(chatId, 
          '📸 Receipt received! Please describe it:\n' +
          '• "Spent $50 on groceries"\n' +
          '• "Restaurant bill $85.50"\n\n' +
          'Or resend with a caption describing the amount and items.'
        );
      }
    } catch (err) {
      await bot.sendMessage(chatId, `❌ Error processing receipt: ${String(err)}`);
    }
  });
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});

/**
 * Interactive CLI for the accounting agent.
 * Run this to chat with your agent in real-time!
 */

import { AccountingAgent } from './agent/accounting-agent.js';
import { Settings } from './config/settings.js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

const main = async () => {
  console.log('\n🤖 Welcome to Baro AI Accounting Agent!\n');
  console.log('💰 Track your finances in real-time');
  console.log('📝 Type your transactions below');
  console.log('🚪 Type "exit" or "quit" to stop\n');
  console.log('─'.repeat(60));

  // Create settings
  const settings = new Settings();
  
  // Check for API key
  if (settings.llmProvider === 'groq' && !settings.groqApiKey) {
    console.error('\n❌ Error: GROQ_API_KEY is not set.');
    console.log('Get a free API key at: https://console.groq.com/keys\n');
    process.exit(1);
  } else if (settings.llmProvider === 'openai' && !settings.openaiApiKey) {
    console.error('\n❌ Error: OPENAI_API_KEY is not set.');
    console.log('Get an API key at: https://platform.openai.com/api-keys\n');
    process.exit(1);
  }

  // Initialize agent
  const agent = new AccountingAgent(settings);
  
  console.log('\n✨ Agent is ready! Enter your transactions:\n');
  console.log('💡 Examples:');
  console.log('  - "I spent $50 on groceries"');
  console.log('  - "Received $200 payment"');
  console.log('  - "Paid $30 for lunch"');
  console.log('  - "balance" - check your balance');
  console.log('  - "history" - see recent transactions\n');

  // Start interaction loop
  while (true) {
    const input = await question('\n💬 You: ');

    // Handle exit commands
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('\n👋 Thanks for using Baro AI! Here\'s your final summary:');
      console.log('─'.repeat(60));
      console.log(`💰 Final Balance: $${agent.tracker.getBalance().toFixed(2)}`);
      console.log('\n📊 Recent Transactions:');
      
      const transactions = agent.tracker.getRecentTransactions(10);
      if (transactions.length === 0) {
        console.log('  No transactions yet.');
      } else {
        transactions.forEach((t, i) => {
          const sign = t.type === 'income' ? '+' : '-';
          const date = t.timestamp.toLocaleTimeString();
          console.log(`  ${i + 1}. ${sign}$${t.amount.toFixed(2)} - ${t.description} (${date})`);
        });
      }
      console.log('─'.repeat(60));
      console.log('\n');
      rl.close();
      process.exit(0);
    }

    // Handle balance check
    if (input.toLowerCase().includes('balance')) {
      console.log(`\n💰 Current Balance: $${agent.tracker.getBalance().toFixed(2)}`);
      continue;
    }

    // Handle history check
    if (input.toLowerCase().includes('history')) {
      const transactions = agent.tracker.getRecentTransactions(10);
      console.log('\n📋 Recent Transactions:');
      if (transactions.length === 0) {
        console.log('  No transactions yet.');
      } else {
        transactions.forEach((t, i) => {
          const sign = t.type === 'income' ? '+' : '-';
          const date = t.timestamp.toLocaleTimeString();
          console.log(`  ${i + 1}. ${sign}$${t.amount.toFixed(2)} - ${t.description} (${date})`);
        });
      }
      continue;
    }

    // Process the transaction
    try {
      console.log('\n🤔 Processing...');
      const result = await agent.processMessage(input);
      
      if (result.success) {
        console.log(`\n✅ ${result.message}`);
      } else {
        console.log(`\n❌ ${result.message}`);
      }
    } catch (error) {
      console.error(`\n❌ Error: ${error}`);
    }
  }
};

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

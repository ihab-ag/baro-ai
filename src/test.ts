/**
 * Test script for the accounting agent.
 * Run this to test the agent without WhatsApp integration.
 */

import { AccountingAgent } from './agent/accounting-agent.js';
import { Settings } from './config/settings.js';

const testAgent = async () => {
  console.log('🚀 Initializing Baro AI Accounting Agent...\n');
  
  // Create settings
  const settings = new Settings();
  
  // Check for API key based on provider
  if (settings.llmProvider === 'groq' && !settings.groqApiKey) {
    console.warn('⚠️  Warning: GROQ_API_KEY is not set.');
    console.log('Get a free API key at: https://console.groq.com/keys\n');
    return;
  } else if (settings.llmProvider === 'openai' && !settings.openaiApiKey) {
    console.warn('⚠️  Warning: OPENAI_API_KEY is not set.');
    console.log('Get an API key at: https://platform.openai.com/api-keys\n');
    return;
  }
  
  // Initialize agent
  const agent = new AccountingAgent(settings);
  
  console.log('Agent initialized. Testing with sample messages:\n');
  console.log('─'.repeat(60));
  
  // Test messages
  const testMessages = [
    'I received $500 salary today',
    'Spent $45 on groceries at the supermarket',
    'Paid $80 for dinner at the restaurant',
    'Got $200 payment from client',
  ];
  
  for (const message of testMessages) {
    console.log(`\n📨 Message: ${message}`);
    console.log('─'.repeat(60));
    
    const result = await agent.processMessage(message);
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.log(`❌ ${result.message}`);
    }
    
    console.log(`💰 Current Balance: $${agent.tracker.getBalance().toFixed(2)}`);
    console.log('─'.repeat(60));
  }
  
  // Print summary
  console.log('\n\n📊 Final Summary:');
  console.log('─'.repeat(60));
  console.log(`💰 Total Balance: $${agent.tracker.getBalance().toFixed(2)}`);
  console.log('\nRecent Transactions:');
  
  agent.tracker.getRecentTransactions(10).forEach((transaction, i) => {
    const sign = transaction.type === 'income' ? '+' : '-';
    console.log(
      `${i + 1}. ${sign}$${transaction.amount.toFixed(2)} - ${transaction.description}`
    );
  });
  
  console.log('─'.repeat(60));
};

testAgent().catch(console.error);

/**
 * Main entry point for the Baro AI WhatsApp Accounting Agent.
 */

import { AccountingAgent } from './agent/accounting-agent.js';
import { Settings } from './config/settings.js';

const main = async () => {
  console.log('🤖 Starting Baro AI Accounting Agent...\n');
  
  // Load settings
  const settings = new Settings();
  
  // Initialize the agent
  const agent = new AccountingAgent(settings);
  
  // For now, run a test
  console.log('Testing agent with sample messages:\n');
  
  const testMessages = [
    'I received $500 salary today',
    'Spent $45 on groceries at the supermarket',
    'Paid $80 for dinner at the restaurant',
  ];
  
  for (const message of testMessages) {
    console.log(`📨 Message: ${message}`);
    const result = await agent.processMessage(message);
    console.log(`💬 Response: ${result.message}`);
    console.log(`💰 Balance: $${agent.tracker.getBalance().toFixed(2)}\n`);
  }
  
  console.log('\n✅ Agent is ready!');
};

main().catch(console.error);

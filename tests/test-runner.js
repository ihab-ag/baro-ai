/**
 * Pre-flight test runner
 * Runs basic functionality checks before starting the bot
 */
import { ExpenseTracker } from '../src/agent/expense-tracker.js';
import { Transaction } from '../src/agent/expense-tracker.js';
import { Settings } from '../src/config/settings.js';
export async function runPreflightTests() {
    const results = [];
    // Test 1: Transaction Creation
    try {
        const tx = new Transaction(100, 'Test', 'income', 'salary');
        if (tx.amount !== 100 || tx.type !== 'income') {
            throw new Error('Transaction creation failed');
        }
        results.push({ name: 'Transaction Creation', passed: true });
    }
    catch (error) {
        results.push({ name: 'Transaction Creation', passed: false, error: error.message });
    }
    // Test 2: ExpenseTracker Basic Operations
    try {
        const tracker = new ExpenseTracker();
        tracker.addIncome(100, 'Test Income');
        tracker.addExpense(50, 'Test Expense');
        const balance = tracker.getBalance();
        if (balance !== 50) {
            throw new Error(`Expected balance 50, got ${balance}`);
        }
        const transactions = tracker.getRecentTransactions(10);
        if (transactions.length !== 2) {
            throw new Error(`Expected 2 transactions, got ${transactions.length}`);
        }
        results.push({ name: 'ExpenseTracker Operations', passed: true });
    }
    catch (error) {
        results.push({ name: 'ExpenseTracker Operations', passed: false, error: error.message });
    }
    // Test 3: CSV Export
    try {
        const tracker = new ExpenseTracker();
        tracker.addIncome(100, 'Test');
        const csv = tracker.exportToCSV();
        if (!csv || !csv.includes('Amount')) {
            throw new Error('CSV export failed');
        }
        results.push({ name: 'CSV Export', passed: true });
    }
    catch (error) {
        results.push({ name: 'CSV Export', passed: false, error: error.message });
    }
    // Test 4: Settings Configuration
    try {
        const settings = new Settings();
        // Just check that it instantiates without error
        if (!settings) {
            throw new Error('Settings creation failed');
        }
        results.push({ name: 'Settings Configuration', passed: true });
    }
    catch (error) {
        results.push({ name: 'Settings Configuration', passed: false, error: error.message });
    }
    // Test 5: Environment Variables Check
    try {
        const settings = new Settings();
        const hasToken = !!settings.telegramBotToken;
        const hasApiKey = !!(settings.groqApiKey || settings.openaiApiKey);
        if (!hasToken) {
            throw new Error('TELEGRAM_BOT_TOKEN not set');
        }
        if (!hasApiKey) {
            throw new Error('No LLM API key set (GROQ_API_KEY or OPENAI_API_KEY)');
        }
        results.push({ name: 'Environment Variables', passed: true });
    }
    catch (error) {
        results.push({ name: 'Environment Variables', passed: false, error: error.message });
    }
    return results;
}
export function printTestResults(results) {
    console.log('\n🧪 Pre-flight Test Results:\n');
    let allPassed = true;
    results.forEach(result => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} ${result.name}`);
        if (!result.passed && result.error) {
            console.log(`   Error: ${result.error}`);
            allPassed = false;
        }
    });
    console.log('');
    if (allPassed) {
        console.log('✅ All pre-flight tests passed!');
    }
    else {
        console.log('❌ Some tests failed. Please fix the issues before running the bot.');
        process.exit(1);
    }
    console.log('');
}
// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runPreflightTests()
        .then(printTestResults)
        .catch(error => {
        console.error('❌ Test runner error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=test-runner.js.map
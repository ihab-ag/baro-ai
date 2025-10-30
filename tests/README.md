# Test Suite Documentation

This directory contains comprehensive tests for all bot functionalities.

## Running Tests

### All Tests
```bash
npm test
```
Runs all tests once and exits.

### Watch Mode
```bash
npm run test:watch
```
Runs tests in watch mode - automatically re-runs when files change.

### UI Mode
```bash
npm run test:ui
```
Opens Vitest UI in browser for interactive testing.

### Pre-flight Tests
```bash
npm run test:preflight
```
Runs basic functionality checks before starting the bot. Automatically runs before `npm start`.

## Test Files

### `expense-tracker.test.ts`
Tests core transaction tracking functionality:
- ✅ Transaction creation (income/expense)
- ✅ Balance calculation
- ✅ Transaction ordering (most recent first)
- ✅ Category filtering
- ✅ CSV export
- ✅ Serialization/deserialization

### `persisted-tracker.test.ts`
Tests database persistence (requires Supabase):
- ✅ Data loading from Supabase
- ✅ Income/expense persistence
- ✅ Account management
- ✅ Budget operations
- ✅ Transaction deletion
- ✅ CSV export with persistence

**Note:** These tests are automatically skipped if Supabase credentials are not configured.

### `command-handlers.test.ts`
Tests Telegram bot command handlers:
- ✅ Balance command handler
- ✅ History command handler
- ✅ Accounts command handler
- ✅ Budgets command handler

### `accounting-agent.test.ts`
Tests AI agent functionality:
- ✅ Agent initialization
- ✅ Balance summary generation

### `integration.test.ts`
End-to-end workflow tests:
- ✅ Complete month transaction workflow
- ✅ Mixed transaction balance tracking
- ✅ Transaction ordering
- ✅ Empty state handling
- ✅ Transaction tracking correctness

### `test-runner.ts`
Pre-flight test runner used before bot startup:
- ✅ Core functionality verification
- ✅ Environment variable checks
- ✅ Basic operations validation

## Test Coverage

The test suite covers:
- ✅ **Core Functionality**: Transaction operations, balance calculation
- ✅ **Data Persistence**: Database operations (when Supabase configured)
- ✅ **Command Handlers**: All major bot commands
- ✅ **Integration**: Complete workflows and edge cases
- ✅ **Pre-flight Checks**: Automatic validation before bot start

## Test Results

All tests should pass before deploying. Current status:

```
✓ Expense Tracker: 12/12 tests passing
✓ Command Handlers: 4/4 tests passing
✓ Accounting Agent: 2/2 tests passing
✓ Integration: 5/5 tests passing
⊘ Persisted Tracker: Skipped if Supabase not configured
```

## Adding New Tests

When adding new features:

1. **Add unit tests** to appropriate test file
2. **Add integration tests** if testing workflows
3. **Update pre-flight tests** if adding critical functionality
4. **Ensure tests pass** before committing

## Continuous Integration

Tests are designed to:
- ✅ Run quickly (< 1 second for core tests)
- ✅ Pass without external dependencies (except Supabase-specific tests)
- ✅ Be idempotent (can run multiple times)
- ✅ Be isolated (don't affect each other)

## Troubleshooting

### Tests failing?
1. Check environment variables are set
2. Ensure dependencies are installed: `npm install`
3. Run build first: `npm run build`
4. Check TypeScript errors: `npm run build`

### Supabase tests skipped?
This is normal if `SUPABASE_URL` and `SUPABASE_ANON_KEY` are not set in `.env`.

### Pre-flight tests failing?
Fix the issue before running the bot - these check critical functionality.


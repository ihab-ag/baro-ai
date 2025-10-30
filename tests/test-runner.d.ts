/**
 * Pre-flight test runner
 * Runs basic functionality checks before starting the bot
 */
export interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
}
export declare function runPreflightTests(): Promise<TestResult[]>;
export declare function printTestResults(results: TestResult[]): void;
//# sourceMappingURL=test-runner.d.ts.map
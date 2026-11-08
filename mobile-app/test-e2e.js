/**
 * WhereReady Solar OS — Mobile Client Automated E2E Test Suite Runner
 * 
 * Executes all 4 Tiers of automated testing:
 * - Tier 1: Category-Partition Feature Coverage (50 tests)
 * - Tier 2: Boundary Value Analysis & Negative Constraints (43 tests)
 * - Tier 3: Pairwise Multi-Module Workflows (12 tests)
 * - Tier 4: Real-World Solar EPC Customer Journeys (16 tests)
 * 
 * Usage:
 *   node mobile-app/test-e2e.js
 *   node --test "mobile-app/tests/*.test.js"
 */

const { spawnSync } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  WHEREREADY SOLAR OS — MOBILE CLIENT AUTOMATED E2E TEST RUNNER         ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  Tiers 1-4: Category-Partition, Boundaries, Pairwise & Real-World      ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

const testFiles = [
  'mobile-app/tests/tier1-category-partition.test.js',
  'mobile-app/tests/tier2-boundary-analysis.test.js',
  'mobile-app/tests/tier3-pairwise-combinations.test.js',
  'mobile-app/tests/tier4-real-world-scenarios.test.js',
  'mobile-app/tests/tier5-ui-primitives-stress.test.js',
];

const startTime = Date.now();
const result = spawnSync('node', ['--test', ...testFiles], {
  stdio: 'inherit',
  shell: true,
});
const durationMs = Date.now() - startTime;

if (result.status === 0) {
  console.log(`\n${colors.bold}${colors.green}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.green}  ✔ ALL MOBILE E2E TESTS PASSED SUCCESSFULLY! (${durationMs} ms)            ${colors.reset}`);
  console.log(`${colors.bold}${colors.green}  Tiers 1-4 Feature Invariants, Boundaries & Customer Journeys Verified  ${colors.reset}`);
  console.log(`${colors.bold}${colors.green}========================================================================${colors.reset}\n`);
  process.exit(0);
} else {
  console.error(`\n${colors.bold}${colors.red}========================================================================${colors.reset}`);
  console.error(`${colors.bold}${colors.red}  ✖ SOME MOBILE E2E TESTS FAILED (Exit Code: ${result.status})           ${colors.reset}`);
  console.error(`${colors.bold}${colors.red}========================================================================${colors.reset}\n`);
  process.exit(result.status || 1);
}

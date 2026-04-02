const fs = require('fs');
const path = require('path');

/**
 * Check 6: Testing setup — does the project have tests and are they enforced?
 * Weight: 10/100
 */

const MAX_POINTS = 10;

module.exports = function checkTesting(projectDir) {
  const results = [];
  let score = 0;

  // Detect test framework presence
  const testIndicators = [
    { name: 'Vitest', files: ['vitest.config.ts', 'vitest.config.js', 'vitest.config.mts'] },
    { name: 'Jest', files: ['jest.config.js', 'jest.config.ts', 'jest.config.mjs'] },
    { name: 'Playwright', files: ['playwright.config.ts', 'playwright.config.js'] },
    { name: 'Cypress', files: ['cypress.config.ts', 'cypress.config.js'] },
    { name: 'Pytest', files: ['pytest.ini', 'conftest.py'] },
    { name: 'Go test', files: ['go.mod'] },
    { name: 'Cargo test', files: ['Cargo.toml'] },
  ];

  let detectedFramework = null;
  for (const ti of testIndicators) {
    if (ti.files.some(f => fs.existsSync(path.join(projectDir, f)))) {
      detectedFramework = ti.name;
      break;
    }
  }

  // Also check deps
  if (!detectedFramework) {
    const pkgPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps.vitest) detectedFramework = 'Vitest';
        else if (allDeps.jest) detectedFramework = 'Jest';
        else if (allDeps['@playwright/test']) detectedFramework = 'Playwright';
        else if (allDeps.cypress) detectedFramework = 'Cypress';
        else if (allDeps.mocha) detectedFramework = 'Mocha';
      } catch {}
    }
  }

  // --- Has test framework (3 pts) ---
  if (detectedFramework) {
    score += 3;
    results.push({ status: 'pass', message: `Test framework: ${detectedFramework}` });
  } else {
    results.push({
      status: 'fail',
      message: 'No test framework detected',
      fix: 'Install Vitest, Jest, or your language\'s test framework',
      impact: 'high',
    });
    return { name: 'Testing', score: 0, max: MAX_POINTS, results };
  }

  // --- Has test files (3 pts) ---
  const testDirs = ['__tests__', 'tests', 'test', 'spec', 'e2e'];
  const hasTestDir = testDirs.some(d =>
    fs.existsSync(path.join(projectDir, d))
    || fs.existsSync(path.join(projectDir, 'src', d))
  );

  // Check for co-located test files
  const hasColocatedTests = hasFilesMatching(projectDir, /\.(test|spec)\.(ts|tsx|js|jsx)$/);

  if (hasTestDir || hasColocatedTests) {
    score += 3;
    const where = hasTestDir ? 'dedicated test directory' : 'co-located test files';
    results.push({ status: 'pass', message: `Test files found (${where})` });
  } else {
    results.push({
      status: 'fail',
      message: 'No test files found',
      fix: 'Create test files in __tests__/ or co-locate with *.test.ts pattern',
      impact: 'high',
    });
  }

  // --- Test command works (2 pts) ---
  if (fs.existsSync(path.join(projectDir, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'));
      const testScript = pkg.scripts?.test;
      if (testScript && testScript !== 'echo "Error: no test specified" && exit 1') {
        score += 2;
        results.push({ status: 'pass', message: 'Test script is configured' });
      } else {
        results.push({
          status: 'warn',
          message: 'Test script is the npm default placeholder',
          fix: 'Update the "test" script in package.json to actually run your tests',
          impact: 'medium',
        });
      }
    } catch {}
  } else {
    score += 2; // Non-JS projects get a pass
  }

  // --- CLAUDE.md mentions testing (2 pts) ---
  const claudePath = path.join(projectDir, 'CLAUDE.md');
  if (fs.existsSync(claudePath)) {
    const content = fs.readFileSync(claudePath, 'utf-8');
    if (/\b(test|spec|jest|vitest|pytest|cargo test)\b/i.test(content)) {
      score += 2;
      results.push({ status: 'pass', message: 'CLAUDE.md mentions testing' });
    } else {
      results.push({
        status: 'warn',
        message: 'CLAUDE.md doesn\'t mention testing',
        fix: 'Add test commands and rules about running tests to CLAUDE.md',
        impact: 'medium',
      });
    }
  }

  return { name: 'Testing', score: Math.min(score, MAX_POINTS), max: MAX_POINTS, results };
};

function hasFilesMatching(dir, pattern, depth = 0, maxDepth = 3) {
  if (depth >= maxDepth) return false;
  const ignore = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'target', 'vendor']);
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (ignore.has(entry.name) || entry.name.startsWith('.')) continue;
      if (entry.isFile() && pattern.test(entry.name)) return true;
      if (entry.isDirectory() && hasFilesMatching(path.join(dir, entry.name), pattern, depth + 1, maxDepth)) return true;
    }
  } catch {}
  return false;
}

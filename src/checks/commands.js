const fs = require('fs');
const path = require('path');

/**
 * Check 3: Are key development commands documented and runnable?
 * Weight: 15/100
 */

const MAX_POINTS = 15;

module.exports = function checkCommands(projectDir) {
  const results = [];
  let score = 0;

  const pkgPath = path.join(projectDir, 'package.json');
  const makefilePath = path.join(projectDir, 'Makefile');
  const pyprojectPath = path.join(projectDir, 'pyproject.toml');
  const cargoPath = path.join(projectDir, 'Cargo.toml');

  let scripts = {};
  let pm = 'npm';

  // Detect package manager and scripts
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      scripts = pkg.scripts || {};
      if (fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) pm = 'pnpm';
      else if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) pm = 'yarn';
      else if (fs.existsSync(path.join(projectDir, 'bun.lockb')) || fs.existsSync(path.join(projectDir, 'bun.lock'))) pm = 'bun';
    } catch {}
  }

  const hasMakefile = fs.existsSync(makefilePath);
  const hasPyproject = fs.existsSync(pyprojectPath);
  const hasCargo = fs.existsSync(cargoPath);
  const isGoProject = fs.existsSync(path.join(projectDir, 'go.mod'));

  // --- Dev command (3 pts) ---
  if (scripts.dev || scripts.start || scripts.serve) {
    score += 3;
    const cmd = scripts.dev ? 'dev' : scripts.start ? 'start' : 'serve';
    results.push({ status: 'pass', message: `Dev server: \`${pm} run ${cmd}\`` });
  } else if (hasCargo || isGoProject) {
    score += 3;
    results.push({ status: 'pass', message: `Dev: \`${hasCargo ? 'cargo run' : 'go run .'}\`` });
  } else {
    results.push({
      status: 'warn',
      message: 'No dev/start script found',
      fix: 'Add a "dev" or "start" script to package.json',
      impact: 'medium',
    });
  }

  // --- Build command (3 pts) ---
  if (scripts.build) {
    score += 3;
    results.push({ status: 'pass', message: `Build: \`${pm} run build\`` });
  } else if (hasCargo) {
    score += 3;
    results.push({ status: 'pass', message: 'Build: `cargo build`' });
  } else if (isGoProject) {
    score += 3;
    results.push({ status: 'pass', message: 'Build: `go build`' });
  } else if (hasMakefile) {
    score += 2;
    results.push({ status: 'pass', message: 'Build: `make` (Makefile detected)' });
  } else {
    results.push({
      status: 'warn',
      message: 'No build script found',
      fix: 'Add a "build" script if the project needs compilation',
      impact: 'low',
    });
  }

  // --- Test command (4 pts) ---
  const hasRealTestScript = scripts.test && scripts.test !== 'echo "Error: no test specified" && exit 1';
  if (hasRealTestScript) {
    score += 4;
    results.push({ status: 'pass', message: `Test: \`${pm} test\`` });
  } else if (scripts['test:unit'] || scripts['test:integration']) {
    score += 3;
    const cmd = scripts['test:unit'] ? 'test:unit' : 'test:integration';
    results.push({ status: 'pass', message: `Test: \`${pm} run ${cmd}\`` });
  } else if (hasCargo) {
    score += 4;
    results.push({ status: 'pass', message: 'Test: `cargo test`' });
  } else if (isGoProject) {
    score += 4;
    results.push({ status: 'pass', message: 'Test: `go test ./...`' });
  } else if (fs.existsSync(path.join(projectDir, 'pytest.ini')) || hasPyproject) {
    score += 3;
    results.push({ status: 'pass', message: 'Test: `pytest`' });
  } else {
    results.push({
      status: 'fail',
      message: 'No test command configured',
      fix: 'Add a test framework (Vitest, Jest, Pytest) and a "test" script',
      impact: 'high',
    });
  }

  // --- Lint command (3 pts) ---
  if (scripts.lint || scripts['lint:fix']) {
    score += 3;
    results.push({ status: 'pass', message: `Lint: \`${pm} run ${scripts.lint ? 'lint' : 'lint:fix'}\`` });
  } else if (fs.existsSync(path.join(projectDir, 'biome.json')) || fs.existsSync(path.join(projectDir, 'biome.jsonc'))) {
    score += 2;
    results.push({ status: 'pass', message: 'Lint: Biome configured (add a lint script for clarity)' });
  } else {
    results.push({
      status: 'warn',
      message: 'No lint script found',
      fix: 'Add ESLint, Biome, or another linter with a "lint" script',
      impact: 'medium',
    });
  }

  // --- Typecheck or equivalent (2 pts) ---
  if (scripts.typecheck || scripts['type-check'] || scripts.tsc) {
    score += 2;
    results.push({ status: 'pass', message: 'Typecheck script configured' });
  } else if (fs.existsSync(path.join(projectDir, 'tsconfig.json'))) {
    score += 1;
    results.push({
      status: 'warn',
      message: 'TypeScript present but no typecheck script',
      fix: 'Add a "typecheck" script: "tsc --noEmit"',
      impact: 'medium',
    });
  } else if (hasCargo || isGoProject) {
    score += 2;
    results.push({ status: 'pass', message: 'Type safety built into language' });
  }

  return { name: 'Commands', score: Math.min(score, MAX_POINTS), max: MAX_POINTS, results };
};

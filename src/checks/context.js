const fs = require('fs');
const path = require('path');

/**
 * Check 4: Context optimization — is the project set up to give Claude
 * the right context without wasting tokens?
 * Weight: 15/100
 */

const MAX_POINTS = 15;

const NOISE_DIRS = [
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.output',
  '.svelte-kit', 'coverage', '__pycache__', '.pytest_cache', '.mypy_cache',
  'target', 'vendor', '.turbo', '.cache', '.parcel-cache',
];

const NOISE_FILES = [
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock',
  'Cargo.lock', 'poetry.lock', 'composer.lock', 'Pipfile.lock',
];

module.exports = function checkContext(projectDir) {
  const results = [];
  let score = 0;

  // --- .claudeignore exists (5 pts) ---
  const claudeignorePath = path.join(projectDir, '.claudeignore');
  if (fs.existsSync(claudeignorePath)) {
    const content = fs.readFileSync(claudeignorePath, 'utf-8');
    const rules = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));

    if (rules.length >= 5) {
      score += 5;
      results.push({ status: 'pass', message: `.claudeignore has ${rules.length} rules — good noise filtering` });
    } else if (rules.length >= 1) {
      score += 3;
      results.push({
        status: 'warn',
        message: `.claudeignore has only ${rules.length} rule(s)`,
        fix: 'Add more patterns: lock files, dist/, coverage/, generated code',
        impact: 'medium',
      });
    }
  } else {
    // Check if .gitignore at least exists
    const gitignorePath = path.join(projectDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      score += 1;
      results.push({
        status: 'warn',
        message: 'No .claudeignore — relying on .gitignore alone',
        fix: 'Create .claudeignore to exclude lock files, generated code, and large binaries from Claude\'s context',
        impact: 'medium',
      });
    } else {
      results.push({
        status: 'fail',
        message: 'No .claudeignore or .gitignore — Claude reads everything',
        fix: 'Create .claudeignore to prevent Claude from reading irrelevant files (lock files, dist/, coverage/)',
        impact: 'high',
      });
    }
  }

  // --- Lock files are excluded (3 pts) ---
  const hasLockFiles = NOISE_FILES.some(f => fs.existsSync(path.join(projectDir, f)));
  if (hasLockFiles) {
    let lockFilesIgnored = false;
    const ignoreFile = fs.existsSync(claudeignorePath) ? claudeignorePath : path.join(projectDir, '.gitignore');
    if (fs.existsSync(ignoreFile)) {
      const ignoreContent = fs.readFileSync(ignoreFile, 'utf-8');
      lockFilesIgnored = NOISE_FILES.some(f => ignoreContent.includes(f) || ignoreContent.includes('*.lock'));
    }

    if (lockFilesIgnored) {
      score += 3;
      results.push({ status: 'pass', message: 'Lock files are excluded from context' });
    } else {
      results.push({
        status: 'warn',
        message: 'Lock files not excluded — wastes context tokens',
        fix: 'Add lock files to .claudeignore: package-lock.json, yarn.lock, pnpm-lock.yaml',
        impact: 'medium',
      });
    }
  } else {
    score += 3;
    results.push({ status: 'pass', message: 'No lock files to worry about' });
  }

  // --- Project size sanity (4 pts) ---
  const fileCount = countProjectFiles(projectDir, 0, 4);
  if (fileCount < 500) {
    score += 4;
    results.push({ status: 'pass', message: `~${fileCount} files — manageable project size` });
  } else if (fileCount < 2000) {
    score += 2;
    results.push({
      status: 'warn',
      message: `~${fileCount} files — large project, .claudeignore critical`,
      fix: 'Ensure .claudeignore excludes generated files, vendor code, and large directories',
      impact: 'medium',
    });
  } else {
    score += 1;
    results.push({
      status: 'warn',
      message: `~${fileCount} files — very large codebase`,
      fix: 'Use .claudeignore aggressively. Consider focusing Claude on specific directories.',
      impact: 'high',
    });
  }

  // --- No huge files in common paths (3 pts) ---
  const suspiciousFiles = findLargeFiles(projectDir);
  if (suspiciousFiles.length === 0) {
    score += 3;
    results.push({ status: 'pass', message: 'No oversized files in common paths' });
  } else {
    score += 1;
    results.push({
      status: 'warn',
      message: `${suspiciousFiles.length} large file(s) may waste context: ${suspiciousFiles.slice(0, 3).join(', ')}`,
      fix: 'Add large generated/data files to .claudeignore',
      impact: 'medium',
    });
  }

  return { name: 'Context Optimization', score: Math.min(score, MAX_POINTS), max: MAX_POINTS, results };
};

function countProjectFiles(dir, depth, maxDepth) {
  if (depth >= maxDepth) return 0;
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (NOISE_DIRS.includes(entry.name) || entry.name.startsWith('.')) continue;
      if (entry.isFile()) count++;
      else if (entry.isDirectory()) count += countProjectFiles(path.join(dir, entry.name), depth + 1, maxDepth);
    }
  } catch {}
  return count;
}

function findLargeFiles(dir) {
  const large = [];
  const checkDirs = ['src', 'lib', 'app', 'pages', 'components'];

  for (const d of checkDirs) {
    const full = path.join(dir, d);
    if (!fs.existsSync(full)) continue;
    scanForLarge(full, large, 0, 3);
  }

  // Also check root files
  try {
    const rootFiles = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of rootFiles) {
      if (!entry.isFile()) continue;
      const fp = path.join(dir, entry.name);
      try {
        const stat = fs.statSync(fp);
        if (stat.size > 100000) { // > 100KB
          large.push(entry.name);
        }
      } catch {}
    }
  } catch {}

  return large;
}

function scanForLarge(dir, results, depth, maxDepth) {
  if (depth >= maxDepth) return;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || NOISE_DIRS.includes(entry.name)) continue;
      const fp = path.join(dir, entry.name);
      if (entry.isFile()) {
        try {
          const stat = fs.statSync(fp);
          if (stat.size > 200000) { // > 200KB
            results.push(path.relative(process.cwd(), fp));
          }
        } catch {}
      } else if (entry.isDirectory()) {
        scanForLarge(fp, results, depth + 1, maxDepth);
      }
    }
  } catch {}
}

const fs = require('fs');
const path = require('path');

/**
 * Check 5: Safety — are secrets protected, destructive ops blocked,
 * and env files handled properly?
 * Weight: 15/100
 */

const MAX_POINTS = 15;

module.exports = function checkSafety(projectDir) {
  const results = [];
  let score = 0;

  // --- .env files not committed (4 pts) ---
  const gitignorePath = path.join(projectDir, '.gitignore');
  const claudeignorePath = path.join(projectDir, '.claudeignore');

  let envIgnored = false;
  for (const ignorePath of [gitignorePath, claudeignorePath]) {
    if (fs.existsSync(ignorePath)) {
      const content = fs.readFileSync(ignorePath, 'utf-8');
      if (content.includes('.env') && !content.includes('.env.example')) {
        envIgnored = true;
      }
    }
  }

  const hasEnvFile = fs.existsSync(path.join(projectDir, '.env'))
    || fs.existsSync(path.join(projectDir, '.env.local'));

  if (hasEnvFile && envIgnored) {
    score += 4;
    results.push({ status: 'pass', message: '.env files exist and are gitignored' });
  } else if (hasEnvFile && !envIgnored) {
    results.push({
      status: 'fail',
      message: '.env files exist but may not be gitignored',
      fix: 'Add .env* to .gitignore (except .env.example)',
      impact: 'high',
    });
  } else if (!hasEnvFile) {
    score += 2;
    results.push({ status: 'info', message: 'No .env files detected' });
  }

  // --- Has .env.example (3 pts) ---
  const hasExample = fs.existsSync(path.join(projectDir, '.env.example'))
    || fs.existsSync(path.join(projectDir, '.env.template'))
    || fs.existsSync(path.join(projectDir, '.env.sample'));

  if (hasExample) {
    score += 3;
    results.push({ status: 'pass', message: '.env.example exists — devs know what vars are needed' });
  } else if (hasEnvFile) {
    results.push({
      status: 'warn',
      message: 'No .env.example — new devs won\'t know required env vars',
      fix: 'Create .env.example with all required variables (without real values)',
      impact: 'medium',
    });
  } else {
    score += 2;
    results.push({ status: 'info', message: 'No env files needed' });
  }

  // --- No secrets in tracked files (4 pts) ---
  const secretPatterns = [
    /(?:api[_-]?key|secret|token|password|credential)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    /sk[-_](live|test)_[a-zA-Z0-9]{10,}/,
    /ghp_[a-zA-Z0-9]{36}/,
    /xox[bsp]-[a-zA-Z0-9-]+/,
    /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
  ];

  const filesToCheck = [
    'src/config.ts', 'src/config.js', 'config.ts', 'config.js',
    'src/lib/config.ts', 'src/lib/config.js',
    'src/env.ts', 'src/env.js', 'env.ts', 'env.js',
    'src/constants.ts', 'src/constants.js',
  ];

  let secretsFound = false;
  for (const f of filesToCheck) {
    const fp = path.join(projectDir, f);
    if (!fs.existsSync(fp)) continue;
    try {
      const content = fs.readFileSync(fp, 'utf-8');
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          secretsFound = true;
          results.push({
            status: 'fail',
            message: `Potential secret found in ${f}`,
            fix: 'Move secrets to environment variables. Never hardcode credentials.',
            impact: 'high',
          });
          break;
        }
      }
    } catch {}
  }

  if (!secretsFound) {
    score += 4;
    results.push({ status: 'pass', message: 'No hardcoded secrets detected in config files' });
  }

  // --- CLAUDE.md mentions security rules (4 pts) ---
  const claudePath = path.join(projectDir, 'CLAUDE.md');
  if (fs.existsSync(claudePath)) {
    const content = fs.readFileSync(claudePath, 'utf-8');
    const hasSecurityRules = /\b(secret|credential|\.env|api.?key|password|token)\b/i.test(content)
      && /\b(never|don't|do not|must not|forbidden)\b/i.test(content);

    if (hasSecurityRules) {
      score += 4;
      results.push({ status: 'pass', message: 'CLAUDE.md contains security rules about secrets/env' });
    } else {
      results.push({
        status: 'warn',
        message: 'CLAUDE.md doesn\'t mention secret/env protection',
        fix: 'Add rules like "NEVER commit .env files or hardcode secrets"',
        impact: 'medium',
      });
    }
  } else {
    results.push({
      status: 'fail',
      message: 'No CLAUDE.md — no security rules for Claude',
      fix: 'Create CLAUDE.md with explicit security rules',
      impact: 'high',
    });
  }

  return { name: 'Safety', score: Math.min(score, MAX_POINTS), max: MAX_POINTS, results };
};

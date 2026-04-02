const fs = require('fs');
const path = require('path');

/**
 * Check 2: Claude Code hooks configuration.
 * Weight: 20/100 — hooks are the enforcement layer.
 */

const MAX_POINTS = 20;

module.exports = function checkHooks(projectDir) {
  const results = [];
  let score = 0;

  const settingsPath = path.join(projectDir, '.claude', 'settings.json');

  if (!fs.existsSync(settingsPath)) {
    // Check local settings too
    const localSettings = path.join(projectDir, '.claude', 'settings.local.json');
    if (!fs.existsSync(localSettings)) {
      results.push({
        status: 'fail',
        message: 'No .claude/settings.json found — no hooks configured',
        fix: 'Create .claude/settings.json with hooks for PreToolUse and PostToolUse',
        impact: 'high',
      });
      return { name: 'Hooks', score: 0, max: MAX_POINTS, results };
    }
  }

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch (err) {
    results.push({
      status: 'fail',
      message: `Invalid JSON in settings.json: ${err.message}`,
      fix: 'Fix the JSON syntax in .claude/settings.json',
      impact: 'high',
    });
    return { name: 'Hooks', score: 0, max: MAX_POINTS, results };
  }

  // --- Has hooks key (3 pts) ---
  if (!settings.hooks || typeof settings.hooks !== 'object') {
    results.push({
      status: 'fail',
      message: 'No hooks configured in settings.json',
      fix: 'Add a "hooks" key with PreToolUse and/or PostToolUse arrays',
      impact: 'high',
    });
    return { name: 'Hooks', score: 2, max: MAX_POINTS, results };
  }

  score += 3;
  results.push({ status: 'pass', message: 'Hooks section exists' });

  // --- Has PreToolUse hooks (5 pts) ---
  const preHooks = settings.hooks.PreToolUse || settings.hooks.preToolUse || [];
  if (preHooks.length >= 3) {
    score += 5;
    results.push({ status: 'pass', message: `${preHooks.length} PreToolUse hooks — strong enforcement` });
  } else if (preHooks.length >= 1) {
    score += 2;
    results.push({
      status: 'warn',
      message: `Only ${preHooks.length} PreToolUse hook(s)`,
      fix: 'Add hooks for common protections: destructive commands, .env edits, force push',
      impact: 'medium',
    });
  } else {
    results.push({
      status: 'fail',
      message: 'No PreToolUse hooks — nothing is blocked',
      fix: 'Add PreToolUse hooks to block dangerous operations (rm -rf, force push, .env edits)',
      impact: 'high',
    });
  }

  // --- Has PostToolUse hooks (3 pts) ---
  const postHooks = settings.hooks.PostToolUse || settings.hooks.postToolUse || [];
  if (postHooks.length >= 1) {
    score += 3;
    results.push({ status: 'pass', message: `${postHooks.length} PostToolUse hook(s) — post-action checks active` });
  } else {
    results.push({
      status: 'info',
      message: 'No PostToolUse hooks',
      fix: 'Consider adding post-action hooks for linting or typechecking after edits',
      impact: 'low',
    });
  }

  // --- Hooks have proper structure (3 pts) ---
  const allHooks = [...preHooks, ...postHooks];
  const wellFormed = allHooks.filter(h => h.matcher && h.command && h.type === 'command');
  if (wellFormed.length === allHooks.length && allHooks.length > 0) {
    score += 3;
    results.push({ status: 'pass', message: 'All hooks properly structured (matcher + type + command)' });
  } else if (wellFormed.length > 0) {
    score += 1;
    const malformed = allHooks.length - wellFormed.length;
    results.push({
      status: 'warn',
      message: `${malformed} hook(s) missing required fields`,
      fix: 'Each hook needs: matcher (tool name), type ("command"), command (shell command)',
      impact: 'medium',
    });
  }

  // --- Covers critical patterns (3 pts) ---
  const allCommands = allHooks.map(h => h.command || '').join(' ');
  const criticalPatterns = {
    'destructive bash protection': /rm -rf|reset --hard|push.*force/i,
    'env file protection': /\.env/i,
    'force push protection': /push.*force|push.*-f/i,
  };

  let coveredCount = 0;
  for (const [name, pattern] of Object.entries(criticalPatterns)) {
    if (pattern.test(allCommands)) {
      coveredCount++;
    }
  }

  if (coveredCount >= 3) {
    score += 3;
    results.push({ status: 'pass', message: 'Covers all critical protection patterns' });
  } else if (coveredCount >= 1) {
    score += 1;
    const missing = Object.keys(criticalPatterns).filter(
      (name) => !criticalPatterns[name].test(allCommands)
    );
    results.push({
      status: 'warn',
      message: `Missing protections: ${missing.join(', ')}`,
      fix: `Add hooks for: ${missing.join(', ')}`,
      impact: 'medium',
    });
  } else {
    results.push({
      status: 'fail',
      message: 'No critical protections configured',
      fix: 'Add hooks to block: rm -rf, git push --force, .env file edits',
      impact: 'high',
    });
  }

  return { name: 'Hooks', score: Math.min(score, MAX_POINTS), max: MAX_POINTS, results };
};

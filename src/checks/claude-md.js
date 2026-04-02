const fs = require('fs');
const path = require('path');

/**
 * Check 1: CLAUDE.md quality and completeness.
 * Weight: 25/100 — this is the most impactful file.
 */

const MAX_POINTS = 25;

module.exports = function checkClaudeMd(projectDir) {
  const results = [];
  let score = 0;

  const claudePaths = [
    path.join(projectDir, 'CLAUDE.md'),
    path.join(projectDir, '.claude', 'CLAUDE.md'),
  ];

  const claudeFile = claudePaths.find(p => fs.existsSync(p));

  if (!claudeFile) {
    results.push({
      status: 'fail',
      message: 'No CLAUDE.md found',
      fix: 'Create a CLAUDE.md at the project root with instructions for Claude Code',
      impact: 'high',
    });
    return { name: 'CLAUDE.md', score: 0, max: MAX_POINTS, results };
  }

  const content = fs.readFileSync(claudeFile, 'utf-8');
  const lines = content.split('\n');
  const lineCount = lines.length;
  const wordCount = content.split(/\s+/).length;

  // --- Exists (2 pts) ---
  score += 2;
  results.push({ status: 'pass', message: 'CLAUDE.md exists' });

  // --- Minimum length (3 pts) ---
  if (lineCount >= 20) {
    score += 3;
    results.push({ status: 'pass', message: `${lineCount} lines — good coverage` });
  } else if (lineCount >= 10) {
    score += 1;
    results.push({
      status: 'warn',
      message: `Only ${lineCount} lines — too short for complex projects`,
      fix: 'Add more context: architecture, conventions, common commands',
      impact: 'medium',
    });
  } else {
    results.push({
      status: 'fail',
      message: `Only ${lineCount} lines — way too short`,
      fix: 'A good CLAUDE.md has 20-100 lines covering commands, conventions, and rules',
      impact: 'high',
    });
  }

  // --- Has headings / structure (3 pts) ---
  const headings = lines.filter(l => /^#{1,3}\s+/.test(l));
  if (headings.length >= 3) {
    score += 3;
    results.push({ status: 'pass', message: `${headings.length} sections — well structured` });
  } else if (headings.length >= 1) {
    score += 1;
    results.push({
      status: 'warn',
      message: `Only ${headings.length} section(s) — add more structure`,
      fix: 'Organize with ## headings: Commands, Architecture, Conventions, Rules',
      impact: 'medium',
    });
  } else {
    results.push({
      status: 'fail',
      message: 'No headings — unstructured wall of text',
      fix: 'Add ## headings to organize instructions into clear sections',
      impact: 'high',
    });
  }

  // --- Has commands section (3 pts) ---
  const hasCommands = /\b(npm|yarn|pnpm|bun|cargo|go|python|pip|make)\s+(run\s+)?\w+/i.test(content)
    || /```(bash|sh|shell)/i.test(content)
    || /\b(dev|build|test|lint|start|deploy)\b.*`[^`]+`/i.test(content);
  if (hasCommands) {
    score += 3;
    results.push({ status: 'pass', message: 'Contains runnable commands' });
  } else {
    results.push({
      status: 'fail',
      message: 'No commands found',
      fix: 'Add dev, build, test, and lint commands so Claude knows how to run your project',
      impact: 'high',
    });
  }

  // --- Has rules/constraints (3 pts) ---
  const ruleIndicators = (content.match(/\b(MUST|NEVER|ALWAYS|DO NOT|DON'T|IMPORTANT|REQUIRED)\b/gi) || []).length;
  if (ruleIndicators >= 3) {
    score += 3;
    results.push({ status: 'pass', message: `${ruleIndicators} explicit rules/constraints` });
  } else if (ruleIndicators >= 1) {
    score += 1;
    results.push({
      status: 'warn',
      message: `Only ${ruleIndicators} explicit rule(s)`,
      fix: 'Add clear rules with MUST/NEVER/ALWAYS for critical behaviors',
      impact: 'medium',
    });
  } else {
    results.push({
      status: 'fail',
      message: 'No explicit rules — Claude has no constraints',
      fix: 'Add rules like "NEVER edit .env files" or "ALWAYS run tests before committing"',
      impact: 'high',
    });
  }

  // --- Has architecture/structure info (3 pts) ---
  const hasArchitecture = /\b(src\/|app\/|components|lib\/|utils|directory|folder|structure|architecture|layout)\b/i.test(content);
  if (hasArchitecture) {
    score += 3;
    results.push({ status: 'pass', message: 'Describes project architecture' });
  } else {
    results.push({
      status: 'warn',
      message: 'No architecture description',
      fix: 'Describe key directories and their purpose (src/components, src/lib, etc.)',
      impact: 'medium',
    });
  }

  // --- Has conventions (3 pts) ---
  const hasConventions = /\b(convention|style|pattern|naming|format|indent|quote|semicolon|tabs?\b|spaces?\b|camelCase|snake_case|PascalCase)\b/i.test(content)
    || /\b(TypeScript|ESLint|Prettier|Biome|strict)\b/i.test(content);
  if (hasConventions) {
    score += 3;
    results.push({ status: 'pass', message: 'Documents code conventions' });
  } else {
    results.push({
      status: 'warn',
      message: 'No code conventions documented',
      fix: 'Document coding style: TypeScript strict, formatting, naming conventions',
      impact: 'low',
    });
  }

  // --- Not too long / bloated (2 pts) ---
  if (wordCount <= 2000) {
    score += 2;
    results.push({ status: 'pass', message: `${wordCount} words — concise and focused` });
  } else if (wordCount <= 5000) {
    score += 1;
    results.push({
      status: 'warn',
      message: `${wordCount} words — getting long, Claude may lose focus`,
      fix: 'Keep CLAUDE.md under 2000 words. Move detailed docs elsewhere.',
      impact: 'low',
    });
  } else {
    results.push({
      status: 'fail',
      message: `${wordCount} words — too long, wastes context window`,
      fix: 'Trim to essentials. Long CLAUDE.md files dilute important instructions.',
      impact: 'medium',
    });
  }

  return { name: 'CLAUDE.md', score: Math.min(score, MAX_POINTS), max: MAX_POINTS, results };
};

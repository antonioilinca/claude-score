const chalk = require('chalk');

/**
 * Terminal reporter — the visual output that makes people screenshot and share.
 */

function getGrade(percentage) {
  if (percentage >= 90) return { letter: 'A', color: chalk.green };
  if (percentage >= 80) return { letter: 'B', color: chalk.green };
  if (percentage >= 70) return { letter: 'C', color: chalk.yellow };
  if (percentage >= 50) return { letter: 'D', color: chalk.red };
  return { letter: 'F', color: chalk.red };
}

function renderBar(score, max, width = 20) {
  const pct = max > 0 ? score / max : 0;
  const filled = Math.round(pct * width);
  const empty = width - filled;

  let color;
  if (pct >= 0.8) color = chalk.green;
  else if (pct >= 0.6) color = chalk.yellow;
  else color = chalk.red;

  return color('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
}

function renderGradeBig(grade, color) {
  // ASCII art letter grades
  const letters = {
    A: [
      '   ██   ',
      '  ████  ',
      ' ██  ██ ',
      ' ██████ ',
      ' ██  ██ ',
    ],
    B: [
      ' █████  ',
      ' ██  ██ ',
      ' █████  ',
      ' ██  ██ ',
      ' █████  ',
    ],
    C: [
      '  █████ ',
      ' ██     ',
      ' ██     ',
      ' ██     ',
      '  █████ ',
    ],
    D: [
      ' ████   ',
      ' ██ ██  ',
      ' ██  ██ ',
      ' ██ ██  ',
      ' ████   ',
    ],
    F: [
      ' ██████ ',
      ' ██     ',
      ' ████   ',
      ' ██     ',
      ' ██     ',
    ],
  };

  const art = letters[grade] || letters.F;
  return art.map(line => color(line)).join('\n');
}

module.exports = function renderTerminal(report) {
  const { totalScore, maxScore, percentage, categories, topFixes } = report;
  const grade = getGrade(percentage);

  const lines = [];

  // Header
  lines.push('');
  lines.push(chalk.bold.cyan('  claude-score') + chalk.dim(' — Lighthouse for Claude Code'));
  lines.push(chalk.dim('  ' + '─'.repeat(50)));
  lines.push('');

  // Big grade
  const gradeArt = renderGradeBig(grade.letter, grade.color);
  const gradeLines = gradeArt.split('\n');

  // Score alongside grade
  const scoreText = [
    '',
    grade.color.bold(`  Score: ${totalScore}/${maxScore}`),
    grade.color.bold(`  Grade: ${grade.letter} (${percentage}%)`),
    '',
    chalk.dim(`  ${getVerdict(percentage)}`),
  ];

  // Merge grade art and score text side by side
  const maxLines = Math.max(gradeLines.length, scoreText.length);
  for (let i = 0; i < maxLines; i++) {
    const artLine = (gradeLines[i] || '         ').padEnd(12);
    const textLine = scoreText[i] || '';
    lines.push(`  ${artLine}${textLine}`);
  }

  lines.push('');
  lines.push(chalk.dim('  ' + '─'.repeat(50)));

  // Category breakdown
  lines.push('');
  lines.push(chalk.bold('  Category Breakdown'));
  lines.push('');

  for (const cat of categories) {
    const pct = cat.max > 0 ? Math.round((cat.score / cat.max) * 100) : 0;
    const bar = renderBar(cat.score, cat.max);
    const name = cat.name.padEnd(22);
    const scoreStr = `${cat.score}/${cat.max}`.padStart(5);

    lines.push(`  ${bar} ${chalk.white(name)} ${chalk.dim(scoreStr)} ${chalk.dim(`${pct}%`)}`);
  }

  // Detailed results per category
  lines.push('');
  lines.push(chalk.dim('  ' + '─'.repeat(50)));

  for (const cat of categories) {
    lines.push('');
    const catPct = cat.max > 0 ? Math.round((cat.score / cat.max) * 100) : 0;
    const catColor = catPct >= 80 ? chalk.green : catPct >= 60 ? chalk.yellow : chalk.red;
    lines.push(chalk.bold(`  ${cat.name}`) + catColor(` ${cat.score}/${cat.max}`));

    for (const r of cat.results) {
      const icon = r.status === 'pass' ? chalk.green('  ✓')
        : r.status === 'fail' ? chalk.red('  ✗')
        : r.status === 'warn' ? chalk.yellow('  !')
        : chalk.dim('  ·');

      lines.push(`  ${icon} ${chalk.white(r.message)}`);

      if (r.fix && r.status !== 'pass') {
        lines.push(chalk.dim(`      → ${r.fix}`));
      }
    }
  }

  // Top fixes
  if (topFixes.length > 0) {
    lines.push('');
    lines.push(chalk.dim('  ' + '─'.repeat(50)));
    lines.push('');
    lines.push(chalk.bold('  Top Actions to Improve Score'));
    lines.push('');

    for (let i = 0; i < Math.min(topFixes.length, 5); i++) {
      const fix = topFixes[i];
      const impactColor = fix.impact === 'high' ? chalk.red : fix.impact === 'medium' ? chalk.yellow : chalk.dim;
      lines.push(`  ${chalk.cyan(`${i + 1}.`)} ${chalk.white(fix.fix)}`);
      lines.push(chalk.dim(`     Impact: `) + impactColor(fix.impact) + chalk.dim(` | Category: ${fix.category}`));
    }
  }

  // Badge suggestion
  lines.push('');
  lines.push(chalk.dim('  ' + '─'.repeat(50)));
  lines.push('');
  lines.push(chalk.dim('  Add to your README:'));
  lines.push(chalk.dim(`  ![Claude Code Score](https://img.shields.io/badge/Claude_Code_Score-${grade.letter}_(${percentage}%25)-${getShieldColor(percentage)})`));

  lines.push('');

  return lines.join('\n');
};

function getVerdict(pct) {
  if (pct >= 90) return 'Excellent — Claude Code works at full power on this project';
  if (pct >= 80) return 'Strong — a few tweaks will make it even better';
  if (pct >= 70) return 'Decent — but significant improvements possible';
  if (pct >= 50) return 'Weak — Claude is flying blind on many things';
  return 'Critical — Claude Code has almost no guidance here';
}

function getShieldColor(pct) {
  if (pct >= 90) return 'brightgreen';
  if (pct >= 80) return 'green';
  if (pct >= 70) return 'yellow';
  if (pct >= 50) return 'orange';
  return 'red';
}

module.exports.getGrade = getGrade;

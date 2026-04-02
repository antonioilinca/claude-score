#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');

// Checks
const checkClaudeMd = require('./checks/claude-md');
const checkHooks = require('./checks/hooks');
const checkCommands = require('./checks/commands');
const checkContext = require('./checks/context');
const checkSafety = require('./checks/safety');
const checkTesting = require('./checks/testing');

// Reporters
const renderTerminal = require('./reporters/terminal');
const renderJson = require('./reporters/json');
const renderBadge = require('./reporters/badge');

const pkg = require('../package.json');
const program = new Command();

program
  .name('claude-score')
  .description(chalk.bold('Lighthouse for your Claude Code setup'))
  .version(pkg.version);

program
  .argument('[directory]', 'Project directory to score', '.')
  .option('--json', 'Output as JSON')
  .option('--badge', 'Output only the markdown badge')
  .option('--min-score <number>', 'Exit with code 1 if score is below this threshold')
  .action(runScore);

async function runScore(directory, options) {
  const projectDir = path.resolve(directory || '.');

  // Run all checks
  const categories = [
    checkClaudeMd(projectDir),
    checkHooks(projectDir),
    checkCommands(projectDir),
    checkContext(projectDir),
    checkSafety(projectDir),
    checkTesting(projectDir),
  ];

  // Calculate totals
  const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
  const maxScore = categories.reduce((sum, c) => sum + c.max, 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  // Collect all fixes, sorted by impact
  const impactOrder = { high: 1, medium: 2, low: 3 };
  const topFixes = categories.flatMap(cat =>
    cat.results
      .filter(r => r.fix && r.status !== 'pass')
      .map(r => ({ ...r, category: cat.name }))
  ).sort((a, b) => (impactOrder[a.impact] || 4) - (impactOrder[b.impact] || 4));

  const report = { totalScore, maxScore, percentage, categories, topFixes };

  // Output
  if (options.json) {
    console.log(renderJson(report));
  } else if (options.badge) {
    console.log(renderBadge(report));
  } else {
    console.log(renderTerminal(report));
  }

  // Threshold check for CI
  if (options.minScore) {
    const minScore = parseInt(options.minScore, 10);
    if (percentage < minScore) {
      if (!options.json && !options.badge) {
        console.log(chalk.red(`\n  Score ${percentage}% is below threshold ${minScore}%\n`));
      }
      process.exit(1);
    }
  }
}

program.parse();

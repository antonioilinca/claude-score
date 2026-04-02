/**
 * Badge reporter — generates a markdown badge and optional SVG.
 */

module.exports = function renderBadge(report) {
  const { percentage } = report;

  let letter;
  if (percentage >= 90) letter = 'A';
  else if (percentage >= 80) letter = 'B';
  else if (percentage >= 70) letter = 'C';
  else if (percentage >= 50) letter = 'D';
  else letter = 'F';

  const color = percentage >= 90 ? 'brightgreen'
    : percentage >= 80 ? 'green'
    : percentage >= 70 ? 'yellow'
    : percentage >= 50 ? 'orange'
    : 'red';

  const badgeUrl = `https://img.shields.io/badge/Claude_Code_Score-${letter}_(${percentage}%25)-${color}`;

  return `[![Claude Code Score](${badgeUrl})](https://github.com/antonioilinca/claude-score)`;
};

/**
 * JSON reporter — for CI/CD pipelines, scripts, and machine consumption.
 */

module.exports = function renderJson(report) {
  const { totalScore, maxScore, percentage, categories, topFixes } = report;

  let letter;
  if (percentage >= 90) letter = 'A';
  else if (percentage >= 80) letter = 'B';
  else if (percentage >= 70) letter = 'C';
  else if (percentage >= 50) letter = 'D';
  else letter = 'F';

  return JSON.stringify({
    score: totalScore,
    maxScore,
    percentage,
    grade: letter,
    categories: categories.map(c => ({
      name: c.name,
      score: c.score,
      max: c.max,
      percentage: c.max > 0 ? Math.round((c.score / c.max) * 100) : 0,
      checks: c.results.map(r => ({
        status: r.status,
        message: r.message,
        fix: r.fix || null,
        impact: r.impact || null,
      })),
    })),
    topFixes: topFixes.slice(0, 5).map(f => ({
      fix: f.fix,
      impact: f.impact,
      category: f.category,
    })),
    badge: `https://img.shields.io/badge/Claude_Code_Score-${letter}_(${percentage}%25)-${percentage >= 90 ? 'brightgreen' : percentage >= 80 ? 'green' : percentage >= 70 ? 'yellow' : percentage >= 50 ? 'orange' : 'red'}`,
    generatedAt: new Date().toISOString(),
  }, null, 2);
};

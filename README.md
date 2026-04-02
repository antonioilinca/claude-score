# claude-score

Lighthouse for your Claude Code setup. One command, one score, one grade.

```
  claude-score — Lighthouse for Claude Code
  ──────────────────────────────────────────

   ████
  ██  ██    Score: 82/100
  ██████    Grade: B (82%)
  ██  ██
  ██  ██    Strong — a few tweaks will make it even better
```

## Why

Your `CLAUDE.md`, hooks, and project setup directly determine how well Claude Code works on your codebase. Most projects score under 30%. This tool tells you exactly what to fix.

## Install

```bash
npx claude-score            # run without installing
# or
npm install -g claude-score  # install globally
```

From source:

```bash
git clone https://github.com/antonioilinca/claude-score.git
cd claude-score && npm install && npm link
```

## Usage

```bash
# Score current directory
claude-score

# Score a specific project
claude-score /path/to/project

# JSON output (for scripts/CI)
claude-score --json

# Markdown badge for README
claude-score --badge

# Fail CI if score is below threshold
claude-score --min-score 70
```

## What it checks

| Category | Weight | What's checked |
|----------|--------|----------------|
| **CLAUDE.md** | 25 pts | Exists, structured, has commands, rules, architecture, conventions, concise |
| **Hooks** | 20 pts | settings.json exists, PreToolUse/PostToolUse hooks, critical protections (destructive cmds, .env, force push) |
| **Commands** | 15 pts | Dev, build, test, lint, typecheck scripts detected and documented |
| **Context** | 15 pts | .claudeignore exists, lock files excluded, project size, no oversized files |
| **Safety** | 15 pts | .env gitignored, .env.example exists, no hardcoded secrets, security rules in CLAUDE.md |
| **Testing** | 10 pts | Test framework installed, test files exist, test script works, mentioned in CLAUDE.md |

## Grading

| Grade | Score | Meaning |
|-------|-------|---------|
| **A** | 90-100% | Claude Code works at full power |
| **B** | 80-89% | Strong — a few tweaks left |
| **C** | 70-79% | Decent — significant improvements possible |
| **D** | 50-69% | Weak — Claude is flying blind |
| **F** | 0-49% | Critical — almost no guidance |

## CI/CD integration

Add to your GitHub Actions workflow:

```yaml
- name: Check Claude Code score
  run: npx claude-score --min-score 70
```

The `--min-score` flag exits with code 1 if the score is below the threshold — perfect for quality gates.

## Badge

Add to your README:

```bash
claude-score --badge
```

Output:

```markdown
[![Claude Code Score](https://img.shields.io/badge/Claude_Code_Score-B_(82%25)-green)](https://github.com/antonioilinca/claude-score)
```

## JSON output

```bash
claude-score --json | jq '{grade, score, percentage}'
```

```json
{
  "grade": "B",
  "score": 82,
  "percentage": 82
}
```

## Works with

- Any Node.js/TypeScript project (npm, yarn, pnpm, bun)
- Python projects (pip, poetry, uv)
- Go projects
- Rust projects
- Monorepos (Turborepo, Nx, Lerna)

## Zero dependencies (almost)

Only `commander` and `chalk`. No AI, no network calls. Runs in under a second.

## License

MIT

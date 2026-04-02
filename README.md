# claude-score

> Lighthouse for your Claude Code setup. One command. One grade. Zero excuses.

```
  claude-score — Lighthouse for Claude Code
  ──────────────────────────────────────────────────

   ██████
   ██           Score: 25/100
   ████         Grade: F (25%)
   ██
   ██           Critical — Claude Code has almost no guidance here

  ──────────────────────────────────────────────────

  Category Breakdown

  ░░░░░░░░░░░░░░░░░░░░ CLAUDE.md               0/25  0%
  ░░░░░░░░░░░░░░░░░░░░ Hooks                   0/20  0%
  ███████████████░░░░░ Commands               11/15 73%
  ████████░░░░░░░░░░░░ Context Optimization    6/15 40%
  ███████████░░░░░░░░░ Safety                  8/15 53%
  ░░░░░░░░░░░░░░░░░░░░ Testing                 0/10  0%

  ──────────────────────────────────────────────────

  Top Actions to Improve Score

  1. Create a CLAUDE.md with instructions for Claude Code
     Impact: high | Category: CLAUDE.md
  2. Add hooks to .claude/settings.json
     Impact: high | Category: Hooks
  3. Add a test framework and test script
     Impact: high | Category: Testing
```

**That F is probably your project right now.** Most Claude Code setups score under 30%.

## Try it

```bash
npx claude-score
```

That's it. One command. Takes less than a second.

## What it checks

| Category | Weight | What's checked |
|----------|--------|----------------|
| **CLAUDE.md** | 25 pts | Exists, structured, has commands/rules/architecture/conventions, not bloated |
| **Hooks** | 20 pts | .claude/settings.json exists, PreToolUse/PostToolUse hooks, critical protections |
| **Commands** | 15 pts | Dev, build, test, lint, typecheck scripts detected |
| **Context** | 15 pts | .claudeignore, lock files excluded, project size, no oversized files |
| **Safety** | 15 pts | .env gitignored, .env.example exists, no hardcoded secrets, CLAUDE.md security rules |
| **Testing** | 10 pts | Framework installed, test files exist, script configured, mentioned in CLAUDE.md |

## Grading

| Grade | Score | Meaning |
|-------|-------|---------|
| **A** | 90-100% | Claude Code works at full power |
| **B** | 80-89% | Strong setup, a few tweaks left |
| **C** | 70-79% | Decent, but leaving performance on the table |
| **D** | 50-69% | Weak — Claude is mostly guessing |
| **F** | 0-49% | Critical — you're barely using Claude Code |

## Fix your score

Scored an F? Two commands to fix it:

```bash
npx claude-gen       # auto-generate CLAUDE.md from your codebase
npx claude-enforce init  # convert rules into deterministic hooks
```

| Tool | What it does |
|------|-------------|
| [claude-gen](https://github.com/antonioilinca/claude-gen) | Scans your project, generates a complete CLAUDE.md |
| [claude-enforce](https://github.com/antonioilinca/claude-enforce) | Converts CLAUDE.md rules into .claude/settings.json hooks |

## CI/CD

```yaml
- name: Check Claude Code score
  run: npx claude-score --min-score 70
```

Exits with code 1 below the threshold. Perfect for quality gates.

## Badge

```bash
npx claude-score --badge
```

```markdown
[![Claude Code Score](https://img.shields.io/badge/Claude_Code_Score-A_(94%25)-brightgreen)](https://github.com/antonioilinca/claude-score)
```

## More options

```bash
claude-score /path/to/project    # score a specific project
claude-score --json              # machine-readable output
claude-score --badge             # README badge markdown
claude-score --min-score 70      # CI threshold (exit 1 if below)
```

## Works with

Node.js/TypeScript (npm, yarn, pnpm, bun), Python (pip, poetry, uv), Go, Rust, monorepos (Turborepo, Nx, Lerna).

## How it works

Zero AI. Zero network calls. Pure static analysis of your project files in under 1 second. Only dependencies: `commander` and `chalk`.

## License

MIT

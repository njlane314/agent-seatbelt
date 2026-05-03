# Agent Seatbelt

Treat coding agents like junior contractors with GitHub-native safety rules.

A PR guardrail for AI-agent-authored or bot-authored changes. It runs locally by default, emits deterministic JSON and Markdown, writes a GitHub Step Summary when used as an action, and can update one stable PR comment when requested.

## Install

```bash
pnpm add -D agent-seatbelt
```

Run locally:

```bash
pnpm agent-seatbelt scan --base origin/main --head HEAD --config .github/agent-seatbelt.yml --format markdown
pnpm agent-seatbelt scan --base origin/main --head HEAD --format json
```

## GitHub Actions

Use `actions/checkout` with full history so git comparisons are available.

```yaml
name: Agent Seatbelt

on:
  pull_request:

jobs:
  agent_seatbelt:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - uses: njlane314/agent-seatbelt@v1
        with:
          mode: warn
          comment: true
```

Use `mode: fail` when findings should block the check. In `warn` mode, findings are reported but the action exits successfully unless a runtime error occurs.

## Config

Create `.github/agent-seatbelt.yml`:

```yaml
agent_seatbelt:
  agent_logins:
    - "my-codex-bot"
    - "claude-code-bot"
  agent_email_patterns:
    - "*[bot]*"
    - "*codex*"
    - "*claude*"
  agent_branch_patterns:
    - "codex/**"
    - "agent/**"
    - "ai/**"
  agent_labels:
    - "ai-generated"
    - "agent-authored"
  protected_paths:
    - path: ".github/workflows/**"
      require_label: "human-approved"
      severity: "error"
    - path: "src/auth/**"
      require_label: "security-reviewed"
      severity: "error"
    - path: "src/billing/**"
      require_label: "billing-reviewed"
      severity: "error"
    - path: "infra/prod/**"
      require_label: "infra-reviewed"
      severity: "error"
  forbidden_for_agents:
    - ".github/agent-seatbelt.yml"
    - ".github/workflows/**"
    - "package.json"
    - "pnpm-lock.yaml"
```

## Example JSON

```json
{
  "tool": "agent-seatbelt",
  "version": "0.1.1",
  "base": "origin/main",
  "head": "HEAD",
  "mode": "warn",
  "summary": {
    "findings": 1,
    "errors": 1,
    "warnings": 0
  },
  "findings": [
    {
      "id": "agent-seatbelt:example",
      "severity": "error",
      "title": "Example finding",
      "message": "Likely agent-authored PR modifies .github/workflows/deploy.yml without the human-approved label.",
      "evidence": {},
      "recommendation": "Add the required human review label or move the workflow change to a human-authored PR."
    }
  ]
}
```

## Example Markdown

```markdown
Agent Seatbelt found 1 finding.

1. Likely agent-authored PR modifies .github/workflows/deploy.yml without the human-approved label.
   Evidence: see JSON output for matched paths and labels.
   Recommendation: Add the required human review label or move the workflow change to a human-authored PR.
```

## Notes

- No telemetry.
- No LLM calls.
- No source-code upload.
- No external network calls except GitHub API calls for optional PR comments.
- The hidden PR comment marker is `<!-- agent-seatbelt-report -->`.

## License

Agent Seatbelt is licensed under the Business Source License 1.1. Evaluation, development, testing, security review, and use in public open-source repositories are allowed. Commercial use, including private/internal CI use, managed services, resale, hosted services, or competing products, requires a paid commercial license from njlane314.

Each version converts to Apache-2.0 on the earlier of its configured Change Date or the fourth anniversary of that version's first public distribution. See [LICENSE](LICENSE).

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm build:action
```

The action bundle is written to `dist/index.js` with `@vercel/ncc`.

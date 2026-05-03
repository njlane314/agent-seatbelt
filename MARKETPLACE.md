# GitHub Marketplace Publishing Notes

Release title: PatchProof Agent Seatbelt v0.1.2

Primary category: Security
Secondary category: Code quality

Short description:
Apply stricter PR guardrails to agent-authored changes.

Release notes:

PatchProof Agent Seatbelt is a local-first GitHub Action and CLI from PatchProof. It produces JSON, Markdown, GitHub Step Summary output, and optional stable PR comments. It supports warn/fail modes, explicit base/head refs, and repository-local configuration.

This release prepares the action for GitHub Marketplace publication:

- single root action metadata file: action.yml
- no workflow files in the action repository
- bundled Node 20 action entrypoint in dist/index.js
- source-available BUSL-1.1 commercial licensing
- versioned CLI and action output: 0.1.2
- public open-source repository use allowed; commercial/private use requires a paid license

Suggested listing summary:
Apply stricter PR guardrails to agent-authored changes.

Suggested listing body:
Use Agent Seatbelt when pull requests need evidence before merge. The action runs locally on the checked-out repository, avoids telemetry and LLM calls, and only uses the GitHub API for optional PR comments. Configure it under .github/agent-seatbelt.yml and choose warn mode for advisory checks or fail mode for blocking checks.

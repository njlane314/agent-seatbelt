import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { classify, runScan } from '../src/index.js';
import { loadConfig } from '../src/config.js';

function repo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-seatbelt-'));
  git(dir, ['init', '-b', 'main']);
  git(dir, ['config', 'user.name', 'Human']);
  git(dir, ['config', 'user.email', 'human@example.com']);
  write(dir, 'README.md', 'initial\n');
  commit(dir, 'initial');
  return dir;
}
function git(cwd: string, args: string[]): string { return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim(); }
function write(cwd: string, file: string, content: string): void { fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true }); fs.writeFileSync(path.join(cwd, file), content); }
function commit(cwd: string, msg: string): void { git(cwd, ['add', '.']); git(cwd, ['commit', '-m', msg]); }
function event(cwd: string, input: { labels?: string[]; author?: string; branch?: string; title?: string; body?: string } = {}): string {
  const file = path.join(cwd, 'event.json');
  fs.writeFileSync(file, JSON.stringify({ pull_request: { title: input.title ?? 'change', body: input.body ?? '', labels: (input.labels ?? []).map((name) => ({ name })), user: { login: input.author ?? 'human' }, head: { ref: input.branch ?? 'feature' } } }));
  return file;
}

describe('agent-seatbelt', () => {
  it('classifies configured agent signals conservatively', () => {
    const cwd = repo();
    const config = loadConfig(undefined, cwd, { agent_logins: ['my-codex-bot'] });
    const ev = { title: '', body: '', labels: [], author: 'my-codex-bot', baseRef: '', baseSha: '', headRef: 'codex/x', headSha: '' };
    expect(classify({ event: ev, config, cwd, base: 'HEAD', head: 'HEAD' })).toBe('likely_agent');
  });

  it('reports protected workflow changes from likely agent PRs', async () => {
    const cwd = repo();
    const base = git(cwd, ['rev-parse', 'HEAD']);
    write(cwd, '.github/workflows/deploy.yml', 'name: deploy\n');
    commit(cwd, 'workflow');
    const result = await runScan({ base, head: 'HEAD', cwd, eventPath: event(cwd, { labels: ['ai-generated'], branch: 'codex/workflow' }) });
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings.map((finding) => finding.message).join('\n')).toContain('.github/workflows/deploy.yml');
  });

  it('allows protected path when the required label is present', async () => {
    const cwd = repo();
    const base = git(cwd, ['rev-parse', 'HEAD']);
    write(cwd, 'src/auth/session.ts', 'export const session = true;\n');
    commit(cwd, 'auth');
    const result = await runScan({ base, head: 'HEAD', cwd, eventPath: event(cwd, { labels: ['ai-generated', 'security-reviewed'] }) });
    expect(result.findings).toHaveLength(0);
  });

  it('does not over-block unknown PRs by default', async () => {
    const cwd = repo();
    const base = git(cwd, ['rev-parse', 'HEAD']);
    write(cwd, 'package.json', '{"name":"fixture"}\n');
    commit(cwd, 'package');
    const result = await runScan({ base, head: 'HEAD', cwd });
    expect(result.findings).toHaveLength(0);
  });
});

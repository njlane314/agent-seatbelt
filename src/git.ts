import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export interface PullRequestEvent {
  title: string;
  body: string;
  labels: string[];
  author: string;
  baseRef: string;
  baseSha: string;
  headRef: string;
  headSha: string;
}

export function runGit(args: string[], cwd = process.cwd()): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd();
}

export function changedFiles(base: string, head: string, cwd = process.cwd()): string[] {
  const output = runGit(['diff', '--name-only', '--diff-filter=ACMRT', base + '...' + head], cwd);
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).sort();
}

export function readEvent(eventPath?: string): PullRequestEvent | undefined {
  const file = eventPath || process.env.GITHUB_EVENT_PATH;
  if (!file || !fs.existsSync(file)) return undefined;
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as any;
  const pr = raw.pull_request ?? raw;
  if (!pr || typeof pr !== 'object') return undefined;
  return {
    title: String(pr.title ?? ''),
    body: String(pr.body ?? ''),
    labels: Array.isArray(pr.labels) ? pr.labels.map((label: any) => String(label.name ?? label)).filter(Boolean) : [],
    author: String(pr.user?.login ?? pr.author?.login ?? pr.sender?.login ?? raw.sender?.login ?? ''),
    baseRef: String(pr.base?.ref ?? ''),
    baseSha: String(pr.base?.sha ?? ''),
    headRef: String(pr.head?.ref ?? ''),
    headSha: String(pr.head?.sha ?? '')
  };
}

export function normalizeRepoPath(file: string, cwd = process.cwd()): string {
  const normalized = path.isAbsolute(file) ? path.relative(cwd, file) : file;
  return normalized.split(path.sep).join('/').replace(/^\.\//, '');
}

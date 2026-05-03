import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
export function runGit(args, cwd = process.cwd()) {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd();
}
export function changedFiles(base, head, cwd = process.cwd()) {
    const output = runGit(['diff', '--name-only', '--diff-filter=ACMRT', base + '...' + head], cwd);
    return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).sort();
}
export function readEvent(eventPath) {
    const file = eventPath || process.env.GITHUB_EVENT_PATH;
    if (!file || !fs.existsSync(file))
        return undefined;
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const pr = raw.pull_request ?? raw;
    if (!pr || typeof pr !== 'object')
        return undefined;
    return {
        title: String(pr.title ?? ''),
        body: String(pr.body ?? ''),
        labels: Array.isArray(pr.labels) ? pr.labels.map((label) => String(label.name ?? label)).filter(Boolean) : [],
        author: String(pr.user?.login ?? pr.author?.login ?? pr.sender?.login ?? raw.sender?.login ?? ''),
        baseRef: String(pr.base?.ref ?? ''),
        baseSha: String(pr.base?.sha ?? ''),
        headRef: String(pr.head?.ref ?? ''),
        headSha: String(pr.head?.sha ?? '')
    };
}
export function normalizeRepoPath(file, cwd = process.cwd()) {
    const normalized = path.isAbsolute(file) ? path.relative(cwd, file) : file;
    return normalized.split(path.sep).join('/').replace(/^\.\//, '');
}
//# sourceMappingURL=git.js.map
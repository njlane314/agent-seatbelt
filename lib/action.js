import * as core from '@actions/core';
import * as github from '@actions/github';
import { runScan } from './index.js';
import { COMMENT_MARKER, exitCodeFor, renderMarkdown, writeStepSummary } from './report.js';
import { readEvent } from './git.js';
function input(name) {
    const value = core.getInput(name);
    return value.length > 0 ? value : undefined;
}
function boolInput(name) {
    return core.getBooleanInput(name, { required: false });
}
function detectRefs(eventPath) {
    const event = readEvent(eventPath);
    const base = input('base') ?? event?.baseSha ?? event?.baseRef;
    const head = input('head') ?? event?.headSha ?? event?.headRef;
    if (!base || !head)
        throw new Error('base and head refs are required outside pull_request events');
    return { base, head };
}
async function upsertComment(markdown) {
    const token = input('github-token');
    const issue = github.context.issue;
    if (!token || !issue.owner || !issue.repo || !issue.number)
        return;
    const octokit = github.getOctokit(token);
    const body = COMMENT_MARKER + '\n' + markdown;
    const comments = await octokit.rest.issues.listComments({ owner: issue.owner, repo: issue.repo, issue_number: issue.number, per_page: 100 });
    const existing = comments.data.find((comment) => comment.body?.includes(COMMENT_MARKER));
    if (existing) {
        await octokit.rest.issues.updateComment({ owner: issue.owner, repo: issue.repo, comment_id: existing.id, body });
    }
    else {
        await octokit.rest.issues.createComment({ owner: issue.owner, repo: issue.repo, issue_number: issue.number, body });
    }
}
async function main() {
    try {
        const eventPath = input('event');
        const refs = detectRefs(eventPath);
        const options = {
            base: refs.base,
            head: refs.head,
            cwd: process.cwd(),
            mode: input('mode') ?? 'warn'
        };
        const configPath = input('config');
        const modelPath = input('model');
        const since = input('since');
        const coverage = input('coverage');
        if (configPath)
            options.configPath = configPath;
        if (eventPath)
            options.eventPath = eventPath;
        if (modelPath)
            options.modelPath = modelPath;
        if (since)
            options.since = since;
        if (coverage)
            options.coverage = coverage;
        const result = await runScan(options);
        const markdown = renderMarkdown(result);
        await writeStepSummary(markdown);
        if (boolInput('comment'))
            await upsertComment(markdown);
        core.setOutput('json', JSON.stringify(result));
        core.setOutput('markdown', markdown);
        core.setOutput('findings', String(result.summary.findings));
        if (exitCodeFor(result) !== 0)
            core.setFailed('Agent Seatbelt found blocking findings.');
    }
    catch (error) {
        core.setFailed(error instanceof Error ? error.message : String(error));
    }
}
void main();
//# sourceMappingURL=action.js.map
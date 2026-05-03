import crypto from 'node:crypto';
import picomatch from 'picomatch';
import { changedFiles, readEvent, runGit } from './git.js';
import { TOOL_NAME, VERSION, loadConfig } from './config.js';
import { createResult } from './report.js';
export async function runScan(options) {
    const cwd = options.cwd ?? process.cwd();
    const config = loadConfig(options.configPath, cwd, options.configOverrides);
    const mode = options.mode ?? config.mode;
    const files = changedFiles(options.base, options.head, cwd);
    const event = readEvent(options.eventPath);
    const authorship = classify({ event, config, cwd, base: options.base, head: options.head });
    const labels = new Set((event?.labels ?? []).map((label) => label.toLowerCase()));
    const findings = new Map();
    if (!config.apply_to.includes(authorship)) {
        return createResult({ tool: TOOL_NAME, version: VERSION, base: options.base, head: options.head, mode, findings: [] });
    }
    for (const file of files) {
        for (const rule of config.protected_paths) {
            if (matches(file, rule.path) && !labels.has(rule.require_label.toLowerCase())) {
                add(findings, protectedFinding(file, rule, authorship));
            }
        }
        if (matchesAny(file, config.forbidden_for_agents)) {
            add(findings, makeFinding('forbidden', file, 'error', authorship, file + ' is forbidden for ' + authorship + ' PRs.', 'Move this change to a human-authored PR or adjust the guardrail config with review.'));
        }
        if (file === '.github/agent-seatbelt.yml') {
            add(findings, makeFinding('self-config', file, 'error', authorship, 'Agent-authored PR modifies .github/agent-seatbelt.yml.', 'Guardrail policy changes require human review in a separate PR.'));
        }
        if (matches(file, '.github/workflows/**')) {
            add(findings, makeFinding('workflow', file, 'error', authorship, capitalize(authorship) + ' PR modifies workflow file ' + file + '.', 'Add the required human approval label or move workflow changes to a human-authored PR.'));
        }
        if (isDependencyManifest(file)) {
            add(findings, makeFinding('dependency', file, 'error', authorship, capitalize(authorship) + ' PR changes dependency manifest ' + file + '.', 'Have a human review dependency changes or move them to a human-authored PR.'));
        }
        if (matchesAny(file, config.secrets_paths)) {
            add(findings, makeFinding('secrets', file, 'error', authorship, capitalize(authorship) + ' PR touches secrets-like file ' + file + '.', 'Remove the secrets-like change or route it through a trusted human review path.'));
        }
        if (matchesAny(file, config.production_infra_paths)) {
            add(findings, makeFinding('prod-infra', file, 'error', authorship, capitalize(authorship) + ' PR touches production infrastructure file ' + file + '.', 'Add the configured infrastructure review label or move the change to a human-authored PR.'));
        }
        if (findings.size >= config.max_findings)
            break;
    }
    return createResult({ tool: TOOL_NAME, version: VERSION, base: options.base, head: options.head, mode, findings: [...findings.values()].slice(0, config.max_findings) });
}
export function classify(input) {
    const event = input.event;
    const labels = (event?.labels ?? []).map((label) => label.toLowerCase());
    const login = (event?.author ?? '').toLowerCase();
    const branch = (event?.headRef ?? '').toLowerCase();
    const text = ((event?.title ?? '') + '\n' + (event?.body ?? '')).toLowerCase();
    const commitText = readCommitText(input.cwd, input.base, input.head).toLowerCase();
    const agentSignals = [
        input.config.agent_logins.some((item) => item.toLowerCase() === login),
        input.config.agent_labels.some((label) => labels.includes(label.toLowerCase())),
        input.config.agent_branch_patterns.some((pattern) => matches(branch, pattern.toLowerCase())),
        input.config.agent_text_markers.some((marker) => text.includes(marker.toLowerCase())),
        input.config.agent_email_patterns.some((pattern) => matchesTextPattern(commitText, pattern)),
        /co-authored-by:.*(codex|claude|copilot|agent)/i.test(commitText)
    ];
    if (agentSignals.some(Boolean))
        return 'likely_agent';
    if (login.endsWith('[bot]') || commitText.includes('[bot]') || /github-actions|dependabot|renovate/.test(commitText))
        return 'bot';
    if (event)
        return 'human';
    return 'unknown';
}
function readCommitText(cwd, base, head) {
    try {
        return runGit(['log', '--format=%an%n%ae%n%B%n----', base + '...' + head], cwd);
    }
    catch {
        return '';
    }
}
function protectedFinding(file, rule, authorship) {
    return makeFinding('protected:' + rule.require_label, file, rule.severity, authorship, capitalize(authorship) + ' PR modifies ' + file + '. Changes matching ' + rule.path + ' require the ' + rule.require_label + ' label.', 'Apply ' + rule.require_label + ' after human review, or move this change to a human-authored PR.');
}
function makeFinding(type, file, severity, authorship, message, recommendation) {
    return {
        id: 'agent-seatbelt:' + stableHash(type + ':' + file),
        severity,
        title: 'Agent guardrail violation',
        message,
        evidence: { path: file, classification: authorship, summary: 'PR classified as ' + authorship + ' and changed ' + file },
        recommendation
    };
}
function add(findings, finding) {
    if (!findings.has(finding.id))
        findings.set(finding.id, finding);
}
function matches(file, pattern) {
    return picomatch(pattern, { dot: true, nocase: true })(file);
}
function matchesTextPattern(text, pattern) {
    const normalized = pattern.toLowerCase();
    const literal = normalized.replaceAll('*', '');
    if (literal && text.includes(literal))
        return true;
    const escaped = normalized.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replaceAll('*', '.*');
    return new RegExp('^' + escaped + '$', 'i').test(text);
}
function matchesAny(file, patterns) {
    return patterns.length > 0 && picomatch(patterns, { dot: true, nocase: true })(file);
}
function isDependencyManifest(file) {
    return ['package.json', 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'].includes(file) || file.endsWith('/package.json');
}
function stableHash(value) {
    return crypto.createHash('sha256').update(value).digest('hex').slice(0, 12);
}
function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
}
//# sourceMappingURL=index.js.map
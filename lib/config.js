import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
export const TOOL_NAME = 'agent-seatbelt';
export const VERSION = '0.1.0';
export const DEFAULT_CONFIG_PATH = '.github/agent-seatbelt.yml';
const ProtectedPathSchema = z.object({
    path: z.string(),
    require_label: z.string(),
    severity: z.enum(['info', 'warning', 'error']).default('error')
});
export const ConfigSchema = z.object({
    mode: z.enum(['warn', 'fail']).default('warn'),
    agent_logins: z.array(z.string()).default([]),
    agent_email_patterns: z.array(z.string()).default(['*[bot]*', '*codex*', '*claude*']),
    agent_branch_patterns: z.array(z.string()).default(['codex/**', 'agent/**', 'ai/**']),
    agent_labels: z.array(z.string()).default(['ai-generated', 'agent-authored', 'agent', 'codex', 'claude', 'copilot']),
    agent_text_markers: z.array(z.string()).default(['ai-generated', 'agent-authored', 'codex', 'claude', 'copilot']),
    apply_to: z.array(z.enum(['bot', 'likely_agent', 'unknown', 'human'])).default(['bot', 'likely_agent']),
    protected_paths: z.array(ProtectedPathSchema).default([
        { path: '.github/workflows/**', require_label: 'human-approved', severity: 'error' },
        { path: 'src/auth/**', require_label: 'security-reviewed', severity: 'error' },
        { path: 'src/billing/**', require_label: 'billing-reviewed', severity: 'error' },
        { path: 'infra/prod/**', require_label: 'infra-reviewed', severity: 'error' }
    ]),
    forbidden_for_agents: z.array(z.string()).default(['.github/agent-seatbelt.yml', '.github/workflows/**', 'package.json', 'pnpm-lock.yaml']),
    secrets_paths: z.array(z.string()).default(['.env', '.env.*', '**/*.pem', '**/*.key', '**/*secret*', '**/*credentials*']),
    production_infra_paths: z.array(z.string()).default(['infra/prod/**', 'terraform/prod/**', 'k8s/prod/**']),
    max_findings: z.number().int().min(1).default(20)
});
export function loadConfig(configPath = DEFAULT_CONFIG_PATH, cwd = process.cwd(), overrides = {}) {
    const resolved = path.resolve(cwd, configPath);
    let section = {};
    if (fs.existsSync(resolved)) {
        const parsed = parse(fs.readFileSync(resolved, 'utf8')) ?? {};
        section = typeof parsed === 'object' && parsed !== null && 'agent_seatbelt' in parsed ? parsed.agent_seatbelt ?? {} : parsed;
    }
    return ConfigSchema.parse({ ...section, ...compact(overrides) });
}
function compact(value) {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
//# sourceMappingURL=config.js.map
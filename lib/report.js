import fs from 'node:fs';
export const COMMENT_MARKER = '<!-- agent-seatbelt-report -->';
export function createResult(input) {
    const errors = input.findings.filter((finding) => finding.severity === 'error').length;
    const warnings = input.findings.filter((finding) => finding.severity === 'warning').length;
    return {
        tool: input.tool,
        version: input.version,
        base: input.base,
        head: input.head,
        mode: input.mode,
        summary: { findings: input.findings.length, errors, warnings },
        findings: input.findings
    };
}
export function renderMarkdown(result) {
    const label = 'Agent Seatbelt';
    if (result.findings.length === 0)
        return label + ' found no findings.';
    const noun = result.findings.length === 1 ? 'finding' : 'findings';
    const lines = [label + ' found ' + result.findings.length + ' ' + noun + '.', ''];
    result.findings.forEach((finding, index) => {
        lines.push(String(index + 1) + '. ' + finding.message);
        const evidence = formatEvidence(finding.evidence);
        if (evidence)
            lines.push('   Evidence: ' + evidence);
        lines.push('   Recommendation: ' + finding.recommendation);
        if (index !== result.findings.length - 1)
            lines.push('');
    });
    return lines.join('\n');
}
function formatEvidence(evidence) {
    const preferred = evidence.summary;
    if (typeof preferred === 'string' && preferred.length > 0)
        return preferred;
    const entries = Object.entries(evidence).filter(([, value]) => value !== undefined && value !== null && typeof value !== 'object');
    return entries.map(([key, value]) => key + '=' + String(value)).join(', ');
}
export function exitCodeFor(result) {
    if (result.mode !== 'fail')
        return 0;
    return result.summary.errors + result.summary.warnings > 0 ? 1 : 0;
}
export async function writeStepSummary(markdown) {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryPath)
        return;
    await fs.promises.appendFile(summaryPath, markdown + '\n');
}
//# sourceMappingURL=report.js.map
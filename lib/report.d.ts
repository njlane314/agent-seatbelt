export type Severity = 'info' | 'warning' | 'error';
export type Mode = 'warn' | 'fail';
export interface Finding {
    id: string;
    severity: Severity;
    title: string;
    message: string;
    evidence: Record<string, unknown>;
    recommendation: string;
}
export interface ScanResult {
    tool: string;
    version: string;
    base: string;
    head: string;
    mode: Mode;
    summary: {
        findings: number;
        errors: number;
        warnings: number;
    };
    findings: Finding[];
}
export declare const COMMENT_MARKER = "<!-- agent-seatbelt-report -->";
export declare function createResult(input: {
    tool: string;
    version: string;
    base: string;
    head: string;
    mode: Mode;
    findings: Finding[];
}): ScanResult;
export declare function renderMarkdown(result: ScanResult): string;
export declare function exitCodeFor(result: ScanResult): number;
export declare function writeStepSummary(markdown: string): Promise<void>;

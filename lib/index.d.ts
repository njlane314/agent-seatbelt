import { type PullRequestEvent } from './git.js';
import { type AgentSeatbeltConfig } from './config.js';
import { type Mode, type ScanResult } from './report.js';
export type Authorship = 'human' | 'bot' | 'likely_agent' | 'unknown';
export interface ScanOptions {
    base: string;
    head: string;
    cwd?: string;
    configPath?: string;
    configOverrides?: Partial<AgentSeatbeltConfig>;
    mode?: Mode;
    eventPath?: string;
    modelPath?: string;
    since?: string;
    coverage?: string;
}
export declare function runScan(options: ScanOptions): Promise<ScanResult>;
export declare function classify(input: {
    event: PullRequestEvent | undefined;
    config: AgentSeatbeltConfig;
    cwd: string;
    base: string;
    head: string;
}): Authorship;

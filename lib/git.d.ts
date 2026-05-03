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
export declare function runGit(args: string[], cwd?: string): string;
export declare function changedFiles(base: string, head: string, cwd?: string): string[];
export declare function readEvent(eventPath?: string): PullRequestEvent | undefined;
export declare function normalizeRepoPath(file: string, cwd?: string): string;

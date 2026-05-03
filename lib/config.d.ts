import { z } from 'zod';
export declare const TOOL_NAME = "agent-seatbelt";
export declare const VERSION = "0.1.3";
export declare const DEFAULT_CONFIG_PATH = ".github/agent-seatbelt.yml";
declare const ProtectedPathSchema: z.ZodObject<{
    path: z.ZodString;
    require_label: z.ZodString;
    severity: z.ZodDefault<z.ZodEnum<{
        info: "info";
        warning: "warning";
        error: "error";
    }>>;
}, z.core.$strip>;
export declare const ConfigSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<{
        warn: "warn";
        fail: "fail";
    }>>;
    agent_logins: z.ZodDefault<z.ZodArray<z.ZodString>>;
    agent_email_patterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
    agent_branch_patterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
    agent_labels: z.ZodDefault<z.ZodArray<z.ZodString>>;
    agent_text_markers: z.ZodDefault<z.ZodArray<z.ZodString>>;
    apply_to: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        unknown: "unknown";
        bot: "bot";
        likely_agent: "likely_agent";
        human: "human";
    }>>>;
    protected_paths: z.ZodDefault<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        require_label: z.ZodString;
        severity: z.ZodDefault<z.ZodEnum<{
            info: "info";
            warning: "warning";
            error: "error";
        }>>;
    }, z.core.$strip>>>;
    forbidden_for_agents: z.ZodDefault<z.ZodArray<z.ZodString>>;
    secrets_paths: z.ZodDefault<z.ZodArray<z.ZodString>>;
    production_infra_paths: z.ZodDefault<z.ZodArray<z.ZodString>>;
    max_findings: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type AgentSeatbeltConfig = z.infer<typeof ConfigSchema>;
export type ProtectedPath = z.infer<typeof ProtectedPathSchema>;
export declare function loadConfig(configPath?: string, cwd?: string, overrides?: Partial<AgentSeatbeltConfig>): AgentSeatbeltConfig;
export {};

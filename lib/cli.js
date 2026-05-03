#!/usr/bin/env node
import { Command } from 'commander';
import { DEFAULT_CONFIG_PATH, VERSION } from './config.js';
import { runScan } from './index.js';
import { exitCodeFor, renderMarkdown } from './report.js';
const program = new Command();
program.name('agent-seatbelt').description('Apply stricter PR rules to agent-authored or bot-authored changes.').version(VERSION);
program.command('scan')
    .requiredOption('--base <ref>', 'base git ref')
    .requiredOption('--head <ref>', 'head git ref')
    .option('--event <path>', 'pull_request event JSON path')
    .option('--config <path>', 'config path', DEFAULT_CONFIG_PATH)
    .option('--mode <mode>', 'warn or fail', 'warn')
    .option('--format <format>', 'markdown or json', 'markdown')
    .action(async (options) => {
    const result = await runScan({ base: options.base, head: options.head, eventPath: options.event, configPath: options.config, mode: options.mode });
    process.stdout.write(options.format === 'json' ? JSON.stringify(result, null, 2) + '\n' : renderMarkdown(result) + '\n');
    process.exitCode = exitCodeFor(result);
});
program.parse();
//# sourceMappingURL=cli.js.map
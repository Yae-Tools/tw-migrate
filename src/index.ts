import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { glob } from 'glob';
import inquirer from 'inquirer';
import { CONVERSIONS } from './conversions.js';
import { simpleGit } from 'simple-git';
import { detectEnvironment, getTailwindVersion, shouldShowTailwindWarning } from './environment.js';
import { exitMessage } from './util/exitMessage.js';
import { ParallelProcessor } from './util/parallelProcessor.js';
import { ErrorHandler } from './util/errorHandler.js';
import { GitStatus, ProcessingResult } from './types/conversionTypes.js';
import { createUnifiedDiff } from './util/diff.js';
import { loadConfig, TwMigrateConfig } from './util/config.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import ora from 'ora';

type CliArgs = {
  conversions?: string[];
  path?: string;
  exclude?: string[];
  config?: string;
  dryRun?: boolean;
  'dry-run'?: boolean;
  diff?: boolean;
  json?: boolean;
  check?: boolean;
  ignoreGit?: boolean;
  'ignore-git'?: boolean;
  maxMemory?: number;
  'max-memory'?: number;
};

type NormalizedArgs = {
  conversions?: string[];
  path: string;
  exclude: string[];
  dryRun: boolean;
  diff: boolean;
  json: boolean;
  check: boolean;
  ignoreGit: boolean;
  maxMemory?: number;
};

const DEFAULT_PATH = './**/*.{js,jsx,ts,tsx,html,css,svelte}';

const argv = yargs(hideBin(process.argv))
  .option('conversions', {
    alias: 'c',
    type: 'array',
    description: 'A list of conversions to run',
    choices: Object.keys(CONVERSIONS),
  })
  .option('path', {
    alias: 'p',
    type: 'string',
    description: 'The path to the files to convert',
  })
  .option('exclude', {
    alias: 'e',
    type: 'array',
    description: 'Glob patterns to exclude',
  })
  .option('config', {
    type: 'string',
    description: 'Path to tw-migrate config JSON file',
  })
  .option('dry-run', {
    type: 'boolean',
    default: false,
    description: 'Preview changes without writing files',
  })
  .option('diff', {
    type: 'boolean',
    default: false,
    description: 'Print a unified diff for changed files',
  })
  .option('json', {
    type: 'boolean',
    default: false,
    description: 'Print a machine-readable JSON summary',
  })
  .option('check', {
    type: 'boolean',
    default: false,
    description: 'Exit with code 1 if any files would change',
  })
  .option('ignore-git', {
    type: 'boolean',
    default: false,
    description: 'Ignore Git clean check',
  })
  .option('max-memory', {
    alias: 'm',
    type: 'number',
    description: 'Maximum memory usage in MB (default: auto-detect based on system memory)',
  })
  .help().argv;

const logo = `
 ██╗   ██╗ █████╗ ███████╗      ███╗   ███╗ ██████╗ ██████╗ ███████╗██████╗ ███╗   ██╗██╗███████╗███████╗
 ╚██╗ ██╔╝██╔══██╗██╔════╝      ████╗ ████║██╔═══██╗██╔══██╗██╔════╝██╔══██╗████╗  ██║██║╚══███╔╝██╔════╝
  ╚████╔╝ ███████║█████╗  █████╗██╔████╔██║██║   ██║██║  ██║█████╗  ██████╔╝██╔██╗ ██║██║  ███╔╝ █████╗  
   ╚██╔╝  ██╔══██║██╔══╝  ╚════╝██║╚██╔╝██║██║   ██║██║  ██║██╔══╝  ██╔══██╗██║╚██╗██║██║ ███╔╝  ██╔══╝  
    ██║   ██║  ██║███████╗      ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗██║  ██║██║ ╚████║██║███████╗███████╗
    ╚═╝   ╚═╝  ╚═╝╚══════╝      ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚══════╝╚══════╝
             
                                                  ██████       
                                                  █████████   ██
                                                █    █████████ 
                                              █████    █████   
                                            █████████    █     
                                            ██   █████████      
                                                  ██████       
                  
                                      Tailwind CSS Class Converter
`;

async function run() {
  const cliArgs = (await argv) as CliArgs;
  const config = await loadConfig(cliArgs.config);
  const args = normalizeArgs(cliArgs, config);

  if (!args.json) {
    console.log(chalk.cyan(logo));
  }

  await showEnvironmentWarnings(process.cwd(), args.json);
  const gitStatus = await checkGitStatus(args.ignoreGit, args.json);
  const selectedConversions = await resolveConversions(args.conversions, args.json);

  if (!selectedConversions) {
    return;
  }

  const files = await findFiles(args.path, args.exclude, args.json);
  if (files.length === 0) {
    return;
  }

  await processFiles(files, selectedConversions, gitStatus, args);
  exitMessage();
}

function normalizeArgs(args: CliArgs, config: TwMigrateConfig): NormalizedArgs {
  return {
    conversions: args.conversions ?? config.conversions,
    path: args.path ?? config.path ?? DEFAULT_PATH,
    exclude: args.exclude ?? config.exclude ?? [],
    dryRun: args.dryRun ?? args['dry-run'] ?? config.dryRun ?? false,
    diff: args.diff ?? config.diff ?? false,
    json: args.json ?? config.json ?? false,
    check: args.check ?? config.check ?? false,
    ignoreGit: args.ignoreGit ?? args['ignore-git'] ?? config.ignoreGit ?? false,
    maxMemory: args.maxMemory ?? args['max-memory'] ?? config.maxMemory,
  };
}

async function showEnvironmentWarnings(currentDir: string, quiet: boolean): Promise<void> {
  const detectedEnv = await detectEnvironment(currentDir);
  const tailwindVersion = await getTailwindVersion(currentDir);

  if (!quiet && shouldShowTailwindWarning(tailwindVersion)) {
    console.log(
      "\x1b[31m⚠️  Warning: For full compatibility, especially with 'size' conversions, ensure your project uses Tailwind CSS v3.4 or later.\x1b[0m",
    );
    console.log('');
  }

  if (quiet || detectedEnv === 'Unknown' || !process.stdout.isTTY) {
    return;
  }

  const confirmEnv = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: chalk.blue(`${detectedEnv} environment detected. Press Y to continue...`),
      default: true,
    },
  ]);

  if (!confirmEnv.continue) {
    console.log(chalk.red('Operation cancelled by user.'));
    exitMessage();
  }
}

async function checkGitStatus(ignoreGit: boolean, quiet: boolean): Promise<GitStatus> {
  const git = simpleGit();

  try {
    const status = await git.status();
    const gitStatus: GitStatus = {
      isRepo: true,
      hasChanges: !status.isClean(),
      currentBranch: status.current ?? undefined,
      lastCommit: undefined,
    };

    if (gitStatus.hasChanges && !ignoreGit) {
      console.error(
        chalk.red(
          'Error: Git repository is not clean. Please commit or stash your changes before running the converter, or use --ignore-git to override.',
        ),
      );
      exitMessage();
    }

    return gitStatus;
  } catch {
    if (!quiet) {
      console.warn(
        chalk.yellow(
          'Warning: Not a Git repository or Git not installed. Skipping Git clean check.',
        ),
      );
    }
    return { isRepo: false, hasChanges: false };
  }
}

async function resolveConversions(
  conversions: string[] | undefined,
  quiet: boolean,
): Promise<string[] | null> {
  if (conversions && conversions.length > 0) {
    return conversions;
  }

  if (!process.stdout.isTTY || quiet) {
    if (!quiet) {
      console.log(
        chalk.yellow(
          'No conversions selected. Please specify conversions with the -c flag or run in an interactive terminal.',
        ),
      );
      console.log(
        chalk.yellow(
          'Example: `npx tw-migrate -c size,spacing,typography -p "./src/**/*.{js,jsx,ts,tsx,html,css,svelte}"`',
        ),
      );
    }
    exitMessage();
    return null;
  }

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedConversions',
      message: chalk.blue('Select the conversions to apply:'),
      choices: Object.keys(CONVERSIONS),
    },
  ]);

  const selectedConversions = answers.selectedConversions as string[] | undefined;
  if (!selectedConversions || selectedConversions.length === 0) {
    console.log(chalk.red('No conversions selected. Exiting.'));
    exitMessage();
    return null;
  }

  return selectedConversions;
}

async function findFiles(
  pathPattern: string,
  exclude: string[],
  quiet: boolean,
): Promise<string[]> {
  const files = await glob(pathPattern, { nodir: true, ignore: ['node_modules/**', ...exclude] });

  if (files.length === 0) {
    if (!quiet) {
      console.log(chalk.yellow('No files found matching the specified pattern.'));
    }
    exitMessage();
    return [];
  }

  if (!quiet) {
    console.log(chalk.blue(`Found ${files.length} files to process...`));
  }
  return files;
}

async function processFiles(
  files: string[],
  conversions: string[],
  gitStatus: GitStatus,
  args: NormalizedArgs,
): Promise<void> {
  const spinner =
    args.json || !process.stdout.isTTY
      ? null
      : ora(chalk.cyan('Initializing processing...')).start();

  try {
    await ErrorHandler.initSession(files.length, gitStatus);
    const results = await ParallelProcessor.autoProcessFiles(
      files,
      conversions,
      createEnhancedConversions(),
      (processed, total, currentFile) => {
        if (spinner) {
          const percentage = ((processed / total) * 100).toFixed(1);
          spinner.text = chalk.cyan(`Processing [${percentage}%]: ${currentFile}`);
        }
      },
      args.maxMemory,
      args.dryRun || args.check,
      args.diff || args.json,
    );

    spinner?.stop();
    printResults(results, args);
  } catch (error) {
    spinner?.fail(chalk.red('Processing failed with fatal error'));
    printFatalError(error);
    process.exit(1);
  }
}

function createEnhancedConversions(): Record<
  string,
  (content: string, filePath?: string) => ReturnType<(typeof CONVERSIONS)[keyof typeof CONVERSIONS]>
> {
  return Object.fromEntries(
    Object.entries(CONVERSIONS).map(([key, fn]) => [
      key,
      (content: string, filePath?: string) => fn(content, filePath),
    ]),
  );
}

function printResults(results: ProcessingResult[], args: NormalizedArgs): void {
  if (args.diff) {
    printDiff(results);
  }

  if (args.json) {
    console.log(JSON.stringify(createJsonSummary(results), null, 2));
  } else {
    printProcessingSummary(results, args.dryRun || args.check);
  }

  if (args.check && results.some((result) => result.changed)) {
    process.exitCode = 1;
  }
}

function printDiff(results: ProcessingResult[]): void {
  const diffs = results
    .filter((result) => result.changed && result.filePath && result.oldContent && result.newContent)
    .map((result) =>
      createUnifiedDiff(
        result.filePath ?? 'unknown',
        result.oldContent ?? '',
        result.newContent ?? '',
      ),
    )
    .filter((diff) => diff.length > 0);

  if (diffs.length > 0) {
    console.log(diffs.join('\n\n'));
  }
}

function createJsonSummary(results: ProcessingResult[]): object {
  return {
    total: results.length,
    successful: results.filter((result) => result.success).length,
    failed: results.filter((result) => !result.success).length,
    changed: results.filter((result) => result.changed).length,
    files: results.map((result) => ({
      filePath: result.filePath,
      success: result.success,
      changed: result.changed ?? false,
      error: result.error?.message,
    })),
  };
}

function printProcessingSummary(results: ProcessingResult[], previewOnly: boolean): void {
  const successCount = results.filter((result) => result.success).length;
  const changeCount = results.reduce((sum, result) => sum + (result.changes || 0), 0);
  const errorCount = results.filter((result) => !result.success).length;
  const changeVerb = previewOnly ? 'Would change' : 'Applied changes to';

  console.log('');
  if (errorCount === 0) {
    console.log(chalk.green(`✅ Successfully processed ${successCount} files`));
    console.log(
      changeCount > 0
        ? chalk.blue(`🔧 ${changeVerb} ${changeCount} files`)
        : chalk.blue('📝 No changes were needed'),
    );
    return;
  }

  console.log(
    chalk.yellow(`⚠️  Processed ${successCount} files successfully, ${errorCount} failed`),
  );
  if (changeCount > 0) {
    console.log(chalk.blue(`🔧 ${changeVerb} ${changeCount} files`));
  }
}

function printFatalError(error: unknown): void {
  if (error instanceof Error) {
    console.error(chalk.red(`Error: ${error.message}`));
    return;
  }

  console.error(chalk.red('An unknown error occurred'));
}

export { run };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  run().catch(console.error);
}

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
import chalk from 'chalk';
import ora from 'ora';

type CliArgs = {
  conversions?: string[];
  path: string;
  ignoreGit?: boolean;
  'ignore-git'?: boolean;
  maxMemory?: number;
  'max-memory'?: number;
};

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
    default: './**/*.{js,jsx,ts,tsx,html,css,svelte}',
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
  console.log(chalk.cyan(logo));

  const args = normalizeArgs((await argv) as CliArgs);
  await showEnvironmentWarnings(process.cwd());
  const gitStatus = await checkGitStatus(args.ignoreGit);
  const selectedConversions = await resolveConversions(args.conversions);

  if (!selectedConversions) {
    return;
  }

  const files = await findFiles(args.path);
  if (files.length === 0) {
    return;
  }

  await processFiles(files, selectedConversions, gitStatus, args.maxMemory);
  exitMessage();
}

function normalizeArgs(args: CliArgs): Required<Pick<CliArgs, 'path'>> & {
  conversions?: string[];
  ignoreGit: boolean;
  maxMemory?: number;
} {
  return {
    conversions: args.conversions,
    path: args.path,
    ignoreGit: args.ignoreGit ?? args['ignore-git'] ?? false,
    maxMemory: args.maxMemory ?? args['max-memory'],
  };
}

async function showEnvironmentWarnings(currentDir: string): Promise<void> {
  const detectedEnv = await detectEnvironment(currentDir);
  const tailwindVersion = await getTailwindVersion(currentDir);

  if (shouldShowTailwindWarning(tailwindVersion)) {
    console.log(
      "\x1b[31m⚠️  Warning: For full compatibility, especially with 'size' conversions, ensure your project uses Tailwind CSS v3.4 or later.\x1b[0m",
    );
    console.log('');
  }

  if (detectedEnv === 'Unknown' || !process.stdout.isTTY) {
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

async function checkGitStatus(ignoreGit: boolean): Promise<GitStatus> {
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
    console.warn(
      chalk.yellow('Warning: Not a Git repository or Git not installed. Skipping Git clean check.'),
    );
    return { isRepo: false, hasChanges: false };
  }
}

async function resolveConversions(conversions?: string[]): Promise<string[] | null> {
  if (conversions && conversions.length > 0) {
    return conversions;
  }

  if (!process.stdout.isTTY) {
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

async function findFiles(pathPattern: string): Promise<string[]> {
  const files = await glob(pathPattern, { nodir: true, ignore: ['node_modules/**'] });

  if (files.length === 0) {
    console.log(chalk.yellow('No files found matching the specified pattern.'));
    exitMessage();
    return [];
  }

  console.log(chalk.blue(`Found ${files.length} files to process...`));
  return files;
}

async function processFiles(
  files: string[],
  conversions: string[],
  gitStatus: GitStatus,
  maxMemory?: number,
): Promise<void> {
  const spinner = ora(chalk.cyan('Initializing processing...')).start();

  try {
    await ErrorHandler.initSession(files.length, gitStatus);
    const results = await ParallelProcessor.autoProcessFiles(
      files,
      conversions,
      createEnhancedConversions(),
      (processed, total, currentFile) => {
        const percentage = ((processed / total) * 100).toFixed(1);
        spinner.text = chalk.cyan(`Processing [${percentage}%]: ${currentFile}`);
      },
      maxMemory,
    );

    spinner.stop();
    printProcessingSummary(results);
    console.log(await ErrorHandler.generateReport());
  } catch (error) {
    spinner.fail(chalk.red('Processing failed with fatal error'));
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

function printProcessingSummary(results: ProcessingResult[]): void {
  const successCount = results.filter((result) => result.success).length;
  const changeCount = results.reduce((sum, result) => sum + (result.changes || 0), 0);
  const errorCount = results.filter((result) => !result.success).length;

  console.log('');
  if (errorCount === 0) {
    console.log(chalk.green(`✅ Successfully processed ${successCount} files`));
    console.log(
      changeCount > 0
        ? chalk.blue(`🔧 Applied changes to ${changeCount} files`)
        : chalk.blue('📝 No changes were needed'),
    );
    return;
  }

  console.log(
    chalk.yellow(`⚠️  Processed ${successCount} files successfully, ${errorCount} failed`),
  );
  if (changeCount > 0) {
    console.log(chalk.blue(`🔧 Applied changes to ${changeCount} files`));
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

run().catch(console.error);

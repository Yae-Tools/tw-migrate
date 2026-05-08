import { promises as fs } from 'fs';
import * as path from 'path';

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type Environment =
  | 'Next.js'
  | 'React'
  | 'Angular'
  | 'Svelte'
  | 'Vue'
  | 'HTML/CSS'
  | 'Unknown';

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isPackageJson(value: unknown): value is PackageJson {
  return typeof value === 'object' && value !== null;
}

async function readPackageJson(projectRoot: string): Promise<PackageJson | null> {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!(await checkFileExists(packageJsonPath))) {
    return null;
  }

  const content = await fs.readFile(packageJsonPath, 'utf-8');
  try {
    const parsedContent: unknown = JSON.parse(content);
    return isPackageJson(parsedContent) ? parsedContent : null;
  } catch {
    return null;
  }
}

export async function detectEnvironment(projectRoot: string): Promise<Environment> {
  // Check for Next.js
  if (
    (await checkFileExists(path.join(projectRoot, 'next.config.js'))) ||
    (await checkFileExists(path.join(projectRoot, 'next.config.mjs')))
  ) {
    return 'Next.js';
  }

  const packageJson = await readPackageJson(projectRoot);

  if (packageJson) {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    if (dependencies['react']) {
      return 'React';
    }
    if (dependencies['@angular/core']) {
      return 'Angular';
    }
    if (dependencies['svelte']) {
      return 'Svelte';
    }
    if (dependencies['vue']) {
      return 'Vue';
    }
  }

  // Default to HTML/CSS if no specific framework is detected but there are HTML/CSS files.
  const projectFiles = await fs.readdir(projectRoot);
  if (projectFiles.some((file) => file.endsWith('.html') || file.endsWith('.css'))) {
    return 'HTML/CSS';
  }

  return 'Unknown';
}

export async function getTailwindVersion(projectRoot: string): Promise<string | null> {
  const packageJson = await readPackageJson(projectRoot);

  if (packageJson) {
    // Check dependencies first, then devDependencies
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    return dependencies['tailwindcss'] || devDependencies['tailwindcss'] || null;
  }

  return null;
}

export function shouldShowTailwindWarning(version: string | null): boolean {
  if (!version) {
    return true; // Show warning if Tailwind CSS is not found
  }

  const versionParts = extractMajorMinor(version);
  if (!versionParts) {
    return true; // Show warning if version format is unrecognizable
  }

  const { major, minor } = versionParts;

  // Show warning if version is below 3.4
  return major < 3 || (major === 3 && minor < 4);
}

function extractMajorMinor(version: string): { major: number; minor: number } | null {
  const versionStartIndex = [...version].findIndex(
    (character) => character >= '0' && character <= '9',
  );
  if (versionStartIndex === -1) {
    return null;
  }

  const [major, minor] = version.slice(versionStartIndex).split('.').map(Number);
  if (!Number.isInteger(major) || !Number.isInteger(minor)) {
    return null;
  }

  return { major, minor };
}

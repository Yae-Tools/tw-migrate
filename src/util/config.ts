import fs from 'fs/promises';
import path from 'path';

export type TwMigrateConfig = {
  path?: string;
  exclude?: string[];
  conversions?: string[];
  dryRun?: boolean;
  diff?: boolean;
  json?: boolean;
  check?: boolean;
  ignoreGit?: boolean;
  maxMemory?: number;
};

const DEFAULT_CONFIG_FILES = ['tw-migrate.config.json', '.tw-migraterc.json'];

export async function loadConfig(configPath?: string): Promise<TwMigrateConfig> {
  const resolvedPath = configPath ? path.resolve(configPath) : await findDefaultConfig();
  if (!resolvedPath) {
    return {};
  }

  const content = await fs.readFile(resolvedPath, 'utf-8');
  return sanitizeConfig(JSON.parse(content) as unknown);
}

async function findDefaultConfig(): Promise<string | null> {
  for (const configFile of DEFAULT_CONFIG_FILES) {
    const candidate = path.resolve(configFile);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next default config name.
    }
  }

  return null;
}

function sanitizeConfig(value: unknown): TwMigrateConfig {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const record = value as Record<string, unknown>;
  return {
    path: getString(record.path),
    exclude: getStringArray(record.exclude),
    conversions: getStringArray(record.conversions),
    dryRun: getBoolean(record.dryRun),
    diff: getBoolean(record.diff),
    json: getBoolean(record.json),
    check: getBoolean(record.check),
    ignoreGit: getBoolean(record.ignoreGit),
    maxMemory: getNumber(record.maxMemory),
  };
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? value
    : undefined;
}

function getBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

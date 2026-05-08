type BooleanCliArgs = Record<string, unknown>;

export function getBooleanOption(
  args: BooleanCliArgs,
  rawArgs: string[],
  configValue: boolean | undefined,
  camelName: string,
  kebabName = camelName,
): boolean {
  if (hasBooleanFlag(rawArgs, camelName, kebabName)) {
    return Boolean(args[camelName] ?? args[kebabName]);
  }

  return configValue ?? Boolean(args[camelName] ?? args[kebabName]);
}

function hasBooleanFlag(rawArgs: string[], camelName: string, kebabName: string): boolean {
  return rawArgs.some((arg) => {
    const normalizedArg = arg.split('=')[0];
    return (
      normalizedArg === `--${camelName}` ||
      normalizedArg === `--no-${camelName}` ||
      normalizedArg === `--${kebabName}` ||
      normalizedArg === `--no-${kebabName}`
    );
  });
}

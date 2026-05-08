export function createUnifiedDiff(
  filePath: string,
  oldContent: string,
  newContent: string,
): string {
  if (oldContent === newContent) {
    return '';
  }

  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const output = [`--- ${filePath}`, `+++ ${filePath}`];
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let index = 0; index < maxLines; index++) {
    const oldLine = oldLines[index];
    const newLine = newLines[index];

    if (oldLine === newLine) {
      output.push(` ${oldLine ?? ''}`);
      continue;
    }

    if (oldLine !== undefined) {
      output.push(`-${oldLine}`);
    }
    if (newLine !== undefined) {
      output.push(`+${newLine}`);
    }
  }

  return output.join('\n');
}

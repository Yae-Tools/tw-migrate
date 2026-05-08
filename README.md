# TW Migrate

[![npm version](https://badge.fury.io/js/tw-migrate.svg)](https://badge.fury.io/js/tw-migrate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful CLI tool designed to automate the migration of Tailwind CSS classes to newer, more efficient conventions. Modernize your codebase without manual refactoring, improving maintainability and consistency across your project.

## 🌟 Why TW Migrate?

As Tailwind CSS evolves, certain class patterns become deprecated or less efficient, requiring developers to manually refactor large codebases—a time-consuming and error-prone process. This tool addresses that challenge by providing automated, rule-based conversion of outdated class usages into their modern equivalents.

**Example transformations:**
- `w-4 h-4` → `size-4` (unified sizing)
- `mx-4 my-4` → `m-4` (axis consolidation)
- `bg-red-500 bg-opacity-50` → `bg-red-500/50` (modern opacity syntax)
- `space-x-4 space-y-4` on flex containers → `gap-4` (modern gap usage)

## ✨ Features

- **🔄 Automated Class Migration:** Updates Tailwind CSS classes based on predefined conversion rules
- **🎯 Interactive Mode:** Guided selection of conversions with checkbox interface
- **🛡️ Git Integration:** Ensures repository is clean before making changes, preventing data loss
- **📁 Flexible Path Targeting:** Support for glob patterns to target specific files or directories
- **🏢 Monorepo Friendly:** Easily integrate into monorepo setups across multiple packages
- **🔍 Environment Detection:** Automatically detects project framework (React, Vue, Svelte, Next.js, etc.)
- **📊 Real-time Progress:** Live progress reporting with percentage completion
- **⚡ Parallel Processing:** Efficient file processing for large codebases

## 📦 Installation

### Quick Start with npx (Recommended)

The fastest way to get started is using `npx` for one-time or ad-hoc usage:

```bash
npx tw-migrate
```

This downloads and runs the latest version without requiring local installation.

### Global Installation

For regular use or CI/CD integration:

```bash
npm install -g tw-migrate
```

After installation, the command is available system-wide:

```bash
tw-migrate -c size -p "src/**/*.tsx"
```

### Prerequisites

- **Node.js**: v20.19+, v22.13+, or v23.5+
- **Git**: Optional but recommended for safety checks
- **Tailwind CSS**: v2.0+ (see [compatibility section](#-compatibility) for specific requirements)

## 🚀 Quick Start

### Interactive Mode (Recommended for First Use)

Run without arguments to enter interactive mode:

```bash
npx tw-migrate
```

The tool will:
1. Display project environment detection
2. Prompt you to select conversion types
3. Show real-time progress with file-by-file updates
4. Provide a summary of changes made

### Non-Interactive Mode

For scripts or CI environments:

```bash
# Apply specific conversions
npx tw-migrate -c size margin -p "src/**/*.{js,jsx,ts,tsx}"

# Multiple conversions with custom path
npx tw-migrate -c "size,gap,color-opacity" -p "./components/**/*.tsx"
```

## 📖 Usage Examples

### Target Specific Files

```bash
# Process only TypeScript React files
npx tw-migrate -c size -p "src/**/*.{ts,tsx}"

# Process a single file
npx tw-migrate -c color-opacity -p "components/Button.tsx"

# Process HTML and CSS files
npx tw-migrate -c gap -p "**/*.{html,css}"
```

### Monorepo Usage

```bash
# Target specific package
npx tw-migrate -c size -p "packages/ui/**/*.tsx"

# Process all packages
npx tw-migrate -c margin padding -p "packages/**/*.{js,jsx,ts,tsx}"

# Workspace-specific targeting
npx tw-migrate -c "size,gap" -p "apps/web/src/**/*.tsx"
```

### CI/CD Integration

```bash
# Skip Git checks in CI environment
npx tw-migrate -c size --ignore-git -p "src/**/*.tsx"

# Non-interactive with all conversions
npx tw-migrate -c "size,margin,padding,color-opacity,gap" --ignore-git
```

## 🔄 Conversion Types

### Size Conversion (`size`)

Merges identical `w-{value}` and `h-{value}` classes into unified `size-{value}` classes.

```html
<!-- Before -->
<div class="w-4 h-4 w-full h-full">

<!-- After -->
<div class="size-4 size-full">
```

**Requirements:** Tailwind CSS v3.4+

### Axis Conversion (`margin`, `padding`)

Consolidates axis-specific classes when values are identical.

```html
<!-- Before -->
<div class="mx-4 my-4 px-2 py-2">

<!-- After -->
<div class="m-4 p-2">
```

**Supported patterns:**
- `mx-{value}` + `my-{value}` → `m-{value}`
- `px-{value}` + `py-{value}` → `p-{value}`

### Color Opacity Conversion (`color-opacity`)

Modernizes opacity usage by merging separate color and opacity classes.

```html
<!-- Before -->
<div class="bg-red-500 bg-opacity-50 text-blue-600 text-opacity-75">

<!-- After -->
<div class="bg-red-500/50 text-blue-600/75">
```

**Supported prefixes:** `bg`, `text`, `border`, `ring`, `divide`, `placeholder`

### Gap Conversion (`gap`)

Converts `space-x` and `space-y` to `gap` when used together on flex or grid containers.

```html
<!-- Before -->
<div class="flex space-x-4 space-y-4">

<!-- After -->
<div class="flex gap-4">
```

**Note:** Only applies when both `space-x` and `space-y` have the same value and container uses `flex` or `grid`.

## ⚙️ Command Reference

### Core Options

| Flag | Alias | Type | Description | Default |
|------|-------|------|-------------|----------|
| `--conversions` | `-c` | `string[]` | Conversion types to apply | Interactive prompt |
| `--path` | `-p` | `string` | Glob pattern for file targeting | `./**/*.{js,jsx,ts,tsx,html,css,svelte}` |
| `--ignore-git` | | `boolean` | Skip Git repository checks | `false` |
| `--version` | | | Display version information | |
| `--help` | | | Show help information | |

### Available Conversions

- `size` - Merge w-/h- classes to size-
- `margin` - Consolidate margin axis classes
- `padding` - Consolidate padding axis classes  
- `color-opacity` - Modernize color opacity syntax
- `gap` - Convert space- to gap classes

### Interactive vs Non-Interactive Mode

**Interactive Mode** (when stdout is TTY):
- Displays ASCII logo and environment detection
- Prompts for conversion selection if not specified
- Shows real-time progress with file updates
- Provides confirmation dialogs

**Non-Interactive Mode** (scripts/CI):
- Requires `--conversions` flag
- Silent execution with minimal output
- Exits with error if conversions not specified

## 🔧 Configuration

### Environment Detection

The tool automatically detects your project environment:

- **Framework Detection**: React, Vue, Svelte, Next.js, Nuxt.js, Angular
- **Tailwind Version**: Validates compatibility requirements
- **Git Status**: Checks for uncommitted changes
- **File Types**: Adjusts processing based on detected framework

### Git Integration

By default, the tool prevents execution if uncommitted changes exist:

```bash
# Check Git status
git status

# Commit changes before running
git add .
git commit -m "Pre-modernization commit"

# Or override with --ignore-git flag
npx tw-migrate --ignore-git
```

## 🔗 Compatibility

### Tailwind CSS Version Requirements

| Conversion Type | Minimum Version | Notes |
|-----------------|-----------------|-------|
| `size` | v3.4+ | Uses modern size utilities |
| `margin`, `padding` | v2.0+ | Basic axis consolidation |
| `color-opacity` | v2.0+ | Modern opacity syntax |
| `gap` | v2.0+ | Gap utilities |
| Arbitrary values | v2.2+ | `[custom-values]` support |

### Framework Support

- **React**: `.js`, `.jsx`, `.ts`, `.tsx`
- **Vue**: `.vue`, `.js`, `.ts`
- **Svelte**: `.svelte`
- **Angular**: `.html`, `.ts`
- **Generic**: `.html`, `.css`

### Node.js Compatibility

- **Minimum**: Node.js v16
- **Recommended**: Node.js v18+
- **Dependencies**: All dependencies are bundled for minimal installation overhead

## 🚨 Troubleshooting

### Common Issues

**Framework not detected:**
```bash
# Verify package.json exists in project root
ls package.json

# Check for framework dependencies
cat package.json | grep -E "(react|vue|svelte|next|nuxt|angular)"
```

**Tailwind version warnings:**
```bash
# Check Tailwind version
npm list tailwindcss

# Upgrade if needed
npm install tailwindcss@latest
```

**Git repository issues:**
```bash
# Initialize Git if needed
git init

# Or skip Git checks
npx tw-migrate --ignore-git
```

**File permission errors:**
```bash
# Check file permissions
ls -la src/components/

# Ensure read/write access
chmod 644 src/components/*.tsx
```

### Debug Mode

For detailed output, run with verbose logging:

```bash
# Enable debug output (if implemented)
DEBUG=tw-migrate npx tw-migrate
```

## 🏗️ Advanced Usage

### Custom File Patterns

```bash
# Process only specific directories
npx tw-migrate -c size -p "src/components/**/*.tsx"

# Multiple pattern matching
npx tw-migrate -c gap -p "{components,pages}/**/*.{js,ts}"

# Exclude specific files
npx tw-migrate -c margin -p "src/**/*.tsx" --exclude "**/*.test.tsx"
```

### Integration with Build Tools

**package.json scripts:**
```json
{
  "scripts": {
    "modernize:interactive": "tw-migrate",
    "modernize:size": "tw-migrate -c size",
    "modernize:all": "tw-migrate -c size,margin,padding,color-opacity,gap",
    "modernize:ci": "tw-migrate -c size --ignore-git"
  }
}
```

**Pre-commit hooks:**
```yaml
# .pre-commit-config.yaml
- repo: local
  hooks:
    - id: tw-migrate
      name: Modernize Tailwind classes
      entry: npx tw-migrate -c size --ignore-git
      language: system
      files: \.(js|jsx|ts|tsx|html|css|svelte)$
```

## 📊 Performance

- **Processing Speed**: ~100-500 files/second (depending on file size)
- **Memory Usage**: Minimal memory footprint with streaming processing
- **Parallel Processing**: Automatically optimizes for available CPU cores
- **Large Codebases**: Tested on projects with 10,000+ files

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Yae-Tools/tw-migrate.git
cd tw-migrate

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Test locally
npm run start
```

### Adding New Conversions

1. Create conversion function in `src/util/`
2. Add type definitions in `src/types/conversionTypes.ts`
3. Register in `src/conversions.ts`
4. Add comprehensive tests
5. Update documentation

### Reporting Issues

When reporting issues, please include:
- Node.js version (`node --version`)
- Tailwind CSS version
- Sample code that reproduces the issue
- Expected vs actual behavior

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) team for the amazing framework
- Contributors and community for feedback and improvements
- Open source libraries that make this tool possible

---

<div align="center">
  <strong>Made with ❤️ for the Tailwind CSS community</strong><br>
  <a href="https://github.com/Yae-Tools/tw-migrate">⭐ Star on GitHub</a> •
  <a href="https://github.com/Yae-Tools/tw-migrate/issues">🐛 Report Bug</a> •
  <a href="https://github.com/Yae-Tools/tw-migrate/discussions">💬 Discussions</a>
</div>

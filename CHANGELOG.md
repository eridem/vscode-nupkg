### Unreleased

- Breaking: raise minimum VS Code version to 1.85.0.
- Feature: `.nupkg` files now open in a built-in custom editor with a rendered Preview and legacy YAML view, instead of dumping a temporary `.yml` file. The old `extension.preview` command is kept as a fallback.
- Improvement: add `nupkg.preview.defaultMode` setting to choose the default view.
- Improvement: migrate build to esbuild and lint to ESLint (flat config); drop TSLint, Yarn, and the legacy `vscode` module in favor of `@types/vscode`.
- Improvement: add unit tests for parsers and metadata reading.

### 1.0.1

- Bugfix: fix Homepage url

### 1.0.0

- Improvement: support for repositories ([#10](https://github.com/eridem/vscode-nupkg/issues/10)).

### 0.0.8

- Improvement: Add profile names.
- Bugfix: fix encoding on file names.

### 0.0.7

- Improvement: show version symbols '<=', '<', '>=' and '>'.

### 0.0.6

- Improvement: sort files alphabetically.
- Bugfix: fix bug showing dependencies without group.
- Bugfix: fix bug repeating sections in Metadata.

### 0.0.5

- Bugfix: show 'All Frameworks' raised exception.
- Bugfix: show 'References' section.

### 0.0.4

- Improvement: search tags on Marketplace, homepage, ...

### 0.0.3

- Bugfix: grammar in README.

### 0.0.2

- Improvement: change icon.

### 0.0.1

- Initial release.
- Feature: context menu and title icon to open the previews.
- Feature: display files inside the package.
- Feature: display metadata and dependencies inside the package.

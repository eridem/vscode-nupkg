# NuGet NuPkg Viewer

**Peek inside any `.nupkg` without unzipping it.** Click a NuGet package in VS Code and instantly see its metadata, dependencies, and file contents — rendered, readable, and theme-aware.

## Why you'll like it

- **Zero-click preview.** Click a `.nupkg` file and it opens straight into a rendered preview — no commands, no extraction, no temp files to hunt down.
- **Everything in one view.** Metadata, dependencies (flat or grouped by target framework), framework assemblies, references, and the full file listing — all in one scrollable page.
- **Speaks NuGet fluently.** Version ranges like `[1.0,2.0)` are shown as `>= 1.0 && < 2.0`, and Portable Class Library `ProfileNN` identifiers are translated into readable framework lists.
- **Matches your theme.** The preview follows your VS Code color theme automatically, light or dark.
- **Raw YAML when you need it.** Toggle to a plain-text YAML view for copy-pasting or diffing.

## Features

### Rendered preview (default)

Opening a `.nupkg` file activates a custom read-only editor with a fully rendered, styled view of the package: title, description, author, license, project/repository links, tags, dependency groups per target framework, framework assemblies, references, and the zip's file tree.

![Rendered preview in dark theme](https://raw.githubusercontent.com/eridem/vscode-nupkg/master/images/screenshot-preview.png)

### YAML view

Prefer plain text? Toggle to the YAML view from the preview toolbar for a raw, greppable/diffable dump of the same data.

![YAML view toggle](https://raw.githubusercontent.com/eridem/vscode-nupkg/master/images/screenshot-yaml-code.png)

## Getting started

1. Install **NuGet NuPkg Viewer** from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=eridem.vscode-nupkg).
2. Click on any `.nupkg` file.
3. That's it — the preview opens automatically.

## Custom settings

Prefer the YAML view by default? Set `nupkg.preview.defaultMode` to `"yaml"` in your settings.

## Known Issues

Found a bug or have a feature request? [Open an issue](https://github.com/eridem/vscode-nupkg/issues).

## Changelog

See what's new in the [Changelog](./CHANGELOG.md) or on the [Marketplace changelog tab](https://marketplace.visualstudio.com/items/eridem.vscode-nupkg/changelog).

## Copyright

Done by [Miguel Ángel Domínguez Coloma](https://www.eridem.com) - <https://www.eridem.com>

Licensed under [the MIT License](./LICENSE.md)

import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import { basename, join } from 'path';
import * as nupkgUtils from './nupkg-utils';
import * as zipUtils from './zip-utils';
import { renderSectionsHtml, escapeHtml } from './preview-render';

class NupkgDocument implements vscode.CustomDocument {
    constructor(public readonly uri: vscode.Uri) { }
    dispose(): void { /* nothing to release */ }
}

// globalState key holding the last view the user toggled to, so newly opened
// packages reuse that choice (falling back to the nupkg.preview.defaultMode setting).
const LAST_MODE_KEY = 'nupkg.preview.lastMode';

export class NupkgPreviewProvider implements vscode.CustomReadonlyEditorProvider<NupkgDocument> {
    public static readonly viewType = 'nupkg.preview';

    constructor(private readonly context: vscode.ExtensionContext) { }

    openCustomDocument(uri: vscode.Uri): NupkgDocument {
        return new NupkgDocument(uri);
    }

    async resolveCustomEditor(
        document: NupkgDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken,
    ): Promise<void> {
        webviewPanel.webview.options = { enableScripts: true };

        const filePath = document.uri.fsPath;
        const configMode = vscode.workspace
            .getConfiguration('nupkg')
            .get<string>('preview.defaultMode', 'modern');
        const lastMode = this.context.globalState.get<string>(LAST_MODE_KEY);
        const defaultMode = (lastMode ?? configMode) === 'yaml' ? 'yaml' : 'modern';

        try {
            const [metadata, entries, nupkgYaml, zipText] = await Promise.all([
                nupkgUtils.getNuPkgMetadata(filePath),
                zipUtils.getZipEntries(filePath),
                nupkgUtils.getTextForNuPkgContents(filePath),
                zipUtils.getTextForZipContents(filePath),
            ]);

            const sectionsHtml = renderSectionsHtml(metadata, entries);
            const yamlText = (nupkgYaml + '\n' + zipText + '\n')
                .replace(/'(Portable Class Library\s+\([^)]+\))\s*'/gi, '$1');

            webviewPanel.webview.html = this.buildHtml(
                webviewPanel.webview,
                sectionsHtml,
                yamlText,
                defaultMode,
            );

            webviewPanel.webview.onDidReceiveMessage((message) => {
                if (!message) { return; }
                if (message.type === 'setMode') {
                    const mode = message.mode === 'yaml' ? 'yaml' : 'modern';
                    this.context.globalState.update(LAST_MODE_KEY, mode);
                } else if (message.type === 'openYaml') {
                    this.openYamlAsFile(document.uri, yamlText);
                }
            });
        } catch (error: any) {
            webviewPanel.webview.html = this.buildErrorHtml(webviewPanel.webview, filePath, error);
        }
    }

    private async openYamlAsFile(uri: vscode.Uri, yamlText: string): Promise<void> {
        const newFilePath = join(os.tmpdir(), basename(uri.fsPath) + '.yml');
        fs.writeFileSync(newFilePath, yamlText);
        const doc = await vscode.workspace.openTextDocument(newFilePath);
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
    }

    private buildHtml(
        webview: vscode.Webview,
        sectionsHtml: string,
        yamlText: string,
        defaultMode: string,
    ): string {
        const nonce = getNonce();
        const modernActive = defaultMode === 'modern';
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${this.styleTag(nonce)}
</head>
<body>
  <div class="toolbar">
    <div class="toggle" role="tablist">
      <button id="tab-modern" class="${modernActive ? 'active' : ''}" role="tab">Preview</button>
      <button id="tab-yaml" class="${modernActive ? '' : 'active'}" role="tab">YAML</button>
    </div>
    <button id="open-yaml" class="action" type="button">Open YAML as file</button>
  </div>
  <div id="view-modern" class="view" ${modernActive ? '' : 'hidden'}>
    ${sectionsHtml}
  </div>
  <div id="view-yaml" class="view" ${modernActive ? 'hidden' : ''}>
    <pre class="yaml">${escapeHtml(yamlText)}</pre>
  </div>
  <script nonce="${nonce}">
    const vscodeApi = acquireVsCodeApi();
    const tabModern = document.getElementById('tab-modern');
    const tabYaml = document.getElementById('tab-yaml');
    const viewModern = document.getElementById('view-modern');
    const viewYaml = document.getElementById('view-yaml');
    function show(mode, persist) {
      const modern = mode !== 'yaml';
      const value = modern ? 'modern' : 'yaml';
      viewModern.hidden = !modern;
      viewYaml.hidden = modern;
      tabModern.classList.toggle('active', modern);
      tabYaml.classList.toggle('active', !modern);
      vscodeApi.setState({ mode: value });
      if (persist) { vscodeApi.postMessage({ type: 'setMode', mode: value }); }
    }
    tabModern.addEventListener('click', () => show('modern', true));
    tabYaml.addEventListener('click', () => show('yaml', true));
    document.getElementById('open-yaml').addEventListener('click', () => {
      vscodeApi.postMessage({ type: 'openYaml' });
    });
    const prev = vscodeApi.getState();
    if (prev && prev.mode) { show(prev.mode, false); }
  </script>
</body>
</html>`;
    }

    private buildErrorHtml(webview: vscode.Webview, filePath: string, error: any): string {
        const nonce = getNonce();
        const message = error && error.message ? error.message : String(error);
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}';">
${this.styleTag(nonce)}
</head>
<body>
  <section>
    <h2>Unable to preview this package</h2>
    <p class="muted">${escapeHtml(filePath)}</p>
    <pre class="yaml">${escapeHtml(message)}</pre>
  </section>
</body>
</html>`;
    }

    private styleTag(nonce: string): string {
        return `<style nonce="${nonce}">
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      padding: 0 1.25rem 2rem;
      line-height: 1.5;
    }
    .toolbar {
      position: sticky;
      top: 0;
      background: var(--vscode-editor-background);
      padding: 0.75rem 0;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .toolbar .action {
      margin-left: auto;
      font: inherit;
      padding: 0.3rem 0.9rem;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      cursor: pointer;
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
      background: var(--vscode-button-secondaryBackground, transparent);
    }
    .toggle { display: inline-flex; border: 1px solid var(--vscode-panel-border); border-radius: 4px; overflow: hidden; }
    .toggle button {
      font: inherit;
      padding: 0.3rem 0.9rem;
      border: none;
      cursor: pointer;
      color: var(--vscode-foreground);
      background: transparent;
    }
    .toggle button.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    h2 {
      font-size: 1.05rem;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 0.25rem;
      margin: 1.5rem 0 0.75rem;
    }
    h2 .count, .muted { color: var(--vscode-descriptionForeground); font-weight: normal; }
    table.kv { border-collapse: collapse; width: 100%; }
    table.kv th, table.kv td {
      text-align: left;
      vertical-align: top;
      padding: 0.25rem 0.75rem 0.25rem 0;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    table.kv th { width: 12rem; color: var(--vscode-descriptionForeground); font-weight: 600; }
    table.kv table.kv { margin: 0; }
    table.kv table.kv th, table.kv table.kv td { border-bottom: none; padding-top: 0; padding-bottom: 0; }
    ul.refs, ul.tree { list-style: none; padding: 0; margin: 0; }
    ul.tree .entry { display: flex; align-items: center; gap: 0.6rem; padding: 0.1rem 0; font-family: var(--vscode-editor-font-family, monospace); }
    .badge {
      font-size: 0.65rem;
      padding: 0.05rem 0.35rem;
      border-radius: 3px;
      letter-spacing: 0.03em;
    }
    .badge.dir { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
    .badge.file { border: 1px solid var(--vscode-panel-border); color: var(--vscode-descriptionForeground); }
    pre.yaml {
      font-family: var(--vscode-editor-font-family, monospace);
      background: var(--vscode-textCodeBlock-background);
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      white-space: pre;
    }
  </style>`;
    }
}

function getNonce(): string {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
}

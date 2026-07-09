import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import { basename, join } from 'path';
import * as zipUtils from './zip-utils';
import * as nupkgUtils from './nupkg-utils';
import { NupkgPreviewProvider } from './preview-provider';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            NupkgPreviewProvider.viewType,
            new NupkgPreviewProvider(context),
            {
                webviewOptions: { retainContextWhenHidden: true },
                supportsMultipleEditorsPerDocument: false,
            },
        ),
    );

    function createFileAndShowIt(fileUri: vscode.Uri, text: string) {
        let newFilePath = join(os.tmpdir(), basename(fileUri.fsPath) + '.yml');
        fs.writeFileSync(newFilePath, text);

        vscode.workspace.openTextDocument(newFilePath).then(doc => {
            vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        });
    }

    let disposable = vscode.commands.registerCommand('extension.preview', (fileUri: vscode.Uri) => {
        if (!fileUri) return vscode.window.showInformationMessage('Use the context menu over the *.nupkg file or the editor button to obtain the preview.');
        Promise.all([
            nupkgUtils.getTextForNuPkgContents(fileUri.fsPath),
            zipUtils.getTextForZipContents(fileUri.fsPath)
        ]).then((texts) => {
            let text = '';
            texts.forEach((t) => text += t + '\n');
            text = text.replace(/'(Portable Class Library\s+\([^\)]+\))\s*'/gi, '$1')
            createFileAndShowIt(fileUri, text);
        })
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }

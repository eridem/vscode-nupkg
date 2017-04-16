import * as vscode from 'vscode';
import * as zipUtils from './zip-utils';
import * as nupkgUtils from './nupkg-utils';

const { basename, join } = require('path');
const shell = require('shelljs');

export function activate(context: vscode.ExtensionContext) {
    function createFileAndShowIt(fileUri, text) {
        let newFilePath = join(shell.tempdir(), basename(fileUri._fsPath) + '.yml');
        shell.echo(text).to(newFilePath)

        vscode.workspace.openTextDocument(newFilePath).then(doc => {
            vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
        });
    }

    let disposable = vscode.commands.registerCommand('extension.preview', (fileUri) => {
        if (!fileUri) return vscode.window.showInformationMessage('Use the context menu over the *.nupkg file or the editor button to obtain the preview.');
        Promise.all([
            nupkgUtils.getTextForNuPkgContents(fileUri._fsPath),
            zipUtils.getTextForZipContents(fileUri._fsPath)
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

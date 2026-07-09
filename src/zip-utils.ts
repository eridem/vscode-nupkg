import * as filenameParser from './filename-parser';

function createFileTreeAsText(entries: any[]) {
    let result = 'Contents:\n';
    entries.forEach((e: any) => result += '  - ' + (e.isDirectory ? 'Folder: ' : 'File:   ') + ' ' + filenameParser.parse(e.entryName) + '\n');
    return result;
}

function alphabetically(a: any, b: any) {
    return a.entryName.localeCompare(b.entryName);
}

export function getTextForZipContents(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let AdmZip = require('adm-zip');
        let zip = new AdmZip(filePath);
        let zipEntries = zip.getEntries().sort(alphabetically); // an array of ZipEntry records
        return resolve(createFileTreeAsText(JSON.parse(JSON.stringify(zipEntries))));
    })
}

export interface ZipEntryInfo {
    name: string;
    isDirectory: boolean;
}

// Structured variant of getTextForZipContents for the webview preview.
export function getZipEntries(filePath: string): Promise<ZipEntryInfo[]> {
    return new Promise<ZipEntryInfo[]>((resolve, reject) => {
        let AdmZip = require('adm-zip');
        let zip = new AdmZip(filePath);
        let zipEntries = zip.getEntries().sort(alphabetically);
        let plain = JSON.parse(JSON.stringify(zipEntries));
        return resolve(plain.map((e: any) => ({
            name: filenameParser.parse(e.entryName),
            isDirectory: e.isDirectory,
        })));
    });
}

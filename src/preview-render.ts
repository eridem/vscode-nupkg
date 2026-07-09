import type { ZipEntryInfo } from './zip-utils';

export function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Renders any leaf value: strings/numbers as text, xml2js "$" attribute bags
// and nested objects as a small key/value table, arrays as stacked blocks.
function renderValue(value: any): string {
    if (value === null || value === undefined) {
        return '<span class="muted">—</span>';
    }
    if (Array.isArray(value)) {
        return value.map(renderValue).join('');
    }
    if (typeof value === 'object') {
        const rows = Object.keys(value)
            .map(k => `<tr><th>${escapeHtml(k)}</th><td>${renderValue(value[k])}</td></tr>`)
            .join('');
        return `<table class="kv">${rows}</table>`;
    }
    return escapeHtml(value);
}

function renderKeyValueSection(title: string, obj: Record<string, any>): string {
    const rows = Object.keys(obj)
        .map(k => `<tr><th>${escapeHtml(k)}</th><td>${renderValue(obj[k])}</td></tr>`)
        .join('');
    return `<section><h2>${escapeHtml(title)}</h2><table class="kv">${rows}</table></section>`;
}

function renderReferencesSection(references: any[]): string {
    const items = references
        .map(r => `<li>${renderValue(r)}</li>`)
        .join('');
    return `<section><h2>References</h2><ul class="refs">${items}</ul></section>`;
}

function renderContentsSection(entries: ZipEntryInfo[]): string {
    const rows = entries
        .map(e => {
            const kind = e.isDirectory ? 'dir' : 'file';
            const label = e.isDirectory ? 'DIR' : 'FILE';
            return `<li class="entry ${kind}"><span class="badge ${kind}">${label}</span>` +
                `<span class="name">${escapeHtml(e.name)}</span></li>`;
        })
        .join('');
    return `<section><h2>Contents <span class="count">(${entries.length})</span></h2>` +
        `<ul class="tree">${rows}</ul></section>`;
}

// Builds the inner HTML for the "modern" rendered view. Pure: no vscode APIs,
// so it is covered by unit tests. `metadata` is the object produced by
// createNuGetAsText; sections are rendered only when present.
export function renderSectionsHtml(metadata: any, entries: ZipEntryInfo[]): string {
    const parts: string[] = [];
    const meta = metadata || {};

    if (meta['Metadata'] && Object.keys(meta['Metadata']).length) {
        parts.push(renderKeyValueSection('Metadata', meta['Metadata']));
    }
    if (Array.isArray(meta['References']) && meta['References'].length) {
        parts.push(renderReferencesSection(meta['References']));
    }
    if (meta['Dependencies'] && Object.keys(meta['Dependencies']).length) {
        parts.push(renderKeyValueSection('Dependencies', meta['Dependencies']));
    }
    if (meta['Framework Assemblies'] && Object.keys(meta['Framework Assemblies']).length) {
        parts.push(renderKeyValueSection('Framework Assemblies', meta['Framework Assemblies']));
    }
    parts.push(renderContentsSection(entries || []));

    return parts.join('\n');
}

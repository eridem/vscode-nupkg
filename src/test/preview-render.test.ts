import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, renderSectionsHtml } from '../preview-render';

test('escapeHtml neutralizes markup and quotes', () => {
    assert.equal(
        escapeHtml(`<script>"x" & 'y'</script>`),
        '&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;',
    );
});

test('escapeHtml renders null/undefined as empty string', () => {
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
});

test('renderSectionsHtml emits sections only when present', () => {
    const metadata = {
        Metadata: { id: 'My.Package', version: '1.2.3' },
        References: [{ file: 'System.dll' }],
        Dependencies: { 'net45': { 'Newtonsoft.Json': '>= 9.0.1 && < 10.0.0' } },
        'Framework Assemblies': { net45: 'System.Xml' },
    };
    const entries = [
        { name: 'lib', isDirectory: true },
        { name: 'lib/net45/My.dll', isDirectory: false },
    ];

    const html = renderSectionsHtml(metadata, entries);

    assert.match(html, /<h2>Metadata<\/h2>/);
    assert.match(html, /My\.Package/);
    assert.match(html, /<h2>References<\/h2>/);
    assert.match(html, /<h2>Dependencies<\/h2>/);
    assert.match(html, /<h2>Framework Assemblies<\/h2>/);
    assert.match(html, /Contents <span class="count">\(2\)<\/span>/);
    assert.match(html, /badge dir">DIR/);
    assert.match(html, /badge file">FILE/);
});

test('renderSectionsHtml always renders Contents even when metadata is empty', () => {
    const html = renderSectionsHtml({}, []);
    assert.match(html, /<h2>Contents/);
    assert.doesNotMatch(html, /<h2>Metadata<\/h2>/);
});

test('renderSectionsHtml escapes values from the package', () => {
    const html = renderSectionsHtml(
        { Metadata: { description: '<b>x</b>' } },
        [{ name: 'a<b>.dll', isDirectory: false }],
    );
    assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
    assert.match(html, /a&lt;b&gt;\.dll/);
    assert.doesNotMatch(html, /<b>x<\/b>/);
});

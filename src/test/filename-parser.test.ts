import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as filenameParser from '../filename-parser';

test('empty input returns empty string', () => {
    assert.equal(filenameParser.parse(''), '');
});

test('plain names pass through unchanged', () => {
    assert.equal(filenameParser.parse('lib/net45/Foo.dll'), 'lib/net45/Foo.dll');
});

test('URL-encoded names are decoded', () => {
    assert.equal(filenameParser.parse('lib/net45/Foo%20Bar.dll'), 'lib/net45/Foo Bar.dll');
    assert.equal(filenameParser.parse('content/a%2Bb.txt'), 'content/a+b.txt');
});

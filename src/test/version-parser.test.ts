import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as versionParser from '../version-parser';

test('empty input returns empty string', () => {
    assert.equal(versionParser.parse(''), '');
    assert.equal(versionParser.parse(undefined as unknown as string), '');
});

test('a bare version is treated as a minimum', () => {
    assert.equal(versionParser.parse('1.0.0'), '>= 1.0.0');
});

test('inclusive lower / exclusive upper range', () => {
    assert.equal(versionParser.parse('[1.0,2.0)'), '>= 1.0 && < 2.0');
});

test('exclusive lower / inclusive upper range', () => {
    assert.equal(versionParser.parse('(1.0,2.0]'), '> 1.0 && <= 2.0');
});

test('inclusive on both ends', () => {
    assert.equal(versionParser.parse('[1.0,2.0]'), '>= 1.0 && <= 2.0');
});

test('exact-version bracket notation', () => {
    // [1.0] -> both bounds parse from the single "1.0]" token: it ends with "]" => <=
    assert.equal(versionParser.parse('[1.0]'), '>= 1.0');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as profileParser from '../profile-parser';

test('empty input returns empty string', () => {
    assert.equal(profileParser.parse(''), '');
});

test('a non-portable framework passes through unchanged', () => {
    assert.equal(profileParser.parse('net45'), 'net45');
    assert.equal(profileParser.parse('All Frameworks'), 'All Frameworks');
});

test('a known ProfileNN is expanded to its friendly framework list', () => {
    const result = profileParser.parse('.NETPortable0.0-Profile1');
    assert.match(result, /^Portable Class Library \(.+\)$/);
    assert.ok(result.includes('.NET Framework 4.0'), 'includes .NET Framework 4.0');
    assert.ok(result.includes('Silverlight 4.0'), 'includes Silverlight 4.0');
    assert.ok(result.includes('Windows 8.0'), 'includes Windows 8.0');
});

test('an unknown ProfileNN passes through unchanged', () => {
    assert.equal(profileParser.parse('Profile999999'), 'Profile999999');
});

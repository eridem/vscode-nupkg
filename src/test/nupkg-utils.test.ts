import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNuGetAsText } from '../nupkg-utils';

// Fixtures mimic the xml2js-shaped structure produced by
// smart-nupkg-metadata-reader: every value is an array, attribute bags live
// under a `$` key.

test('dependencies grouped by target framework', () => {
    const spec = {
        package: {
            metadata: [
                {
                    id: ['My.Package'],
                    version: ['1.2.3'],
                    references: [{ reference: [{ $: { file: 'System.dll' } }] }],
                    frameworkAssemblies: [
                        {
                            frameworkAssembly: [
                                { $: { assemblyName: 'System.Xml', targetFramework: 'net45' } },
                            ],
                        },
                    ],
                    dependencies: [
                        {
                            group: [
                                {
                                    $: { targetFramework: 'net45' },
                                    dependency: [
                                        { $: { id: 'Newtonsoft.Json', version: '[9.0.1,10.0.0)' } },
                                    ],
                                },
                                { $: { targetFramework: '.NETPortable0.0-Profile1' } },
                            ],
                        },
                    ],
                },
            ],
        },
    };

    const result = createNuGetAsText(spec);

    assert.deepEqual(result.Metadata, { id: 'My.Package', version: '1.2.3' });
    assert.deepEqual(result.References, [{ file: 'System.dll' }]);
    assert.deepEqual(result['Framework Assemblies'], { net45: 'System.Xml' });
    assert.deepEqual(result.Dependencies.net45, {
        'Newtonsoft.Json': '>= 9.0.1 && < 10.0.0',
    });

    // A group with no dependencies is expanded via the profile parser and marked empty.
    const pclKey = Object.keys(result.Dependencies).find((k) => k.startsWith('Portable'));
    assert.ok(pclKey, 'a Portable Class Library key exists');
    assert.equal(result.Dependencies[pclKey!], 'No dependencies.');
});

test('flat dependencies without a target framework', () => {
    const spec = {
        package: {
            metadata: [
                {
                    id: ['Flat.Package'],
                    dependencies: [
                        {
                            dependency: [
                                { $: { id: 'Dep.A', version: '2.0.0' } },
                                { $: { id: 'Dep.B', version: '[1.0,2.0)' } },
                            ],
                        },
                    ],
                },
            ],
        },
    };

    const result = createNuGetAsText(spec);

    assert.deepEqual(result.Metadata, { id: 'Flat.Package' });
    assert.deepEqual(result.Dependencies, {
        'Dep.A': '>= 2.0.0',
        'Dep.B': '>= 1.0 && < 2.0',
    });
});

test('empty spec yields an empty object', () => {
    assert.deepEqual(createNuGetAsText({}), {});
});

function createNuGetAsText(nugetSpec: any): any {
    // r is Result object
    let r = {}

    if (nugetSpec.package && nugetSpec.package.metadata && nugetSpec.package.metadata[0]) {
        let metadata = nugetSpec.package.metadata[0] || [];
        let metadataKeys = Object.keys(metadata).filter(m => m !== 'dependencies') || [];
        let dependencies = metadata.dependencies && metadata.dependencies[0] && metadata.dependencies[0].group ? metadata.dependencies[0].group : [];
        let references = metadata.references && metadata.references[0] && metadata.references[0].reference ? metadata.references[0].reference : []
        let dependencyKeys = Object.keys(dependencies) || [];
        let frameworkAssemblies = metadata.frameworkAssemblies && metadata.frameworkAssemblies[0] && metadata.frameworkAssemblies[0].frameworkAssembly ? metadata.frameworkAssemblies[0].frameworkAssembly : [];
        let frameworkAssembliesKeys = Object.keys(frameworkAssemblies) || [];

        // Metadata
        if (metadataKeys.length) r['Metadata'] = {};
        metadataKeys.forEach(k => r['Metadata'][k] = metadata[k].toString())

        // References
        if (references.length) {
            r['References'] = references.map(r => r.$)
        }

        // Dependencies
        if (dependencyKeys.length) r['Dependencies'] = {};
        dependencyKeys.forEach(k => {
            let framework = dependencies[k];
            let frameworkName = framework.$ && framework.$.targetFramework ? framework.$.targetFramework : 'All Frameworks'
            r['Dependencies'][frameworkName] = {}
            let dependency = r['Dependencies'][frameworkName]

            if (framework.dependency) {
                framework.dependency.forEach(d => dependency[d.$.id] = d.$.version)
            } else {
                dependency = `No dependencies.`
            }
        })

        // frameworkAssemblies
        if (frameworkAssembliesKeys.length) r['Framework Assemblies'] = {};
        frameworkAssembliesKeys.forEach(k => r['Framework Assemblies'][frameworkAssemblies[k].$.targetFramework || 'All'] = frameworkAssemblies[k].$.assemblyName);
    }

    return r;
}

export function getTextForNuPkgContents(filePath): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        var nupkgReader = require('smart-nupkg-metadata-reader');
        var yaml = require('js-yaml');
        nupkgReader.readMetadata(filePath, function (result, error) {
            if (error) {
                return reject();
            }
            let yamlString = yaml.safeDump(createNuGetAsText(result));
            return resolve(yamlString);
        });
    });
}
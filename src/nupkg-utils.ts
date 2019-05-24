import * as versionParser from './version-parser';
import * as profileParser from './profile-parser';

function getDependenciesWithoutFramework(metadata) {
    return metadata.dependencies && metadata.dependencies[0] && metadata.dependencies[0].dependency ? metadata.dependencies[0].dependency : [];
}

function getDependenciesByFramework(metadata) {
    return metadata.dependencies && metadata.dependencies[0] && metadata.dependencies[0].group ? metadata.dependencies[0].group : [];
}

function skipInMetadata(section) {
    return section !== 'dependencies' && section !== 'references' && section !== 'frameworkAssemblies'
}

function plainObject(obj: any) {
    if (obj instanceof Array && obj.length == 1 && typeof obj[0] == 'object') {
        let keys = Object.keys(obj[0])
        if (keys.length > 0 && keys[0] == '$') {
            return obj[0].$
        }
        return obj[0]
    }
    
    return obj.toString()
}

function createNuGetAsText(nugetSpec: any): any {
    // r is Result object
    let r = {}

    if (nugetSpec.package && nugetSpec.package.metadata && nugetSpec.package.metadata[0]) {
        let metadata = nugetSpec.package.metadata[0] || [];
        let metadataKeys = Object.keys(metadata).filter(m => m !== 'dependencies') || [];
        let dependenciesByFramework = getDependenciesByFramework(metadata);
        let dependenciesWithoutFramework = getDependenciesWithoutFramework(metadata);
        let references = metadata.references && metadata.references[0] && metadata.references[0].reference ? metadata.references[0].reference : []
        let dependencyByFrameworkKeys = Object.keys(dependenciesByFramework) || [];
        let frameworkAssemblies = metadata.frameworkAssemblies && metadata.frameworkAssemblies[0] && metadata.frameworkAssemblies[0].frameworkAssembly ? metadata.frameworkAssemblies[0].frameworkAssembly : [];
        let frameworkAssembliesKeys = Object.keys(frameworkAssemblies) || [];

        // Metadata
        if (metadataKeys.length) r['Metadata'] = {};
        metadataKeys.filter(skipInMetadata).forEach(k => r['Metadata'][k] = plainObject(metadata[k]))

        // References
        if (references.length) {
            r['References'] = references.map(r => r.$)
        }

        // Dependencies by Framework
        if (dependencyByFrameworkKeys.length) r['Dependencies'] = r['Dependencies'] || {};
        dependencyByFrameworkKeys.forEach(k => {
            let framework = dependenciesByFramework[k];
            let frameworkName = profileParser.parse(framework.$ && framework.$.targetFramework ? framework.$.targetFramework : 'All Frameworks')
            r['Dependencies'][frameworkName] = {}
            let dependency = r['Dependencies'][frameworkName]

            if (framework.dependency) {
                framework.dependency.forEach(d => dependency[d.$.id] = versionParser.parse(d.$.version))
            } else {
                r['Dependencies'][frameworkName] = `No dependencies.`
            }
        })

        // Dependencies without Framework
        if (dependenciesWithoutFramework.length) r['Dependencies'] = r['Dependencies'] || {};
        dependenciesWithoutFramework.forEach(k => {
            r['Dependencies'][k.$.id] = versionParser.parse(k.$.version)
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

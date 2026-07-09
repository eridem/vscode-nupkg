import * as versionParser from './version-parser';
import * as profileParser from './profile-parser';

function getDependenciesWithoutFramework(metadata: any) {
    return metadata.dependencies && metadata.dependencies[0] && metadata.dependencies[0].dependency ? metadata.dependencies[0].dependency : [];
}

function getDependenciesByFramework(metadata: any) {
    return metadata.dependencies && metadata.dependencies[0] && metadata.dependencies[0].group ? metadata.dependencies[0].group : [];
}

function skipInMetadata(section: string) {
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

export function createNuGetAsText(nugetSpec: any): any {
    // r is Result object
    let r: Record<string, any> = {}

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
            r['References'] = references.map((r: any) => r.$)
        }

        // Dependencies by Framework
        if (dependencyByFrameworkKeys.length) r['Dependencies'] = r['Dependencies'] || {};
        dependencyByFrameworkKeys.forEach(k => {
            let framework = dependenciesByFramework[k];
            let frameworkName = profileParser.parse(framework.$ && framework.$.targetFramework ? framework.$.targetFramework : 'All Frameworks')
            r['Dependencies'][frameworkName] = {}
            let dependency = r['Dependencies'][frameworkName]

            if (framework.dependency) {
                framework.dependency.forEach((d: any) => dependency[d.$.id] = versionParser.parse(d.$.version))
            } else {
                r['Dependencies'][frameworkName] = `No dependencies.`
            }
        })

        // Dependencies without Framework
        if (dependenciesWithoutFramework.length) r['Dependencies'] = r['Dependencies'] || {};
        dependenciesWithoutFramework.forEach((k: any) => {
            r['Dependencies'][k.$.id] = versionParser.parse(k.$.version)
        })

        // frameworkAssemblies
        if (frameworkAssembliesKeys.length) r['Framework Assemblies'] = {};
        frameworkAssembliesKeys.forEach(k => r['Framework Assemblies'][frameworkAssemblies[k].$.targetFramework || 'All'] = frameworkAssemblies[k].$.assemblyName);
    }

    return r;
}

// smart-nupkg-metadata-reader only invokes its callback if it finds a zip
// entry ending in ".nuspec"; otherwise its internal xml2js parser's "end"
// event never fires and the callback silently never runs, hanging the
// caller forever. Check upfront so a malformed/atypical package rejects
// instead of leaving resolveCustomEditor's Promise.all pending indefinitely.
function ensureNuspecEntry(filePath: string): void {
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(filePath);
    const hasNuspec = zip.getEntries().some((e: any) => e.entryName.endsWith('.nuspec'));
    if (!hasNuspec) {
        throw new Error('No .nuspec file found inside the package.');
    }
}

export function getTextForNuPkgContents(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        var nupkgReader = require('smart-nupkg-metadata-reader');
        var yaml = require('js-yaml');
        try {
            ensureNuspecEntry(filePath);
        } catch (err) {
            return reject(err);
        }
        nupkgReader.readMetadata(filePath, function (result: any, error: any) {
            if (error) {
                return reject(error);
            }
            let yamlString = yaml.dump(createNuGetAsText(result));
            return resolve(yamlString);
        });
    });
}

// Returns the reshaped metadata object (the same structure createNuGetAsText
// produces) so the webview preview can render it as HTML instead of YAML.
export function getNuPkgMetadata(filePath: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        var nupkgReader = require('smart-nupkg-metadata-reader');
        try {
            ensureNuspecEntry(filePath);
        } catch (err) {
            return reject(err);
        }
        nupkgReader.readMetadata(filePath, function (result: any, error: any) {
            if (error) {
                return reject(error || new Error('Unable to read .nuspec metadata.'));
            }
            return resolve(createNuGetAsText(result));
        });
    });
}

function createVersion(symbol: string, number: string): string {
    number = number.replace(/[^\d\.]/gi, '')
    return `${symbol} ${number}`
}

export function parseDependencyVersion (version: string): string {
    console.log('Version to parse: ', version)
    if (!version) return ''

    if (version.startsWith('(') || version.startsWith('[')) {
        const versions = version
            .split(',')
            .map(v => v.trim())
            .map(v => {
                return v.startsWith('[') ? createVersion('>=', v) : 
                v.startsWith('(') ? createVersion('>', v)  :
                v.endsWith(']')   ? createVersion('<=', v) :
                                    createVersion('<', v)
            })
        return versions.join(' && ')
    } else {
        return createVersion('>=', version)
    }
}

module.exports = { parseDependencyVersion }

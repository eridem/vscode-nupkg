export function parse (filename: string): string {
    if (!filename) return ''

    return decodeURIComponent(filename)
}

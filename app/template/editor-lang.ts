/** Maps a file extension to a Monaco Editor language identifier. */
export function extensionToLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
        case 'json':
            return 'json'
        case 'yaml':
        case 'yml':
            return 'yaml'
        default:
            return 'plaintext'
    }
}
export interface FilePath {
    path: string |null;
    file: string |null;
}

export function fileExtension(fileName: string): string {
    const reExt = new RegExp("^.*\\.(.+)$");

    if (fileName && reExt.test(fileName)) {
        return fileName.match(reExt)[1].toLowerCase();
    }

    return null;
}

export function filePath(path: string): FilePath {
    if (path) {
        const re = new RegExp("(.*)\/(.*)?$");
        if (re.test(path)) {
            const m = path.match(re);
            return { path: m[1], file: m[2] };
        } else {
            return { path: null, file: path };
        }
    }

    return null;
}

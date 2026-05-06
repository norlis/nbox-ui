import {data, type LoaderFunctionArgs} from "react-router";
import {Repository} from "~/core/repository";
import {requireAuthCookie} from "~/core/auth";

// Proxy used by the entry sidebar to lazy-load child folders of a prefix.
// Returns only the "folder" entries (keys ending in "/") flattened into full paths.
export async function loader({request}: LoaderFunctionArgs) {
    await requireAuthCookie(request);
    const url = new URL(request.url);
    const prefix = url.searchParams.get("v");
    if (!prefix) return data<{paths: string[]}>({paths: []});

    try {
        const [entries] = await Repository.entry.retrieve(request, prefix);
        const paths = entries
            .filter(e => e.key.endsWith("/"))
            .map(e => `${e.path}/${e.key}`);
        return data<{paths: string[]}>({paths});
    } catch {
        return data<{paths: string[]}>({paths: []});
    }
}
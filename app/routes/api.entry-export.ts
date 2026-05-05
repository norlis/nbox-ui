import {type LoaderFunctionArgs} from "react-router";
import {getAuthFromRequest} from "~/core/auth";
import {BASE_URL} from "~/config/settings";

const EXT: Record<string, string> = {
    json: 'json',
    yaml: 'yaml',
    dotenv: 'env',
    ecs: 'json',
}

export async function loader({request}: LoaderFunctionArgs) {
    const url = new URL(request.url)
    const prefix = url.searchParams.get('prefix') ?? ''
    const format = url.searchParams.get('format') ?? 'json'

    const token = await getAuthFromRequest(request)

    const upstream = await fetch(
        `${BASE_URL}/api/entry/export?prefix=${encodeURIComponent(prefix)}&format=${format}`,
        {headers: {Authorization: `Bearer ${token}`}}
    )

    if (!upstream.ok) {
        return new Response('Export failed', {status: upstream.status})
    }

    const contentType = upstream.headers.get('Content-Type') ?? 'application/octet-stream'
    const filename = `export-${prefix.replace(/\//g, '-').replace(/\/$/, '') || 'entries'}.${EXT[format] ?? format}`

    return new Response(upstream.body, {
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    })
}

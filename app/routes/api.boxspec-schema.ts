import {Repository} from "~/core/repository";
import {requireAuthCookie} from "~/core/auth";
import {data, type LoaderFunctionArgs} from "react-router";

export async function loader({request}: LoaderFunctionArgs) {
    await requireAuthCookie(request);
    const url = new URL(request.url);
    const pattern = url.searchParams.get("pattern");

    if (!pattern) {
        return data({schema: {}}, {status: 400});
    }

    try {
        const result = await Repository.template.resolveSchema(pattern, request);
        return data(result);
    } catch {
        return data({schema: {}});
    }
}
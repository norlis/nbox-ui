import {BASE_URL} from "~/configuration/settings";
import {getAuthFromRequest} from "~/adapters/auth";
import {ApiError, type ProblemDetail} from "~/adapters/api";


export const Retrieve = async (request: Request, endpoint: string, content: string = "json") => {
    const token = await getAuthFromRequest(request)
    const res = await fetch(
        `${BASE_URL}${endpoint}`,
        {
            headers: {...basicAuth(token)}
        }
    );

    if (!res.ok) {
        const errorData: ProblemDetail = await res.json();
        throw new ApiError(errorData);
    }

    if (content?.includes("json")) {
        return await res.json()
    }
    return await res.text()
}


export const Post = async (request: Request, endpoint: string, data: object) => {
    const token = await getAuthFromRequest(request)

    const res = await fetch(
        `${BASE_URL}${endpoint}`,
        {
            method: "POST",
            body: JSON.stringify(data),
            headers: {...basicAuth(token)}
        }
    );

    if (!res.ok) {
        const errorData: ProblemDetail = await res.json();
        throw new ApiError(errorData);
    }

    return [await res.json(), res.status]
}


const basicAuth = (token: string | null): Record<string, string> => {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    }
}


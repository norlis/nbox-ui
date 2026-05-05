import {BASE_URL} from "~/config/settings";
import {getAuthFromRequest} from "~/core/auth";

// --- Error types ---

export interface ProblemDetail {
    type?: string;
    title: string;
    status: number;
    detail?: string;
    instance?: string;
    requestId?: string;
    timestamp: string;
    stackTrace?: string;
}

export class ApiError extends Error {
    public readonly status: number;
    public readonly problemDetail: ProblemDetail;

    constructor(problemDetail: ProblemDetail) {
        super(problemDetail.detail || problemDetail.title);
        this.name = 'ApiError';
        this.status = problemDetail.status;
        this.problemDetail = problemDetail;
    }
}

// --- HTTP client ---

export const Retrieve = async (request: Request, endpoint: string, content: string = "json") => {
    const token = await getAuthFromRequest(request)
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {...basicAuth(token)}
    });

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

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {...basicAuth(token)}
    });

    if (!res.ok) {
        const errorData: ProblemDetail = await res.json();
        throw new ApiError(errorData);
    }

    return [await res.json(), res.status]
}

const basicAuth = (token: string | null): Record<string, string> => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
})

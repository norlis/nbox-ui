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
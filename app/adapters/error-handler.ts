import {ApiError} from "~/adapters/api";


export const withApiErrorHandler = <A extends any[], R>(
    fn: (...args: A) => Promise<R>
) => {
    return async (...args: A): Promise<R> => {
        try {
            return await fn(...args);
        } catch (error) {
            if (error instanceof ApiError) {
                console.error(`API Error: ${error.status} - ${error.problemDetail.title}`, error.problemDetail);

                throw new Response(error.problemDetail.detail || error.problemDetail.title, {
                    status: error.status,
                });
            }

            console.error("Internal Error:", error);
            throw new Response("Internal Error.", {
                status: 500,
            });
        }
    };
};
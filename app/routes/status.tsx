import type {HeadersFunction} from "react-router";

export const headers: HeadersFunction = () => ({
    "Content-Type": "application/html; charset=utf-8",
});


export async function loader() {
    return new Response("HEALTHY", { status: 200 });
}
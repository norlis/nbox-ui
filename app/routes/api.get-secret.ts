import {Repository} from "~/adapters";
import {requireAuthCookie} from "~/adapters/auth";
import {data, type LoaderFunctionArgs} from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
    await requireAuthCookie(request);
    const url = new URL(request.url);
    const keyPath = url.searchParams.get("keyPath");

    if (!keyPath) {
        return data({ error: "keyPath es requerido" }, { status: 400 });
    }

    try {
        const secretEntry = await Repository.entry.retrieveSecret(keyPath, request);
        return data(secretEntry);
    } catch (error) {
        return data({ error: "Falló la obtención del secreto" }, { status: 500 });
    }
}
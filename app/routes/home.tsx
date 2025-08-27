import type {Route} from "./+types/home";
import {useEffect} from "react";
import {useLayout} from "~/context/layout-context";
import type {LoaderFunctionArgs} from "react-router";
import {requireAuthCookie} from "~/adapters/auth";

export function meta({}: Route.MetaArgs) {
    return [
        {title: "nbox (^.^)"},
        {name: "description", content: "Welcome to nbox!"},
    ];
}

export async function loader({request}: LoaderFunctionArgs) {
    return await requireAuthCookie(request)
}

export default function home() {
    const {setHeaderActions, setCurrentPath, setSidebar} = useLayout();

    useEffect(() => {
        setHeaderActions("")
        setCurrentPath("")
        setSidebar(null)
    }, [setHeaderActions, setCurrentPath, setSidebar]);

    return (
        <div className="h-[90vh] flex flex-col items-center justify-center">
            <h1 className="text-5xl font-bold">
                Welcome to nbox!
            </h1>
            <p className="text-xl text-amber-500">
                templates | environments vars | secrets
            </p>
        </div>
    )
}

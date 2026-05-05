import {redirectIfLoggedInLoader, setAuthOnResponse} from "~/core/auth";
import {Button} from "../components/ui/button";
import {Input} from "../components/ui/input";
import {Label} from "../components/ui/label";
import {BASE_URL} from "~/config/settings";
import {data, Form, type LoaderFunctionArgs, redirect, useActionData} from "react-router";
import type {Route} from "../../.react-router/types/app/routes/+types/home";


async function login(username: string, password: string) {
    const res = await fetch(
        `${BASE_URL}/api/auth/token`,
        {
            method: "POST",
            body: JSON.stringify({username: username, password: password}),
            headers: {'Content-Type': 'application/json',}
        }
    )

    if (!res.ok) {
        return ""
    }
    const {token} = await res.json()
    return token
}

function validate(username: string, password: string) {
    const errors: { username?: string; password?: string } = {};

    if (!username) {
        errors.username = "user is required.";
    }

    if (!password) {
        errors.password = "Password is required.";
    }

    return Object.keys(errors).length ? errors : null;
}


export const loader = redirectIfLoggedInLoader;

export const meta = () => {
    return [{title: "nbox login"}];
};

export async function action({request}: LoaderFunctionArgs) {
    const formData = await request.formData();
    const username = String(formData.get("username") || "");
    const password = String(formData.get("password") || "");

    const errors = validate(username, password);
    if (errors) {
        return data({ok: false, errors}, 400);
    }

    const token = await login(username, password);
    if (token === "") {
        return data(
            {ok: false, errors: {password: "Invalid credentials"}},
            400,
        );
    }

    const response = redirect("/");
    return setAuthOnResponse(response, token);
}

export default function Signup() {
    const actionResult = useActionData<typeof action>();

    return (
        <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 p-8 bg-slate-900 border-4 border-yellow-400 shadow-[8px_8px_0px_0px_rgba(234,179,8,1)] transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="w-full max-w-sm">

                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-3 mb-6 group">
                            <h1 className="text-2xl font-bold text-yellow-500 transition-all duration-300 group-hover:text-yellow-400">
                                nbox
                            </h1>
                        </div>
                    </div>

                    {actionResult?.errors && (
                        <div role="alert" aria-live="assertive" className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Invalid credentials.
                            </p>
                        </div>
                    )}

                    <Form className="space-y-8 animate-slide-up" method="post">
                        <div className="space-y-6">
                            <div className="space-y-3 group">
                                <Label
                                    htmlFor="username"
                                    className="text-slate-300 text-sm font-medium tracking-wide transition-colors duration-300 group-focus-within:text-yellow-500"
                                >
                                    USERNAME
                                </Label>
                                <Input
                                        id="username"
                                        name="username"
                                        type="text"
                                        className={`bg-transparent border-0 border-b-2 text-white placeholder:text-slate-500 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-0 py-3 text-lg transition-colors duration-200 ${
                                            actionResult?.errors ? "border-red-500" : "border-slate-700 focus:border-yellow-500"
                                        }`}
                                        placeholder="username"
                                    />
                            </div>

                            <div className="space-y-3 group">
                                <Label
                                    htmlFor="password"
                                    className="text-slate-300 text-sm font-medium tracking-wide transition-colors duration-300 group-focus-within:text-yellow-500"
                                >
                                    PASSWORD
                                </Label>
                                <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        className={`bg-transparent border-0 border-b-2 text-white placeholder:text-slate-500 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-0 py-3 text-lg transition-colors duration-200 ${
                                            actionResult?.errors ? "border-red-500" : "border-slate-700 focus:border-yellow-500"
                                        }`}
                                        placeholder="password"
                                    />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-transparent border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-slate-950 font-medium h-12 rounded-none transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25 disabled:scale-100"
                        >
                            LOGIN
                        </Button>
                    </Form>

                </div>

            </div>

        </>
    );
}
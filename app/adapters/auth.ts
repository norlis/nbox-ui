import {decodeJwt, type JWTPayload} from "jose";
import {createCookie, type LoaderFunctionArgs, redirect} from "react-router";

type Claims = JWTPayload & {
    username: string
}

let secret = process.env.COOKIE_SECRET || "default";
if (secret === "default") {
    console.warn(
        "🚨 No COOKIE_SECRET environment variable set, using default. The app is insecure in production.",
    );
    secret = "default-secret";
}

const cookie = createCookie("token", {
    secrets: [secret],
    // 1 day
    maxAge: 24 * 60 * 60,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
});

export async function getAuthFromRequest(
    request: Request,
): Promise<string | null> {
    if (!request) return null
    const token = await cookie.parse(request.headers.get("Cookie"));
    return token ?? null;
}

export async function setAuthOnResponse(
    response: Response,
    token: string,
): Promise<Response> {
    const header = await cookie.serialize(token);
    response.headers.append("Set-Cookie", header);
    return response;
}

export async function requireAuthCookie(request: Request) {
    const token = await getAuthFromRequest(request);
    if (!token) {
        throw redirect("/login", {
            headers: {
                "Set-Cookie": await cookie.serialize("", {
                    maxAge: 0,
                }),
            },
        });
    }
    return token;
}

export async function redirectIfLoggedInLoader({ request }: LoaderFunctionArgs) {
    const token = await getAuthFromRequest(request);
    if (token) {
        throw redirect("/");
    }
    return null;
}

export async function redirectWithClearedCookie(): Promise<Response> {
    return redirect("/", {
        headers: {
            "Set-Cookie": await cookie.serialize(null, {
                expires: new Date(0),
            }),
        },
    });
}

export async function decodeToken(token: string | null): Promise<Claims | null> {
    if (!token) return null
    try {
        return decodeJwt<Claims>(token)
    } catch (error) {
        return null
    }
}
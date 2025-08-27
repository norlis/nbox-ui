import {index, route, type RouteConfig} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("logout", "routes/logout.ts"),
    route("status", "routes/status.tsx"),
    route("entry", "routes/entry.tsx"),
    route("api/entry", "routes/api.entry.ts"),
    route("api/get-secret", "routes/api.get-secret.ts"),

    route("template", "routes/template/index.tsx", [
        route(":service/:stage/:template", "routes/template/template.tsx") ,
        route(":service?/new", "routes/template/create.tsx") ,
        route(":service/:stage/:template/build", "routes/template/build.tsx") ,
    ])
] satisfies RouteConfig;

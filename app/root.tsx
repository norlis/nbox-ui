import {
  data,
  isRouteErrorResponse,
  Links,
  type LoaderFunctionArgs,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type {Route} from "./+types/root";
import "./app.css";
import type {ReactNode} from "react";
import {Toaster} from "~/components/ui/sonner";
import {LayoutProvider} from "~/context/layout-context";
import {TreeProvider} from "~/context/tree-context";
import {MainLayout} from "~/components/layout/main-layout";
import {decodeToken, getAuthFromRequest} from "~/adapters/auth";
import {GlobalLoading} from "~/components/global-loading";


export async function loader({ request }: LoaderFunctionArgs) {
  const token = await getAuthFromRequest(request);
  const claims = await decodeToken(token)
  return data(claims)
}



export function meta({}: Route.MetaArgs) {
  return [
    { title: "nbox" },
    { name: "description", content: "Welcome to nbox!" },
  ];
}

export const links: Route.LinksFunction = () => [
  {
    rel: "icon",
    href: "/favicon.png",
    type: "image/png",
  },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap",
  },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <GlobalLoading />
        <ScrollRestoration />
        <Toaster  richColors theme="dark" position="top-right" closeButton />
        <Scripts />
      </body>
    </html>
  );
}

export default function App(){
  const claims = useLoaderData<typeof loader>();

  return (
      <LayoutProvider>
         <TreeProvider >
           <MainLayout username={claims?.username || ""}>
            <Outlet/>
           </MainLayout>
         </TreeProvider>
       </LayoutProvider>

  )
}
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

import {redirectWithClearedCookie} from "~/adapters/auth";

export function loader(){
    return redirectWithClearedCookie();
}


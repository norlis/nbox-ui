import {redirectWithClearedCookie} from "~/core/auth";

export function loader(){
    return redirectWithClearedCookie();
}


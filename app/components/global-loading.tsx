import {useNavigation} from "react-router";
import {cx} from "class-variance-authority";
import {Loader} from "lucide-react";

function GlobalLoading() {
    const navigation = useNavigation();
    const active = navigation.state !== "idle";

    return (
        <div
            role="progressbar"
            aria-valuetext={active ? "Loading" : undefined}
            aria-hidden={!active}
            className={cx(
                "fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50",
                active ? "translate-y-0" : "translate-y-full"
            )}
        >
            <Loader className="h-12 w-12 animate-spin text-yellow-500"/>
            <span className="sr-only">Cargando...</span>
        </div>
    );
}

export {GlobalLoading};
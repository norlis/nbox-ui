import {AlertTriangle} from "lucide-react";


type FunErrorProps = {
    type?: "unknown" | "known"
    title?: string
    message: string
}


export function FunError({title, message} :FunErrorProps){

    return (
        <div className="min-h-screen flex items-center justify-center p-4 ">
        <div className="w-full text-center space-y-6">
            <div className="flex justify-center">
                <AlertTriangle className={`h-16 w-16 text-orange-400`} />
            </div>

            <div className="space-y-3">
                {title && (<h1 className="text-xl font-semibold text-white">{title}</h1>)}
                <p className="text-gray-300 text-xl animate-pulse">{message}</p>
            </div>
        </div>
    </div>
    )
}

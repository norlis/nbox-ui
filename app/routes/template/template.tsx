import {
    type ActionFunctionArgs,
    data,
    Form, isRouteErrorResponse,
    Link,
    type LoaderFunctionArgs,
    redirect,
    useActionData,
    useLoaderData,
    useNavigation,
} from "react-router";
import {useEffect, useRef, useState} from "react";
import {toast} from "sonner";
import {Button} from "../../components/ui/button";
import {Ban, Pencil, Play, SaveAll} from "lucide-react";
import {cn} from "~/core/utils";
import {Repository} from "~/core/repository";
import {useLayout} from "~/layout/layout.context";
import type {Route} from "./+types/template";
import {FunError} from "../../components/ui/error";
import {TemplateEditor} from "~/template/components/template-editor";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    if (isRouteErrorResponse(error)) {
        return (
            <FunError message={error.data} type={"known"}/>
        );
    }
    return (
        <FunError message={error instanceof Error ? error.message : "Unknown Error"} />
    );
}

export const action = async ({request, params}: ActionFunctionArgs) => {
    const formData = await request.formData();
    const template = formData.get("template")

    const {stage, service, template: templateName} = params

    if (typeof template !== "string") throw new Error('template is empty')
    if (typeof stage !== "string") throw new Error('stage is empty')
    if (typeof service !== "string") throw new Error('service is empty')
    if (typeof templateName !== "string") throw new Error('templateName is empty')

    const response = await Repository.template.upsert({
        template,
        stage,
        service,
        templateName,
    }, request)

    const [path, result] = Object.entries(response ?? {})[0] ?? []
    if (!path || !result) return redirect(`/template`)

    if (!result.valid) {
        return data({ errors: result.errors ?? [], kind: result.kind })
    }

    const [serviceSaved, stageSaved, templateSaved] = path.split("/")
    return redirect(`/template/${serviceSaved}/${stageSaved}/${templateSaved}`, {})

}

export async function loader({request, params}: LoaderFunctionArgs) {
    if (typeof params.template !== "string") throw new Error('template is empty')
    if (typeof params.stage !== "string") throw new Error('stage is empty')
    if (typeof params.service !== "string") throw new Error('service is empty')

    const {service, stage, template} = params
    const result = await Repository.template.retrieve({service, stage, template}, request)
    return data<{ template: string, service: string | undefined, stage: string | undefined, templateName: string | undefined}>({
        template: result, service, stage, templateName: template
    })
}


export default function TemplateRoute() {
    const {template = "", templateName = "", stage, service} = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const wasSubmitting = useRef(false);
    const [isEditable, setEditable] = useState<boolean>(false)

    const [templateChange, setTemplateChange] = useState<string>(template)
    const {setHeaderActions, setCurrentPath} = useLayout();

    useEffect(() => {
        if (navigation.state === 'submitting') {
            wasSubmitting.current = true;
        }
        if (navigation.state === 'idle' && wasSubmitting.current) {
            wasSubmitting.current = false;
            if (actionData?.errors?.length) {
                actionData.errors.forEach((e: { path: string; message: string }) => {
                    toast.error(`${e.path}: ${e.message}`)
                })
            } else {
                setEditable(false);
            }
        }
    }, [navigation.state, actionData]);

    useEffect(() => {
        setHeaderActions(
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditable(prev => !prev)}
                    className={cn("border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-yellow-300", isEditable ? 'bg-slate-700 text-orange-400' : '')}
                >
                    {!isEditable ?
                        <Pencil className="mr-1 h-4 w-4"/> :
                        <Ban className="mr-1 h-4 w-4"/>
                    }
                </Button>

                <div className="h-8 w-px bg-slate-600 mx-1"/>

                <Button asChild
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-yellow-300"
                >
                    <Link to={`/template/${service}/${stage}/${templateName}/build`} target="_blank" rel="noopener noreferrer">
                        <Play className="mr-1 h-4 w-4"/>
                    </Link>
                </Button>
            </div>
        )
        setCurrentPath(`${service}/${stage}/${templateName}`);


        return () => {
            setHeaderActions(null);
            setCurrentPath( "");
        };
    }, [isEditable, service, setCurrentPath, setHeaderActions, stage, templateName])

    return (
        <div className="flex flex-col h-full">

            <div className="flex  w-full space-x-1  shadow-lg mb-1">
                <Form method="post" className="w-full">
                    <div className="flex w-full justify-end items-center gap-2 text-sm">

                        {isEditable && (
                            <div className="text-slate-400 mr-6">
                                <div className="text-yellow-400 animate-pulse flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                                </div>
                            </div>
                        )}
                        <Button size="sm" disabled={!isEditable} variant="outline" type="submit"
                                      className={cn("bg-gray-900/50 hover:bg-gray-600 border-gray-700", isEditable ? 'text-orange-400' : '')}>

                            <SaveAll className="mr-2 h-4 w-4"/>
                            <span>Save</span>
                        </Button>
                    </div>
                    <input type="hidden" value={templateChange} name="template" readOnly/>
                </Form>
            </div>

            <div className="flex justify-between  w-full space-x-2 p-3 shadow-lg mb-4">
                <div className="flex flex-col flex-auto">
                    <TemplateEditor
                        value={template}
                        filename={templateName}
                        readOnly={!isEditable}
                        onChange={setTemplateChange}
                    />
                </div>
            </div>

        </div>
    )
}
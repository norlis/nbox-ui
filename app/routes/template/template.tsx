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
import {lazy, Suspense, useEffect, useRef, useState} from "react";
import {toast} from "sonner";
import {Button} from "~/components/ui/button";
import {Ban, FileDiff, Pencil, Play, SaveAll} from "lucide-react";
import {cn} from "~/core/utils";
import {Repository} from "~/core/repository";
import {useLayout} from "~/layout/layout.context";
import type {Route} from "./+types/template";
import {FunError} from "~/components/ui/error";
import {TemplateMetadataBar} from "~/template/components/template-metadata-bar";
import type {TemplateMetadata} from "~/template/template.types";
const TemplateEditor = lazy(() =>
    import("~/template/components/template-editor").then(m => ({default: m.TemplateEditor}))
);

const EditorFallback = () => (
    <div className="border border-gray-900 bg-neutral-900 w-full h-[75vh] animate-pulse"/>
);

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
    const [content, stageData] = await Promise.all([
        Repository.template.retrieve({service, stage, template}, request),
        Repository.template.retrieveStage(service, stage, request),
    ])
    return data<{
        template: string,
        templateName: string,
        metadata: TemplateMetadata | null,
        service: string,
        stage: string,
    }>({
        template: content,
        templateName: stageData.template.name,
        metadata: stageData.metadata ?? null,
        service,
        stage,
    })
}


export default function TemplateRoute() {
    const {template = "", templateName = "", metadata = null, stage, service} = useLoaderData<typeof loader>();
    // Backend returns `template.name` as full S3 path (e.g. "service/stage/file.json").
    // Strip the prefix so breadcrumbs/headers don't duplicate service/stage.
    const templateFile = templateName.split('/').pop() ?? templateName
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

                <Button
                    size="sm"
                    type="submit"
                    form="template-save-form"
                    disabled={!isEditable}
                    variant="outline"
                    className={cn("border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-yellow-300", isEditable ? 'text-orange-400' : '')}
                >
                    <SaveAll className="mr-1 h-4 w-4"/>
                </Button>

                <div className="h-8 w-px bg-slate-600 mx-1"/>

                <Button asChild
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-yellow-300"
                >
                    <Link to={`/template/diff?a=${service}/${stage}`}>
                        <FileDiff className="mr-1 h-4 w-4"/>
                    </Link>
                </Button>

                <Button asChild
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-yellow-300"
                >
                    <Link to={`/template/${service}/${stage}/${templateFile}/build`} target="_blank" rel="noopener noreferrer">
                        <Play className="mr-1 h-4 w-4"/>
                    </Link>
                </Button>
            </div>
        )
        setCurrentPath(`${service}/${stage}/${templateFile}`);


        return () => {
            setHeaderActions(null);
            setCurrentPath( "");
        };
    }, [isEditable, service, setCurrentPath, setHeaderActions, stage, templateFile])

    return (
        <div className="flex flex-col h-full">

            <Form method="post" id="template-save-form">
                <input type="hidden" value={templateChange} name="template" readOnly/>
            </Form>

            <div className="px-3">
                <TemplateMetadataBar metadata={metadata}/>
            </div>

            <div className="flex justify-between  w-full space-x-2 p-3 shadow-lg mb-4">
                <div className="flex flex-col flex-auto">
                    <Suspense fallback={<EditorFallback/>}>
                        <TemplateEditor
                            value={template}
                            filename={templateName}
                            readOnly={!isEditable}
                            onChange={setTemplateChange}
                        />
                    </Suspense>
                </div>
            </div>

        </div>
    )
}
import {
    type ActionFunctionArgs,
    data,
    Form, isRouteErrorResponse,
    Link,
    type LoaderFunctionArgs,
    redirect,
    useLoaderData,
    useRouteError
} from "react-router";
// import {ClientOnly} from "remix-utils/client-only"
import {Editor, type OnMount} from "@monaco-editor/react";
import {type FC, useEffect, useRef, useState} from "react";
import {Button} from "~/components/ui/button";
import {Ban, Braces, Pencil, Play, SaveAll} from "lucide-react";
import {cn} from "~/lib/utils";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "~/components/ui/sheet";
import {Repository} from "~/adapters";
import {useLayout} from "~/context/layout-context";
import type {Route} from "./+types/template";
import {FunError} from "~/components/error";

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

    const [res, err] = await Repository.template.upsert({
        template,
        stage: stage,
        service: service,
        templateName: templateName
    }, request)


    if (err !== null) {
        throw err
    }

    if (res.length === 0) return redirect(`/template`)

    const [serviceSaved, stageSaved, templateSaved] = res[0].split("/")
    return redirect(`/template/${serviceSaved}/${stageSaved}/${templateSaved}`, {})

}

export async function loader({request, params}: LoaderFunctionArgs) {
    if (typeof params.template !== "string") throw new Error('template is empty')
    if (typeof params.stage !== "string") throw new Error('stage is empty')
    if (typeof params.service !== "string") throw new Error('service is empty')

    const {service, stage, template} = params
    const result = await Repository.template.retrieve({service, stage, template}, request)
    const vars = await Repository.template.vars({service, stage, template}, request)
    return data<{ template: string, vars: string[], service: string | undefined, stage: string | undefined, templateName: string | undefined}>({
        template: result, vars, service, stage, templateName: template
    })
}


const Vars: FC<{ vars: string[] }> = ({vars= []}) => (
    <Sheet>
        <SheetTrigger>
            <Button variant="outline" className="ml-4 bg-gray-900/50 border-gray-700 hover:bg-gray-600">
                <Braces className="mr-2 h-4 w-4"/> Show vars
            </Button>
        </SheetTrigger>
        <SheetContent className="border border-gray-900 bg-neutral-900 w-[500px]">
            <SheetHeader>
                <SheetTitle>templates vars</SheetTitle>
                {vars?.map(v =>
                    <p key={v}>{v}</p>
                )}
            </SheetHeader>
        </SheetContent>
    </Sheet>
)

export default function TemplateRoute() {
    const {template = "", vars = [], templateName, stage, service} = useLoaderData<typeof loader>();
    const editorRef = useRef<any>(null)
    const [isEditable, setEditable] = useState<boolean>(false)

    const [templateChange, setTemplateChange] = useState<string>("")
    const {setHeaderActions, setCurrentPath} = useLayout();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(typeof window !== 'undefined');
    }, []);

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor
    }

    const handleEditorChange = (value: string | undefined) => {
        const newValue = value || ''
        setTemplateChange(newValue)
    }

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
                {/*<Vars vars={vars} />*/}
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
                    <input type="hidden" defaultValue={templateChange} name="template"/>
                </Form>
            </div>

            <div className="flex justify-between  w-full space-x-2 p-3 shadow-lg mb-4">
                <div className="flex flex-col flex-auto">
                        {isClient && (
                            <div className="border border-gray-900 bg-neutral-900 w-full h-[75vh] flex flex-col">
                                <div className="flex-grow border rounded-md overflow-hidden border-gray-700">
                                    <Editor
                                        height="100%"
                                        width="100%"
                                        language="json"
                                        theme={"vs-dark"}
                                        value={template}
                                        onChange={handleEditorChange}
                                        onMount={handleEditorDidMount}
                                        options={{
                                            minimap: {enabled: false},
                                            fontSize: 14,
                                            wordWrap: 'on',
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            readOnly: !isEditable,
                                            cursorStyle: 'block'
                                        }}
                                    /></div>
                            </div>
                        )}
                </div>
            </div>

        </div>
    )
}
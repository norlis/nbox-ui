import {
    type ActionFunctionArgs,
    data,
    Form,
    type LoaderFunctionArgs,
    redirect,
    useActionData,
    useLoaderData,
    useRouteError,
} from "react-router";

import type {BoxSpec} from "~/template/template.types";
import {Button} from "~/components/ui/button";
import {Save} from "lucide-react";
import {useEffect, useState} from "react";
import {Input} from "~/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "~/components/ui/select";
import {Repository} from "~/core/repository";
import {useLayout} from "~/layout/layout.context";
import {toast} from "sonner";
import {TemplateEditor} from "~/template/components/template-editor";


export function ErrorBoundary() {
    const error = useRouteError();
    console.error(error)
    return <div>Internal Error</div>;
}

export const action = async ({request}: ActionFunctionArgs) => {
    const formData = await request.formData();
    const template = formData.get("template")
    const stage = formData.get("stage")
    const service = formData.get("service")
    const templateName = formData.get("templateName")

    if (typeof template !== "string") throw new Error('template is empty')
    if (typeof stage !== "string") throw new Error('stage is empty')
    if (typeof service !== "string") throw new Error('service is empty')
    if (typeof templateName !== "string" || !templateName) throw new Error('templateName is empty')

    const response = await Repository.template.upsert(
        {template, stage, service, templateName},
        request
    )

    const [path, result] = Object.entries(response ?? {})[0] ?? []
    if (!path || !result) return redirect(`/template`)

    if (!result.valid) {
        return data({ errors: result.errors ?? [], kind: result.kind })
    }

    const [serviceSaved, stageSaved, templateSaved] = path.split("/")
    return redirect(`/template/${serviceSaved}/${stageSaved}/${templateSaved}`, {})
}


export async function loader({request, params}: LoaderFunctionArgs) {
    const [stages, specs, allowedExtensions] = await Promise.all([
        Repository.template.stages(request),
        Repository.template.specs(request).catch(() => [] as BoxSpec[]),
        Repository.template.allowedExtensions(request).catch(() => [] as string[]),
    ])
    const {service = ""} = params

    return data({service, stages, specs, allowedExtensions})
}

export default function NewTemplate() {
    const {stages = [], specs = [], allowedExtensions = [], service} = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();

    const [template, setTemplate] = useState<string>("")
    const [templateName, setTemplateName] = useState<string>("")
    const [selectedSpec, setSelectedSpec] = useState<string>("")

    const {setHeaderActions, setCurrentPath} = useLayout();

    useEffect(() => {
        if (actionData?.errors?.length) {
            actionData.errors.forEach((e: { path: string; message: string }) => {
                toast.error(`${e.path}: ${e.message}`)
            })
        }
    }, [actionData]);

    useEffect(() => {
        return () => {
            setHeaderActions(null);
            setCurrentPath(service || "new template");
        };
    }, [service, setHeaderActions, setCurrentPath])

    const handleSpecChange = (specId: string) => {
        setSelectedSpec(specId)
        if (specId === '__custom__') {
            setTemplateName('')
            return
        }
        const spec = specs.find(s => s.id === specId)
        if (spec?.matchPatterns?.[0]) {
            // Use first pattern as suggestion, strip glob wildcards
            const suggested = spec.matchPatterns[0].replace(/\*/g, '')
            setTemplateName(suggested)
        }
    }

    return (
            <Form method="post">
                <input type="hidden" name="template" value={template}/>
                <input type="hidden" name="templateName" value={templateName}/>
                <div className="flex justify-between items-center w-full space-x-2 p-3 shadow-lg mb-4">

                    <div className="flex flex-1 flex-row items-center gap-4">
                        <Input type="text" name="service" placeholder="service name"
                               defaultValue={service}
                               className="flex-1 min-w-0 bg-gray-700/50 border focus:border-gray-600 border-gray-500 rounded-md"/>

                        <Select name="stage">
                            <SelectTrigger className="flex-1 min-w-0 bg-slate-900">
                                <SelectValue placeholder="Select stage"/>
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700/60 border-gray-700 rounded-md text-white">
                                <SelectGroup className="bg-gray-700/60">
                                    <SelectLabel>Stages</SelectLabel>
                                    {stages.map(stage =>
                                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                                    )}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Select value={selectedSpec} onValueChange={handleSpecChange}>
                            <SelectTrigger className="flex-1 min-w-0 bg-slate-900">
                                <SelectValue placeholder="Select spec type"/>
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700/60 border-gray-700 rounded-md text-white">
                                <SelectGroup className="bg-gray-700/60">
                                    <SelectLabel>Spec Types</SelectLabel>
                                    {specs.map(spec =>
                                        <SelectItem key={spec.id} value={spec.id}>
                                            {spec.name}
                                        </SelectItem>
                                    )}
                                    <SelectItem value="__custom__">Custom file</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                        <Input type="text"
                               placeholder="filename (e.g. task-definition.json)"
                               value={templateName}
                               onChange={(e) => setTemplateName(e.target.value)}
                               className="flex-1 min-w-0 bg-gray-700/50 border focus:border-gray-600 border-gray-500 rounded-md"/>
                    </div>

                    <Button type="submit"
                            className="border ml-6 border-gray-600 rounded-md hover:bg-gray-600 hover:text-orange-400">
                        <Save className="mr-2 h-4 w-4"/> Save
                    </Button>
                </div>

                <TemplateEditor
                    value={template}
                    filename={templateName}
                    onChange={setTemplate}
                />

            </Form>
    )
}
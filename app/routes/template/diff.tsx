import {data, isRouteErrorResponse, type LoaderFunctionArgs, useLoaderData, useNavigate} from "react-router"
import {lazy, Suspense, useEffect} from "react"
import {requireAuthCookie} from "~/core/auth"
import {Repository} from "~/core/repository"
import {useLayout} from "~/layout/layout.context"
import type {Box, TemplateMetadata} from "~/template/template.types"
import {TemplateMetadataBar} from "~/template/components/template-metadata-bar"
import {TemplateSidePicker} from "~/template/components/template-side-picker"
import type {Route} from "./+types/diff"
import {FunError} from "~/components/ui/error"

const TemplateDiffViewer = lazy(() =>
    import("~/template/components/template-diff-viewer").then(m => ({default: m.TemplateDiffViewer}))
)

const DiffFallback = () => (
    <div className="border border-gray-900 bg-neutral-900 w-full h-full animate-pulse"/>
)

export function ErrorBoundary({error}: Route.ErrorBoundaryProps) {
    if (isRouteErrorResponse(error)) {
        return <FunError message={error.data} type={"known"}/>
    }
    return <FunError message={error instanceof Error ? error.message : "Unknown Error"}/>
}

type Side = {service: string, stage: string} | null

function parseSide(raw: string | null): Side {
    if (!raw) return null
    const [service, stage] = raw.split("/")
    if (!service || !stage) return null
    return {service, stage}
}

function encodeSide(side: Side): string | null {
    return side ? `${side.service}/${side.stage}` : null
}

type SideData = {
    metadata: TemplateMetadata | null
    filename: string
    content: string
} | null

async function loadSide(side: Side, boxes: Box[], request: Request): Promise<SideData> {
    if (!side) return null
    const stage = boxes.find(b => b.service === side.service)?.stage[side.stage]
    if (!stage) return null
    const filename = stage.template.name.split('/').pop() ?? stage.template.name
    const content = await Repository.template.retrieve(
        {service: side.service, stage: side.stage, template: filename},
        request,
    )
    return {
        metadata: stage.metadata ?? null,
        filename,
        content,
    }
}

export async function loader({request}: LoaderFunctionArgs) {
    await requireAuthCookie(request)
    const url = new URL(request.url)
    const a = parseSide(url.searchParams.get("a"))
    const b = parseSide(url.searchParams.get("b"))

    const boxes = await Repository.template.templates(request)
    const [sideA, sideB] = await Promise.all([
        loadSide(a, boxes, request),
        loadSide(b, boxes, request),
    ])

    return data<{
        boxes: Box[],
        a: Side,
        b: Side,
        sideA: SideData,
        sideB: SideData,
    }>({boxes, a, b, sideA, sideB})
}

export default function TemplateDiff() {
    const {boxes, a, b, sideA, sideB} = useLoaderData<typeof loader>()
    const navigate = useNavigate()
    const {setCurrentPath, setSidebarCollapsed, restoreSidebarPreference} = useLayout()

    useEffect(() => {
        setCurrentPath("template / diff")
        return () => setCurrentPath("")
    }, [setCurrentPath])

    // Diff needs horizontal real estate; collapse the sidebar while this view is mounted.
    // The user can still expand it manually via the toggle; on leave we restore their preference.
    useEffect(() => {
        setSidebarCollapsed(true)
        return () => restoreSidebarPreference()
    }, [setSidebarCollapsed, restoreSidebarPreference])

    function update(side: 'a' | 'b', value: {service: string, stage: string}) {
        const next = {a, b}
        next[side] = value.service && value.stage ? value : null
        const params = new URLSearchParams()
        const aRaw = encodeSide(next.a)
        const bRaw = encodeSide(next.b)
        if (aRaw) params.set('a', aRaw)
        if (bRaw) params.set('b', bRaw)
        const qs = params.toString()
        navigate(qs ? `/template/diff?${qs}` : `/template/diff`)
    }

    const filename = sideA?.filename ?? sideB?.filename ?? ''
    const bothSelected = Boolean(sideA && sideB)

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <TemplateSidePicker
                        label="template 1"
                        boxes={boxes}
                        service={a?.service ?? null}
                        stage={a?.stage ?? null}
                        onChange={(v) => update('a', v)}
                    />
                    {sideA && <TemplateMetadataBar metadata={sideA.metadata}/>}
                </div>
                <div className="flex flex-col gap-2">
                    <TemplateSidePicker
                        label="template 2"
                        boxes={boxes}
                        service={b?.service ?? null}
                        stage={b?.stage ?? null}
                        onChange={(v) => update('b', v)}
                    />
                    {sideB && <TemplateMetadataBar metadata={sideB.metadata}/>}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {bothSelected ? (
                    <Suspense fallback={<DiffFallback/>}>
                        <TemplateDiffViewer
                            original={sideA!.content}
                            modified={sideB!.content}
                            filename={filename}
                        />
                    </Suspense>
                ) : (
                    <div className="flex items-center justify-center h-full border border-dashed border-slate-700 rounded-md text-slate-400 text-sm">
                        Select service + stage on both sides to compare.
                    </div>
                )}
            </div>
        </div>
    )
}
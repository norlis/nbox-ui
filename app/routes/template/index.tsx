import {
    data,
    Link,
    type LoaderFunctionArgs,
    Outlet,
    useLoaderData,
    useLocation,
    useParams,
    useRouteError
} from "react-router";
import {type Box} from "~/domain/box";
import {Accordion, AccordionItem, AccordionTrigger} from "~/components/ui/accordion";
import {AccordionContent} from "@radix-ui/react-accordion";
import {useEffect, useMemo, useState} from "react";
import {File, Folder, Plus} from "lucide-react";
import {cn} from "~/lib/utils";
import {requireAuthCookie} from "~/adapters/auth";
import {Repository} from "~/adapters";
import {useLayout} from "~/context/layout-context";
import {TemplateFilter} from "~/components/template/template-filter";
import {Badge} from "~/components/ui/badge";
import {Button} from "~/components/ui/button";

export function ErrorBoundary() {
    const error = useRouteError();
    console.error(error)
    return <div>Internal Error</div>;
}

export async function loader({request}: LoaderFunctionArgs) {
    await requireAuthCookie(request)

    const boxes = await Repository.template.templates(request)
    return data<{ boxes: Box[] }>({boxes})
}

export default function TemplateRoute() {
    const {boxes = []} = useLoaderData<typeof loader>();
    const params = useParams()
    const location = useLocation();
    // const [defaultOpenItems, setDefaultOpenItems] = useState(params.service)

    const [searchTerm, setSearchTerm] = useState("")

    const {setSidebar, setHeaderActions} = useLayout();

    const filteredAndSortedData = useMemo(() => {
        const filtered = boxes.filter((item) => {
            const serviceMatch = item.service.toLowerCase().includes(searchTerm.toLowerCase())
            const stageMatch = Object.keys(item.stage).some((stage) => stage.toLowerCase().includes(searchTerm.toLowerCase()))
            return serviceMatch || stageMatch
        })

        return filtered.sort((a, b) => a.service.localeCompare(b.service))
    }, [boxes, searchTerm])


    useEffect(() => {
        const sidebarComponent = (
            <div className="w-full h-screen bg-slate-900 border-r border-slate-700  flex flex-col">
                <div className="flex-shrink-0 p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Folder className="h-5 w-5 text-blue-400" />
                            <h1 className="text-xl font-semibold text-slate-100">templates</h1>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-200 hover:bg-slate-700 bg-transparent"
                        >
                            {/*<Plus className="h-4 w-4" />*/}
                            <Link to={params?.service ? `/template/${params?.service}/new` :`/template/new`}>
                                <Plus className={cn("h-4 w-4 font-bold hover:text-orange-400 ", location.pathname === "/template/new" ? "text-orange-400" : "")} />
                            </Link>
                        </Button>
                    </div>
                    <TemplateFilter searchTerm={searchTerm} onSearchChange={setSearchTerm}/>
                </div>


                {/* Scrollable content area */}
                <div className="flex-1 overflow-auto">
                    <div className="p-2">
                        {filteredAndSortedData.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">No services found matching &#34;{searchTerm}&#34;</div>
                        ) : (
                            <Accordion type="multiple" className="space-y-1" defaultValue={[params.service || ""]}>
                                {filteredAndSortedData.map((item) => {
                                    const stageCount = Object.keys(item.stage).length

                                    return (
                                        <AccordionItem
                                            key={item.service}
                                            value={item.service}

                                            className="border-b border-slate-700  data-[state=open]:bg-slate-800"
                                        >
                                            <AccordionTrigger className="flex items-center gap-2 p-3 hover:bg-slate-700 transition-colors [&[data-state=open]>svg]:rotate-180">
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Folder className="h-4 w-4 text-blue-400" />
                                                    <span className="font-medium text-slate-100">{item.service}</span>
                                                    <Badge variant="secondary" className="font-semibold ml-auto bg-blue-500  text-blue-900">
                                                        {stageCount}
                                                    </Badge>
                                                </div>
                                            </AccordionTrigger>

                                            <AccordionContent className="border-t border-slate-700 bg-slate-850">
                                                <div className="p-3 space-y-1">
                                                    {Object.entries(item.stage).map(([stageName, tpl]) => (
                                                        <div
                                                            key={stageName}
                                                            className="flex items-center gap-2 pl-6 py-2 hover:bg-slate-700 rounded transition-colors"
                                                        >
                                                            <File className="h-4 w-4 text-green-400" />
                                                            <Link key={`${item.service}-${stageName}`}
                                                                  to={`/template/${item.service}/${stageName}/${tpl.template.value}`}
                                                                  className={cn("font-mono text-sm  hover:text-orange-400", (params.service === item.service && params.stage === stageName) ? "text-orange-400" : "")}>
                                                                {stageName}
                                                            </Link>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                            </Accordion>
                        )}
                    </div>
                </div>
            </div>

        )


        setSidebar({content: sidebarComponent, className: "w-100"});

        return () => {
            setSidebar(null);
        };

    }, [boxes, params.service, params.stage, searchTerm, setHeaderActions, setSidebar])

    return (
        <>

            <div className="flex h-screen">
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex overflow-hidden">
                        <main className="flex-1 overflow-auto p-6">
                            <Outlet/>
                        </main>
                    </div>
                </div>
            </div>
        </>
    )
}
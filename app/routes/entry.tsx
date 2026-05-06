import {useCallback, useEffect} from "react";
import {useLayout} from "~/layout/layout.context";
import {EntrySidebar} from "~/entry/components/sidebar";
import {requireAuthCookie} from "~/core/auth";
import {Repository} from "~/core/repository";
import type {ClassifiedPrefixes, EntryRecords} from "~/entry/entry.types";
import {
    isRouteErrorResponse,
    Link,
    type LoaderFunctionArgs,
    useFetcher,
    useLoaderData
} from "react-router";
import {useTree} from "~/tree/tree.context";
import {cn} from "~/core/utils";
import {EntryTable} from "~/entry/components/entry-table";
import {ActionButtons} from "~/entry/components/action-buttons";
import {useEntry} from "~/entry/use-entry";
import {toast} from "sonner";
import type {EntryActionResponse} from "~/entry/entry.validations";
import {SecretCacheProvider, useRetrieveSecret} from "~/entry/use-retrieve-secret";
import type {Route} from "./+types/entry";
import {FunError} from "~/components/ui/error";

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

type Exchange = {
    prefixes: string[]
    initialsPrefixes: ClassifiedPrefixes
    prefix: string | null
    entries: EntryRecords
}

function getPrefix(request: Request) {
    const url = new URL(request.url);
    return url.searchParams.get("prefix");
}

export async function loader({request}: LoaderFunctionArgs) {
    await requireAuthCookie(request)
    const prefix = getPrefix(request)
    const [[entries = [], prefixes], environments, stages] = await Promise.all([
        Repository.entry.retrieve(request, prefix),
        Repository.entry.retrieveEnvironments(request),
        Repository.template.stages(request),
    ])
    return {
        prefixes: prefixes,
        prefix,
        entries,
        initialsPrefixes: environments,
        stages,
    };
}

export default function Entry() {
    return (
        <SecretCacheProvider>
            <EntryView/>
        </SecretCacheProvider>
    )
}

function EntryView() {
    const {prefixes = [], prefix = "", entries: initialEntries = [] , initialsPrefixes, stages = []} = useLoaderData<typeof loader>();
    const { addPaths, tree } = useTree();
    const { setSidebar, setHeaderActions, setNavExtra, setCurrentPath, currentPath} = useLayout();

    const fetcher = useFetcher<EntryActionResponse>();
    const { invalidateSecret } = useRetrieveSecret();

    const {
        entries,
        revealedSecrets,
        editingEntries,
        isLoading,
        isLoadingMessage,
        changes,

        startGlobalEdit,
        startEditingEntry,
        saveEntry,
        saveAllChanges,
        cancelAllEdits,
        toggleSecretVisibility,
        cancelEdit,
        updateEntryChange,
    } = useEntry({initialEntries, fetcher})

    const renderNode = useCallback((node: {name: string}, fullPath: string, isActive: boolean) => (
        <Link
            to={`?prefix=${fullPath}/`}
            className={cn(
                "block w-full cursor-pointer hover:text-yellow-300",
                isActive ? "text-yellow-300" : ""
            )}
        >
            {node.name}
        </Link>
    ), [])

    const entriesFiltered = entries.filter((e) => !e.key.endsWith("/"))
    const secureCount = entriesFiltered.filter((e) => e.secure).length
    const editableCount = editingEntries.size
    const changesCount = changes.size

    useEffect(() => {
        if (initialsPrefixes?.sidebar?.length) {
            addPaths(...initialsPrefixes.sidebar);
        }
        if (prefix && prefixes?.length) {
            addPaths(...prefixes);
        }
    }, [prefix, prefixes, initialsPrefixes, addPaths]);

    useEffect(() => {
        if (initialsPrefixes?.topbar?.length) {
            setNavExtra(
                <div className="flex items-center gap-2">
                    {initialsPrefixes.topbar.map(p => (
                        <Link
                            key={p}
                            to={`/entry?prefix=${p}/`}
                            className="px-3 py-1 text-sm font-mono rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:border-yellow-500 hover:text-yellow-400 transition-colors"
                        >
                            {p}
                        </Link>
                    ))}
                </div>
            );
        }
        return () => setNavExtra(null);
    }, [initialsPrefixes, setNavExtra]);

    useEffect(() => {
        const sidebarComponent = (
            <EntrySidebar
                paths={tree}
                stages={stages}
                renderNode={renderNode}
            />
        );

        const allEnvironments = [
            ...(initialsPrefixes?.sidebar ?? []),
            ...(initialsPrefixes?.topbar ?? []),
        ]

        const headerActions = (
            <ActionButtons
                editableCount={editableCount}
                changesCount={changesCount}
                currentPath={currentPath || ""}
                environments={allEnvironments}
                onEditAll={startGlobalEdit}
                onSaveAll={saveAllChanges}
                onCancelAll={cancelAllEdits}
            />)

        setSidebar({content: sidebarComponent});
        setHeaderActions(headerActions);
        setCurrentPath(prefix || "");

        return () => {
            setSidebar(null);
            setHeaderActions(null);
            setCurrentPath("");
        };
    }, [
        tree, stages, prefix, setSidebar, renderNode,
        setCurrentPath, setHeaderActions, currentPath,
        startGlobalEdit, saveAllChanges,
        cancelAllEdits, changesCount, editableCount
        ]
    );

    useEffect(() => {
        if (fetcher.data && fetcher.state === 'idle') {
            const { status, message } = fetcher.data;

            switch (status) {
                case 'success':
                    toast.success(message || "Operation successful!");
                    fetcher.data.savedIds?.forEach(id => invalidateSecret(id));
                    break;
                case 'partial_error':
                    toast.warning(message || "Some entries could not be saved.");
                    fetcher.data.savedIds?.forEach(id => invalidateSecret(id));
                    break;
                case 'validation_error':
                    toast.error(message || "Validation failed. Please check your data.");
                    break;
            }
        }
    }, [fetcher.data, fetcher.state]);

    return (
        <div className="flex flex-col h-full">

            <div className="flex justify-between items-center text-sm mb-2">
                <div className="text-slate-400">
                    <span className="font-medium">{entriesFiltered.length}</span> entries •{" "}
                    <span className="font-medium text-yellow-400">{secureCount}</span> secure •{" "}
                    <span className="font-semibold text-red-400">{revealedSecrets.size}</span> revealed
                    { editingEntries.size > 0 && (
                        <>
                            {" • "}
                            <span className="font-medium text-yellow-400">{editableCount}</span> editable
                        </>
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    {(editingEntries.size > 0) && (
                        <div
                            className={cn(
                                "animate-pulse flex items-center space-x-2",
                                changesCount > 0 ? "text-amber-400 font-semibold" : "text-slate-400"
                            )} >
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
                            <span>Editing mode active <strong>({changesCount})</strong></span>
                        </div>
                    )}
                    {isLoading && (
                        <div className="text-yellow-400 animate-pulse flex items-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                            <span>{isLoadingMessage}</span>
                        </div>
                    )}
                </div>
            </div>

            <EntryTable
                entries={entriesFiltered}
                editableCount={editableCount}
                revealedSecrets={revealedSecrets}
                editingEntries={editingEntries}
                onToggleVisibility={toggleSecretVisibility}
                onEditEntry={startEditingEntry}
                onSaveEntry={saveEntry}
                onCancelEdit={cancelEdit}
                changes={changes}
                onUpdateEntry={updateEntryChange}
            />

        </div>
    )
}
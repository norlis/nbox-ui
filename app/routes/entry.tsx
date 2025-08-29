import {useCallback, useEffect} from "react";
import {useLayout} from "~/context/layout-context";
import {EntrySidebar} from "~/components/entry/sidebar";
import {requireAuthCookie} from "~/adapters/auth";
import {Repository} from "~/adapters";
import type {EnvironmentRecords} from "~/domain/event";
import type {EntryRecords} from "~/domain/entry";
import {data, Link, type LoaderFunctionArgs, useFetcher, useLoaderData, useRouteError} from "react-router";
import {useTree} from "~/context/tree-context";
import {ScrollArea} from "~/components/ui/scroll-area";
import {cn} from "~/lib/utils";
import {EntryTable} from "~/components/entry/entry-table";
import {ActionButtons} from "~/components/entry/action-buttons";
import {useEntry} from "~/hooks/use-entry";
import {toast} from "sonner";
import type {EntryActionResponse} from "~/domain/validations";
import {useRetrieveSecret} from "~/hooks/use-retrieve-secret";

export function ErrorBoundary() {
    const error = useRouteError();
    console.error(error)
    return <div>Internal Error</div>;
}

type Exchange = {
    prefixes: EnvironmentRecords
    initialsPrefixes: EnvironmentRecords
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
    const [entries = [], prefixes] = await Repository.entry.retrieve(request, prefix)
    const environments =   await Repository.entry.retrieveEnvironments(request)
    return data<Exchange>({
        prefixes: prefixes,
        prefix,
        entries,
        initialsPrefixes: environments,
    });
}

export default function Entry() {
    const {prefixes = [], prefix = "", entries: initialEntries = [] , initialsPrefixes} = useLoaderData<typeof loader>();
    const { addPaths, tree } = useTree();
    const { setSidebar, setHeaderActions, setCurrentPath , currentPath} = useLayout();

    const fetcher = useFetcher<EntryActionResponse>();
    const { invalidateSecret, invalidateAll } = useRetrieveSecret();
    // const revalidator = useRevalidator();

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

    const entriesFiltered = entries.filter((e) => !e.key.endsWith("/"))
    const secureCount = entriesFiltered.filter((e) => e.secure).length
    const editableCount = editingEntries.size
    const changesCount = changes.size

    useEffect(() => {
        if (initialsPrefixes) {
            addPaths(...initialsPrefixes);
        }
        if (prefix && prefixes) {
            addPaths(...prefixes);
        }
    }, [prefix, prefixes, initialsPrefixes, addPaths]);

    const handleDownload = useCallback(() => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(
                entries
                    ?.filter(e => !e.key.endsWith("/"))
                    .map(item => ({key: `${item.path}/${item.key}`, value: item.value, secure: item.secure})),
                null, 4)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `entries-${prefix?.split("/").slice(0, -1).join("-")}.json`;
        link.click();
    }, [entries, prefix]);

    useEffect(() => {
        const sidebarComponent = (
            <EntrySidebar
                paths={tree}
                searchTerm={""}
                onSearchChange={() => {}}
                renderNode={(node, fullPath, isActive) => (
                    <Link
                        to={`?prefix=${fullPath}/`}
                        className={cn(
                            "block w-full cursor-pointer hover:text-yellow-300",
                            isActive ? "text-yellow-300" : ""
                        )}
                    >
                        {node.name}
                    </Link>
                )}
            />
        );

        const headerActions = (
            <ActionButtons
                editableCount={editableCount}
                changesCount={changesCount}
                currentPath={currentPath || ""}
                onEditAll={startGlobalEdit}
                onSaveAll={saveAllChanges}
                onCancelAll={cancelAllEdits}
                onDownload={handleDownload}
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
        tree, prefix, setSidebar,
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
                    if (fetcher.data.savedIds) {
                        fetcher.data.savedIds.forEach(id => invalidateSecret(id));
                    }
                    // invalidateAll()
                    // revalidator.revalidate();
                    // console.log("success", fetcher.data, cache.has('global/example/dd'), revealedSecrets.has('global/example/dd'))
                    // fetcher.data?.savedIds?.forEach(id => console.log("success", id, cache.has(id), revealedSecrets.has(id)));
                    break;
                case 'partial_error':
                    toast.warning(message || "Some entries could not be saved.");
                    // revalidator.revalidate()
                    // invalidateAll()

                    if (fetcher.data.savedIds) {
                        fetcher.data.savedIds.forEach(id => invalidateSecret(id));
                    }
                    break;
                case 'validation_error':
                    toast.error(message || "Validation failed. Please check your data.");
                    // revalidator.revalidate()
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
                            <span className="font-medium text-green-400">{editableCount}</span> editable
                        </>
                    )}
                </div>
                <div className="flex items-center space-x-4">
                    {(editingEntries.size > 0) && (
                        <div
                            className={cn(
                                "animate-pulse flex items-center space-x-2",
                                changesCount > 0 ? "text-amber-700 font-semibold" : "text-blue-400"
                            )} >
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
                            <span> Editing mode active <strong>({changesCount})</strong> </span>
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

            {/*<ScrollArea className="h-[calc(90vh-5rem)] py-1">*/}
                <EntryTable
                    entries={entriesFiltered}
                    editableCount={editableCount}
                    revealedSecrets={revealedSecrets}
                    editingEntries={editingEntries}
                    // currentPath={currentPath || ""}
                    onToggleVisibility={toggleSecretVisibility}
                    onEditEntry={startEditingEntry}
                    onSaveEntry={saveEntry}
                    onCancelEdit={cancelEdit}
                    changes={changes}
                    onUpdateEntry={updateEntryChange}
                />
            {/*</ScrollArea>*/}

        </div>
    )
}
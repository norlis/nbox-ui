import {Button} from "~/components/ui/button"
import {Input} from "~/components/ui/input"
import {memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from "react"
import {ChevronDown, ChevronRight, FileText, RefreshCw, Search} from "lucide-react"
import {cn} from "~/core/utils"
import {useLayout} from "~/layout/layout.context";
import {useTree} from "~/tree/tree.context";
import type {PathNode} from "~/tree/tree.types"


interface EnhancedSidebarProps {
    paths: PathNode[]
    stages?: string[]
    renderNode: (node: PathNode, fullPath: string, isActive: boolean) => ReactNode;
}

interface PathNodeItemProps {
    node: PathNode;
    parentPath?: string;
    currentPath: string;
    expandedNodes: Set<string>;
    loadingPaths: Set<string>;
    matchingPaths: Set<string> | null;
    toggleNode: (path: string) => void;
    renderNode: (node: PathNode, fullPath: string, isActive: boolean) => ReactNode;
}

const STORAGE_KEY = 'nbox:entry-tree-expanded'

function readExpanded(): Set<string> {
    if (typeof window === 'undefined') return new Set()
    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return new Set()
        const arr = JSON.parse(raw)
        return Array.isArray(arr) ? new Set<string>(arr) : new Set()
    } catch {
        return new Set()
    }
}

function persistExpanded(set: Set<string>): void {
    if (typeof window === 'undefined') return
    try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
    } catch {
        // sessionStorage may be unavailable (private mode); ignore.
    }
}

function isPathActive(currentPath: string, fullPath: string): boolean {
    if (!currentPath) return false
    return currentPath === fullPath || currentPath.startsWith(fullPath + "/")
}

function nodeMatches(node: PathNode, fullPath: string, query: string): boolean {
    return fullPath.toLowerCase().includes(query) || node.name.toLowerCase().includes(query)
}

// Computes the set of paths that match the query OR have a descendant that matches.
// Used both to filter the visible tree and to expand the relevant branches.
function collectMatching(nodes: PathNode[], query: string, parentPath = ""): Set<string> {
    const matches = new Set<string>()
    if (!query) return matches
    const q = query.toLowerCase()
    const walk = (list: PathNode[], prefix: string): boolean => {
        let any = false
        for (const node of list) {
            const fullPath = prefix ? `${prefix}/${node.name}` : node.name
            const selfMatch = nodeMatches(node, fullPath, q)
            const childMatch = node.children && node.children.length > 0
                ? walk(node.children, fullPath)
                : false
            if (selfMatch || childMatch) {
                matches.add(fullPath)
                any = true
            }
        }
        return any
    }
    walk(nodes, parentPath)
    return matches
}

const PathNodeItem = ({
    node, parentPath = "", currentPath, expandedNodes, loadingPaths, matchingPaths,
    toggleNode, renderNode,
}: PathNodeItemProps) => {
    const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    const isExpanded = expandedNodes.has(fullPath);
    const isActive = isPathActive(currentPath, fullPath);
    const isLoading = loadingPaths.has(fullPath);
    const canHaveChildren = node.children !== undefined && node.children.length > 0;

    // Hide nodes that don't match the active filter.
    if (matchingPaths && !matchingPaths.has(fullPath)) return null

    const visibleChildren = isExpanded && node.children
        ? (matchingPaths
            ? node.children.filter(c => matchingPaths.has(parentPath ? `${parentPath}/${node.name}/${c.name}` : `${node.name}/${c.name}`))
            : node.children)
        : []

    return (
        <div>
            <div
                className={cn(
                    "flex items-center py-2 px-3 rounded-md transition-colors duration-200",
                    isActive ? "bg-slate-700 text-slate-50" : "text-slate-300",
                )}
            >
                {canHaveChildren || isLoading ? (
                    <Button
                        variant="ghost" size="icon"
                        onClick={() => toggleNode(fullPath)}
                        title={isExpanded ? "Collapse" : "Expand"}
                        className={cn(
                            "h-6 w-6 mr-1 cursor-pointer",
                            isActive ? "text-slate-50 hover:bg-slate-600" : "text-slate-400 hover:bg-slate-600",
                        )}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? <RefreshCw className="h-4 w-4 animate-spin"/>
                            : isExpanded
                                ? <ChevronDown className="h-4 w-4"/>
                                : <ChevronRight className="h-4 w-4"/>}
                    </Button>
                ) : (
                    <Button
                        variant="ghost" size="icon"
                        onClick={() => toggleNode(fullPath)}
                        title="Expand to load"
                        className={cn(
                            "h-6 w-6 mr-1 cursor-pointer",
                            isActive ? "text-slate-50 hover:bg-slate-600" : "text-slate-400 hover:bg-slate-600",
                        )}
                    >
                        <FileText className="h-4 w-4"/>
                    </Button>
                )}
                <div className="flex-grow">
                    {renderNode(node, fullPath, isActive)}
                </div>
            </div>
            {isExpanded && visibleChildren.length > 0 && (
                <div className="ml-6 border-l border-slate-700">
                    {visibleChildren.map((child) => (
                        <PathNodeItem
                            key={child.name}
                            node={child}
                            parentPath={fullPath}
                            currentPath={currentPath}
                            expandedNodes={expandedNodes}
                            loadingPaths={loadingPaths}
                            matchingPaths={matchingPaths}
                            toggleNode={toggleNode}
                            renderNode={renderNode}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const MemoizedPathNodeItem = memo(PathNodeItem);

// Sorts top-level nodes by the canonical stage order; non-stage names go last alphabetically.
function sortByStages(paths: PathNode[], stages: string[]): PathNode[] {
    if (!stages.length) return paths
    const order = new Map(stages.map((s, i) => [s, i]))
    return [...paths].sort((a, b) => {
        const ai = order.get(a.name)
        const bi = order.get(b.name)
        if (ai !== undefined && bi !== undefined) return ai - bi
        if (ai !== undefined) return -1
        if (bi !== undefined) return 1
        return a.name.localeCompare(b.name)
    })
}

export function EntrySidebar({paths, stages = [], renderNode}: EnhancedSidebarProps) {
    const {currentPath} = useLayout();
    const {addPaths} = useTree();

    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
    const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set())
    const loadedRef = useRef<Set<string>>(new Set())
    const [query, setQuery] = useState<string>("")

    // Hydrate expansion state from sessionStorage after mount (SSR-safe).
    useEffect(() => {
        const stored = readExpanded()
        if (stored.size > 0) setExpandedNodes(stored)
    }, [])

    useEffect(() => {
        persistExpanded(expandedNodes)
    }, [expandedNodes])

    // Auto-expand the chain leading to the active prefix (so the current entry is in view).
    useEffect(() => {
        const segments = currentPath?.split("/").filter(Boolean) ?? [];
        if (segments.length <= 1) return
        const toExpand = new Set<string>()
        let cumulative = ""
        for (const segment of segments.slice(0, -1)) {
            cumulative = cumulative ? `${cumulative}/${segment}` : segment
            toExpand.add(cumulative)
        }
        setExpandedNodes(prev => {
            let changed = false
            const next = new Set(prev)
            for (const p of toExpand) if (!next.has(p)) { next.add(p); changed = true }
            return changed ? next : prev
        })
    }, [currentPath]);

    const fetchChildren = useCallback(async (path: string) => {
        if (loadedRef.current.has(path)) return
        loadedRef.current.add(path)
        setLoadingPaths(prev => new Set(prev).add(path))
        try {
            const res = await fetch(`/api/entry-prefix?v=${encodeURIComponent(path + "/")}`)
            if (!res.ok) return
            const json = (await res.json()) as {paths?: string[]}
            if (json.paths?.length) addPaths(...json.paths)
        } catch {
            // Network/abort: forget so the user can retry by re-expanding.
            loadedRef.current.delete(path)
        } finally {
            setLoadingPaths(prev => {
                const next = new Set(prev)
                next.delete(path)
                return next
            })
        }
    }, [addPaths])

    const toggleNode = useCallback((path: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev)
            if (next.has(path)) {
                next.delete(path)
            } else {
                next.add(path)
                // Lazy load children the first time the user expands the node.
                if (!loadedRef.current.has(path)) fetchChildren(path)
            }
            return next
        })
    }, [fetchChildren])

    // Sort + filter according to the search query.
    const sortedPaths = useMemo(() => sortByStages(paths || [], stages), [paths, stages])
    const matchingPaths = useMemo(
        () => query.trim() ? collectMatching(sortedPaths, query.trim()) : null,
        [sortedPaths, query],
    )

    // When a search is active, expand every node that has a match underneath
    // so the matches are visible without manual clicking.
    useEffect(() => {
        if (!matchingPaths) return
        setExpandedNodes(prev => {
            let changed = false
            const next = new Set(prev)
            for (const p of matchingPaths) if (!next.has(p)) { next.add(p); changed = true }
            return changed ? next : prev
        })
    }, [matchingPaths])

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700 p-4">
            <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"/>
                <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="pl-8 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
                />
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                {sortedPaths.map((node) => (
                    <MemoizedPathNodeItem
                        key={node.name}
                        node={node}
                        currentPath={currentPath || ""}
                        expandedNodes={expandedNodes}
                        loadingPaths={loadingPaths}
                        matchingPaths={matchingPaths}
                        toggleNode={toggleNode}
                        renderNode={renderNode}
                    />
                ))}
            </div>
        </div>
    );
}
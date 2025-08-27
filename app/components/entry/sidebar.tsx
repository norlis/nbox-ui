import {Button} from "~/components/ui/button"

import {memo, type ReactNode, useCallback, useEffect, useState} from "react"
import {Input} from "~/components/ui/input"
import {ChevronDown, ChevronRight, FileText, RefreshCw, Search} from "lucide-react"
import {cn} from "~/lib/utils"
import {useLayout} from "~/context/layout-context";
import type {PathNode} from "~/domain/tree"


interface EnhancedSidebarProps {
    paths: PathNode[]
    searchTerm: string
    onSearchChange: (term: string) => void
    loadingPaths?: Set<string>;
    renderNode: (node: PathNode, fullPath: string, isActive: boolean) => ReactNode; // La nueva prop!
}

interface PathNodeItemProps extends Omit<EnhancedSidebarProps, 'searchTerm' | 'onSearchChange' | 'paths'> {
    node: PathNode;
    parentPath?: string;
    currentPath: string;
    expandedNodes: Set<string>;
    toggleNode: (path: string) => void;
}

const PathNodeItem =
    ({ node, parentPath = "", currentPath, expandedNodes, toggleNode, loadingPaths, renderNode }: PathNodeItemProps) => {
        const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
        const isExpanded = expandedNodes.has(fullPath);
        const isActive = currentPath.includes(fullPath);
        const isLoading = loadingPaths?.has(fullPath);
        const canHaveChildren = node.children !== undefined && node.children.length > 0;

        return (
            <div>
                <div
                    className={cn(
                        "flex items-center py-2 px-3 rounded-md transition-colors duration-200",
                        isActive ? "bg-slate-700 text-slate-50" : "text-slate-300",
                    )}
                >
                    {canHaveChildren ? (
                        <Button
                            variant="ghost" size="icon"
                            onClick={() => toggleNode(fullPath)}
                            className={cn("h-6 w-6 mr-1", isActive ? "text-slate-50 hover:bg-slate-600" : "text-slate-400 hover:bg-slate-600")}
                            disabled={isLoading}
                        >
                            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    ) : (
                        <div className="w-6 h-6 mr-1 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-slate-400" />
                        </div>
                    )}
                    {/*<span className="flex-grow flex items-center gap-2">{node.name}</span>*/}
                    <div className="flex-grow">
                        {renderNode(node, fullPath, isActive)}
                    </div>
                </div>
                {isExpanded && node.children && (
                    <div className="ml-6 border-l border-slate-700">
                        {node.children.map((child) => (
                            <PathNodeItem
                                key={child.name}
                                node={child}
                                parentPath={fullPath}
                                currentPath={currentPath}
                                expandedNodes={expandedNodes}
                                toggleNode={toggleNode}
                                loadingPaths={loadingPaths}
                                renderNode={renderNode}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }


const MemoizedPathNodeItem = memo(PathNodeItem);

export function EntrySidebar({
                                    paths,
                                    searchTerm,
                                    onSearchChange,
                                    renderNode
                                }: EnhancedSidebarProps) {

    const { currentPath } = useLayout();

    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["global", "global/"]))

    const filteredPaths = paths || [];

    useEffect(() => {
        const pathSegments = currentPath?.split("/");
        if (pathSegments && pathSegments.length > 1) {
            const pathsToExpand = new Set<string>();
            let currentCumulativePath = "";
            for (const segment of pathSegments.slice(0, -1)) {
                currentCumulativePath = currentCumulativePath ? `${currentCumulativePath}/${segment}` : segment;
                pathsToExpand.add(currentCumulativePath);
            }
            setExpandedNodes(prev => new Set([...prev, ...pathsToExpand]));
        }
    }, [currentPath]);

    const toggleNode = useCallback((path: string) => {
        setExpandedNodes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(path)) newSet.delete(path);
            else newSet.add(path);
            return newSet;
        });
    }, []);

    // const filteredPaths = useMemo(() => {
    //     if (!searchTerm) return paths;
    //     const lowerCaseSearchTerm = searchTerm.toLowerCase();
    //     function filter(nodes: PathNode[]): PathNode[] {
    //         const result: PathNode[] = [];
    //         for (const node of nodes) {
    //             const filteredChildren = node.children ? filter(node.children) : undefined;
    //             if (node.name.toLowerCase().includes(lowerCaseSearchTerm) || (filteredChildren && filteredChildren.length > 0)) {
    //                 result.push({ ...node, children: filteredChildren });
    //             }
    //         }
    //         return result;
    //     }
    //     return filter(paths);
    // }, [paths, searchTerm]);

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700 p-4">
            <div className="mb-6">
                {/*<h2 className="text-xl font-bold text-slate-50 mb-4">Environment Explorer</h2>*/}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search environments..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-slate-800 border-slate-700 text-slate-50 focus:ring-yellow-500 focus:border-yellow-500"
                        disabled={true}
                    />
                </div>
            </div>
            {/*<div className="mb-4 p-3 bg-slate-800 border border-slate-700 rounded-md">*/}
            {/*    <div className="text-sm text-slate-400 mb-1">Current Path</div>*/}
            {/*    <div className="text-yellow-300 font-mono text-sm break-all">{"{" + currentPath + "}"}</div>*/}
            {/*</div>*/}
            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                {filteredPaths.map((node) => (
                    <MemoizedPathNodeItem
                        key={node.name}
                        node={node}
                        currentPath={currentPath || ""}
                        expandedNodes={expandedNodes}
                        toggleNode={toggleNode}
                        renderNode={renderNode}
                    />
                ))}
            </div>
        </div>
    );
}
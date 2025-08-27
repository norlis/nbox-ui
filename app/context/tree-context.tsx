import {createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState} from "react";
import {TreeBuilder, type TreeNode} from "~/context/tree-builder";


interface TreeContextType {
    tree: TreeNode[];
    addPaths: (...paths: string[]) => void;
    clearTree: () => void;
    buildTreeFromList: (paths: string[]) => void;
}

interface TreeProviderProps {
    children: ReactNode;
    initialPaths?: string[];
}


const TreeContext = createContext<TreeContextType | undefined>(undefined);


export const TreeProvider = ({ children, initialPaths = [] }: TreeProviderProps) => {
    const treeBuilderRef = useRef(new TreeBuilder(...initialPaths));

    const [tree, setTree] = useState<TreeNode[]>(() => treeBuilderRef.current.getTree());

    const addPaths = useCallback((...paths: string[]) => {
        treeBuilderRef.current.addPath(...paths);
        setTree([...treeBuilderRef.current.getTree()]);
    }, []);

    const clearTree = useCallback(() => {
        treeBuilderRef.current.clear();
        setTree([...treeBuilderRef.current.getTree()]);
    }, []);

    const buildTreeFromList = useCallback((paths: string[]) => {
        treeBuilderRef.current.clear();
        treeBuilderRef.current.addPath(...paths);
        setTree([...treeBuilderRef.current.getTree()]);
    }, []);

    const value = useMemo(() => ({
        tree,
        addPaths,
        clearTree,
        buildTreeFromList
    }), [tree, addPaths, clearTree, buildTreeFromList]);

    return (
        <TreeContext.Provider value={value}>
            {children}
        </TreeContext.Provider>
    );
};

export const useTree = () => {
    const context = useContext(TreeContext);
    if (context === undefined) {
        throw new Error('useTree debe ser usado dentro de un TreeProvider');
    }
    return context;
};
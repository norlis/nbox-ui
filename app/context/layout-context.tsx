import type {ReactNode} from "react";
import {createContext, useContext, useMemo, useState} from "react";

type SidebarConfig = {
    content: ReactNode | null;
    className?: string;
};

interface LayoutContextType {
    sidebar: SidebarConfig | null;
    headerActions: ReactNode | null;
    currentPath: string | null;
    setSidebar: (config: SidebarConfig | null) => void;
    setHeaderActions: (node: ReactNode | null) => void;
    setCurrentPath: (path: string | null) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [sidebar, setSidebar] = useState<SidebarConfig | null>(null);
    const [headerActions, setHeaderActions] = useState<ReactNode | null>(null);
    const [currentPath, setCurrentPath] = useState<string | null>(null);

    const value = useMemo(() => ({
        sidebar,
        headerActions,
        currentPath,
        setSidebar,
        setHeaderActions,
        setCurrentPath,
    }), [sidebar, headerActions, currentPath]);

    return (
        <LayoutContext.Provider value={value}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error("useLayout debe ser usado dentro de un LayoutProvider");
    }
    return context;
}
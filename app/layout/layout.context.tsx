import type {ReactNode} from "react";
import {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";

type SidebarConfig = {
    content: ReactNode | null;
    className?: string;
};

interface LayoutContextType {
    sidebar: SidebarConfig | null;
    headerActions: ReactNode | null;
    navExtra: ReactNode | null;
    currentPath: string | null;
    isSidebarCollapsed: boolean;
    setSidebar: (config: SidebarConfig | null) => void;
    setHeaderActions: (node: ReactNode | null) => void;
    setNavExtra: (node: ReactNode | null) => void;
    setCurrentPath: (path: string | null) => void;
    toggleSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const STORAGE_KEY = 'nbox:sidebar-collapsed';

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [sidebar, setSidebar] = useState<SidebarConfig | null>(null);
    const [headerActions, setHeaderActions] = useState<ReactNode | null>(null);
    const [navExtra, setNavExtra] = useState<ReactNode | null>(null);
    const [currentPath, setCurrentPath] = useState<string | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Hydrate preference from localStorage after mount (SSR-safe).
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.localStorage.getItem(STORAGE_KEY) === '1') {
            setIsSidebarCollapsed(true);
        }
    }, []);

    const toggleSidebar = useCallback(() => {
        setIsSidebarCollapsed(prev => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
            }
            return next;
        });
    }, []);

    const value = useMemo(() => ({
        sidebar,
        headerActions,
        navExtra,
        currentPath,
        isSidebarCollapsed,
        setSidebar,
        setHeaderActions,
        setNavExtra,
        setCurrentPath,
        toggleSidebar,
    }), [sidebar, headerActions, navExtra, currentPath, isSidebarCollapsed, toggleSidebar]);

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
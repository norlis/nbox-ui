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
    setSidebarCollapsed: (value: boolean) => void;
    restoreSidebarPreference: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const STORAGE_KEY = 'nbox:sidebar-collapsed';

function readSidebarPreference(): boolean {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
}

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [sidebar, setSidebar] = useState<SidebarConfig | null>(null);
    const [headerActions, setHeaderActions] = useState<ReactNode | null>(null);
    const [navExtra, setNavExtra] = useState<ReactNode | null>(null);
    const [currentPath, setCurrentPath] = useState<string | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Hydrate preference from localStorage after mount (SSR-safe).
    useEffect(() => {
        if (readSidebarPreference()) setIsSidebarCollapsed(true);
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

    // Route-driven override (does not persist). Pair with restoreSidebarPreference on unmount.
    const setSidebarCollapsed = useCallback((value: boolean) => {
        setIsSidebarCollapsed(value);
    }, []);

    const restoreSidebarPreference = useCallback(() => {
        setIsSidebarCollapsed(readSidebarPreference());
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
        setSidebarCollapsed,
        restoreSidebarPreference,
    }), [sidebar, headerActions, navExtra, currentPath, isSidebarCollapsed, toggleSidebar, setSidebarCollapsed, restoreSidebarPreference]);

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
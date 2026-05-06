import type {ReactNode} from "react"
import {PanelLeftClose, PanelLeftOpen} from "lucide-react"
import {cn} from "~/core/utils"
import {Header} from "~/layout/header";
import {useLayout} from "~/layout/layout.context";


interface EnhancedMainLayoutProps {
    children: ReactNode
    username: string
}


export function MainLayout({children, username}: EnhancedMainLayoutProps) {
    const { sidebar, headerActions, currentPath, isSidebarCollapsed, toggleSidebar } = useLayout();
    const pathSegments = currentPath ? currentPath.split("/").filter(Boolean) : []
    const sidebarVisible = Boolean(sidebar) && !isSidebarCollapsed

    return (
        <div className="flex h-screen w-full bg-slate-950 text-slate-50">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-yellow-500 focus:text-slate-900 focus:font-medium focus:rounded-md"
            >
                Skip to content
            </a>

            {sidebarVisible && (
                <aside
                    className={cn(
                        "w-80 flex-shrink-0",
                        sidebar?.className
                    )}
                >
                    {sidebar?.content}
                </aside>
            )}

            <main id="main-content" className={cn("flex flex-col flex-grow overflow-hidden", !sidebarVisible && "w-full")}>
                {username && <Header currentUser={username}/>}

                {(currentPath || sidebar) && (
                    <div
                        className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700 sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            {sidebar && (
                                <button
                                    type="button"
                                    onClick={toggleSidebar}
                                    aria-label={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                                    title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                                    className="text-slate-400 hover:text-yellow-300 transition-colors"
                                >
                                    {isSidebarCollapsed
                                        ? <PanelLeftOpen className="h-4 w-4"/>
                                        : <PanelLeftClose className="h-4 w-4"/>}
                                </button>
                            )}
                            <div className="flex items-center space-x-1 text-slate-400 text-sm">
                                {pathSegments.map((segment, index) => (
                                    <span key={index} className="flex items-center">
                                        <span className="mx-1">/</span>
                                        <span className={cn(
                                                  "font-mono",
                                                  index === pathSegments.length - 1 ? "text-yellow-300" : "text-slate-400",
                                              )} > {segment}  </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                        {headerActions}
                    </div>
                )}

                <div className="flex-grow p-6 overflow-hidden">{children}</div>
            </main>
        </div>
    )
}
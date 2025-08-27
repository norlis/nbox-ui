import type {ReactNode} from "react"
import {cn} from "~/lib/utils"
import {Header} from "~/components/layout/header";
import {useLayout} from "~/context/layout-context";


interface EnhancedMainLayoutProps {
    children: ReactNode
    username: string
}


export function MainLayout({children, username}: EnhancedMainLayoutProps) {
    const { sidebar, headerActions, currentPath } = useLayout();
    const pathSegments = currentPath ? currentPath.split("/").filter(Boolean) : []

    return (
        <div className="flex h-screen w-full bg-slate-950 text-slate-50">
            {/* Sidebar */}
            {/*{sidebar && <aside className="w-80 flex-shrink-0">{sidebar}</aside>}*/}
            {sidebar && (
                <aside
                    className={cn(
                        "w-80 flex-shrink-0",
                        "w-80",
                        sidebar.className
                    )}
                >
                    {sidebar.content}
                </aside>
            )}

            {/* Main Content Area */}
            <main className={cn("flex flex-col flex-grow overflow-hidden", !sidebar && "w-full")}>
                {/* Top Navigation */}
                {username && <Header currentUser={username}/>}

                {/* Path and Actions Header (only if currentPath is provided) */}
                {currentPath && (
                    <div
                        className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700 sticky top-0 z-10">
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
                        {headerActions}
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-grow p-6 overflow-hidden">{children}</div>
            </main>
        </div>
    )
}
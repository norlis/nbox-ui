import React, {useCallback, useState} from "react"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "~/components/ui/dialog"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "~/components/ui/tabs"
import {TraditionalForm} from "./traditional-form"
import {ImportJsonForm} from "./import-json-form"

interface CreateVariableModalProps {
    currentPath: string
    defaultTab?: "single" | "import"
    children: React.ReactNode // To allow custom trigger button
}

export function CreateVariableModal({
                                        currentPath,
                                        defaultTab = "single",
                                        children,
                                    }: CreateVariableModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState(defaultTab)

    const handleClose = useCallback(() => {
        setIsOpen(false)
        setActiveTab(defaultTab) // Reset tab on close
    }, [])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger> {/* Use children as trigger */}
            <DialogContent className="sm:max-w-[600px] bg-slate-900 text-slate-50 border-slate-700 ">
                <DialogHeader>
                    <DialogTitle className="text-slate-50">Add / Import</DialogTitle>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
                        <TabsTrigger
                            value="single"
                            className="data-[state=active]:bg-yellow-600 data-[state=active]:text-slate-900 text-slate-300"
                        >
                            Add one
                        </TabsTrigger>
                        <TabsTrigger
                            value="import"
                            className="data-[state=active]:bg-yellow-600 data-[state=active]:text-slate-900 text-slate-300"
                        >
                            JSON import
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="single" className="mt-6">
                        <TraditionalForm currentPath={currentPath} onClose={handleClose} />
                    </TabsContent>
                    <TabsContent value="import" className="mt-6  max-w-3xl h-[70vh] flex flex-col">
                        <ImportJsonForm onClose={handleClose} currentPath={currentPath} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

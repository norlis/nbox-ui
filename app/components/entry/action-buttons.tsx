import {Button} from "~/components/ui/button"
import {Download, Pencil, Plus, Save, Upload, X} from "lucide-react"
import {CreateVariableModal} from "./create-variable-modal"


interface EnhancedActionButtonsProps {
    editableCount: number
    changesCount: number
    currentPath: string
    onEditAll?: () => void
    onSaveAll?: () => void
    onCancelAll?: () => void
    onDownload?: () => void
}

export function ActionButtons({
                                  editableCount,
                                  changesCount,
                                  currentPath,
                                  onEditAll,
                                  onSaveAll,
                                  onCancelAll,
                                  onDownload
                              }: EnhancedActionButtonsProps) {

    return (
        <div className="flex items-center gap-2">
            {editableCount > 1  ? (
                <>
                    <Button onClick={onSaveAll} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="h-4 w-4 mr-1"/>
                        Save ({changesCount})
                    </Button>
                    <Button
                        onClick={onCancelAll}
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                    >
                        <X className="h-4 w-4 mr-1"/>
                        Cancel
                    </Button>
                </>
            ) : (
                <>
                    <CreateVariableModal
                        currentPath={currentPath}
                        defaultTab="single"
                    >
                        <Button size="sm"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-yellow-300">
                            <Plus className="h-4 w-4 mr-1"/>
                        </Button>
                    </CreateVariableModal>

                    <Button
                        onClick={onEditAll}
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-yellow-300"
                    >
                        <Pencil className="h-4 w-4 mr-1"/>
                    </Button>

                    <div className="h-4 w-px bg-slate-600 mx-1"/>

                    <Button
                        onClick={onDownload}
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                    >
                        <Download className="h-4 w-4"/>
                    </Button>

                    <CreateVariableModal
                        currentPath={currentPath}
                        defaultTab="import"
                    >
                        <Button size="sm" variant="ghost"
                                className="text-slate-400 hover:text-slate-200 hover:bg-slate-700">
                            <Upload className="h-4 w-4"/>
                        </Button>
                    </CreateVariableModal>
                </>
            )}

            <div className="h-4 w-px bg-slate-600 mx-1"/>

        </div>
    )
}
import {Button} from "../../components/ui/button"
import {Layers, Pencil, Plus, Save, Upload, X} from "lucide-react"
import {CreateVariableModal} from "./create-variable-modal"
import {BulkEditSheet} from "./bulk-edit-sheet"
import {ExportDropdown} from "./export-dropdown"

interface EnhancedActionButtonsProps {
    editableCount: number
    changesCount: number
    currentPath: string
    environments: string[]
    onEditAll?: () => void
    onSaveAll?: () => void
    onCancelAll?: () => void
}

export function ActionButtons({
                                  editableCount,
                                  changesCount,
                                  currentPath,
                                  environments,
                                  onEditAll,
                                  onSaveAll,
                                  onCancelAll,
                              }: EnhancedActionButtonsProps) {

    return (
        <div className="flex items-center gap-2">
            {editableCount > 1 ? (
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
                    <CreateVariableModal currentPath={currentPath} defaultTab="single">
                        <Button size="sm" aria-label="Add variable"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-yellow-300">
                            <Plus className="h-4 w-4 mr-1" aria-hidden="true"/>
                        </Button>
                    </CreateVariableModal>

                    <Button
                        onClick={onEditAll}
                        size="sm"
                        aria-label="Edit all entries"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-yellow-300"
                    >
                        <Pencil className="h-4 w-4 mr-1" aria-hidden="true"/>
                    </Button>

                    <BulkEditSheet currentPath={currentPath} environments={environments}>
                        <Button size="sm" aria-label="Bulk edit"
                                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-yellow-300">
                            <Layers className="h-4 w-4 mr-1" aria-hidden="true"/>
                        </Button>
                    </BulkEditSheet>

                    <div className="h-4 w-px bg-slate-600 mx-1" aria-hidden="true"/>

                    <ExportDropdown currentPath={currentPath}/>

                    <CreateVariableModal currentPath={currentPath} defaultTab="import">
                        <Button size="sm" variant="ghost" aria-label="Import"
                                className="text-slate-400 hover:text-slate-200 hover:bg-slate-700">
                            <Upload className="h-4 w-4" aria-hidden="true"/>
                        </Button>
                    </CreateVariableModal>
                </>
            )}
        </div>
    )
}
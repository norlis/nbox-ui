import {EditableRow} from "./editable-row"
import type {EntriesEditable, EntryEditable} from "~/domain/entry";
import {Card, CardContent} from "~/components/ui/card";


interface TableProps {
    entries: EntriesEditable
    editableCount: number
    changes: Map<string, { newName: string; newValue: string, newSecure: boolean; }>
    revealedSecrets: Map<string, string>
    editingEntries: Set<string>
    onToggleVisibility: (name: string) => void
    onEditEntry?: (entry: EntryEditable) => void
    onSaveEntry?: (entry: EntryEditable) => void
    onCancelEdit?: (entryName: string) => void
    onUpdateEntry: (entryId: string, newName: string, newValue: string, newSecure: boolean) => void
}


export function EntryTable({
                                         entries,
                                         editableCount,
                                         changes,
                                         revealedSecrets,
                                         editingEntries,
                                         onToggleVisibility,
                                         onEditEntry,
                                         onSaveEntry,
                                         onCancelEdit,
                                         onUpdateEntry,
                                     }: TableProps) {
    return (
        <Card className="bg-slate-800/50 border-slate-700 shadow-2xl backdrop-blur-sm">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-750">
                            <th className="text-left p-4 text-slate-300 font-semibold text-sm uppercase tracking-wider">
                                Key Name
                            </th>
                            <th className="text-left p-4 text-slate-300 font-semibold text-sm uppercase tracking-wider">Value</th>
                            <th className="text-left p-4 text-slate-300 font-semibold text-sm uppercase tracking-wider">
                                Security
                            </th>
                            <th className="text-left p-4 text-slate-300 font-semibold text-sm uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            entries.map((entry, index) => {
                                const entryId = `${entry.path}/${entry.key}`;
                                return (
                                    <EditableRow
                                        key={`${entryId}-${index}`}
                                        entry={entry}
                                        editableCount={editableCount}
                                        isRevealed={revealedSecrets.has(entryId)}
                                        revealedSecrets={revealedSecrets}
                                        isEditing={editingEntries.has(entryId)}
                                        onToggleVisibility={onToggleVisibility}
                                        onEdit={onEditEntry}
                                        onSave={onSaveEntry}
                                        onCancel={onCancelEdit}
                                        currentPath={""}
                                        changes={changes}
                                        onUpdateEntry={onUpdateEntry}
                                    />
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

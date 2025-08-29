import {EditableRow} from "./editable-row"
import type {EntriesEditable, EntryEditable} from "~/domain/entry";
import {Card, CardContent} from "~/components/ui/card";
import {useEffect, useRef, useState} from "react";


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
    const [isScrolled, setIsScrolled] = useState(false)
    const tableContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleScroll = () => {
            if (tableContainerRef.current) {
                const scrollTop = tableContainerRef.current.scrollTop
                setIsScrolled(scrollTop > 0)
            }
        }

        const container = tableContainerRef.current
        if (container) {
            container.addEventListener("scroll", handleScroll)
            return () => container.removeEventListener("scroll", handleScroll)
        }
    }, [])

    return (
        // <Card className="bg-slate-800/50 border-slate-700 shadow-2xl backdrop-blur-sm">
        //     <CardContent className="p-0">
        <div className="bg-slate-800/50 border border-slate-700 shadow-2xl backdrop-blur-sm overflow-hidden">
                <div ref={tableContainerRef}
                     className={`h-[calc(90vh-5rem)] overflow-auto transition-all duration-300 ${isScrolled ? "shadow-inner" : ""}`}>
                    <table className="w-full">
                        <thead
                            className={`sticky top-0 z-10 transition-all duration-300 ${
                                isScrolled
                                    ? "bg-gradient-to-r from-slate-800 to-slate-750 backdrop-blur-sm shadow-md border-b-2 border-slate-600"
                                    : "bg-gradient-to-r from-slate-800 to-slate-750"
                            }`}
                        >
                        <tr className="border-b border-slate-700">
                            <th
                                className={`px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider transition-colors ${
                                    isScrolled ? "text-slate-200" : "text-slate-300"
                                }`}
                            >
                                Key
                            </th>
                            <th
                                className={`px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider transition-colors ${
                                    isScrolled ? "text-slate-200" : "text-slate-300"
                                }`}
                            >
                                Value
                            </th>
                            <th
                                className={`px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider transition-colors ${
                                    isScrolled ? "text-slate-200" : "text-slate-300"
                                }`}
                            >
                                Security
                            </th>
                            <th
                                className={`px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider transition-colors ${
                                    isScrolled ? "text-slate-200" : "text-slate-300"
                                }`}
                            >
                                Actions
                            </th>
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
        {/*    </CardContent>*/}
        {/*</Card>*/}
    </div>
    )
}

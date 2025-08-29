import type React from "react"
import {useEffect, useRef, useState} from "react"
import {Check, Copy, Edit, X} from 'lucide-react'
import {Button} from "~/components/ui/button"
import {Badge} from "~/components/ui/badge"
import {Input} from "~/components/ui/input"
import {Switch} from "~/components/ui/switch";
import {ValueDisplay} from "./value-display"
import type {EntryEditable} from "~/domain/entry"

interface EditableRowProps {
    entry: EntryEditable
    changes: Map<string, { newName: string; newValue: string; newSecure: boolean }>
    editableCount: number
    isRevealed: boolean
    isEditing: boolean
    currentPath: string
    revealedSecrets: Map<string, string>
    onToggleVisibility: (name: string) => void
    onEdit?: (entry: EntryEditable) => void
    onSave?: (entry: EntryEditable) => void
    onCancel?: (entryName: string) => void
    onUpdateEntry: (entryId: string, newName: string, newValue: string, newSecure: boolean) => void
}

export function EditableRow({
                                entry,
                                editableCount,
                                changes,
                                isRevealed,
                                isEditing,
                                revealedSecrets,
                                onToggleVisibility,
                                onEdit,
                                onSave,
                                onCancel,
                                onUpdateEntry,
                            }: EditableRowProps) {
    const path = `${entry.path}/${entry.key}`

    const entryId = `${entry.path}/${entry.key}`;
    const nameInputRef = useRef<HTMLInputElement>(null);

    const [copiedItem, setCopiedItem] = useState<string | null>(null)
    const valueInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing && nameInputRef.current) {
            nameInputRef.current.focus()
        }
    }, [isEditing])

    const pendingChange = changes.get(entryId);
    const currentName = pendingChange?.newName ?? entry.key;
    const currentValue = pendingChange?.newValue ?? entry.actualValue ?? entry.value;
    const currentSecure = pendingChange?.newSecure ?? entry.secure;

    const getDefaultSecureValue = () => {
        return revealedSecrets.get(path)
    }

    const getDisplayValue = () => {
        if (!entry.secure) return entry.value;
        if (isRevealed) {
            return  revealedSecrets.get(entryId) || currentValue;
        }
        return entry.value;
    };

    const copyToClipboard = async (value: string, name: string) => {
        try {
            await navigator.clipboard.writeText(value)
            setCopiedItem(name)
            setTimeout(() => setCopiedItem(null), 2000)
        } catch (err) {
            console.error("Failed to copy: ", err)
        }
    }

    const handleSave = () => {
        onSave?.(entry);
    };

    const handleCancel = () => {
        onCancel?.(entryId);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") handleCancel();
    };

    const shouldEdit = isEditing

    return (
        <tr
            className={`border-b border-slate-700 transition-all duration-200 ${
                shouldEdit ? "bg-blue-500/10 border-blue-500/30" :
                    (entry.secure) ? "bg-slate-700/30" :
                        "hover:bg-slate-750"
            }`}
        >
            {/* Name Column */}
            <td className="p-4 w-1/4"
            >
                {shouldEdit ? (
                    <Input
                        ref={nameInputRef}
                        value={currentName}
                        onChange={(e) => onUpdateEntry(entryId, e.target.value, currentValue, currentSecure)}
                        onKeyDown={handleKeyDown}
                        className="font-mono text-sm bg-slate-700 border-slate-600 text-yellow-400 focus:border-yellow-500"
                    />
                ) : (
                    <div
                        className="group flex items-center gap-2 cursor-pointer hover:text-slate-100 transition-colors select-none"
                        onClick={() => copyToClipboard(`{{ ${entryId} }}`, `${entryId}`)}
                        title="Click para copiar"
                    >
                        <span className="text-yellow-400 font-mono text-sm break-all">
                            {entry.key}
                        </span>
                        <Copy className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </div>
                )}
            </td>

            {/* Value Column */}
            <td className="p-4 w-2/4">
                {shouldEdit ? (
                    <div className="flex items-center space-x-2">
                        <Input
                            ref={valueInputRef}
                            type={entry.secure && !isRevealed ? "password" : "text"}
                            value={currentValue}
                            onChange={(e) => onUpdateEntry(entryId, currentName, e.target.value, currentSecure)}
                            onKeyDown={handleKeyDown}
                            placeholder={entry.secure ? getDefaultSecureValue() : "Enter value..."}
                            className="font-mono text-sm bg-slate-700 border-slate-600 text-slate-300 focus:border-blue-500"
                        />
                    </div>
                ) : (
                    <ValueDisplay
                        value={getDisplayValue() || ""}
                        isSecure={entry.secure}
                        isRevealed={isRevealed}
                        maxLength={60}
                        onToggleVisibility={() => onToggleVisibility(entryId)}
                    />
                )}
            </td>

            {/* Secure Column */}
            <td className="p-4 w-1/8">
                {
                    shouldEdit ? (
                        <div className="flex items-center">
                            <Switch
                                checked={currentSecure}
                                onCheckedChange={(newCheckedState) => {
                                    onUpdateEntry(entryId, currentName, currentValue, newCheckedState);
                                }}
                            />
                        </div>
                    ): (
                        entry.secure ? (
                            <Badge className="bg-yellow-500 text-black hover:bg-yellow-600 font-medium">
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-black rounded-full"></div>
                                    <span>secure</span>
                                </div>
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-slate-600 text-slate-300 font-medium">
                                public
                            </Badge>
                        )
                    )
                }

            </td>

            <td className="p-4 w-1/8">
                <div className="flex items-center space-x-2">
                    {shouldEdit ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSave}
                                className="h-6 w-6 p-0 text-green-400 hover:text-green-300 transition-colors"
                                title="Save changes"
                                disabled={editableCount>1}

                            >
                                <Check className="h-3 w-3"/>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300 transition-colors"
                                title="Cancel changes"
                            >
                                <X className="h-3 w-3"/>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit?.(entry)}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-white transition-colors"
                                title="Edit entry"
                            >
                                <Edit className="h-3 w-3"/>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(getDisplayValue() || "", entry.key)}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-white transition-colors"
                                title="Copy value"
                            >
                                <Copy className="h-3 w-3"/>
                            </Button>
                        </>
                    )}
                    {(copiedItem === entry.key || copiedItem === `${entryId}` ) &&
                        <span className="text-xs text-green-400 animate-fade-in">Copied!</span>}
                </div>
            </td>
        </tr>
    )
}

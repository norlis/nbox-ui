import {useEffect, useState} from "react"
import {Input} from "~/components/ui/input"
import {Label} from "~/components/ui/label"
import {Switch} from "~/components/ui/switch"
import {Button} from "~/components/ui/button"
import {useFetcher} from "react-router";
import {type EntryActionResponse, EntryArraySchema} from "~/domain/validations";
import {useEntryForm} from "~/hooks/use-entry-form";
import {Plus, Trash2} from "lucide-react";
import {toast} from "sonner"
import type {Entry} from "~/domain/entry"


function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-red-400 text-sm mt-1">{message}</p>;
}

type FormErrors = {
    [key: number]: {
        [K in keyof Entry]?: string
    }
}

interface TraditionalFormProps {
    currentPath: string
    onClose: () => void
}

export function TraditionalForm({currentPath, onClose}: TraditionalFormProps) {

    const fetcher = useFetcher<EntryActionResponse>();
    // const revalidator = useRevalidator();

    const {entries, addEntry, updateEntry, removeEntry} = useEntryForm([
        {key: "", value: "", secure: false}
    ]);
    const [clientErrors, setClientErrors] = useState<FormErrors>({})

    const isSubmitting = fetcher.state === "submitting";


    useEffect(() => {
        const result = EntryArraySchema.safeParse(entries);
        if (!result.success) {
            const newErrors: FormErrors = {}
            result.error.issues.forEach((error) => {
                if (error.path.length >= 2) {
                    const index = error.path[0] as number
                    const field = error.path[1] as keyof Entry

                    if (!newErrors[index]) {
                        newErrors[index] = {}
                    }
                    newErrors[index][field] = error.message
                }
            })
            setClientErrors(newErrors)
        } else {
            setClientErrors({});
        }
    }, [entries]);

    useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data) {
            const data  =  fetcher.data;

            switch (data.status) {
                case 'success':
                    toast.success(`${data.message} \n ${data.savedIds.join("\n")}`)
                    onClose();
                    break;
                case 'partial_error':
                    toast.warning("Operation completed with errors ⚠️️", {
                        description: data.message
                    })
                    break;
                case 'validation_error':
                    toast.error( "Validation error", {
                        description:  "Please correct the errors in the form."
                    })
                    break;
            }
        }
    }, [fetcher.state, fetcher.data, onClose])

    return (
        <>
            <fetcher.Form method="POST" action="/api/entry">
                <div className="space-y-6 overflow-y-auto">
                    <div className="text-slate-400">
                        <span className="font-medium">{entries.length}</span> entries •{" "}
                        <span
                            className="font-medium text-yellow-400">{entries.filter((e) => e.secure).length}</span> secure
                    </div>

                    <div className="space-y-6 overflow-y-auto max-h-[55vh]">
                        <>
                            {entries.map((entry, index) => {
                                const path = currentPath.endsWith("/") ? currentPath : `${currentPath}/`;

                                return (
                                    <div key={index}
                                         className="p-4 rounded-lg border-1 border-dashed border-slate-500 bg-muted/20 bg-blue-500/10 border-blue-500/30">
                                        <input type="hidden" name={`entries[${index}][key]`}
                                               value={`${path}${entry.key}`}/>
                                        <div className="flex items-center justify-end gap-2 mb-4">
                                            {entries.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeEntry(index)}
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2"
                                                    title="Remove entry"
                                                >
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Key</Label>
                                                    <Input
                                                        name={`entries[${index}][key-suffix]`} // Este solo es para el display
                                                        value={entry.key}
                                                        onChange={(e) => updateEntry(index, "key", e.target.value)}
                                                        placeholder="var-name"
                                                        className="bg-slate-800 text-slate-50"
                                                    />
                                                    <FieldError message={clientErrors[index]?.key} />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Value</Label>
                                                    <Input
                                                        name={`entries[${index}][value]`}
                                                        value={entry.value}
                                                        onChange={(e) => updateEntry(index, "value", e.target.value)}
                                                        placeholder="text"
                                                        className="bg-slate-800 text-slate-50"

                                                    />
                                                     <FieldError message={clientErrors[index]?.value} />
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={entry.secure}
                                                        onCheckedChange={(checked) => updateEntry(index, "secure", checked)}
                                                    />
                                                    <Label>Secret</Label>
                                                    <input type="hidden" name={`entries[${index}][secure]`}
                                                           value={String(entry.secure)}/>
                                                </div>
                                            </div>


                                        </div>

                                    </div>
                                )
                            })}</>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-border">
                        <Button
                            variant="outline"
                            onClick={addEntry}
                            className="flex items-center gap-2 bg-transparent"
                        >
                            <Plus className="h-4 w-4"/>
                            Add
                        </Button>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                            >
                                Cancel
                            </Button>

                            <Button type="submit" disabled={isSubmitting || !!Object.keys(clientErrors).length }
                                    className="bg-yellow-600 hover:bg-yellow-700 text-slate-900">
                                {isSubmitting ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </div>
                </div>
            </fetcher.Form>
        </>
    );
}

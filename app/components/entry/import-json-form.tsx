import React, {useCallback, useEffect, useRef, useState} from "react"
import {Button} from "~/components/ui/button"
import {Label} from "~/components/ui/label"
import {FileJson} from "lucide-react"
import {Editor, type OnMount} from "@monaco-editor/react";
import Ajv from 'ajv'

import type {EntryActionResponse} from "~/domain/validations";
import {toast} from "sonner";
import {useFetcher} from "react-router";

const ajv = new Ajv()

interface ImportJsonFormProps {
    currentPath: string
    onClose: () => void
}

const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Generated schema for Root",
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "key": {
                "type": "string"
            },
            "value": {
                "type": "string"
            },
            "secure": {
                "type": "boolean"
            }
        },
        "required": [
            "key",
            "value",
            // "secure"
        ]
    }
}

const validate = ajv.compile(schema)


export function ImportJsonForm({onClose, currentPath}: ImportJsonFormProps) {

    const exampleJson = `[
      {
        "key": "${currentPath}var-name",
        "value": "text plain",
        "secure": false
      }
    ]`

    const fetcher = useFetcher<EntryActionResponse>();
    const [code, setCode] = useState(exampleJson)
    const [error, setError] = useState<string | null>(null)
    const editorRef = useRef<any>(null)
    const theme = "vs-dark"

    const isSubmitting = fetcher.state !== 'idle';

    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data) {
            const {status, message} = fetcher.data;
            if (status === 'success') {
                toast.success(message || "Entries imported successfully!");
                onClose();
            } else {
                toast.error(message || "An error occurred during import.");
            }
        }
    }, [fetcher.data, fetcher.state, onClose]);

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor
    }

    const validateUniqueKeys = (json: any[]): string | null => {
        const keys = new Set()
        for (let i = 0; i < json.length; i++) {
            if (keys.has(json[i].key)) {
                return `Duplicate key "${json[i].key}" found at index ${i}`
            }
            keys.add(json[i].key)
        }
        return null
    }

    const validateJson = useCallback((value: string) => {
        try {
            const parsedJson = JSON.parse(value)
            const valid = validate(parsedJson)

            if (!valid) {
                const errors = validate.errors
                if (errors && errors.length > 0) {
                    setError(`Schema validation error: ${errors[0].message} at ${errors[0].instancePath}`)
                } else {
                    setError('Unknown schema validation error')
                }
            } else {
                const uniqueKeyError = validateUniqueKeys(parsedJson)
                if (uniqueKeyError) {
                    setError(uniqueKeyError)
                } else {
                    setError(null)
                }
            }
        } catch (e) {
            setError(`JSON syntax error: ${(e as Error).message}`)
        }
    }, [])

    const handleEditorChange = (value: string | undefined) => {
        const newValue = value || ''
        setCode(newValue)
        validateJson(newValue)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (error || code.length === 0 || isSubmitting) {
            return;
        }

        try {
            const parsedJson = JSON.parse(code);
            const formData = new FormData();

            parsedJson.forEach((entry: any, index: number) => {
                // Añadimos el path actual a cada entrada

                formData.append(`entries[${index}][key]`, entry.key);
                formData.append(`entries[${index}][value]`, entry.value);
                const isSecure = typeof entry.secure === 'boolean' ? entry.secure : false;
                formData.append(`entries[${index}][secure]`, String(isSecure));
            });

            fetcher.submit(formData, {
                method: "POST",
                action: "/api/entry",
            });

        } catch (e) {
            toast.error("Failed to parse JSON before submitting.");
        }
    };


    const formatJson = () => {
        try {
            const formatted = JSON.stringify(JSON.parse(code), null, 2)
            setCode(formatted)
            editorRef.current?.setValue(formatted)
            validateJson(formatted)
        } catch (e) {
            setError(`Formatting error: ${(e as Error).message}`)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-[70vh] space-y-6" method="POST" action="/api/entry">
            <div>
                <Label htmlFor="json-editor" className="mb-1 block">
                    JSON Editor
                </Label>
                <div className="flex justify-end mb-4">
                    <Button
                        type="button"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent hover:text-yellow-300"
                        variant="ghost"
                        size="sm"
                        onClick={formatJson}
                        title="Format"
                    >
                        <FileJson className="mr-2 h-4 w-4"/>
                    </Button>
                </div>
                <div className="flex-grow border rounded-md overflow-hidden border-gray-700">
                    <Editor
                        height="50vh"
                        language="json"
                        theme={theme}
                        value={code}
                        onChange={handleEditorChange}
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: {enabled: false},
                            fontSize: 14,
                            wordWrap: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            formatOnPaste: true,
                            formatOnType: true,
                        }}
                    />
                </div>
                {/*<MonacoEditor value={jsonInput} onChange={setJsonInput} language="json" height="300px" />*/}
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>


            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="bg-yellow-600 hover:bg-yellow-700 text-slate-900"
                    disabled={!!error}
                >
                    Import
                </Button>
            </div>
        </form>
    )
}
